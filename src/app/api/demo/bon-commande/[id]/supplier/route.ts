import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { isBonDeCommandeCategory } from "@/lib/demo-environment/bon-commande";
import { applySupplierDeliveryConfirm } from "@/lib/demo-environment/coherence-victor-hugo";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Actions fournisseur démo : confirm | propose
 * Une seule livraison agenda ; fiche OS mise à jour.
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
      followUpSheetId: true,
    },
  });
  if (!task || (!isBonDeCommandeCategory(task.category) && !task.title.includes("POINT.P"))) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  try {
    if (action === "confirm") {
      const result = await applySupplierDeliveryConfirm({
        rootUserId: rootId,
        taskId: task.id,
        actorUserId: session.user.id,
        actorName: session.user.name ?? "Thomas Bernard",
      });

      const sheetUrl = result?.sheetId
        ? `/dashboard/fiches-suivi/${result.sheetId}`
        : "/dashboard/commandes";

      await prisma.alert.create({
        data: {
          title: "Point.P a confirmé la livraison",
          message: `${task.title} — créneau 11/08 07:30 confirmé. Une seule livraison en agenda.`,
          level: "INFO",
          clientId: rootId,
          actionUrl: sheetUrl,
        },
      });

      await createNotification({
        userId: rootId,
        type: "MESSAGE_RECEIVED",
        title: "Livraison confirmée",
        message: `Point.P a confirmé : ${task.title}`,
        actionUrl: sheetUrl,
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
          actionUrl: sheetUrl,
        });
      }

      return NextResponse.json({
        ok: true,
        action: "confirm",
        deliveryId: result?.deliveryId ?? null,
        sheetId: result?.sheetId ?? null,
      });
    }

    // propose autre heure → alerte à valider côté direction (pas de nouvelle livraison)
    await prisma.task.update({
      where: { id: task.id },
      data: {
        description: `${task.description ?? ""}\n\n[Démo] Point.P propose ${proposedTime} au lieu de 07:30 — en attente validation ABC Étanchéité.`.trim(),
      },
    });

    if (task.followUpSheetId) {
      await prisma.followUpSheet.update({
        where: { id: task.followUpSheetId },
        data: {
          nextAction: `Valider proposition livraison ${proposedTime}`,
          nextActionDone: false,
          colorKey: "orange",
        },
      });
    }

    await prisma.alert.create({
      data: {
        title: "Modification livraison à valider",
        message: `Point.P propose ${proposedTime} au lieu de 07:30 pour ${task.title}.`,
        level: "WARNING",
        clientId: rootId,
        actionUrl: task.followUpSheetId
          ? `/dashboard/fiches-suivi/${task.followUpSheetId}`
          : "/dashboard/commandes",
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
