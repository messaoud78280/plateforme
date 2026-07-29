/**
 * Vocabulaires Pilotage travaux — source de vérité côté code.
 *
 * Les colonnes restent en String en base (pas de migration Prisma) : ces
 * constantes + helpers garantissent qu'on écrit et compare toujours les
 * mêmes libellés FR, y compris en tolérant une casse différente en lecture
 * (ex. « à vérifier » vs « À vérifier » déjà observé en prod).
 */

type ReadonlyStringTuple = readonly string[];

/** Normalise pour comparaison : trim + minuscules + apostrophes unifiées. */
export function normalizePilotageLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "'")
    .replace(/\s+/g, " ");
}

/**
 * Retrouve la valeur canonique dans `allowed`, même si la casse diffère.
 * Sinon retourne `fallback` (écriture sûre) ou `null` (lecture stricte).
 */
export function parsePilotageEnum<T extends ReadonlyStringTuple>(
  allowed: T,
  raw: unknown,
  fallback: T[number],
): T[number];
export function parsePilotageEnum<T extends ReadonlyStringTuple>(
  allowed: T,
  raw: unknown,
  fallback: null,
): T[number] | null;
export function parsePilotageEnum<T extends ReadonlyStringTuple>(
  allowed: T,
  raw: unknown,
  fallback: T[number] | null,
): T[number] | null {
  if (raw == null) return fallback;
  const input = String(raw).trim();
  if (!input) return fallback;
  const exact = (allowed as readonly string[]).find((v) => v === input);
  if (exact) return exact as T[number];
  const needle = normalizePilotageLabel(input);
  const loose = (allowed as readonly string[]).find((v) => normalizePilotageLabel(v) === needle);
  return (loose as T[number] | undefined) ?? fallback;
}

export function isPilotageEnum(allowed: ReadonlyStringTuple, value: string | null | undefined): boolean {
  if (value == null || !value.trim()) return false;
  return parsePilotageEnum(allowed, value, null) != null;
}

// —— Sévérité / priorité (partagées entre plusieurs sous-objets) ——

export const BLOCKER_SEVERITIES = ["Critique", "Important", "À surveiller"] as const;
export type BlockerSeverity = (typeof BLOCKER_SEVERITIES)[number];

export const PILOTAGE_PRIORITIES = ["Basse", "Normale", "Haute", "Critique"] as const;
export type PilotagePriority = (typeof PILOTAGE_PRIORITIES)[number];

// —— Blocages ——

export const BLOCKER_STATUSES = ["Ouvert", "En cours", "Résolu", "Clôturé", "Non applicable"] as const;
export type BlockerStatus = (typeof BLOCKER_STATUSES)[number];

export const BLOCKER_OPEN_STATUSES = ["Ouvert", "En cours"] as const;
export const BLOCKER_CLOSED_STATUSES = ["Résolu", "Clôturé", "Non applicable"] as const;

export function isBlockerOpen(status: string | null | undefined): boolean {
  return isPilotageEnum(BLOCKER_OPEN_STATUSES, status);
}

export function isBlockerClosed(status: string | null | undefined): boolean {
  return isPilotageEnum(BLOCKER_CLOSED_STATUSES, status);
}

export function isBlockerCritical(severity: string | null | undefined): boolean {
  return parsePilotageEnum(BLOCKER_SEVERITIES, severity, null) === "Critique";
}

export function parseBlockerSeverity(raw: unknown): BlockerSeverity {
  return parsePilotageEnum(BLOCKER_SEVERITIES, raw, "Important");
}

export function parseBlockerStatus(raw: unknown, fallback: BlockerStatus = "Ouvert"): BlockerStatus {
  return parsePilotageEnum(BLOCKER_STATUSES, raw, fallback);
}

// —— Jalons ——

export const MILESTONE_STATUSES = [
  "Non démarré",
  "À préparer",
  "Prêt",
  "En cours",
  "Bloqué",
  "Atteint",
  "Reporté",
  "Annulé",
  "Non applicable",
] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export function parseMilestoneStatus(raw: unknown): MilestoneStatus | null {
  return parsePilotageEnum(MILESTONE_STATUSES, raw, null);
}

export function isMilestoneBlocked(status: string | null | undefined): boolean {
  return parsePilotageEnum(MILESTONE_STATUSES, status, null) === "Bloqué";
}

export function isMilestoneReached(status: string | null | undefined): boolean {
  return parsePilotageEnum(MILESTONE_STATUSES, status, null) === "Atteint";
}

// —— Obligations (terminées) ——

export const OBLIGATION_DONE_STATUSES = ["Validée", "Non applicable"] as const;

export function isObligationDone(status: string | null | undefined): boolean {
  return isPilotageEnum(OBLIGATION_DONE_STATUSES, status);
}

// —— Documents DOE / à remettre ——

export const DOE_MISSING_STATUSES = ["Manquant", "À demander"] as const;
export const DOE_DONE_STATUSES = ["Reçu", "Validé", "Non applicable"] as const;

export function isDoeMissing(status: string | null | undefined): boolean {
  return isPilotageEnum(DOE_MISSING_STATUSES, status);
}

// —— Origines de blocage (originType) ——

export const BLOCKER_ORIGIN_TYPES = ["TASK", "MANUAL", "MESSAGE", "OBLIGATION", "PLAN"] as const;
export type BlockerOriginType = (typeof BLOCKER_ORIGIN_TYPES)[number];
