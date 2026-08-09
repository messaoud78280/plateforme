/**
 * CDE-3B2 — Rappels / escalades PurchaseOrder (même pipeline W3).
 * Isolation par commande : une erreur n’arrête pas les autres.
 */
import { prisma } from "@/lib/prisma";
import { evaluateAttentionEscalation } from "@/lib/follow-up/attention/evaluate-escalation";
import { shouldNotifyAttentionLevel } from "@/lib/follow-up/attention/notify-policy";
import {
  resolveEscalationRecipient,
  type ProcessEscalationsResult,
} from "@/lib/follow-up/attention/process-escalations";
import type { UrgencyLevel } from "@/lib/follow-up/types";
import {
  computeReceivingSnapshot,
  evaluatePurchaseOrderAttention,
} from "@/lib/purchase-orders/attention/evaluate";
import { purchaseOrderAttentionEpisodeKey } from "@/lib/purchase-orders/attention/episode";
import {
  purchaseOrderAttentionActionUrl,
  resolvePurchaseOrderNotificationRecipient,
  syncAttentionNotificationsForPurchaseOrders,
} from "@/lib/purchase-orders/attention/sync-notifications";
import type { PurchaseOrderAttentionInput } from "@/lib/purchase-orders/attention/types";

const ACTIVE_STATUSES = [
  "A_VALIDER",
  "VALIDEE",
  "ENVOYEE_FOURNISSEUR",
  "A_CONFIRMER",
  "CONFIRMEE",
  "LIVRAISON_PROGRAMMEE",
  "PARTIELLEMENT_RECUE",
  "REFUSEE",
  "RECUE",
] as const;

function isInternalPerson(personType: string | null | undefined): boolean {
  if (!personType) return true;
  return personType === "INTERNAL";
}

function isExternalPerson(personType: string | null | undefined): boolean {
  return personType === "CLIENT_EXT" || personType === "SUPPLIER";
}

/**
 * 1) sync INITIAL (primaryReason uniquement)
 * 2) evaluateAttentionEscalation (subjectType PURCHASE_ORDER)
 */
export async function processPurchaseOrderAttentionEscalations(opts?: {
  now?: Date;
  organizationId: string;
  take?: number;
}): Promise<ProcessEscalationsResult> {
  const now = opts?.now ?? new Date();
  const result: ProcessEscalationsResult = {
    examined: 0,
    reminded: 0,
    escalated: 0,
    skipped: 0,
    unchanged: 0,
    initialCreated: 0,
    errors: [],
  };
  const organizationId = opts?.organizationId;
  if (!organizationId) return result;

  const fullOrders = await prisma.purchaseOrder.findMany({
    where: {
      organizationId,
      status: { in: [...ACTIVE_STATUSES] },
    },
    select: {
      id: true,
      number: true,
      subject: true,
      status: true,
      sharedWithSupplier: true,
      requestedDeliveryAt: true,
      confirmedDeliveryAt: true,
      proposedDeliveryAt: true,
      proposedDeliveryStatus: true,
      supplierRefuseReason: true,
      responsibleId: true,
      requestedById: true,
      requestedBy: { select: { id: true, name: true, personType: true } },
      responsible: { select: { id: true, name: true, personType: true } },
      externalOrganization: { select: { name: true, tradeName: true } },
      project: { select: { title: true } },
      lines: {
        select: { id: true, designation: true, unit: true, quantity: true },
      },
      receipts: {
        select: {
          id: true,
          receivedAt: true,
          cancelledAt: true,
          status: true,
          deliveryNoteNumber: true,
          documents: { where: { kind: "BL" }, select: { id: true }, take: 1 },
          lines: {
            select: {
              orderLineId: true,
              receivedQty: true,
              damagedQty: true,
              refusedQty: true,
            },
          },
        },
      },
      events: {
        where: { kind: { in: ["shared", "supplier_propose", "supplier_refuse"] } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, kind: true, createdAt: true },
      },
      agendaEvents: {
        where: { type: "LIVRAISON", status: { not: "ANNULE" } },
        take: 1,
        select: { id: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: opts?.take ?? 200,
  });

  const inputs: PurchaseOrderAttentionInput[] = fullOrders.map((o) => {
    const sharedEv = o.events.find((e) => e.kind === "shared");
    const proposeEv = o.events.find((e) => e.kind === "supplier_propose");
    const refuseEv = o.events.find((e) => e.kind === "supplier_refuse");
    return {
      id: o.id,
      number: o.number,
      status: o.status,
      subject: o.subject,
      sharedWithSupplier: o.sharedWithSupplier,
      sharedWithSupplierAt: sharedEv?.createdAt ?? null,
      sharedEventId: sharedEv?.id ?? null,
      proposeEventId: proposeEv?.id ?? null,
      refuseEventId: refuseEv?.id ?? null,
      requestedDeliveryAt: o.requestedDeliveryAt,
      confirmedDeliveryAt: o.confirmedDeliveryAt,
      proposedDeliveryAt: o.proposedDeliveryAt,
      proposedDeliveryStatus: o.proposedDeliveryStatus,
      supplierRefuseReason: o.supplierRefuseReason,
      supplierName: o.externalOrganization.tradeName || o.externalOrganization.name,
      projectTitle: o.project?.title ?? null,
      responsibleId: o.responsibleId,
      responsibleName: o.responsible?.name ?? null,
      requestedById: o.requestedById,
      requestedByName: o.requestedBy?.name ?? null,
      lines: o.lines.map((l) => ({
        id: l.id,
        designation: l.designation,
        unit: l.unit,
        quantity: Number(l.quantity),
      })),
      receipts: o.receipts.map((r) => ({
        id: r.id,
        receivedAt: r.receivedAt,
        cancelledAt: r.cancelledAt,
        status: r.status,
        deliveryNoteNumber: r.deliveryNoteNumber,
        hasBlDocument: r.documents.length > 0,
      })),
      receiptLines: o.receipts.flatMap((r) =>
        r.lines.map((l) => ({
          orderLineId: l.orderLineId,
          receivedQty: Number(l.receivedQty),
          damagedQty: Number(l.damagedQty),
          refusedQty: Number(l.refusedQty),
          receiptId: r.id,
        })),
      ),
      agendaEventId: o.agendaEvents[0]?.id ?? null,
    };
  });

  try {
    const sync = await syncAttentionNotificationsForPurchaseOrders(inputs, {
      now,
      organizationId,
    });
    result.initialCreated += sync.created;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    result.errors.push(`po-sync: ${msg}`);
    console.error("[processPurchaseOrderAttentionEscalations] sync", e);
  }

  const orgOwner = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { ownerUserId: true },
  });
  const ownerUserId = orgOwner?.ownerUserId ?? "";

  for (const order of inputs) {
    result.examined += 1;
    try {
      const attention = evaluatePurchaseOrderAttention(order, { now });
      if (!shouldNotifyAttentionLevel(attention.effectiveUrgency)) {
        result.skipped += 1;
        continue;
      }
      const primary = attention.attentionItems[0];
      if (!primary?.code || !attention.primaryReason) {
        result.skipped += 1;
        continue;
      }

      const responsibleId = await resolvePurchaseOrderNotificationRecipient(order);
      if (!responsibleId) {
        result.skipped += 1;
        continue;
      }

      const escalateToId = await resolveEscalationRecipient({
        organizationId,
        ownerUserId: ownerUserId || responsibleId,
        responsibleId,
      });

      const level = attention.effectiveUrgency as UrgencyLevel;
      const snap = computeReceivingSnapshot(order);
      const episode = purchaseOrderAttentionEpisodeKey(order, primary.code, snap);

      const userIds = [responsibleId, escalateToId].filter(Boolean) as string[];
      const existing = await prisma.notification.findMany({
        where: {
          userId: { in: userIds },
          dedupeKey: { contains: `:${order.id}:` },
        },
        select: { dedupeKey: true, userId: true, type: true, createdAt: true },
      });
      const scoped = existing.filter((n) => {
        const k = n.dedupeKey ?? "";
        return k.includes("PURCHASE_ORDER:") && k.includes(`:${order.id}:`);
      });

      const supplier = (order.supplierName || "Fournisseur").trim();
      const titleBase = `${supplier} — ${order.number}`;

      const plan = evaluateAttentionEscalation({
        sheetId: order.id,
        sheetTitle: titleBase,
        code: primary.code,
        level,
        primaryReason: attention.primaryReason,
        statusEnteredAt: order.sharedWithSupplierAt ?? order.requestedDeliveryAt,
        statusEpisodeKey: episode,
        responsibleId,
        escalateToId,
        responsibleName: order.responsibleName ?? null,
        workflowStep: null,
        existingNotifications: scoped,
        now,
        subjectType: "PURCHASE_ORDER",
      });

      if (
        plan.action === "NONE" ||
        !plan.recipientId ||
        !plan.dedupeKey ||
        !plan.notificationType
      ) {
        result.unchanged += 1;
        continue;
      }

      const recipient = await prisma.user.findUnique({
        where: { id: plan.recipientId },
        select: { id: true, personType: true },
      });
      if (
        !recipient ||
        isExternalPerson(recipient.personType) ||
        !isInternalPerson(recipient.personType)
      ) {
        result.skipped += 1;
        continue;
      }

      const membership = await prisma.organizationMember.findFirst({
        where: { organizationId, userId: plan.recipientId },
        select: { id: true },
      });
      if (!membership && plan.recipientId !== ownerUserId) {
        result.skipped += 1;
        continue;
      }

      const exists = await prisma.notification.findUnique({
        where: { dedupeKey: plan.dedupeKey },
        select: { id: true },
      });
      if (exists) {
        result.unchanged += 1;
        continue;
      }

      await prisma.notification.create({
        data: {
          userId: plan.recipientId,
          type: plan.notificationType,
          title: plan.title ?? "Attention commande",
          message: plan.message ?? plan.problemReason,
          actionUrl: purchaseOrderAttentionActionUrl(order.id, primary.code),
          dedupeKey: plan.dedupeKey,
        },
      });
      if (plan.action === "REMIND") result.reminded += 1;
      else result.escalated += 1;
    } catch (e: unknown) {
      const code =
        e && typeof e === "object" && "code" in e
          ? String((e as { code?: string }).code)
          : "";
      if (code === "P2002") {
        result.unchanged += 1;
      } else {
        const msg = e instanceof Error ? e.message : String(e);
        result.errors.push(`po:${order.id}`);
        console.error(`[processPurchaseOrderAttentionEscalations] ${order.id}`, msg);
        result.skipped += 1;
      }
    }
  }

  return result;
}
