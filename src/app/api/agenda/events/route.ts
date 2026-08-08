import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { AgendaEventType } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { agendaEventAccessWhere, agendaEventInclude, resolveAgendaOwnerUserId } from "@/lib/agenda/access";
import { listLinkedAgendaItems } from "@/lib/agenda/linked-sources";
import { AGENDA_EVENT_TYPES } from "@/lib/agenda/types";
import { prisma } from "@/lib/prisma";
import { canClientAccessProject } from "@/lib/organization/access";
import { isBeworkStaff } from "@/lib/authz";

const VALID_TYPES: Set<string> = new Set(AGENDA_EVENT_TYPES.map((t) => t.id));

async function assertProjectAccess(userId: string, projectId: string, staff: boolean) {
  if (staff) return true;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { clientId: true, organizationId: true },
  });
  if (!project) return false;
  return canClientAccessProject(userId, project);
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** GET /api/agenda/events?from=&to=&scope=&projectId=&q=&type=&linked=1 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));
  const scope = (searchParams.get("scope") as "mine" | "team" | "all" | null) ?? "all";
  const projectId = searchParams.get("projectId");
  const type = searchParams.get("type");
  const q = searchParams.get("q")?.trim();
  const includeLinked = searchParams.get("linked") !== "0";

  try {
    const accessWhere = await agendaEventAccessWhere(session.user, {
      scope,
      projectId: projectId || null,
    });

    const events = await prisma.agendaEvent.findMany({
      where: {
        AND: [
          accessWhere,
          ...(from && to ? [{ startAt: { lte: to }, endAt: { gte: from } }] : []),
          ...(type && VALID_TYPES.has(type) ? [{ type: type as AgendaEventType }] : []),
          ...(q
            ? [
                {
                  OR: [
                    { title: { contains: q, mode: "insensitive" as const } },
                    { description: { contains: q, mode: "insensitive" as const } },
                    { location: { contains: q, mode: "insensitive" as const } },
                    { project: { title: { contains: q, mode: "insensitive" as const } } },
                  ],
                },
              ]
            : []),
        ],
      },
      include: agendaEventInclude,
      orderBy: { startAt: "asc" },
      take: 500,
    });

    const agendaEvents = events.map((e) => ({
      ...e,
      readOnly: false as const,
      source: "agenda" as const,
      href: null as string | null,
    }));

    let linked: Awaited<ReturnType<typeof listLinkedAgendaItems>> = [];
    if (includeLinked && from && to) {
      linked = await listLinkedAgendaItems(session.user, {
        from,
        to,
        projectId: projectId || null,
        q: q || null,
      });
      if (type) linked = linked.filter((i) => i.type === type);
      if (scope === "mine") {
        linked = linked.filter(
          (i) => i.responsibleId === session.user!.id || i.createdBy.id === session.user!.id,
        );
      }
    }

    const merged = [...agendaEvents, ...linked].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );

    return NextResponse.json({ events: merged });
  } catch (error) {
    console.error("GET /api/agenda/events", error);
    return NextResponse.json({ error: "Erreur chargement agenda" }, { status: 500 });
  }
}

/** POST /api/agenda/events */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Titre obligatoire" }, { status: 400 });
    }

    const startAt = parseDate(typeof body.startAt === "string" ? body.startAt : null);
    const endAt = parseDate(typeof body.endAt === "string" ? body.endAt : null);
    if (!startAt || !endAt) {
      return NextResponse.json({ error: "Horaires invalides" }, { status: 400 });
    }
    if (endAt <= startAt) {
      return NextResponse.json({ error: "La fin doit être après le début" }, { status: 400 });
    }

    const type =
      typeof body.type === "string" && VALID_TYPES.has(body.type)
        ? (body.type as AgendaEventType)
        : "AUTRE";
    const projectId = typeof body.projectId === "string" && body.projectId ? body.projectId : null;
    const attendeeIds = Array.isArray(body.attendeeIds)
      ? body.attendeeIds.filter((x): x is string => typeof x === "string")
      : [];

    if (projectId && !(await assertProjectAccess(session.user.id, projectId, isBeworkStaff(session.user)))) {
      return NextResponse.json({ error: "Chantier inaccessible" }, { status: 403 });
    }

    const ownerUserId = await resolveAgendaOwnerUserId(session.user.id);
    const org = await prisma.organization.findUnique({
      where: { ownerUserId },
      select: { id: true },
    });

    const event = await prisma.agendaEvent.create({
      data: {
        title,
        description: typeof body.description === "string" ? body.description : null,
        location: typeof body.location === "string" ? body.location : null,
        type,
        startAt,
        endAt,
        allDay: Boolean(body.allDay),
        projectId,
        responsibleId:
          typeof body.responsibleId === "string" && body.responsibleId ? body.responsibleId : null,
        reminderMinutes:
          typeof body.reminderMinutes === "number" ? body.reminderMinutes : null,
        recurrence: typeof body.recurrence === "string" ? body.recurrence : "NONE",
        ownerUserId,
        createdById: session.user.id,
        organizationId: org?.id ?? null,
        attendees: attendeeIds.length
          ? {
              create: attendeeIds.map((userId) => ({
                userId,
                status: "EN_ATTENTE" as const,
              })),
            }
          : undefined,
      },
      include: agendaEventInclude,
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("POST /api/agenda/events", error);
    return NextResponse.json({ error: "Erreur création événement" }, { status: 500 });
  }
}
