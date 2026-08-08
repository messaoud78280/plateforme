/**
 * AGENDA-V2A — Normalisation AgendaEvent → DTO calendrier (sans prix / notes internes PO).
 */
import { computeUrgencyFromDue } from "@/lib/follow-up/urgency";
import { URGENCY_LABELS } from "@/lib/follow-up/types";
import { resolveDeliverySchedule } from "@/lib/purchase-orders/sync-delivery";
import type { PurchaseOrderStatus } from "@prisma/client";

export type AgendaPurchaseOrderSummary = {
  id: string;
  number: string;
  subject: string;
  status: string;
  supplierName: string | null;
  linesSummary: string | null;
  requestedDeliveryAt: string | null;
  confirmedDeliveryAt: string | null;
  proposedDeliveryAt: string | null;
  proposedDeliveryStatus: string | null;
  deliveryVisual: "A_CONFIRMER" | "CONFIRMEE" | "PROPOSITION" | "ANNULEE" | null;
  canOpen: boolean;
  canReceive: boolean;
  legacyTaskId: string | null;
};

type PoInclude = {
  id: string;
  number: string;
  subject: string;
  status: PurchaseOrderStatus | string;
  requestedDeliveryAt: Date | null;
  confirmedDeliveryAt: Date | null;
  proposedDeliveryAt: Date | null;
  proposedDeliveryStatus: string | null;
  legacyTaskId: string | null;
  externalOrganization?: { name: string; tradeName: string | null } | null;
  lines?: { designation: string; quantity: unknown; unit: string }[];
} | null;

export function serializePurchaseOrderForAgenda(
  po: PoInclude,
  opts?: { canOpen?: boolean },
): AgendaPurchaseOrderSummary | null {
  if (!po) return null;
  const canOpen = opts?.canOpen !== false;
  const schedule = resolveDeliverySchedule({
    status: po.status as PurchaseOrderStatus,
    requestedDeliveryAt: po.requestedDeliveryAt,
    confirmedDeliveryAt: po.confirmedDeliveryAt,
    proposedDeliveryAt: po.proposedDeliveryAt,
    proposedDeliveryStatus: po.proposedDeliveryStatus,
  });
  const lines = (po.lines ?? []).slice(0, 3);
  const linesSummary =
    lines.length === 0
      ? null
      : lines
          .map((l) => {
            const q = Number(l.quantity);
            const qty = Number.isFinite(q) ? (Number.isInteger(q) ? String(q) : q.toFixed(1)) : "?";
            return `${qty} ${l.unit} ${l.designation}`;
          })
          .join(" · ");

  const closed = ["RECUE", "CLOTUREE", "ANNULEE", "REFUSEE", "BROUILLON"].includes(
    String(po.status),
  );

  return {
    id: po.id,
    number: po.number,
    subject: po.subject,
    status: String(po.status),
    supplierName:
      po.externalOrganization?.tradeName || po.externalOrganization?.name || null,
    linesSummary,
    requestedDeliveryAt: po.requestedDeliveryAt?.toISOString() ?? null,
    confirmedDeliveryAt: po.confirmedDeliveryAt?.toISOString() ?? null,
    proposedDeliveryAt: po.proposedDeliveryAt?.toISOString() ?? null,
    proposedDeliveryStatus: po.proposedDeliveryStatus,
    deliveryVisual: schedule.visualLabel,
    canOpen,
    canReceive: canOpen && !closed,
    legacyTaskId: po.legacyTaskId,
  };
}

export function buildAgendaUrgency(opts: {
  startAt: Date;
  status: string;
  followUpSheet?: {
    nextActionAt: Date | null;
    nextActionDone: boolean;
    urgencyOverride: string | null;
  } | null;
}) {
  const sheet = opts.followUpSheet;
  const urgency = sheet
    ? computeUrgencyFromDue(sheet.nextActionAt ?? opts.startAt, {
        nextActionDone: sheet.nextActionDone,
        override: sheet.urgencyOverride as never,
      })
    : computeUrgencyFromDue(opts.startAt, {
        nextActionDone: opts.status === "TERMINE",
      });
  return { urgency, urgencyLabel: URGENCY_LABELS[urgency] };
}

export const AGENDA_STATUS_LABELS: Record<string, string> = {
  PLANIFIE: "À confirmer",
  CONFIRME: "Confirmée",
  TERMINE: "Terminée",
  ANNULE: "Annulée",
};

export const AGENDA_LAYER_FILTERS = [
  { id: "livraisons", label: "Livraisons", types: ["LIVRAISON"] },
  { id: "interventions", label: "Interventions", types: ["INTERVENTION"] },
  {
    id: "reunions",
    label: "Réunions",
    types: ["REUNION_CHANTIER", "VISITE_CHANTIER"],
  },
  {
    id: "rdv",
    label: "Rendez-vous",
    types: ["RDV_CLIENT", "RDV_FOURNISSEUR"],
  },
  { id: "echeances", label: "Échéances", types: ["ECHEANCE", "SITUATION", "FACTURATION"] },
] as const;

export type AgendaLayerId = (typeof AGENDA_LAYER_FILTERS)[number]["id"];
