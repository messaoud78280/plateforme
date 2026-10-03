/**
 * Résolution lecture chantier — pure, sans I/O.
 * Une seule logique pour page globale, scopes, timeline et cartes.
 * Ne crée / ne met à jour aucune donnée.
 */

export type StudyLike = {
  id: string;
  scopeId: string | null;
  sourcesJson?: unknown;
};

export type PlanLike = {
  id: string;
  studyId: string;
  scopeId: string | null;
  status: string;
  revisionKind: string;
  /** Requis pour départager plusieurs CURRENT (révisions / régénérations). */
  revisionNumber?: number | null;
  createdAt?: Date | string | null;
};

export type ScopeLike = {
  id: string;
  referenceStudyId: string | null;
  referenceQuoteId: string | null;
  referenceSchedulePlanId: string | null;
};

const GLOBAL_STUDY_KIND = "bework_global_metre_v1";

export function isGlobalStudySources(sourcesJson: unknown): boolean {
  if (!sourcesJson || typeof sourcesJson !== "object") return false;
  return (sourcesJson as { kind?: string }).kind === GLOBAL_STUDY_KIND;
}

/**
 * Ordre :
 * 1. study global kind + scopeId null
 * 2. study scopeId null
 * 3. referenceStudyId des scopes (premier trouvé)
 * 4. unique PrepStudy du projet
 * 5. null (ne jamais inventer)
 */
export function resolvePrepStudyForWorkspace<T extends StudyLike>(input: {
  studies: T[];
  scopes: ScopeLike[];
}): T | null {
  const { studies, scopes } = input;
  const byId = (id: string | null | undefined) =>
    id ? studies.find((s) => s.id === id) ?? null : null;

  return (
    studies.find((s) => isGlobalStudySources(s.sourcesJson) && !s.scopeId) ??
    studies.find((s) => !s.scopeId) ??
    (() => {
      for (const sc of scopes) {
        const hit = byId(sc.referenceStudyId);
        if (hit) return hit;
      }
      return null;
    })() ??
    (studies.length === 1 ? studies[0]! : null)
  );
}

function planCreatedAtMs(plan: PlanLike): number {
  if (!plan.createdAt) return 0;
  const t =
    plan.createdAt instanceof Date
      ? plan.createdAt.getTime()
      : new Date(plan.createdAt).getTime();
  return Number.isFinite(t) ? t : 0;
}

/**
 * Helper canonique — planning courant à afficher / ouvrir.
 *
 * Règle déterministe :
 * 1. statut CURRENT (non ARCHIVED)
 * 2. sinon revisionKind CURRENT non archivé
 * 3. sinon tout plan non archivé
 * 4. revisionNumber la plus élevée
 * 5. createdAt le plus récent (tie-break)
 *
 * Ne jamais préférer un plan ARCHIVED, même s’il est référencé.
 */
export function resolveCurrentSchedulePlan<T extends PlanLike>(
  list: T[],
): T | null {
  if (list.length === 0) return null;

  const rank = (p: T): number => {
    const status = (p.status ?? "").toUpperCase();
    const kind = (p.revisionKind ?? "").toUpperCase();
    if (status === "ARCHIVED") return -1;
    if (status === "CURRENT") return 300;
    if (kind === "CURRENT") return 200;
    if (status === "INITIAL" || kind === "INITIAL") return 100;
    if (status === "DRAFT") return 50;
    return 10;
  };

  const active = list.filter((p) => rank(p) >= 0);
  if (active.length === 0) return null;

  const bestRank = Math.max(...active.map(rank));
  const tier = active.filter((p) => rank(p) === bestRank);

  return tier.reduce((best, p) => {
    const revP = p.revisionNumber ?? 0;
    const revB = best.revisionNumber ?? 0;
    if (revP !== revB) return revP > revB ? p : best;
    return planCreatedAtMs(p) >= planCreatedAtMs(best) ? p : best;
  });
}

/** @deprecated Prefer resolveCurrentSchedulePlan — alias de compatibilité. */
export function pickBestPlan<T extends PlanLike>(list: T[]): T | null {
  return resolveCurrentSchedulePlan(list);
}

/**
 * Ordre :
 * 1. planning CURRENT du study (scope null ou scopé)
 * 2. referenceSchedulePlanId des scopes — uniquement si non archivé
 * 3. unique planning non archivé du projet
 *
 * Un referenceSchedulePlanId obsolète (ARCHIVED) ne gagne jamais
 * face à un CURRENT plus récent du même study.
 */
export function resolvePrepSchedulePlanForWorkspace<T extends PlanLike>(input: {
  plans: T[];
  scopes: ScopeLike[];
  study: StudyLike | null;
}): T | null {
  const { plans, scopes, study } = input;
  const byIdActive = (id: string | null | undefined) => {
    if (!id) return null;
    const hit = plans.find((p) => p.id === id) ?? null;
    if (!hit) return null;
    if ((hit.status ?? "").toUpperCase() === "ARCHIVED") return null;
    return hit;
  };

  const forStudy = study ? plans.filter((p) => p.studyId === study.id) : [];

  return (
    resolveCurrentSchedulePlan(
      plans.filter(
        (p) => p.scopeId == null && (!study || p.studyId === study.id),
      ),
    ) ??
    resolveCurrentSchedulePlan(forStudy) ??
    (() => {
      for (const sc of scopes) {
        const hit = byIdActive(sc.referenceSchedulePlanId);
        if (hit) return hit;
      }
      return null;
    })() ??
    (() => {
      const active = plans.filter(
        (p) => (p.status ?? "").toUpperCase() !== "ARCHIVED",
      );
      return active.length === 1 ? active[0]! : resolveCurrentSchedulePlan(active);
    })()
  );
}

/**
 * Résolution du planning pour une carte de lot.
 * Ne jamais ouvrir un plan ARCHIVED via referenceSchedulePlanId stale.
 */
export function resolveSchedulePlanForScope<T extends PlanLike>(input: {
  plans: T[];
  scope: ScopeLike;
  studyId: string | null;
}): T | null {
  const { plans, scope, studyId } = input;
  const candidates = plans.filter(
    (p) =>
      p.scopeId === scope.id ||
      p.id === scope.referenceSchedulePlanId ||
      (studyId != null && p.studyId === studyId),
  );
  const current = resolveCurrentSchedulePlan(candidates);
  if (current) return current;

  // Dernier recours : référence explicite si encore active.
  if (scope.referenceSchedulePlanId) {
    const ref = plans.find((p) => p.id === scope.referenceSchedulePlanId);
    if (ref && (ref.status ?? "").toUpperCase() !== "ARCHIVED") return ref;
  }
  return null;
}

/** Mots trop génériques pour matcher une visite orpheline. */
const VISIT_STOPWORDS = new Set([
  "construction",
  "renovation",
  "maison",
  "individuelle",
  "complete",
  "demo",
  "projet",
  "chantier",
]);

export function extractVisitSearchBits(input: {
  title: string;
  siteAddress?: string | null;
  siteCity?: string | null;
}): string[] {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const titleBits = norm(input.title)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 5 && !VISIT_STOPWORDS.has(w))
    .slice(0, 6);

  const addressBits = [input.siteAddress, input.siteCity]
    .filter(Boolean)
    .join(" ")
    .split(/[^a-z0-9]+/)
    .map(norm)
    .filter((w) => w.length >= 4)
    .slice(0, 4);

  return [...new Set([...titleBits, ...addressBits])].slice(0, 8);
}

/**
 * Ne retourne une visite suggérée que si le match est assez fort.
 * Jamais de fallback « premier candidat » (évite faux positifs).
 */
export function pickSuggestedVisitId(input: {
  searchBits: string[];
  candidates: Array<{
    id: string;
    subject?: string | null;
    clientNeed?: string | null;
    siteAddress?: string | null;
    siteName?: string | null;
  }>;
}): string | null {
  const { searchBits, candidates } = input;
  if (searchBits.length === 0 || candidates.length === 0) return null;
  const minHits = Math.min(2, searchBits.length);
  const match = candidates.find((c) => {
    const blob =
      `${c.subject ?? ""} ${c.clientNeed ?? ""} ${c.siteAddress ?? ""} ${c.siteName ?? ""}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    const hits = searchBits.filter((b) => blob.includes(b));
    return hits.length >= minHits;
  });
  return match?.id ?? null;
}

/** Action UI : si ready → Ouvrir, sinon libellé de création. */
export function workspaceOpenOrGenerateLabel(
  ready: boolean,
  generateLabel: string,
): string {
  return ready ? "Ouvrir" : generateLabel;
}
