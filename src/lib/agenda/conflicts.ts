import type { AgendaEventDTO } from "@/components/agenda/agenda-types";

export type AgendaConflict = {
  otherId: string;
  otherTitle: string;
  reason: "responsable" | "chantier";
  otherStartAt?: string;
  responsibleName?: string | null;
};

/** Détecte les chevauchements horaires (même responsable ou même chantier). */
export function findAgendaConflicts(
  candidate: {
    id?: string | null;
    startAt: string;
    endAt: string;
    responsibleId?: string | null;
    projectId?: string | null;
  },
  events: AgendaEventDTO[],
): AgendaConflict[] {
  const start = new Date(candidate.startAt).getTime();
  const end = new Date(candidate.endAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return [];

  const conflicts: AgendaConflict[] = [];
  const seen = new Set<string>();

  for (const e of events) {
    if (e.readOnly) continue;
    if (e.status === "ANNULE" || e.status === "TERMINE") continue;
    const baseId = e.id.includes("__") ? e.id.split("__")[0]! : e.id;
    if (candidate.id && (e.id === candidate.id || baseId === candidate.id)) continue;
    if (seen.has(baseId)) continue;

    const es = new Date(e.startAt).getTime();
    const ee = new Date(e.endAt).getTime();
    if (!(start < ee && end > es)) continue;

    if (candidate.responsibleId && e.responsibleId && candidate.responsibleId === e.responsibleId) {
      seen.add(baseId);
      conflicts.push({
        otherId: baseId,
        otherTitle: e.title,
        reason: "responsable",
        otherStartAt: e.startAt,
        responsibleName: e.responsible?.name ?? null,
      });
      continue;
    }
    if (candidate.projectId && e.projectId && candidate.projectId === e.projectId) {
      seen.add(baseId);
      conflicts.push({
        otherId: baseId,
        otherTitle: e.title,
        reason: "chantier",
        otherStartAt: e.startAt,
      });
    }
  }

  return conflicts;
}

/** Message humain non bloquant pour le panneau / modal. */
export function formatAgendaConflictWarning(
  conflicts: AgendaConflict[],
  responsibleName?: string | null,
): string | null {
  if (conflicts.length === 0) return null;
  const c = conflicts[0]!;
  const who =
    c.reason === "responsable"
      ? c.responsibleName || responsibleName || "Ce responsable"
      : "Ce chantier";
  const when = c.otherStartAt
    ? new Date(c.otherStartAt).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  return `⚠ Conflit d’agenda pour ${who} — ${when ? `${when} · ` : ""}${c.otherTitle}`;
}
