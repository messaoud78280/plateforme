import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { AgendaAttendeeStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { agendaEventInclude } from "@/lib/agenda/access";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

const VALID: Set<string> = new Set(["ACCEPTE", "REFUSE", "EN_ATTENTE", "INVITE"]);

/** POST /api/agenda/events/[id]/rsvp { status: ACCEPTE | REFUSE } */
export async function POST(request: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as { status?: string };
  const status = typeof body.status === "string" ? body.status.toUpperCase() : "";
  if (!VALID.has(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const event = await prisma.agendaEvent.findFirst({
    where: {
      id,
      status: { not: "ANNULE" },
      attendees: { some: { userId: session.user.id } },
    },
    select: {
      id: true,
      createdById: true,
      responsibleId: true,
      attendees: {
        where: { userId: session.user.id },
        select: { status: true },
      },
    },
  });
  if (!event) {
    return NextResponse.json({ error: "Événement introuvable ou non invité" }, { status: 404 });
  }

  // Organisateur / responsable : jamais RSVP sur sa propre réunion
  if (
    event.createdById === session.user.id ||
    event.responsibleId === session.user.id
  ) {
    return NextResponse.json(
      { error: "Le responsable ou l’organisateur n’a pas à accepter sa propre réunion." },
      { status: 403 },
    );
  }

  await prisma.agendaEventAttendee.upsert({
    where: {
      eventId_userId: { eventId: id, userId: session.user.id },
    },
    create: {
      eventId: id,
      userId: session.user.id,
      status: status as AgendaAttendeeStatus,
    },
    update: { status: status as AgendaAttendeeStatus },
  });

  const updated = await prisma.agendaEvent.findUnique({
    where: { id },
    include: agendaEventInclude,
  });

  return NextResponse.json({ event: updated });
}
