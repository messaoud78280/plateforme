/**
 * Résolution lecture chantier — pure, sans I/O.
 * Une seule logique pour page globale, scopes, timeline et cartes.
 * Ne crée / ne met à jour aucune donnée.
 *
 * ## Politique CURRENT planning (canonique)
 *
 * Ranking (`resolveCurrentSchedulePlan`) :
 * 1. exclure ARCHIVED
 * 2. CURRENT (status) > revisionKind CURRENT > INITIAL > DRAFT
 * 3. revisionNumber DESC
 * 4. createdAt tie-break uniquement
 * 5. jamais d’ordre lexical sur status (INITIAL ne bat jamais CURRENT)
 *
 * ## Scope vs global
 *
 * - `resolveSchedulePlanForScope` : CURRENT **scopé** d’abord ; reference*
 *   seulement si active/cohérente ; **pas** de fallback global silencieux.
 * - Fallback global = explicite au call-site (ex. project-workspace).
 * - `resolvePrepSchedulePlanForWorkspace` : carte / chaîne **globale**
 *   (scopeId null d’abord) — ne pas l’utiliser pour une page de lot.
 */

export type StudyLike = {
  id: string;
  scopeId: string | null;
  sourcesJson?: unknown;
  archivedAt?: Date | string | null;
  version?: number | null;
  updatedAt?: Date | string | null;
};

export type ScopeLike = {
  id: string;
  referenceStudyId: string | null;
  referenceQuoteId: string | null;
  referenceSchedulePlanId: string | null;
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

const GLOBAL_STUDY_KIND = "bework_global_metre_v1";

export function isGlobalStudySources(sourcesJson: unknown): boolean {
  if (!sourcesJson || typeof sourcesJson !== "object") return false;
  return (sourcesJson as { kind?: string }).kind === GLOBAL_STUDY_KIND;
}

function isArchivedStudy(s: { archivedAt?: Date | string | null }): boolean {
  return s.archivedAt != null && String(s.archivedAt).length > 0;
}

function studyUpdatedAtMs(s: { updatedAt?: Date | string | null }): number {
  if (!s.updatedAt) return 0;
  const t =
    s.updatedAt instanceof Date
      ? s.updatedAt.getTime()
      : new Date(s.updatedAt).getTime();
  return Number.isFinite(t) ? t : 0;
}

/**
 * Ordre :
 * 1. study global kind + scopeId null
 * 2. study scopeId null
 * 3. referenceStudyId des scopes (premier trouvé)
 * 4. unique PrepStudy du projet
 * 5. null (ne jamais inventer)
 *
 * Les études archivées sont exclues sauf si la liste n’en contient que des archivées
 * (cas deep-link géré par resolveCurrentPrepStudy).
 */
export function resolvePrepStudyForWorkspace<T extends StudyLike>(input: {
  studies: T[];
  scopes: ScopeLike[];
}): T | null {
  const { scopes } = input;
  const pool = input.studies.filter((s) => !isArchivedStudy(s));
  if (pool.length === 0) return null;
  const byId = (id: string | null | undefined) =>
    id ? pool.find((s) => s.id === id) ?? null : null;

  return (
    pool.find((s) => isGlobalStudySources(s.sourcesJson) && !s.scopeId) ??
    pool.find((s) => !s.scopeId) ??
    (() => {
      for (const sc of scopes) {
        const hit = byId(sc.referenceStudyId);
        if (hit) return hit;
      }
      return null;
    })() ??
    (pool.length === 1 ? pool[0]! : null)
  );
}

/**
 * Resolver canonique métré CURRENT pour un chantier.
 * - CURRENT = non archivé + gagnant resolvePrepStudyForWorkspace
 * - Si plusieurs candidats au même rang : version DESC puis updatedAt DESC
 * - deep-link `explicitStudyId` : retourne cette étude même ARCHIVED (isCurrent false)
 * - referenceStudyId d’un scope ne bat jamais un CURRENT non archivé plus récent
 */
export function resolveCurrentPrepStudy<T extends StudyLike>(input: {
  studies: T[];
  scopes: ScopeLike[];
  explicitStudyId?: string | null;
}): {
  study: T;
  isCurrent: boolean;
  status: "CURRENT" | "ARCHIVED";
} | null {
  const { studies, scopes, explicitStudyId } = input;

  if (explicitStudyId) {
    const hit = studies.find((s) => s.id === explicitStudyId);
    if (!hit) return null;
    const archived = isArchivedStudy(hit);
    const current = resolvePrepStudyForWorkspace({
      studies: studies.filter((s) => !isArchivedStudy(s)),
      scopes,
    });
    const isCurrent = !archived && current?.id === hit.id;
    return {
      study: hit,
      isCurrent,
      status: archived ? "ARCHIVED" : isCurrent ? "CURRENT" : "ARCHIVED",
    };
  }

  const active = studies.filter((s) => !isArchivedStudy(s));
  if (active.length === 0) return null;

  // Si reference scope pointe un ancien, le CURRENT actif gagne quand même
  // via resolvePrepStudyForWorkspace (global / scopeId null d’abord).
  let picked = resolvePrepStudyForWorkspace({ studies: active, scopes });

  // Plusieurs études actives sans gagnant clair → meilleure version
  if (!picked && active.length > 1) {
    picked = [...active].sort((a, b) => {
      const dv = (b.version ?? 0) - (a.version ?? 0);
      if (dv !== 0) return dv;
      return studyUpdatedAtMs(b) - studyUpdatedAtMs(a);
    })[0]!;
  }

  // Tie-break version si le resolver a choisi un global mais une autre étude
  // active a une version supérieure au même scope null
  if (picked && active.length > 1) {
    const peers = active.filter(
      (s) =>
        (s.scopeId ?? null) === (picked!.scopeId ?? null) ||
        (!s.scopeId && !picked!.scopeId),
    );
    if (peers.length > 1) {
      picked = [...peers].sort((a, b) => {
        const dv = (b.version ?? 0) - (a.version ?? 0);
        if (dv !== 0) return dv;
        return studyUpdatedAtMs(b) - studyUpdatedAtMs(a);
      })[0]!;
    }
  }

  if (!picked) return null;
  return { study: picked, isCurrent: true, status: "CURRENT" };
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
 * 3. sinon INITIAL / DRAFT non archivé
 * 4. revisionNumber la plus élevée
 * 5. createdAt le plus récent (tie-break)
 *
 * Ne jamais préférer un plan ARCHIVED, même s’il est référencé.
 * Ne jamais utiliser l’ordre alphabétique de status.
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
 * CURRENT d’une étude (tous scopes confondus dans la liste fournie).
 * Filtrer la liste en amont si un scope précis est requis.
 */
export function resolveCurrentSchedulePlanForStudy<T extends PlanLike>(input: {
  plans: T[];
  studyId: string;
}): T | null {
  return resolveCurrentSchedulePlan(
    input.plans.filter((p) => p.studyId === input.studyId),
  );
}

/**
 * Ordre (chaîne / carte **globale** uniquement) :
 * 1. planning CURRENT du study avec scopeId null
 * 2. planning CURRENT du study (tous scopes)
 * 3. referenceSchedulePlanId des scopes — uniquement si non archivé
 * 4. unique planning non archivé du projet
 *
 * Un referenceSchedulePlanId obsolète (ARCHIVED) ne gagne jamais
 * face à un CURRENT plus récent du même study.
 *
 * Ne pas utiliser pour une page de lot → `resolveSchedulePlanForScope`.
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
 * Résolution du planning pour une carte / page de lot.
 *
 * Ordre :
 * 1. CURRENT exact scopé (scopeId === scope.id)
 * 2. preferred/reference active du **même** scope (non ARCHIVED)
 * 3. si `allowGlobalFallback` : CURRENT global (scopeId null) du même study
 *
 * ProjectScope.reference* = baseline/préférence secondaire uniquement.
 * Pas de contamination scope A → scope B.
 * Pas de fallback global silencieux (défaut allowGlobalFallback = false).
 */
export function resolveSchedulePlanForScope<T extends PlanLike>(input: {
  plans: T[];
  scope: ScopeLike;
  studyId: string | null;
  /** Explicitement true seulement si le produit demande un fallback global. */
  allowGlobalFallback?: boolean;
}): T | null {
  const { plans, scope, studyId, allowGlobalFallback = false } = input;

  // 1. Exact scoped CURRENT / actif
  const scopedCurrent = resolveCurrentSchedulePlan(
    plans.filter((p) => p.scopeId === scope.id),
  );
  if (scopedCurrent) return scopedCurrent;

  // 2. Preferred reference — même scope, active, cohérente
  if (scope.referenceSchedulePlanId) {
    const ref = plans.find((p) => p.id === scope.referenceSchedulePlanId);
    if (
      ref &&
      (ref.status ?? "").toUpperCase() !== "ARCHIVED" &&
      ref.scopeId === scope.id &&
      (studyId == null || ref.studyId === studyId)
    ) {
      return ref;
    }
  }

  // 3. Global du même study — uniquement si demandé explicitement
  if (allowGlobalFallback && studyId) {
    const globalCurrent = resolveCurrentSchedulePlan(
      plans.filter((p) => p.studyId === studyId && p.scopeId == null),
    );
    if (globalCurrent) return globalCurrent;
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
