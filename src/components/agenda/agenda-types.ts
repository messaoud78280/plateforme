import type { AgendaPurchaseOrderSummary } from "@/lib/agenda/serialize-event";

export type AgendaEventDTO = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  type: string;
  status: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  projectId: string | null;
  followUpSheetId?: string | null;
  purchaseOrderId?: string | null;
  /** Lien vers le message d’origine (Action BeWork). */
  sourceMessageKind?: string | null;
  sourceMessageId?: string | null;
  sourceMessageHref?: string | null;
  responsibleId: string | null;
  reminderMinutes: number | null;
  recurrence: string | null;
  /** Présent si l’item vient d’une tâche / jalon / RDV (non éditable dans l’agenda). */
  readOnly?: boolean;
  /** Livraison liée PO : horaires pilotés par PurchaseOrder (confirm avant drag). */
  linkedPurchaseOrder?: boolean;
  source?: "agenda" | "task" | "project_start" | "project_end" | "appointment";
  href?: string | null;
  urgency?: string | null;
  urgencyLabel?: string | null;
  /** Statut métier livraison (≠ statut AgendaEvent). */
  deliveryVisual?: "A_CONFIRMER" | "CONFIRMEE" | "PROPOSITION" | "ANNULEE" | null;
  project: { id: string; title: string; siteCity: string | null; siteAddress: string | null } | null;
  responsible: { id: string; name: string; email: string } | null;
  createdBy: { id: string; name: string; email: string };
  attendees: { id: string; status: string; user: { id: string; name: string; email: string } }[];
  followUpSheet?: { id: string; title: string } | null;
  purchaseOrder?: AgendaPurchaseOrderSummary | null;
};

export type AgendaProjectOption = { id: string; title: string };
export type AgendaUserOption = { id: string; name: string; email: string };
export type AgendaView = "day" | "week" | "month" | "year";

export type AgendaQuickCreateDraft = {
  startAt: string;
  endAt: string;
  allDay?: boolean;
};
