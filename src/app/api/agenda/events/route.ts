import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { AgendaEventType, Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import {
  agendaEventAccessWhere,
  agendaEventInclude,
  agendaEventListInclude,
  resolveAgendaOwnerUserId,
} from "@/lib/agenda/access";
import { listLinkedAgendaItems } from "@/lib/agenda/linked-sources";
import { notifyAgendaInvitees } from "@/lib/agenda/notify";
import { expandRecurrenceForRange, type RecurringSeed } from "@/lib/agenda/recurrence";
import { AGENDA_EVENT_TYPES } from "@/lib/agenda/types";
import { prisma } from "@/lib/prisma";
import { canClientAccessProject } from "@/lib/organization/access";
import { isBeworkStaff } from "@/lib/authz";
import {
  buildAgendaUrgency,
  serializePurchaseOrderForAgenda,
} from "@/lib/agenda/serialize-event";
import { isInternalPurchaseOrderActor } from "@/lib/purchase-orders/access";
import { fetchAllAgendaEventsLite } from "@/lib/agenda/fetch-lite";

const VALID_TYPES: Set<string> = new Set(AGENDA_EVENT_TYPES.map((t) => t.id));
/** Création manuelle interdite — livraisons = PurchaseOrder. */
const MANUAL_CREATE_BLOCKED = new Set(["LIVRAISON"]);

async function assertProjectAccess(userId: string, projectId: string, staff: boolean) {
  if (staff) return true;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, clientId: true, organizationId: true },
  });
  if (!project) return false;
  if (!(await canClientAccessProject(userId, project))) return false;
  const { userHasProjectScope } = await import("@/lib/equipe-acces/project-access");
  return userHasProjectScope(userId, project, "agenda");
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** GET /api/agenda/events?from=&to=&scope=&projectId=&q=&type=&linked=1&lite=1 */
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
  const includeLinked = searchParams.get("linked") === "1";
  const liteParam = searchParams.get("lite") === "1";
  const rangeMs = from && to ? to.getTime() - from.getTime() : 0;
  const yearLike = rangeMs > 1000 * 60 * 60 * 24 * 120; // > ~4 mois
  /** Plage annuelle / lite : projection légère + pagination complète (pas de take 800 silencieux). */
  const lite = liteParam || yearLike;
  const take = 500;

  try {
    const accessWhere = await agendaEventAccessWhere(session.user, {
      scope,
      projectId: projectId || null,
    });

    const where: Prisma.AgendaEventWhereInput = {
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
                  { responsible: { name: { contains: q, mode: "insensitive" as const } } },
                  {
                    purchaseOrder: {
                      OR: [
                        { number: { contains: q, mode: "insensitive" as const } },
                        { subject: { contains: q, mode: "insensitive" as const } },
                        {
                          externalOrganization: {
                            OR: [
                              { name: { contains: q, mode: "insensitive" as const } },
                              { tradeName: { contains: q, mode: "insensitive" as const } },
                            ],
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            ]
          : []),
      ],
    };

    let eventsComplete = true;
    let eventsFetched = 0;
    let events: Array<{
      id: string;
      title: string;
      description: string | null;
      location: string | null;
      type: string;
      status: string;
      startAt: Date;
      endAt: Date;
      allDay: boolean;
      projectId: string | null;
      responsibleId: string | null;
      reminderMinutes: number | null;
      recurrence: string | null;
      createdById: string;
      purchaseOrderId: string | null;
      followUpSheetId: string | null;
      sourceMessageKind: string | null;
      sourceMessageId: string | null;
      project: { id: string; title: string; siteCity?: string | null; siteAddress?: string | null } | null;
      responsible: { id: string; name: string | null; email?: string | null } | null;
      followUpSheet: {
        id: string;
        title?: string;
        nextActionAt: Date | null;
        nextActionDone: boolean;
        urgencyOverride: string | null;
        status?: string;
      } | null;
      purchaseOrder: Parameters<typeof serializePurchaseOrderForAgenda>[0];
      createdBy?: { id: string; name: string | null; email: string };
      attendees?: Array<{
        id: string;
        status: string;
        user: { id: string; name: string | null; email: string };
      }>;
    }>;

    if (lite) {
      const liteResult = await fetchAllAgendaEventsLite(where);
      events = liteResult.rows;
      eventsComplete = liteResult.complete;
      eventsFetched = liteResult.fetched;
    } else {
      const listRows = await prisma.agendaEvent.findMany({
        where,
        include: agendaEventListInclude,
        orderBy: { startAt: "asc" },
        take,
      });
      events = listRows;
      eventsFetched = listRows.length;
      // take atteint → échantillon potentiellement tronqué (pas pour la vue Année)
      eventsComplete = listRows.length < take;
    }

    const sourceTaskIds = lite
      ? []
      : events
          .filter((e) => e.sourceMessageKind === "TASK" && e.sourceMessageId)
          .map((e) => e.sourceMessageId as string);
    const taskMsgs =
      sourceTaskIds.length > 0
        ? await prisma.taskMessage.findMany({
            where: { id: { in: sourceTaskIds } },
            select: { id: true, taskId: true },
          })
        : [];
    const taskByMsg = new Map(taskMsgs.map((m) => [m.id, m.taskId]));
    const canOpenPo = isInternalPurchaseOrderActor(session.user);

    const agendaEvents = events.flatMap((e) => {
      const projectForSeed =
        e.project == null
          ? null
          : {
              id: e.project.id,
              title: e.project.title,
              siteCity: "siteCity" in e.project ? (e.project.siteCity as string | null) : null,
              siteAddress:
                "siteAddress" in e.project ? (e.project.siteAddress as string | null) : null,
            };
      const responsibleForSeed =
        e.responsible == null
          ? null
          : {
              id: e.responsible.id,
              name: e.responsible.name ?? "",
              email: "email" in e.responsible ? String(e.responsible.email ?? "") : "",
            };
      const seed: RecurringSeed = {
        id: e.id,
        title: e.title,
        description: e.description,
        location: e.location,
        type: e.type,
        status: e.status,
        startAt: e.startAt,
        endAt: e.endAt,
        allDay: e.allDay,
        projectId: e.projectId,
        responsibleId: e.responsibleId,
        reminderMinutes: e.reminderMinutes,
        recurrence: e.recurrence,
        project: projectForSeed,
        responsible: responsibleForSeed,
        createdBy: { id: e.createdById, name: "", email: "" },
        attendees: [],
      };
      if (!lite && "attendees" in e && Array.isArray(e.attendees)) {
        seed.attendees = e.attendees.map((a) => ({
          id: a.id,
          status: a.status,
          user: {
            id: a.user.id,
            name: a.user.name ?? "",
            email: a.user.email ?? "",
          },
        }));
      }
      if (!lite && "createdBy" in e) {
        const cb = (e as { createdBy?: { id: string; name: string | null; email: string } })
          .createdBy;
        if (cb) {
          seed.createdBy = { id: cb.id, name: cb.name ?? "", email: cb.email ?? "" };
        }
      }
      const expanded =
        from && to
          ? expandRecurrenceForRange(seed, from, to)
          : [{ ...seed, occurrenceStart: e.startAt.toISOString() }];

      return expanded.map((occ) => {
        const sheet = "followUpSheet" in e ? e.followUpSheet : null;
        const startDate =
          occ.startAt instanceof Date ? occ.startAt : new Date(String(occ.startAt));
        const { urgency, urgencyLabel } = buildAgendaUrgency({
          startAt: startDate,
          status: e.status,
          type: e.type,
          followUpSheet: sheet,
        });
        let sourceMessageHref: string | null = null;
        if (!lite && e.sourceMessageKind === "TASK" && e.sourceMessageId) {
          const taskId = taskByMsg.get(e.sourceMessageId);
          sourceMessageHref = taskId
            ? `/dashboard/messagerie?task=${taskId}&messageId=${e.sourceMessageId}`
            : `/dashboard/messagerie?messageId=${e.sourceMessageId}`;
        } else if (!lite && e.sourceMessageKind === "DIRECT" && e.sourceMessageId) {
          sourceMessageHref = `/dashboard/messagerie?tab=messages-directs&messageId=${e.sourceMessageId}`;
        }
        const poSummary = serializePurchaseOrderForAgenda(
          "purchaseOrder" in e ? e.purchaseOrder : null,
          { canOpen: canOpenPo },
        );
        const linkedPo = Boolean(e.purchaseOrderId);
        const sheetTitle =
          sheet && "title" in sheet && typeof sheet.title === "string" ? sheet.title : null;
        const project =
          e.project == null
            ? null
            : {
                id: e.project.id,
                title: e.project.title,
                siteCity: "siteCity" in e.project ? (e.project.siteCity as string | null) : null,
                siteAddress:
                  "siteAddress" in e.project ? (e.project.siteAddress as string | null) : null,
              };
        const responsible =
          e.responsible == null
            ? null
            : {
                id: e.responsible.id,
                name: e.responsible.name ?? "",
                email: "email" in e.responsible ? String(e.responsible.email ?? "") : "",
              };
        const createdBy =
          lite || !("createdBy" in e) || !e.createdBy
            ? { id: e.createdById, name: "", email: "" }
            : e.createdBy;
        return {
          ...occ,
          startAt: occ.startAt instanceof Date ? occ.startAt.toISOString() : String(occ.startAt),
          endAt: occ.endAt instanceof Date ? occ.endAt.toISOString() : String(occ.endAt),
          description: lite ? null : "description" in occ ? occ.description : null,
          location: lite ? null : "location" in occ ? occ.location : null,
          project,
          responsible,
          createdBy,
          attendees: lite ? [] : "attendees" in e ? e.attendees : [],
          readOnly: false as const,
          linkedPurchaseOrder: linkedPo,
          purchaseOrderId: e.purchaseOrderId ?? null,
          purchaseOrder: poSummary,
          deliveryVisual: poSummary?.deliveryVisual ?? null,
          source: "agenda" as const,
          href: sheet
            ? `/dashboard/fiches-suivi/${sheet.id}`
            : poSummary?.canOpen
              ? `/dashboard/commandes/${poSummary.id}`
              : (null as string | null),
          followUpSheetId: sheet?.id ?? e.followUpSheetId ?? null,
          followUpSheet: sheet ? { id: sheet.id, title: sheetTitle ?? "Fiche" } : null,
          sourceMessageKind: lite ? null : (e.sourceMessageKind ?? null),
          sourceMessageId: lite ? null : (e.sourceMessageId ?? null),
          sourceMessageHref,
          urgency,
          urgencyLabel,
          isOccurrence: occ.id.includes("__"),
        };
      });
    });

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
        const uid = session.user!.id;
        linked = linked.filter(
          (i) => i.responsibleId === uid || i.createdBy.id === uid,
        );
      }
    }

    const merged = [...agendaEvents, ...linked].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );

    return NextResponse.json({
      events: merged,
      meta: {
        complete: eventsComplete,
        fetched: eventsFetched,
        lite,
      },
    });
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
    if (MANUAL_CREATE_BLOCKED.has(type)) {
      return NextResponse.json(
        {
          error:
            "Les livraisons se créent depuis une commande fournisseur — pas depuis l’agenda.",
        },
        { status: 400 },
      );
    }
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
        followUpSheetId:
          typeof body.followUpSheetId === "string" && body.followUpSheetId
            ? body.followUpSheetId
            : null,
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

    void notifyAgendaInvitees(event.id);

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("POST /api/agenda/events", error);
    return NextResponse.json({ error: "Erreur création événement" }, { status: 500 });
  }
}
