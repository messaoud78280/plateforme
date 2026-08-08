import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { isBonDeCommandeCategory } from "@/lib/demo-environment/bon-commande";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Actions fournisseur démo : confirm | propose
 * Met à jour BC, agenda, alerte Direction, notification.
 */
export async function POST(request: Request, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.isDemo) {
    return NextResponse.json({ error: "Réservé à la démonstration" }, { status: 403 });
  }
  if (session.user.personType !== "SUPPLIER" && session.user.permissionProfile !== "FOURNISSEUR") {
    return NextResponse.json({ error: "Réservé au profil fournisseur" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const action = body.action === "propose" ? "propose" : "confirm";
  const proposedTime =
    typeof body.proposedTime === "string" ? body.proposedTime.trim() : "09:00";

  const rootId = session.user.demoRootUserId ?? session.user.id;
  const task = await prisma.task.findFirst({
    where: { id, clientId: rootId },
    select: {
      id: true,
      title: true,
      status: true,
      category: true,
      projectId: true,
      description: true,
    },
  });
  if (!task || (!isBonDeCommandeCategory(task.category) && !task.title.includes("POINT.P"))) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  try {
    if (action === "confirm") {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          status: "EN_ATTENTE_INFO",
          description: `${task.description ?? ""}\n\n[Démo] Point.P (Thomas Bernard) a confirmé la livraison — créneau demandé maintenu.`.trim(),
        },
      });

      if (task.projectId) {
        const start = new Date();
        start.setDate(start.getDate() + 2);
        start.setHours(7, 30, 0, 0);
        const end = new Date(start);
        end.setHours(8, 30, 0, 0);
        await prisma.agendaEvent.create({
          data: {
            title: `Livraison Point.P — ${task.title.slice(0, 40)}`,
            type: "LIVRAISON",
            startAt: start,
            endAt: end,
            location: "Résidence Victor Hugo — aire livraison",
            ownerUserId: rootId,
            createdById: session.user.id,
            projectId: task.projectId,
            organizationId: (
              await prisma.project.findUnique({
                where: { id: task.projectId },
                select: { organizationId: true },
              })
            )?.organizationId,
          },
        });
      }

      await prisma.alert.create({
        data: {
          title: "Point.P a confirmé la livraison",
          message: `${task.title} — créneau confirmé par Thomas Bernard.`,
          level: "INFO",
          clientId: rootId,
          actionUrl: `/dashboard/commandes`,
        },
      });

      await createNotification({
        userId: rootId,
        type: "MESSAGE_RECEIVED",
        title: "Livraison confirmée",
        message: `Point.P a confirmé : ${task.title}`,
        actionUrl: "/dashboard/commandes",
      });

      const conducteur = await prisma.user.findFirst({
        where: { invitedById: rootId, permissionProfile: "CONDUCTEUR" },
        select: { id: true },
      });
      if (conducteur && conducteur.id !== rootId) {
        await createNotification({
          userId: conducteur.id,
          type: "DELIVERY_CHECK",
          title: "Livraison Point.P confirmée",
          message: task.title,
          actionUrl: "/dashboard/commandes",
        });
      }

      return NextResponse.json({ ok: true, action: "confirm" });
    }

    // propose autre heure → alerte à valider côté direction
    await prisma.task.update({
      where: { id: task.id },
      data: {
        description: `${task.description ?? ""}\n\n[Démo] Point.P propose ${proposedTime} au lieu de 07:30 — en attente validation ABC Étanchéité.`.trim(),
      },
    });
    await prisma.alert.create({
      data: {
        title: "Modification livraison à valider",
        message: `Point.P propose ${proposedTime} au lieu de 07:30 pour ${task.title}.`,
        level: "WARNING",
        clientId: rootId,
        actionUrl: `/dashboard/commandes`,
      },
    });
    await createNotification({
      userId: rootId,
      type: "MESSAGE_RECEIVED",
      title: "Proposition de créneau fournisseur",
      message: `Point.P propose ${proposedTime} — à accepter ou refuser.`,
      actionUrl: "/dashboard/commandes",
    });

    return NextResponse.json({ ok: true, action: "propose", proposedTime });
  } catch (e) {
    console.error("supplier BC action", e);
    return NextResponse.json({ error: "Erreur traitement commande" }, { status: 500 });
  }
}
