/**
 * PLANNING-V2A — helpers métier (AgendaEvent = source unique).
 */
import type { AgendaEventDTO } from "@/components/agenda/agenda-types";
import { agendaTypeMeta } from "@/lib/agenda/types";
import { findAgendaConflicts, type AgendaConflict } from "@/lib/agenda/conflicts";
import {
  addDays,
  endOfDay,
  formatTime,
  isSameDay,
  isoWeekNumber,
  startOfDay,
  startOfWeek,
} from "@/lib/agenda/dates";

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

export type PlanningWorkDays = 5 | 6 | 7;

export type PlanningResource = {
  id: string;
  name: string;
  email: string;
  jobTitle?: string | null;
  permissionProfile?: string | null;
  personType?: string | null;
  kind: "person" | "unassigned";
};

export type PlanningTeamUser = {
  id: string;
  name: string;
  email: string;
  jobTitle?: string | null;
  permissionProfile?: string | null;
  personType?: string | null;
};

/** Ressource planifiable interne — exclut client / fournisseur / sous-traitant / inactifs. */
export function isPlanifiableUser(u: {
  personType?: string | null;
  permissionProfile?: string | null;
  accessStatus?: string | null;
}): boolean {
  if (u.accessStatus === "DISABLED" || u.accessStatus === "SUSPENDED") return false;
  const pt = u.personType ?? "INTERNAL";
  if (pt === "CLIENT_EXT" || pt === "SUPPLIER" || pt === "SUBCONTRACTOR") return false;
  const pp = u.permissionProfile ?? "";
  if (pp === "CLIENT" || pp === "FOURNISSEUR") return false;
  return true;
}

/**
 * Profils « terrain » planifiables — basés uniquement sur PermissionProfile existants.
 * Pas de TECHNICIEN / OUVRIER dans le modèle actuel.
 * Direction & Administratif restent planifiables via « Toute l'équipe ».
 */
export const PLANNING_TERRAIN_PROFILES = ["CONDUCTEUR", "CHEF_CHANTIER"] as const;

export type PlanningResourceScope = "terrain" | "all";

export function isTerrainPlanifiableProfile(permissionProfile?: string | null): boolean {
  return (PLANNING_TERRAIN_PROFILES as readonly string[]).includes(permissionProfile ?? "");
}

/** Filtre UI ressources — ne touche pas isPlanifiableUser (ACL / chargement). */
export function filterResourcesByScope<T extends { permissionProfile?: string | null }>(
  list: T[],
  scope: PlanningResourceScope,
): T[] {
  if (scope !== "terrain") return list;
  const terrain = list.filter((u) => isTerrainPlanifiableProfile(u.permissionProfile));
  // Fallback : si aucun profil terrain, conserver toute l'équipe (évite board vide)
  return terrain.length > 0 ? terrain : list;
}

export function hasTerrainPlanifiableUsers(
  list: { permissionProfile?: string | null }[],
): boolean {
  return list.some((u) => isTerrainPlanifiableProfile(u.permissionProfile));
}

export function planningRoleLabel(u: {
  jobTitle?: string | null;
  permissionProfile?: string | null;
  id: string;
  currentUserId?: string;
}): string {
  if (u.jobTitle?.trim()) return u.jobTitle.trim();
  switch (u.permissionProfile) {
    case "DIRECTION":
      return "Direction";
    case "CONDUCTEUR":
      return "Conducteur de travaux";
    case "ADMINISTRATIF":
      return "Responsable administratif";
    case "CHEF_CHANTIER":
      return "Chef de chantier";
    default:
      break;
  }
  if (u.currentUserId && u.id === u.currentUserId) return "Vous";
  return "Équipe";
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

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
  const d0 = startOfDay(day).getTime();
  const d1 = endOfDay(day).getTime();
  return s <= d1 && en >= d0;
}

export function eventHasConflict(event: AgendaEventDTO, all: AgendaEventDTO[]): boolean {
  return listEventConflicts(event, all).length > 0;
}

export function listEventConflicts(
  event: AgendaEventDTO,
  all: AgendaEventDTO[],
): AgendaConflict[] {
  return findAgendaConflicts(
    {
      id: event.id.includes("__") ? event.id.split("__")[0] : event.id,
      startAt: event.startAt,
      endAt: event.endAt,
      responsibleId: event.responsibleId,
      projectId: event.projectId,
    },
    all,
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
  const time = e.allDay ? "Journée" : `${formatTime(start)}–${formatTime(end)}`;
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

/** Jours visibles selon préférence entreprise (ISO lun→…). */
export function visibleDaysForRange(
  weekStart: Date,
  mode: "day" | "week" | "fortnight",
  workDays: PlanningWorkDays,
  cursor: Date,
): Date[] {
  if (mode === "day") return [startOfDay(cursor)];
  const n = mode === "fortnight" ? 14 : 7;
  const all = Array.from({ length: n }, (_, i) => addDays(weekStart, i));
  if (mode === "week") return all.slice(0, workDays);
  // 2 semaines : 2 × workDays (pas les week-ends si 5j)
  const out: Date[] = [];
  for (let w = 0; w < 2; w++) {
    for (let d = 0; d < workDays; d++) {
      out.push(addDays(weekStart, w * 7 + d));
    }
  }
  return out;
}

export function planningPeriodLabel(
  mode: "day" | "week" | "fortnight",
  cursor: Date,
  days: Date[],
): { weekLabel: string; rangeLabel: string; title: string } {
  const weekStart = startOfWeek(cursor);
  const weekLabel = `Semaine ${isoWeekNumber(weekStart)}`;
  if (mode === "day") {
    const raw = cursor.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const title = raw.charAt(0).toUpperCase() + raw.slice(1);
    // rangeLabel vide en jour → évite le doublon title / sous-titre (PLANNING-V2B)
    return { weekLabel, rangeLabel: "", title };
  }
  const first = days[0] ?? weekStart;
  const last = days[days.length - 1] ?? first;
  const rangeLabel = `${first.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  })} – ${last.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`;
  const title =
    mode === "week"
      ? `${weekLabel}`
      : `S${isoWeekNumber(weekStart)}–S${isoWeekNumber(addDays(weekStart, 7))}`;
  return { weekLabel, rangeLabel, title };
}

/**
 * Aucune affectation planifiée ce jour (≠ disponibilité réelle).
 * Pas de congés / absences / horaires — voir dette Planning Availability V2.
 */
export function isResourceFreeOnDay(
  events: AgendaEventDTO[],
  resourceId: string,
  day: Date,
): boolean {
  if (resourceId === "__unassigned") return false;
  return eventsForResourceOnDay(events, resourceId, day).length === 0;
}

/** Alias explicite — wording UI : « Sans affectation », jamais « Disponible ». */
export const resourceHasNoAssignmentOnDay = isResourceFreeOnDay;

export function unassignedEventsInRange(
  events: AgendaEventDTO[],
  from: Date,
  to: Date,
): AgendaEventDTO[] {
  const t0 = from.getTime();
  const t1 = to.getTime();
  return events
    .filter((e) => {
      if (e.responsibleId) return false;
      const s = new Date(e.startAt).getTime();
      const en = new Date(e.endAt).getTime();
      return s <= t1 && en >= t0;
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}

export function planningSummary(
  events: AgendaEventDTO[],
  resources: PlanningResource[],
  from: Date,
  to: Date,
): {
  collaborators: number;
  sites: number;
  assignments: number;
  conflicts: number;
  unassigned: number;
} {
  const people = resources.filter((r) => r.kind === "person");
  const inRange = events.filter((e) => {
    const s = new Date(e.startAt).getTime();
    const en = new Date(e.endAt).getTime();
    return s <= to.getTime() && en >= from.getTime();
  });
  const sites = new Set(
    inRange.map((e) => e.projectId || e.project?.title).filter(Boolean) as string[],
  );
  let conflicts = 0;
  const seen = new Set<string>();
  for (const e of inRange) {
    if (!e.responsibleId) continue;
    if (listEventConflicts(e, inRange).length > 0) {
      const key = e.id.includes("__") ? e.id.split("__")[0]! : e.id;
      if (!seen.has(key)) {
        seen.add(key);
        conflicts += 1;
      }
    }
  }
  return {
    collaborators: people.length,
    sites: sites.size,
    assignments: inRange.filter((e) => e.responsibleId).length,
    conflicts,
    unassigned: inRange.filter((e) => !e.responsibleId).length,
  };
}

export function nextAssignmentAfter(
  events: AgendaEventDTO[],
  after: Date,
): AgendaEventDTO | null {
  const t = after.getTime();
  const next = events
    .filter((e) => new Date(e.startAt).getTime() > t && e.responsibleId)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  return next[0] ?? null;
}

/** Livraison liée commande : ne pas drag-replanifier depuis Planning. */
export function isDragBlocked(e: AgendaEventDTO): { blocked: boolean; reason?: string } {
  if (e.readOnly) return { blocked: true, reason: "Événement non modifiable depuis le Planning." };
  if (e.type === "LIVRAISON" && (e.linkedPurchaseOrder || e.purchaseOrderId)) {
    return {
      blocked: true,
      reason: "Livraison liée à une commande — replanifier depuis la commande.",
    };
  }
  if (e.deliveryVisual === "CONFIRMEE") {
    return {
      blocked: true,
      reason: "Livraison confirmée fournisseur — passage par la commande requis.",
    };
  }
  return { blocked: false };
}

export function shiftEventToDay(e: AgendaEventDTO, targetDay: Date): {
  startAt: string;
  endAt: string;
} {
  const start = new Date(e.startAt);
  const end = new Date(e.endAt);
  const duration = end.getTime() - start.getTime();
  const nextStart = new Date(targetDay);
  nextStart.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), 0);
  const nextEnd = new Date(nextStart.getTime() + duration);
  return { startAt: nextStart.toISOString(), endAt: nextEnd.toISOString() };
}
