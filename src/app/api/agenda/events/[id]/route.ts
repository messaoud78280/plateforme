import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { AgendaEventType, AgendaEventStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { agendaEventAccessWhere, agendaEventInclude } from "@/lib/agenda/access";
import { serializePurchaseOrderForAgenda } from "@/lib/agenda/serialize-event";
import { AGENDA_EVENT_TYPES } from "@/lib/agenda/types";
import { prisma } from "@/lib/prisma";
import { canClientAccessProject } from "@/lib/organization/access";
import { isBeworkStaff } from "@/lib/authz";
import { isInternalPurchaseOrderActor } from "@/lib/purchase-orders/access";
import { reschedulePurchaseOrderDeliveryFromAgenda } from "@/lib/purchase-orders/sync-delivery";

const VALID_TYPES: Set<string> = new Set(AGENDA_EVENT_TYPES.map((t) => t.id));

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

type Ctx = { params: Promise<{ id: string }> };

async function canAccessEvent(user: { id: string; role?: string | null }, id: string) {
  const accessWhere = await agendaEventAccessWhere(user);
  return prisma.agendaEvent.findFirst({
    where: { AND: [{ id }, accessWhere] },
    include: agendaEventInclude,
  });
}

/** GET /api/agenda/events/[id] */
export async function GET(_request: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const event = await canAccessEvent(session.user, id);
  if (!event) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const canOpenPo = isInternalPurchaseOrderActor(session.user);

  const annualLink = await prisma.annualServiceIntervention.findFirst({
    where: { agendaEventId: id },
    select: {
      contractId: true,
      contract: { select: { clientName: true } },
    },
  });

  return NextResponse.json({
    event: {
      ...event,
      purchaseOrder: serializePurchaseOrderForAgenda(event.purchaseOrder, { canOpen: canOpenPo }),
      linkedPurchaseOrder: Boolean(event.purchaseOrderId),
      annualContract: annualLink
        ? {
            id: annualLink.contractId,
            clientName: annualLink.contract.clientName,
            href: `/dashboard/contrats-annuels?view=piloter&contract=${encodeURIComponent(annualLink.contractId)}`,
          }
        : null,
    },
  });
}

/** PATCH /api/agenda/events/[id] */
export async function PATCH(request: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const existing = await canAccessEvent(session.user, id);
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const data: Record<string, unknown> = {};

    const linkedPo =
      Boolean(existing.purchaseOrderId) && existing.type === "LIVRAISON";
    const timesChanging =
      typeof body.startAt === "string" || typeof body.endAt === "string";

    // Livraison liée commande : jamais modifier AgendaEvent seul
    if (linkedPo && timesChanging) {
      if (body.confirmLinkedReschedule !== true) {
        return NextResponse.json(
          {
            error: "CONFIRM_LINKED_RESCHEDULE",
            message:
              "Cette livraison est liée à une commande. Confirmez le report pour mettre à jour la commande.",
            purchaseOrderId: existing.purchaseOrderId,
            currentStartAt: existing.startAt.toISOString(),
          },
          { status: 409 },
        );
      }
      const newStart = typeof body.startAt === "string" ? new Date(body.startAt) : existing.startAt;
      if (Number.isNaN(newStart.getTime())) {
        return NextResponse.json({ error: "Horaires invalides" }, { status: 400 });
      }
      const actor = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true },
      });
      const result = await reschedulePurchaseOrderDeliveryFromAgenda({
        orderId: existing.purchaseOrderId!,
        newStartAt: newStart,
        actorUserId: session.user.id,
        actorName: actor?.name ?? undefined,
      });
      if (!result.ok) {
        const status = result.code === "SUPPLIER_CONFIRMED_LOCKED" ? 409 : 400;
        return NextResponse.json(
          {
            error: result.code ?? "RESCHEDULE_DENIED",
            message: result.error,
            confirmedAt: result.confirmedAt ?? null,
            supplierName: result.supplierName ?? null,
            purchaseOrderId: result.purchaseOrderId ?? existing.purchaseOrderId,
            orderUrl: result.orderUrl ?? `/dashboard/commandes/${existing.purchaseOrderId}`,
          },
          { status },
        );
      }
      const refreshed = await canAccessEvent(session.user, id);
      if (!refreshed) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
      const canOpenPo = isInternalPurchaseOrderActor(session.user);
      return NextResponse.json({
        event: {
          ...refreshed,
          purchaseOrder: serializePurchaseOrderForAgenda(refreshed.purchaseOrder, {
            canOpen: canOpenPo,
          }),
          linkedPurchaseOrder: true,
          readOnly: false,
          source: "agenda",
        },
      });
    }

    if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
    if (typeof body.description === "string" || body.description === null) data.description = body.description;
    if (typeof body.location === "string" || body.location === null) data.location = body.location;
    if (typeof body.type === "string" && VALID_TYPES.has(body.type)) {
      if (body.type === "LIVRAISON" && !existing.purchaseOrderId) {
        return NextResponse.json(
          { error: "Impossible de convertir un événement en livraison sans commande." },
          { status: 400 },
        );
      }
      data.type = body.type as AgendaEventType;
    }
    if (typeof body.status === "string") data.status = body.status as AgendaEventStatus;
    if (typeof body.allDay === "boolean") data.allDay = body.allDay;
    if (typeof body.startAt === "string") {
      const d = new Date(body.startAt);
      if (!Number.isNaN(d.getTime())) data.startAt = d;
    }
    if (typeof body.endAt === "string") {
      const d = new Date(body.endAt);
      if (!Number.isNaN(d.getTime())) data.endAt = d;
    }
    if (body.projectId === null) data.projectId = null;
    else if (typeof body.projectId === "string") {
      if (!(await assertProjectAccess(session.user.id, body.projectId, isBeworkStaff(session.user)))) {
        return NextResponse.json({ error: "Chantier inaccessible" }, { status: 403 });
      }
      data.projectId = body.projectId;
    }
    if (body.responsibleId === null || typeof body.responsibleId === "string") {
      data.responsibleId = body.responsibleId;
    }
    if (typeof body.reminderMinutes === "number" || body.reminderMinutes === null) {
      data.reminderMinutes = body.reminderMinutes;
    }
    if (typeof body.recurrence === "string") data.recurrence = body.recurrence;
    if (body.followUpSheetId === null) data.followUpSheetId = null;
    else if (typeof body.followUpSheetId === "string") data.followUpSheetId = body.followUpSheetId;

    if (data.startAt && data.endAt && (data.endAt as Date) <= (data.startAt as Date)) {
      return NextResponse.json({ error: "Horaires invalides" }, { status: 400 });
    }

    if (Array.isArray(body.attendeeIds)) {
      const attendeeIds = body.attendeeIds.filter((x): x is string => typeof x === "string");
      await prisma.agendaEventAttendee.deleteMany({ where: { eventId: id } });
      if (attendeeIds.length) {
        await prisma.agendaEventAttendee.createMany({
          data: attendeeIds.map((userId) => ({ eventId: id, userId, status: "EN_ATTENTE" as const })),
        });
      }
    }

    const event = await prisma.agendaEvent.update({
      where: { id },
      data,
      include: agendaEventInclude,
    });

    const canOpenPo = isInternalPurchaseOrderActor(session.user);
    return NextResponse.json({
      event: {
        ...event,
        purchaseOrder: serializePurchaseOrderForAgenda(event.purchaseOrder, {
          canOpen: canOpenPo,
        }),
        linkedPurchaseOrder: Boolean(event.purchaseOrderId),
      },
    });
  } catch (error) {
    console.error("PATCH /api/agenda/events/[id]", error);
    return NextResponse.json({ error: "Erreur mise à jour" }, { status: 500 });
  }
}

/** DELETE /api/agenda/events/[id] — soft delete (ANNULE) */
export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const existing = await canAccessEvent(session.user, id);
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await prisma.agendaEvent.update({
    where: { id },
    data: { status: "ANNULE" },
  });
  return NextResponse.json({ ok: true });
}
