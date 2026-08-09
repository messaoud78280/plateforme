/**
 * Résumés période + priorisation panneau (AGENDA-V2B).
 * Projection légère — pas de chargement métier lourd.
 */

import { isDeliveryUnconfirmed } from "@/lib/agenda/event-card";
import type { AgendaEventDTO } from "@/components/agenda/agenda-types";
import { eventOverlapsDay, startOfDay } from "@/lib/agenda/dates";

export type PeriodSummary = {
  total: number;
  interventions: number;
  livraisons: number;
  echeances: number;
  reunions: number;
  aConfirmer: number;
  urgents: number;
};

export function summarizePeriod(events: AgendaEventDTO[]): PeriodSummary {
  const s: PeriodSummary = {
    total: events.length,
    interventions: 0,
    livraisons: 0,
    echeances: 0,
    reunions: 0,
    aConfirmer: 0,
    urgents: 0,
  };
  for (const ev of events) {
    if (ev.type === "INTERVENTION" || ev.type === "VISITE_CHANTIER" || ev.type === "LEVEE_RESERVES") {
      s.interventions += 1;
    } else if (ev.type === "LIVRAISON") {
      s.livraisons += 1;
    } else if (ev.type === "ECHEANCE" || ev.type === "SITUATION" || ev.type === "CONTROLE") {
      s.echeances += 1;
    } else if (
      ev.type === "REUNION_CHANTIER" ||
      ev.type === "RDV_CLIENT" ||
      ev.type === "RDV_FOURNISSEUR"
    ) {
      s.reunions += 1;
    }
    if (isDeliveryUnconfirmed(ev)) s.aConfirmer += 1;
    if (ev.urgency === "URGENT" || ev.urgency === "CRITIQUE") s.urgents += 1;
  }
  return s;
}

function priorityScore(ev: AgendaEventDTO): number {
  let score = 0;
  if (ev.urgency === "CRITIQUE") score += 100;
  else if (ev.urgency === "URGENT") score += 80;
  else if (ev.urgency === "IMPORTANT") score += 40;
  if (isDeliveryUnconfirmed(ev)) score += 50;
  if (ev.type === "ECHEANCE") score += 35;
  if (ev.type === "LIVRAISON") score += 30;
  if (ev.type === "INTERVENTION") score += 25;
  if (ev.status === "TERMINE") score -= 20;
  return score;
}

/** Prochaines dates importantes (max n), tri chrono puis priorité. */
export function pickKeyEvents(events: AgendaEventDTO[], max = 7): AgendaEventDTO[] {
  const now = Date.now();
  const upcoming = events
    .filter((ev) => new Date(ev.endAt).getTime() >= now - 60 * 60 * 1000)
    .slice()
    .sort((a, b) => {
      const pa = priorityScore(a);
      const pb = priorityScore(b);
      if (pb !== pa) return pb - pa;
      return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
    });
  return upcoming.slice(0, max);
}

export function eventsForDay(events: AgendaEventDTO[], day: Date): AgendaEventDTO[] {
  return events.filter((ev) => eventOverlapsDay(ev.startAt, ev.endAt, day));
}

/** Index jour → count pour marqueurs année (clé YYYY-MM-DD). */
export function dayActivityIndex(events: AgendaEventDTO[]): Map<string, { count: number; types: Set<string> }> {
  const map = new Map<string, { count: number; types: Set<string> }>();
  for (const ev of events) {
    const start = startOfDay(new Date(ev.startAt));
    const end = startOfDay(new Date(ev.endAt));
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const cur = map.get(key) ?? { count: 0, types: new Set<string>() };
      cur.count += 1;
      cur.types.add(ev.type);
      map.set(key, cur);
    }
  }
  return map;
}

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
