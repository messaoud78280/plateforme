/**
 * Types + resolve visite/devis — partagés par le moteur d’état et le snapshot.
 * Pas de dépendance vers project-preparation-state (évite les cycles).
 */
import { isGlobalStudySources } from "@/lib/chantier/resolve-workspace-entities";
import {
  type PlanLike,
  type ScopeLike,
  type StudyLike,
} from "@/lib/chantier/resolve-workspace-entities";
import { normalizePrepSources } from "@/lib/preparation/plan-source";

export type PreparationEntryMode = "visite" | "plan" | "mixte" | "devis" | "vide";

export type PreparationVisit = {
  id: string;
  status: string;
  projectId: string | null;
  commercialQuoteId: string | null;
  siteAddress: string | null;
  subject: string | null;
  clientNeed: string | null;
};

export type PreparationQuote = {
  id: string;
  status: string;
  isDemonstration: boolean;
  projectId: string | null;
  sourcePrepStudyId: string | null;
  subject: string | null;
};

export type PreparationStudy = StudyLike & {
  projectId?: string;
  dossierStatus: string | null;
  lineCount: number;
  version?: number | null;
};

export type PreparationPlan = PlanLike & {
  projectId?: string;
  studyVersionAtGeneration?: number | null;
  startDateLabel?: string | null;
};

export type PreparationQuoteSync = {
  quoteId: string;
  hasMetreProvenance: boolean;
  currentStudyVersion: number | null;
  transferStudyVersion: number | null;
  hasSignificantQuantityDiffs?: boolean | null;
};

const VISIT_RANK = [
  "TRANSMITTED",
  "READY_TO_QUOTE",
  "IN_PROGRESS",
  "INCOMPLETE",
  "SCHEDULED",
  "TO_PLAN",
] as const;

const WORK_STOP = new Set([
  "construction",
  "renovation",
  "maison",
  "individuelle",
  "complete",
  "complet",
  "completes",
  "projet",
  "chantier",
  "travaux",
  "installation",
  "individuelle",
]);

function fold(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function postals(value: string): string[] {
  return [...value.matchAll(/\b\d{5}\b/g)].map((m) => m[0]);
}

function streetNumber(value: string): string | null {
  const m = fold(value).match(/\b(\d{1,4})\b/);
  return m?.[1] ?? null;
}

export function studyHasPlanSource(sourcesJson: unknown): boolean {
  if (isGlobalStudySources(sourcesJson)) return false;
  return normalizePrepSources(sourcesJson).some(
    (s) => Boolean(s.chantierFileId || s.filename || s.planNumber),
  );
}

function visitRank(status: string): number {
  const i = VISIT_RANK.indexOf(status as (typeof VISIT_RANK)[number]);
  return i === -1 ? 99 : i;
}

function bestVisit(list: PreparationVisit[]): PreparationVisit | null {
  const alive = list.filter((v) => v.status !== "CANCELLED");
  if (alive.length === 0) return null;
  return (
    [...alive].sort((a, b) => visitRank(a.status) - visitRank(b.status))[0] ??
    null
  );
}

function workTokens(text: string): string[] {
  return [
    ...new Set(
      fold(text)
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length >= 6 && !WORK_STOP.has(w)),
    ),
  ];
}

export function visitSharesSite(
  project: { siteAddress?: string | null; siteCity?: string | null },
  visit: { siteAddress?: string | null },
): boolean {
  const projectText = `${project.siteAddress ?? ""} ${project.siteCity ?? ""}`;
  const visitText = visit.siteAddress ?? "";
  const projectPostals = postals(projectText);
  const visitPostals = postals(visitText);
  if (!projectPostals.length || !visitPostals.length) return false;
  if (!projectPostals.some((c) => visitPostals.includes(c))) return false;
  const projectNo = streetNumber(project.siteAddress ?? "");
  const visitNo = streetNumber(visitText);
  return Boolean(projectNo && visitNo && projectNo === visitNo);
}

export function resolveProjectVisit(input: {
  projectId: string;
  siteAddress?: string | null;
  siteCity?: string | null;
  title?: string | null;
  quotes: PreparationQuote[];
  visits: PreparationVisit[];
}): PreparationVisit | null {
  const quoteIds = new Set(input.quotes.map((q) => q.id));
  const linked = input.visits.filter(
    (v) =>
      v.projectId === input.projectId ||
      (v.commercialQuoteId != null && quoteIds.has(v.commercialQuoteId)),
  );
  const explicit = bestVisit(linked);
  if (explicit) return explicit;

  const onSite = input.visits.filter(
    (v) =>
      !v.projectId &&
      v.status !== "CANCELLED" &&
      visitSharesSite(input, v),
  );
  if (onSite.length === 1) return onSite[0]!;
  if (onSite.length === 0) return null;

  const corpus = [
    input.title ?? "",
    ...input.quotes.map((q) => q.subject ?? ""),
  ].join(" ");
  const addressWords = new Set(
    workTokens(`${input.siteAddress ?? ""} ${input.siteCity ?? ""}`),
  );
  const tokens = workTokens(corpus).filter((t) => !addressWords.has(t));
  const scored = onSite
    .map((v) => {
      const blob = fold(`${v.subject ?? ""} ${v.clientNeed ?? ""}`);
      const hits = tokens.filter((t) => blob.includes(t)).length;
      return { v, hits };
    })
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits);
  if (scored.length === 0) return null;
  if (scored.length > 1 && scored[0]!.hits === scored[1]!.hits) return null;
  return scored[0]!.v;
}

export function resolveProjectQuote<T extends PreparationQuote>(input: {
  quotes: T[];
  scopes: ScopeLike[];
}): T | null {
  const byId = new Map(input.quotes.map((q) => [q.id, q]));
  for (const scope of input.scopes) {
    const hit = scope.referenceQuoteId
      ? byId.get(scope.referenceQuoteId)
      : undefined;
    if (hit && hit.status !== "CANCELLED") return hit;
  }
  return (
    input.quotes.find((q) => q.status !== "CANCELLED") ??
    input.quotes[0] ??
    null
  );
}
