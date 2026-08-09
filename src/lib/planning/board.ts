import type { AgendaEventDTO } from "@/components/agenda/agenda-types";
import { agendaTypeMeta } from "@/lib/agenda/types";
import { findAgendaConflicts } from "@/lib/agenda/conflicts";
import { formatTime, isSameDay } from "@/lib/agenda/dates";

/** Types utiles à l’organisation chantier (vue ressources). */
export const PLANNING_RELEVANT_TYPES = new Set([
  "INTERVENTION",
  "VISITE_CHANTIER",
  "LIVRAISON",
  "REUNION_CHANTIER",
  "RDV_CLIENT",
  "RDV_FOURNISSEUR",
  "CONTROLE",
  "LEVEE_RESERVES",
  "RECEPTION",
  "FORMATION",
  "CONGE",
]);

export type PlanningResource = {
  id: string;
  name: string;
  email: string;
  jobTitle?: string | null;
  kind: "person" | "unassigned";
};

export function filterPlanningEvents(events: AgendaEventDTO[]): AgendaEventDTO[] {
  return events.filter(
    (e) =>
      e.status !== "ANNULE" &&
      (PLANNING_RELEVANT_TYPES.has(e.type) || Boolean(e.responsibleId) || e.type === "LIVRAISON"),
  );
}

export function eventsForResourceOnDay(
  events: AgendaEventDTO[],
  resourceId: string,
  day: Date,
): AgendaEventDTO[] {
  return events
    .filter((e) => {
      if (!isSameDay(new Date(e.startAt), day) && !spansDay(e, day)) return false;
      if (resourceId === "__unassigned") {
        return !e.responsibleId;
      }
      if (e.responsibleId === resourceId) return true;
      return e.attendees?.some((a) => a.user.id === resourceId) ?? false;
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}

function spansDay(e: AgendaEventDTO, day: Date): boolean {
  const s = new Date(e.startAt).getTime();
  const en = new Date(e.endAt).getTime();
  const d0 = new Date(day);
  d0.setHours(0, 0, 0, 0);
  const d1 = new Date(day);
  d1.setHours(23, 59, 59, 999);
  return s <= d1.getTime() && en >= d0.getTime();
}

export function eventHasConflict(event: AgendaEventDTO, all: AgendaEventDTO[]): boolean {
  return (
    findAgendaConflicts(
      {
        id: event.id.includes("__") ? event.id.split("__")[0] : event.id,
        startAt: event.startAt,
        endAt: event.endAt,
        responsibleId: event.responsibleId,
        projectId: event.projectId,
      },
      all,
    ).length > 0
  );
}

export function planningBlockLabel(e: AgendaEventDTO): {
  time: string;
  site: string;
  type: string;
  who: string;
} {
  const start = new Date(e.startAt);
  const end = new Date(e.endAt);
  const time = e.allDay
    ? "Journée"
    : `${formatTime(start)} — ${formatTime(end)}`;
  const site =
    e.project?.title ||
    e.purchaseOrder?.supplierName ||
    e.location ||
    e.title;
  const type =
    e.type === "LIVRAISON" && e.purchaseOrder
      ? `Livraison ${e.purchaseOrder.supplierName ?? e.purchaseOrder.number}`
      : agendaTypeMeta(e.type).label;
  const who = e.responsible?.name?.split(" ")[0] ?? "—";
  return { time, site, type, who };
}

export function eventHref(e: AgendaEventDTO): string {
  if (e.href) return e.href;
  if (e.purchaseOrderId) return `/dashboard/commandes/${e.purchaseOrderId}`;
  if (e.projectId) return `/dashboard/projets/${e.projectId}`;
  if (e.followUpSheetId) return `/dashboard/fiches-suivi/${e.followUpSheetId}`;
  return `/dashboard/agenda?event=${encodeURIComponent(e.id)}`;
}
