/**
 * État de préparation d'un chantier — une seule règle pour la liste,
 * la fiche projet et le pourcentage.
 * Lecture seule : ne rattache rien, ne crée rien.
 */
import { isGlobalStudySources } from "@/lib/chantier/resolve-workspace-entities";
import {
  resolvePrepSchedulePlanForWorkspace,
  resolvePrepStudyForWorkspace,
  type PlanLike,
  type ScopeLike,
  type StudyLike,
} from "@/lib/chantier/resolve-workspace-entities";
import { normalizePrepSources } from "@/lib/preparation/plan-source";

export type PreparationEntryMode = "visite" | "plan" | "mixte" | "devis" | "vide";

export type PreparationModuleState = "done" | "progress" | "todo" | "na";

export type PreparationModuleKey = "visite" | "metre" | "devis" | "planning";

export type PreparationModule = {
  key: PreparationModuleKey;
  label: string;
  state: PreparationModuleState;
  stateLabel: string;
  applicable: boolean;
};

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
};

export type PreparationPlan = PlanLike & {
  projectId?: string;
};

export type PreparationSnapshot = {
  entryMode: PreparationEntryMode;
  modules: PreparationModule[];
  progressPercent: number;
  nextAction: string | null;
  visitId: string | null;
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
  return [...alive].sort((a, b) => visitRank(a.status) - visitRank(b.status))[0] ?? null;
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

/** Même lieu : code postal + numéro de voie. Jamais le nom du client. */
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

/**
 * Visite du dossier, sans écriture.
 * 1. projectId
 * 2. devis du projet (commercialQuoteId)
 * 3. lieu unique, ou lieu + nature des travaux si plusieurs visites
 */
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
    (v) => v.projectId === input.projectId || (v.commercialQuoteId != null && quoteIds.has(v.commercialQuoteId)),
  );
  const explicit = bestVisit(linked);
  if (explicit) return explicit;

  const onSite = input.visits.filter(
    (v) => !v.projectId && v.status !== "CANCELLED" && visitSharesSite(input, v),
  );
  if (onSite.length === 1) return onSite[0]!;
  if (onSite.length === 0) return null;

  const corpus = [input.title ?? "", ...input.quotes.map((q) => q.subject ?? "")].join(" ");
  const addressWords = new Set(workTokens(`${input.siteAddress ?? ""} ${input.siteCity ?? ""}`));
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
    const hit = scope.referenceQuoteId ? byId.get(scope.referenceQuoteId) : undefined;
    if (hit && hit.status !== "CANCELLED") return hit;
  }
  return input.quotes.find((q) => q.status !== "CANCELLED") ?? input.quotes[0] ?? null;
}

function posteSuffix(count: number): string {
  if (count <= 0) return "";
  return ` · ${count} poste${count > 1 ? "s" : ""}`;
}

function visitModule(visit: PreparationVisit | null, required: boolean): PreparationModule {
  if (!required && !visit) {
    return {
      key: "visite",
      label: "Visite",
      state: "na",
      stateLabel: "Dossier sur plan",
      applicable: false,
    };
  }
  if (!visit) {
    return {
      key: "visite",
      label: "Visite",
      state: "todo",
      stateLabel: "À faire",
      applicable: true,
    };
  }
  const map: Record<string, { state: PreparationModuleState; stateLabel: string }> = {
    TO_PLAN: { state: "progress", stateLabel: "À planifier" },
    SCHEDULED: { state: "progress", stateLabel: "Planifiée" },
    IN_PROGRESS: { state: "progress", stateLabel: "Relevé en cours" },
    INCOMPLETE: { state: "progress", stateLabel: "À compléter" },
    READY_TO_QUOTE: { state: "done", stateLabel: "Prête à chiffrer" },
    TRANSMITTED: { state: "done", stateLabel: "Transmise" },
    CANCELLED: { state: "na", stateLabel: "Annulée" },
  };
  const hit = map[visit.status] ?? { state: "progress" as const, stateLabel: "En cours" };
  return {
    key: "visite",
    label: "Visite",
    state: hit.state,
    stateLabel: hit.stateLabel,
    applicable: hit.state !== "na",
  };
}

function metreModule(study: PreparationStudy | null): PreparationModule {
  if (!study) {
    return {
      key: "metre",
      label: "Métré",
      state: "todo",
      stateLabel: "À préparer",
      applicable: true,
    };
  }
  const posts = posteSuffix(study.lineCount);
  const validated = study.dossierStatus === "PRO_VALIDE" || study.dossierStatus === "DEMONSTRATION";
  return {
    key: "metre",
    label: "Métré",
    state: validated ? "done" : "progress",
    stateLabel: `${validated ? "Validé" : "En cours"}${posts}`,
    applicable: true,
  };
}

function quoteModule(quote: PreparationQuote | null): PreparationModule {
  if (!quote) {
    return {
      key: "devis",
      label: "Devis",
      state: "todo",
      stateLabel: "À préparer",
      applicable: true,
    };
  }
  const demo = quote.isDemonstration ? " · démo" : "";
  const ready = ["VALIDATED", "SENT", "VIEWED", "ACCEPTED"].includes(quote.status);
  const closed = ["REFUSED", "EXPIRED", "CANCELLED"].includes(quote.status);
  const stateLabel = ready
    ? quote.status === "ACCEPTED"
      ? `Accepté${demo}`
      : quote.status === "VALIDATED"
        ? `Prêt${demo}`
        : `Émis${demo}`
    : closed
      ? quote.status === "REFUSED"
        ? `Refusé${demo}`
        : quote.status === "EXPIRED"
          ? `Expiré${demo}`
          : `Annulé${demo}`
      : `En cours${demo}`;
  return {
    key: "devis",
    label: "Devis",
    state: ready ? "done" : closed ? "todo" : "progress",
    stateLabel,
    applicable: true,
  };
}

function planningModule(plan: PreparationPlan | null, archivedOnly: boolean): PreparationModule {
  if (!plan || plan.status === "ARCHIVED" || archivedOnly) {
    return {
      key: "planning",
      label: "Planning",
      state: "todo",
      stateLabel: archivedOnly ? "Aucun planning actif" : "À préparer",
      applicable: true,
    };
  }
  if (plan.status === "DRAFT") {
    return {
      key: "planning",
      label: "Planning",
      state: "progress",
      stateLabel: "En préparation",
      applicable: true,
    };
  }
  return {
    key: "planning",
    label: "Planning",
    state: "done",
    stateLabel: "Prêt",
    applicable: true,
  };
}

function nextActionFor(input: {
  visit: PreparationVisit | null;
  visitRequired: boolean;
  metre: PreparationModule;
  devis: PreparationModule;
  planning: PreparationModule;
}): string | null {
  const visit = input.visit;
  if (input.visitRequired && visit?.status === "IN_PROGRESS") return "Terminer la visite";
  if (input.visitRequired && visit?.status === "INCOMPLETE") return "Compléter la visite";
  if (input.metre.state === "todo") return "Préparer le métré";
  if (input.metre.state === "progress") return "Finaliser le métré";
  if (input.devis.state === "todo") return "Préparer le devis";
  if (input.devis.state === "progress") return "Finaliser le devis";
  if (input.planning.state === "todo") return "Préparer le planning";
  if (input.planning.state === "progress") return "Finaliser le planning";
  if (input.visitRequired && visit?.status === "TO_PLAN") return "Planifier la visite";
  if (input.visitRequired && visit?.status === "SCHEDULED") return "Réaliser la visite";
  if (input.visitRequired && !visit) return "Planifier la visite";
  return null;
}

export function buildPreparationSnapshot(input: {
  projectId: string;
  title?: string | null;
  siteAddress?: string | null;
  siteCity?: string | null;
  visits: PreparationVisit[];
  studies: PreparationStudy[];
  scopes: ScopeLike[];
  quotes: PreparationQuote[];
  plans: PreparationPlan[];
}): PreparationSnapshot {
  const quote = resolveProjectQuote({ quotes: input.quotes, scopes: input.scopes });
  const visit = resolveProjectVisit({
    projectId: input.projectId,
    siteAddress: input.siteAddress,
    siteCity: input.siteCity,
    title: input.title,
    quotes: input.quotes,
    visits: input.visits,
  });
  const study =
    resolvePrepStudyForWorkspace({ studies: input.studies, scopes: input.scopes }) ?? null;
  const studyFull = study
    ? input.studies.find((s) => s.id === study.id) ?? null
    : null;
  const plan =
    resolvePrepSchedulePlanForWorkspace({
      plans: input.plans,
      scopes: input.scopes,
      study,
    }) ?? null;
  const hasPlanSource = input.studies.some((s) => studyHasPlanSource(s.sourcesJson));
  const entryMode: PreparationEntryMode = visit && hasPlanSource
    ? "mixte"
    : visit
      ? "visite"
      : hasPlanSource
        ? "plan"
        : quote
          ? "devis"
          : "vide";
  const archivedOnly =
    input.plans.length > 0 && input.plans.every((p) => p.status === "ARCHIVED");
  const metre = metreModule(studyFull);
  const devis = quoteModule(quote);
  const planning = planningModule(plan, archivedOnly && plan?.status === "ARCHIVED");
  const visite = visitModule(visit, entryMode !== "plan");
  const modules = [visite, metre, devis, planning];
  const applicable = modules.filter((m) => m.applicable);
  const score = applicable.reduce((acc, m) => {
    if (m.state === "done") return acc + 1;
    if (m.state === "progress") return acc + 0.45;
    return acc;
  }, 0);
  const progressPercent = applicable.length
    ? Math.round((score / applicable.length) * 100)
    : 0;
  return {
    entryMode,
    modules,
    progressPercent,
    nextAction: nextActionFor({
      visit,
      visitRequired: visite.applicable,
      metre,
      devis,
      planning,
    }),
    visitId: visit?.id ?? null,
  };
}
