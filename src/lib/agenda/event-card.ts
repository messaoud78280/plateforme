/**
 * Contenu compact des cartes Agenda (lisibilité chantier, pas de paragraphes).
 * TYPE ≠ STATUT ≠ URGENCE — affichés séparément.
 */

import { formatTime } from "@/lib/agenda/dates";
import { agendaTypeMeta } from "@/lib/agenda/types";
import type { AgendaEventDTO } from "@/components/agenda/agenda-types";

export function isDeliveryUnconfirmed(ev: AgendaEventDTO): boolean {
  return (
    ev.deliveryVisual === "A_CONFIRMER" ||
    ev.deliveryVisual === "PROPOSITION" ||
    (ev.type === "LIVRAISON" && ev.status === "PLANIFIE")
  );
}

export function isAgendaEventDone(ev: AgendaEventDTO): boolean {
  return ev.status === "TERMINE";
}

/** Chantier / lieu court pour carte. */
export function agendaEventSiteLabel(ev: AgendaEventDTO): string | null {
  if (ev.project?.title) {
    const t = ev.project.title.trim();
    // « Victor Hugo — … » → Victor Hugo
    const short = t.split(/[—–|-]/)[0]?.trim() || t;
    return short.length > 28 ? `${short.slice(0, 26)}…` : short;
  }
  if (ev.project?.siteCity) return ev.project.siteCity;
  if (ev.location) return ev.location;
  return null;
}

export function agendaEventPersonFirst(ev: AgendaEventDTO): string | null {
  const n = ev.responsible?.name?.trim();
  if (!n) return null;
  return n.split(/\s+/)[0] ?? n;
}

export type AgendaCardLines = {
  eyebrow: string;
  title: string;
  time: string | null;
  meta: string | null;
  unconfirmed: boolean;
  done: boolean;
  urgencyDot: boolean;
};

export function agendaEventCardLines(
  ev: AgendaEventDTO,
  opts?: { start?: Date; end?: Date },
): AgendaCardLines {
  const meta = agendaTypeMeta(ev.type);
  const start = opts?.start ?? new Date(ev.startAt);
  const end = opts?.end ?? new Date(ev.endAt);
  const po = ev.purchaseOrder;
  const unconfirmed = isDeliveryUnconfirmed(ev);
  const done = isAgendaEventDone(ev);
  const site = agendaEventSiteLabel(ev);
  const who = agendaEventPersonFirst(ev);

  let eyebrow = meta.label.toUpperCase();
  let title = ev.title;

  if (ev.type === "LIVRAISON") {
    eyebrow = po?.supplierName
      ? `🚚 ${po.supplierName.toUpperCase()}`
      : "LIVRAISON";
    title = site || ev.title;
  } else if (ev.type === "INTERVENTION") {
    eyebrow = "INTERVENTION";
    title = site || ev.title;
  } else if (ev.type === "ECHEANCE" || ev.type === "SITUATION") {
    eyebrow = "ÉCHÉANCE";
  } else if (ev.type === "REUNION_CHANTIER" || ev.type === "VISITE_CHANTIER") {
    eyebrow = ev.type === "VISITE_CHANTIER" ? "VISITE" : "RÉUNION";
    if (site) title = site;
  }

  if (done) {
    eyebrow = `✓ ${eyebrow}`;
  }

  const time = ev.allDay
    ? "Toute la journée"
    : `${formatTime(start)}${
        end.getTime() - start.getTime() > 45 * 60_000 ? `–${formatTime(end)}` : ""
      }`;

  const bits: string[] = [];
  if (unconfirmed) {
    bits.push(
      ev.deliveryVisual === "PROPOSITION" ? "Proposé" : "À confirmer",
    );
  } else if (ev.type === "LIVRAISON" && (ev.deliveryVisual === "CONFIRMEE" || ev.status === "CONFIRME")) {
    bits.push("Confirmée");
  } else if (done) {
    bits.push(ev.type === "LIVRAISON" ? "Réceptionnée" : "Terminé");
  }
  if (who) bits.push(who);
  if (site && ev.type === "LIVRAISON" && title !== site) bits.unshift(site);

  return {
    eyebrow,
    title: title || meta.label,
    time,
    meta: bits.length ? bits.join(" · ") : null,
    unconfirmed,
    done,
    urgencyDot: Boolean(ev.urgency && ev.urgency !== "NORMAL"),
  };
}
