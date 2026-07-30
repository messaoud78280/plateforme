import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAgencyOrManager, isBeworkStaff } from "@/lib/authz";

const SLOT_DURATION_MIN = 30;

/** GET /api/appointments */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const isAgence = isAgencyOrManager(session.user);
  const staff = isBeworkStaff(session.user);

  try {
    // Staff : agenda partagé BeWork. Client : ses RDV uniquement.
    const baseWhere = staff
      ? { status: { not: "ANNULE" as const } }
      : {
          status: { not: "ANNULE" as const },
          OR: [
            { clientId: session.user.id },
            ...(session.user.email ? [{ clientEmail: session.user.email }] : []),
          ],
        };

    const appointments = await prisma.appointment.findMany({
      where: {
        ...baseWhere,
        ...(from ? { startAt: { gte: new Date(from) } } : {}),
        ...(to ? { endAt: { lte: new Date(to) } } : {}),
      },
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, title: true } },
        attachments: true,
      },
      orderBy: { startAt: "asc" },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Erreur liste appointments:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des rendez-vous." },
      { status: 500 }
    );
  }
}

/** POST /api/appointments */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      title,
      startAt,
      endAt,
      clientEmail,
      clientName,
      projectId,
      notes,
      recurrence,
      recurrenceEndAt,
      attachmentUrls,
    } = body;

    if (!title?.trim() || !startAt) {
      return NextResponse.json(
        { error: "Titre et date de début requis." },
        { status: 400 }
      );
    }

    const isAgence = isAgencyOrManager(session.user);
    let organizerId = session.user.id;
    if (!isAgence) {
      const manager = await prisma.user.findFirst({ where: { role: "MANAGER" }, select: { id: true } });
      organizerId = manager?.id ?? session.user.id;
    }

    const start = new Date(startAt);
    const end = endAt ? new Date(endAt) : new Date(start.getTime() + SLOT_DURATION_MIN * 60 * 1000);

    const appointment = await prisma.appointment.create({
      data: {
        title: title.trim(),
        startAt: start,
        endAt: end,
        organizerId,
        clientId: !isAgence ? session.user.id : undefined,
        clientEmail: clientEmail?.trim() || (isAgence ? undefined : session.user.email ?? undefined),
        clientName: clientName?.trim() || (isAgence ? undefined : session.user.name ?? undefined),
        projectId: projectId || undefined,
        notes: notes?.trim() || undefined,
        recurrence: recurrence || "NONE",
        recurrenceEndAt: recurrenceEndAt ? new Date(recurrenceEndAt) : undefined,
      },
      include: {
        organizer: { select: { id: true, name: true } },
        attachments: true,
      },
    });

    if (attachmentUrls?.length) {
      await prisma.appointmentAttachment.createMany({
        data: attachmentUrls.map((a: { name: string; fileUrl: string; fileSize: number; mimeType?: string }) => ({
          appointmentId: appointment.id,
          name: a.name,
          fileUrl: a.fileUrl,
          fileSize: a.fileSize || 0,
          mimeType: a.mimeType,
        })),
      });
    }

    const updated = await prisma.appointment.findUnique({
      where: { id: appointment.id },
      include: { attachments: true },
    });

    try {
      await prisma.alert.create({
        data: {
          title: "Nouveau rendez-vous",
          message: `${appointment.clientName || appointment.clientEmail || "Client"} – ${appointment.title} le ${start.toLocaleDateString("fr-FR")} à ${start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
          level: "WARNING",
          clientId: organizerId,
          actionUrl: `/dashboard/messages`,
        },
      });
    } catch {
      // ignore
    }

    return NextResponse.json(updated ?? appointment);
  } catch (error) {
    console.error("Erreur création appointment:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du rendez-vous." },
      { status: 500 }
    );
  }
}
