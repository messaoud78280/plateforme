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
export function resolvePrepStudyForWorkspace(input: {
  studies: StudyLike[];
  scopes: ScopeLike[];
}): StudyLike | null {
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

export function pickBestPlan(list: PlanLike[]): PlanLike | null {
  if (list.length === 0) return null;
  return (
    list.find((p) => p.status === "CURRENT") ??
    list.find((p) => p.revisionKind === "CURRENT" && p.status !== "ARCHIVED") ??
    list.find((p) => p.status !== "ARCHIVED") ??
    list[0] ??
    null
  );
}

/**
 * Ordre :
 * 1. planning scopeId null lié au study (ou tout global si pas de study)
 * 2. planning du study de référence
 * 3. referenceSchedulePlanId des scopes
 * 4. unique planning non archivé du projet
 */
export function resolvePrepSchedulePlanForWorkspace(input: {
  plans: PlanLike[];
  scopes: ScopeLike[];
  study: StudyLike | null;
}): PlanLike | null {
  const { plans, scopes, study } = input;
  const byId = (id: string | null | undefined) =>
    id ? plans.find((p) => p.id === id) ?? null : null;

  const forStudy = study ? plans.filter((p) => p.studyId === study.id) : [];

  return (
    pickBestPlan(
      plans.filter(
        (p) => p.scopeId == null && (!study || p.studyId === study.id),
      ),
    ) ??
    pickBestPlan(forStudy) ??
    (() => {
      for (const sc of scopes) {
        const hit = byId(sc.referenceSchedulePlanId);
        if (hit) return hit;
      }
      return null;
    })() ??
    (() => {
      const active = plans.filter((p) => p.status !== "ARCHIVED");
      return active.length === 1 ? active[0]! : null;
    })()
  );
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
