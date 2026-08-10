/**
 * AGENDA-V2A.3 — règles d’actions du panneau événement (UI + tests).
 * Distingue organisateur / responsable vs invité à réponse.
 */

import type { AgendaEventDTO } from "@/components/agenda/agenda-types";

export function isAgendaOrganizerOrResponsible(
  ev: Pick<AgendaEventDTO, "createdBy" | "responsibleId">,
  userId: string | null | undefined,
): boolean {
  if (!userId) return false;
  if (ev.createdBy?.id === userId) return true;
  if (ev.responsibleId === userId) return true;
  return false;
}

/**
 * Accepter / Refuser : uniquement invité attendee avec réponse attendue.
 * Jamais créateur / responsable (même s’il figure aussi dans attendees).
 */
export function canRespondToAgendaInvitation(
  ev: Pick<AgendaEventDTO, "createdBy" | "responsibleId" | "attendees" | "type">,
  userId: string | null | undefined,
): boolean {
  if (!userId) return false;
  if (ev.type === "LIVRAISON") return false;
  if (isAgendaOrganizerOrResponsible(ev, userId)) return false;
  const attendee = ev.attendees.find((a) => a.user.id === userId);
  if (!attendee) return false;
  const st = (attendee.status || "").toUpperCase();
  return st === "EN_ATTENTE" || st === "INVITE";
}

/** Types pour lesquels « Marquer terminé » a du sens sans attendre le début. */
const COMPLETE_ANYTIME = new Set([
  "INTERVENTION",
  "ECHEANCE",
  "CONTROLE",
  "LEVEE_RESERVES",
  "RECEPTION",
  "SITUATION",
  "FACTURATION",
]);

/**
 * Marquer terminé : pas pour une réunion / RDV futur non commencé.
 */
export function canMarkAgendaEventComplete(
  ev: Pick<AgendaEventDTO, "type" | "status" | "startAt" | "readOnly" | "purchaseOrder">,
  now = new Date(),
): boolean {
  if (ev.readOnly || ev.purchaseOrder) return false;
  if (ev.status === "TERMINE" || ev.status === "ANNULE") return false;
  if (COMPLETE_ANYTIME.has(ev.type)) return true;
  return new Date(ev.startAt).getTime() <= now.getTime();
}

export type AgendaPrimaryAction =
  | { kind: "rsvp_accept" }
  | { kind: "receive_po" }
  | { kind: "complete" }
  | { kind: "edit" }
  | { kind: "open_source"; href: string }
  | { kind: "open_po"; href: string }
  | null;

export function resolveAgendaPrimaryAction(
  ev: AgendaEventDTO,
  userId: string | null | undefined,
): AgendaPrimaryAction {
  if (canRespondToAgendaInvitation(ev, userId)) {
    return { kind: "rsvp_accept" };
  }
  const po = ev.purchaseOrder;
  if (po?.canReceive) {
    return { kind: "receive_po" };
  }
  if (canMarkAgendaEventComplete(ev)) {
    return { kind: "complete" };
  }
  if (!ev.readOnly && !po) {
    return { kind: "edit" };
  }
  if (po?.canOpen) {
    return { kind: "open_po", href: `/dashboard/commandes/${po.id}` };
  }
  if (ev.href) {
    return { kind: "open_source", href: ev.href };
  }
  return null;
}

/** Types dont startAt = échéance → urgence calculée OK. */
export { AGENDA_DUE_URGENCY_TYPES } from "@/lib/agenda/serialize-event";
