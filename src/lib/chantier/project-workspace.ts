/**
 * Dossier chantier V2 — agrégateur lecture Project / ProjectScope.
 * Aucune synchronisation automatique entre modules.
 */
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import {
  planSourceDisplayTitle,
  primaryPrepSource,
  resolvePrepPlanSource,
} from "@/lib/preparation/plan-source";

export type SyncState =
  | "A_JOUR"
  | "MODIFICATION_DISPONIBLE"
  | "A_VERIFIER"
  | "DESYNCHRONISE_VOLONTAIREMENT"
  | "ABSENT";

/** Libellés métier affichés (pas le vocabulaire technique interne). */
export type CardStatusLabel =
  | "À jour"
  | "À vérifier"
  | "À préparer"
  | "En cours"
  | "Action requise"
  | "Non démarré";

export type WorkspaceCardKind = "plan" | "metre" | "devis" | "planning" | "suivi";

export type WorkspaceCard = {
  kind: WorkspaceCardKind;
  label: string;
  title: string;
  href: string | null;
  detail: string | null;
  syncState: SyncState;
  statusLabel: CardStatusLabel;
  actionLabel: string;
  /** Étape structurée pour l’indicateur de progression. */
  ready: boolean;
  syncHint: string | null;
  isReference: boolean;
  planMeta?: {
    studyId: string | null;
    chantierFileId: string | null;
    revisionLabel: string | null;
    documentDate: string | null;
    documentType: string | null;
    fileMissing: boolean;
    openHref: string | null;
    attachHref: string | null;
    versionsHref: string | null;
  };
};

export type ScopeWorkspace = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  displayOrder: number;
  href: string;
  cards: WorkspaceCard[];
  alerts: Array<{ level: "info" | "warning"; message: string }>;
  progress: { ready: number; total: number };
};

export type UnscopedItemKind = "study" | "quote" | "plan";

export type UnscopedItem = {
  kind: UnscopedItemKind;
  id: string;
  label: string;
  detail: string | null;
  suggestedScopeName: string | null;
};

/** Étape de la chaîne chantier (dossier unique). */
export type ChantierWorkflowStepId =
  | "visite"
  | "metre"
  | "devis"
  | "planning"
  | "suivi"
  | "compte_rendu"
  | "notice";

export type ChantierWorkflowStep = {
  id: ChantierWorkflowStepId;
  label: string;
  title: string;
  detail: string | null;
  href: string | null;
  ready: boolean;
  /** Action principale affichée (ouvrir / générer / rattacher…). */
  actionLabel: string;
  /** Action secondaire côté client (ex. create_global_prep). */
  primaryAction:
    | "open"
    | "create_global_prep"
    | "create_follow_up"
    | "create_compte_rendu"
    | "create_notice"
    | "attach_visit"
    | null;
};

/** Pilotage global chantier (métré / devis / planning uniques). */
export type ProjectGlobalWorkspace = {
  metre: WorkspaceCard;
  devis: WorkspaceCard;
  planning: WorkspaceCard;
  /** Chaîne Visite → … → Notice (une seule, pas par lot). */
  workflow: ChantierWorkflowStep[];
  phases: Array<{ id: string; code: string; name: string; href: string }>;
  canCreateFromQuote: boolean;
  primaryQuoteId: string | null;
  visitId: string | null;
  /** Visite orpheline détectée (même org, sujet proche) — à rattacher. */
  suggestedVisitId: string | null;
  followUpSheetId: string | null;
  compteRenduId: string | null;
};

export type ProjectWorkspace = {
  projectId: string;
  title: string;
  chantierStatus: string;
  href: string;
  /** Métré / devis / planning au niveau chantier (pas par lot). */
  global: ProjectGlobalWorkspace;
  scopes: ScopeWorkspace[];
  unscoped: {
    studies: number;
    schedulePlans: number;
    quotes: number;
    items: UnscopedItem[];
  };
};

const GLOBAL_STUDY_KIND = "bework_global_metre_v1";

function isGlobalStudySources(sourcesJson: unknown): boolean {
  if (!sourcesJson || typeof sourcesJson !== "object") return false;
  return (sourcesJson as { kind?: string }).kind === GLOBAL_STUDY_KIND;
}

function asIso(v: Date | string | null | undefined): string | null {
  if (!v) return null;
  if (typeof v === "string") return v.slice(0, 10);
  return v.toISOString().slice(0, 10);
}

function fmtShortFr(iso: string | null): string | null {
  if (!iso) return null;
  const dt = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

function euro(n: number | null): string | null {
  if (n == null) return null;
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € HT`;
}

function planningDisplayTitle(plan: {
  title: string;
  revisionKind: string;
}): string {
  const kind = plan.revisionKind?.toUpperCase() ?? "";
  if (kind === "INITIAL") return "Planning initial";
  if (kind === "CURRENT") return "Planning actuel";
  if (kind === "ARCHIVED") return plan.title?.trim() || "Planning archivé";
  return plan.title?.trim() || "Planning";
}

export function statusLabelFromSync(
  sync: SyncState,
  kind: WorkspaceCardKind,
): CardStatusLabel {
  if (sync === "A_JOUR") return "À jour";
  if (sync === "A_VERIFIER") return "À vérifier";
  if (sync === "MODIFICATION_DISPONIBLE") return "Action requise";
  if (sync === "DESYNCHRONISE_VOLONTAIREMENT") return "À vérifier";
  if (kind === "suivi") return "Non démarré";
  return "À préparer";
}

export function suggestScopeNameFromText(text: string | null | undefined): string | null {
  const t = (text ?? "").trim();
  if (!t) return null;
  const rules: Array<[RegExp, string]> = [
    [/fondation/i, "Fondations"],
    [/électri|electri/i, "Installation électrique"],
    [/\bvrd\b/i, "VRD"],
    [/maçonn|maconn/i, "Maçonnerie"],
    [/plomber/i, "Plomberie"],
    [/couvertur|toiture/i, "Couverture"],
    [/menuiser/i, "Menuiseries"],
    [/isolation|ite\b/i, "Isolation"],
    [/peinture|revêtement|revetement/i, "Finitions"],
    [/chauffage|clim|cvc/i, "CVC"],
  ];
  for (const [re, name] of rules) {
    if (re.test(t)) return name;
  }
  return null;
}

export function codeFromScopeName(name: string): string {
  const cleaned = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, " ")
    .trim();
  const words = cleaned.split(/[\s-]+/).filter(Boolean);
  if (words.length === 0) return "LOT";
  if (words.length === 1) return words[0]!.slice(0, 16);
  const initials = words.map((w) => w[0]!).join("");
  return (initials.length >= 2 ? initials : words[0]!).slice(0, 12);
}

/** Code stable pour une section de devis (« Lot 01 — … » → L01). */
export function codeFromSectionTitle(title: string, fallbackIndex: number): string {
  const lotNum = title.match(/\bLot\s*0*(\d+)\b/i);
  if (lotNum?.[1]) return `L${String(lotNum[1]).padStart(2, "0")}`;
  const base = codeFromScopeName(title);
  if (base && base !== "LOT") return base.slice(0, 12);
  return `L${String(fallbackIndex + 1).padStart(2, "0")}`;
}

export function normalizeLotLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function humanUnscopedSummary(u: {
  studies: number;
  schedulePlans: number;
  quotes: number;
}): string | null {
  const parts: string[] = [];
  if (u.quotes === 1) parts.push("1 devis");
  else if (u.quotes > 1) parts.push(`${u.quotes} devis`);
  if (u.studies === 1) parts.push("1 métré");
  else if (u.studies > 1) parts.push(`${u.studies} métrés`);
  if (u.schedulePlans === 1) parts.push("1 planning");
  else if (u.schedulePlans > 1) parts.push(`${u.schedulePlans} plannings`);
  if (parts.length === 0) return null;
  const total = u.quotes + u.studies + u.schedulePlans;
  if (parts.length === 1) {
    const singular = total === 1;
    return `${parts[0]} de ce chantier ${singular ? "n’est" : "ne sont"} pas encore ${singular ? "rattaché" : "rattachés"} à un lot de travaux.`;
  }
  const last = parts.pop()!;
  return `${parts.join(", ")} et ${last} de ce chantier ne sont pas encore rattachés à un lot de travaux.`;
}

export function formatUnscopedHumanMessage(u: {
  studies: number;
  schedulePlans: number;
  quotes: number;
}): string | null {
  return humanUnscopedSummary(u);
}

function buildScopeCards(input: {
  projectId: string;
  scopeId: string;
  study: {
    id: string;
    title: string;
    version: number;
    sourcesJson: unknown;
    _count: { lines: number };
  } | null;
  quote: {
    id: string;
    number: string;
    totalSellHt: unknown;
    isDemonstration: boolean;
  } | null;
  /** Nombre total de devis rattachés au lot (référence + autres). */
  quotesCount?: number;
  plan: {
    id: string;
    studyId: string;
    title: string;
    revisionKind: string;
    status: string;
    startDate: Date | null;
    endDateBase: Date | null;
    studyVersionAtGeneration: number;
  } | null;
  planSource: Awaited<ReturnType<typeof resolvePrepPlanSource>>;
  refs: {
    studyId: string | null;
    quoteId: string | null;
    planId: string | null;
  };
  /** Métré / planning chantier (fallback — ne jamais renvoyer vers Nouvelle visite). */
  fallbackStudyId?: string | null;
  fallbackPlanHref?: string | null;
}): { cards: WorkspaceCard[]; alerts: ScopeWorkspace["alerts"] } {
  const alerts: ScopeWorkspace["alerts"] = [];
  const study = input.study;
  const quote = input.quote;
  const fallbackStudyId = input.fallbackStudyId ?? null;
  const effectiveStudyId = study?.id ?? fallbackStudyId;
  const quotesCount = Math.max(input.quotesCount ?? (quote ? 1 : 0), quote ? 1 : 0);
  const plan = input.plan;
  const planSource = input.planSource;
  const primary = planSource?.source ?? primaryPrepSource(study?.sourcesJson ?? null);

  const gedHref = `/dashboard/documents?projectId=${encodeURIComponent(input.projectId)}`;
  const openHref = planSource?.file
    ? `/dashboard/projets/${input.projectId}/plan-source?studyId=${encodeURIComponent(study?.id ?? "")}&fileId=${encodeURIComponent(planSource.file.id)}`
    : null;
  const fileMissing = !planSource || planSource.fileMissing;

  const metreSync: SyncState = study ? "A_JOUR" : "ABSENT";
  let devisSync: SyncState = quote ? "A_JOUR" : "ABSENT";
  let planningSync: SyncState = plan ? "A_JOUR" : "ABSENT";
  let devisHint: string | null = null;
  let planningHint: string | null = null;

  if (study && plan && plan.studyVersionAtGeneration < study.version) {
    planningSync = "MODIFICATION_DISPONIBLE";
    planningHint = `Métré V${study.version} plus récent que le planning (généré sur V${plan.studyVersionAtGeneration})`;
    alerts.push({
      level: "warning",
      message: "Le planning doit être recalculé — le métré a évolué.",
    });
  }

  if (study && !quote) {
    alerts.push({
      level: "info",
      message: "Aucun devis de référence — vous pouvez en générer un depuis le métré.",
    });
  }
  if (study && !plan) {
    alerts.push({
      level: "info",
      message: "Aucun planning de référence — génération possible depuis le métré.",
    });
  }
  if (!study && quote) {
    alerts.push({
      level: "info",
      message:
        "Devis de référence prêt — créez un métré pour générer le planning à partir des postes.",
    });
  } else if (!study) {
    alerts.push({
      level: "info",
      message: "Aucun métré rattaché à ce lot de travaux.",
    });
  }
  if (primary && fileMissing) {
    alerts.push({
      level: "warning",
      message: "Plan source identifié mais fichier non rattaché.",
    });
  }

  const rev = planSource?.revisionLabel ?? null;
  const planTitle = planSource
    ? planSource.displayTitle
    : primary
      ? planSourceDisplayTitle(primary)
      : "Aucun plan";

  const planReady = !!(primary && !fileMissing && planSource?.file);
  const planSync: SyncState = !primary ? "ABSENT" : fileMissing ? "A_VERIFIER" : "A_JOUR";

  const startLabel = fmtShortFr(asIso(plan?.startDate));
  const endLabel = fmtShortFr(asIso(plan?.endDateBase));
  const planningDetail =
    startLabel && endLabel
      ? `${startLabel} → ${endLabel}`
      : startLabel
        ? `À partir du ${startLabel}`
        : null;

  const cards: WorkspaceCard[] = [
    {
      kind: "plan",
      label: "Plan",
      title: planTitle,
      href: planReady
        ? openHref
        : study
          ? `/dashboard/visites-metres/etudes/${study.id}?attachPlan=1`
          : `${gedHref}&upload=1`,
      detail: planReady
        ? [rev ? `Révision ${rev}` : null, "PDF disponible"].filter(Boolean).join(" · ")
        : primary
          ? "Fichier à rattacher"
          : "À ajouter",
      syncState: planSync,
      statusLabel: statusLabelFromSync(planSync, "plan"),
      actionLabel: planReady ? "Ouvrir" : "Ajouter un plan",
      ready: planReady,
      syncHint: fileMissing
        ? "Plan source identifié mais fichier non rattaché"
        : rev
          ? `Révision figée pour le métré : ${rev}`
          : null,
      isReference: false,
      planMeta: {
        studyId: study?.id ?? null,
        chantierFileId: planSource?.file?.id ?? null,
        revisionLabel: rev,
        documentDate: planSource?.file?.documentDate ?? null,
        documentType: planSource?.file?.documentType ?? null,
        fileMissing,
        openHref,
        attachHref: study
          ? `/dashboard/visites-metres/etudes/${study.id}?attachPlan=1`
          : `${gedHref}&upload=1`,
        versionsHref: planSource?.file
          ? `${gedHref}&fileId=${encodeURIComponent(planSource.file.id)}`
          : gedHref,
      },
    },
    {
      kind: "metre",
      label: "Métré",
      title: study?.title ?? (fallbackStudyId ? "Métré chantier" : "Non créé"),
      href: effectiveStudyId
        ? `/dashboard/visites-metres/etudes/${effectiveStudyId}`
        : null,
      detail: study
        ? [
            `Version ${study.version}`,
            study._count.lines > 0
              ? `${study._count.lines} quantité${study._count.lines > 1 ? "s" : ""}`
              : null,
          ]
            .filter(Boolean)
            .join(" · ")
        : fallbackStudyId
          ? "Métré global du chantier"
          : "Générer depuis la visite / le devis (pas une nouvelle visite)",
      syncState: study || fallbackStudyId ? "A_JOUR" : "ABSENT",
      statusLabel: statusLabelFromSync(
        study || fallbackStudyId ? "A_JOUR" : "ABSENT",
        "metre",
      ),
      actionLabel: effectiveStudyId ? "Ouvrir" : "Générer le métré chantier",
      ready: !!(study || fallbackStudyId),
      syncHint: null,
      isReference: !!(study && input.refs.studyId === study.id),
    },
    {
      kind: "devis",
      label: "Devis",
      title: quote?.number ?? "Non créé",
      href: quote
        ? `/dashboard/devis-facturation/devis/${quote.id}`
        : study
          ? `/dashboard/visites-metres/etudes/${study.id}`
          : `/dashboard/devis-facturation/devis/nouveau?projectId=${encodeURIComponent(input.projectId)}`,
      detail: quote
        ? [
            euro(d(quote.totalSellHt)),
            quote.isDemonstration ? "démo" : null,
            quotesCount > 1
              ? `réf. · +${quotesCount - 1} autre${quotesCount - 1 > 1 ? "s" : ""}`
              : null,
          ]
            .filter(Boolean)
            .join(" · ") || null
        : "À générer",
      syncState: devisSync,
      statusLabel: statusLabelFromSync(devisSync, "devis"),
      actionLabel: quote ? "Ouvrir" : "Générer un devis",
      ready: !!quote,
      syncHint:
        quotesCount > 1
          ? `${quotesCount} devis sur ce lot — ${quote?.number ?? "—"} en référence`
          : devisHint,
      isReference: !!(quote && input.refs.quoteId === quote.id),
    },
    {
      kind: "planning",
      label: "Planning",
      title: plan ? planningDisplayTitle(plan) : "Non créé",
      href:
        plan && (study || fallbackStudyId)
          ? `/dashboard/visites-metres/etudes/${plan.studyId}/planning/${plan.id}`
          : input.fallbackPlanHref
            ? input.fallbackPlanHref
            : effectiveStudyId
              ? `/dashboard/visites-metres/etudes/${effectiveStudyId}`
              : null,
      detail: plan
        ? planningDetail
        : effectiveStudyId || quote
          ? "Planning global chantier — pas une nouvelle visite"
          : "À générer au niveau chantier",
      syncState: plan ? planningSync : "ABSENT",
      statusLabel: statusLabelFromSync(plan ? planningSync : "ABSENT", "planning"),
      actionLabel: plan
        ? "Ouvrir"
        : "Générer le planning chantier",
      ready: !!plan && planningSync === "A_JOUR",
      syncHint: planningHint ?? "Un seul planning pour tout le chantier.",
      isReference: !!(plan && input.refs.planId === plan.id),
    },
    {
      kind: "suivi",
      label: "Suivi",
      title: "Non démarré",
      href: `/dashboard/projets/${input.projectId}/preparation/${input.scopeId}`,
      detail: "Préparation du suivi chantier",
      syncState: "ABSENT",
      statusLabel: "Non démarré",
      actionLabel: "Préparer le suivi",
      ready: false,
      syncHint: null,
      isReference: false,
    },
  ];

  return { cards, alerts };
}

export async function getProjectWorkspace(
  orgId: string,
  projectId: string,
): Promise<ProjectWorkspace | null> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    select: {
      id: true,
      title: true,
      chantierStatus: true,
    },
  });
  if (!project) return null;

  const scopes = await prisma.projectScope.findMany({
    where: { projectId, organizationId: orgId, status: "ACTIVE" },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  const studies = await prisma.prepStudy.findMany({
    where: { projectId, organizationId: orgId, archivedAt: null },
    select: {
      id: true,
      title: true,
      version: true,
      scopeId: true,
      sourcesJson: true,
      _count: { select: { lines: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const quotes = await prisma.commercialQuote.findMany({
    where: {
      organizationId: orgId,
      OR: [
        { projectId },
        { sourcePrepStudyId: { in: studies.map((s) => s.id) } },
      ],
    },
    select: {
      id: true,
      number: true,
      subject: true,
      totalSellHt: true,
      isDemonstration: true,
      sourcePrepStudyId: true,
      projectId: true,
      scopeId: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const plans = await prisma.prepSchedulePlan.findMany({
    where: { projectId, organizationId: orgId },
    select: {
      id: true,
      studyId: true,
      scopeId: true,
      title: true,
      revisionKind: true,
      status: true,
      startDate: true,
      endDateBase: true,
      studyVersionAtGeneration: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const globalStudy =
    studies.find((s) => isGlobalStudySources(s.sourcesJson) && !s.scopeId) ??
    studies.find((s) => !s.scopeId) ??
    null;
  const globalPlan =
    plans.find(
      (p) =>
        p.scopeId == null &&
        (p.status === "CURRENT" || p.revisionKind === "CURRENT") &&
        (!globalStudy || p.studyId === globalStudy.id),
    ) ??
    plans.find((p) => p.scopeId == null && (!globalStudy || p.studyId === globalStudy.id)) ??
    null;

  const referencedQuoteIds = new Set(
    scopes.map((s) => s.referenceQuoteId).filter((id): id is string => Boolean(id)),
  );
  const globalQuote =
    quotes.find((q) => q.id === scopes[0]?.referenceQuoteId) ??
    quotes.find((q) => referencedQuoteIds.has(q.id)) ??
    quotes.find((q) => q.projectId === projectId) ??
    quotes[0] ??
    null;

  const quoteIds = quotes.map((q) => q.id);
  const [linkedVisits, followUpSheets, siteDocs] = await Promise.all([
    prisma.siteVisit.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { projectId },
          ...(quoteIds.length ? [{ commercialQuoteId: { in: quoteIds } }] : []),
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, subject: true, status: true, projectId: true, commercialQuoteId: true },
    }),
    prisma.followUpSheet.findMany({
      where: {
        projectId,
        status: { not: "ARCHIVE" },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, status: true },
    }),
    prisma.siteDocument.findMany({
      where: { organizationId: orgId, projectId, status: { not: "ARCHIVED" } },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: { id: true, kind: true, title: true, number: true, status: true },
    }),
  ]);

  const visit = linkedVisits[0] ?? null;
  let suggestedVisitId: string | null = null;
  if (!visit) {
    const titleBits = project.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 5)
      .slice(0, 6);
    const candidates = await prisma.siteVisit.findMany({
      where: {
        organizationId: orgId,
        projectId: null,
        OR: [
          { subject: { contains: "cuisine", mode: "insensitive" } },
          { clientNeed: { contains: "cuisine", mode: "insensitive" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, subject: true, clientNeed: true },
    });
    const match = candidates.find((c) => {
      const blob = `${c.subject ?? ""} ${c.clientNeed ?? ""}`.toLowerCase();
      return (
        blob.includes("salle de bain") &&
        (titleBits.some((b) => blob.includes(b)) || blob.includes("cuisine"))
      );
    });
    suggestedVisitId = match?.id ?? candidates[0]?.id ?? null;
  }

  const followUp = followUpSheets[0] ?? null;
  const compteRendu =
    siteDocs.find((d) => d.kind === "COMPTE_RENDU") ?? null;
  const noticeDoc = siteDocs.find((d) => d.kind === "NOTICE") ?? null;

  const suiviHref = globalPlan
    ? `/dashboard/projets/${projectId}/suivi-planning?planId=${globalPlan.id}`
    : followUp
      ? `/dashboard/projets/${projectId}/suivi-planning`
      : null;

  const globalPlanHref =
    globalPlan && globalStudy
      ? `/dashboard/visites-metres/etudes/${globalPlan.studyId}/planning/${globalPlan.id}`
      : null;

  const globalMetreCard: WorkspaceCard = {
    kind: "metre",
    label: "Métré & quantitatif",
    title: globalStudy?.title ?? "Non créé",
    href: globalStudy
      ? `/dashboard/visites-metres/etudes/${globalStudy.id}`
      : null,
    detail: globalStudy
      ? `Version ${globalStudy.version}${
          globalStudy._count.lines > 0
            ? ` · ${globalStudy._count.lines} poste${globalStudy._count.lines > 1 ? "s" : ""}`
            : ""
        }`
      : visit || suggestedVisitId || globalQuote
        ? "Générer depuis la visite et/ou le devis — sans nouvelle visite"
        : "À créer ou importer (JSON ChatGPT)",
    syncState: globalStudy ? "A_JOUR" : "ABSENT",
    statusLabel: globalStudy ? "À jour" : "À préparer",
    actionLabel: globalStudy ? "Ouvrir" : "Générer le métré",
    ready: !!globalStudy,
    syncHint: null,
    isReference: true,
  };

  const globalDevisCard: WorkspaceCard = {
    kind: "devis",
    label: "Devis global",
    title: globalQuote?.number ?? "Non créé",
    href: globalQuote
      ? `/dashboard/devis-facturation/devis/${globalQuote.id}`
      : `/dashboard/devis-facturation/devis/nouveau?projectId=${encodeURIComponent(projectId)}`,
    detail: globalQuote
      ? [euro(d(globalQuote.totalSellHt)), globalQuote.isDemonstration ? "démo" : null]
          .filter(Boolean)
          .join(" · ")
      : "À rattacher",
    syncState: globalQuote ? "A_JOUR" : "ABSENT",
    statusLabel: globalQuote ? "À jour" : "À préparer",
    actionLabel: globalQuote ? "Ouvrir" : "Créer un devis",
    ready: !!globalQuote,
    syncHint: null,
    isReference: true,
  };

  const globalPlanningCard: WorkspaceCard = {
    kind: "planning",
    label: "Planning chantier",
    title: globalPlan ? planningDisplayTitle(globalPlan) : "Non créé",
    href: globalPlanHref
      ? globalPlanHref
      : globalStudy
        ? `/dashboard/visites-metres/etudes/${globalStudy.id}`
        : null,
    detail: globalPlan
      ? [
          globalPlan.startDate ? fmtShortFr(asIso(globalPlan.startDate)) : null,
          globalPlan.endDateBase ? `→ ${fmtShortFr(asIso(globalPlan.endDateBase))}` : null,
        ]
          .filter(Boolean)
          .join(" ") || "Planning unique du chantier"
      : globalQuote || globalStudy
        ? "Générer au niveau chantier — jamais via Nouvelle visite"
        : "À générer",
    syncState: globalPlan ? "A_JOUR" : "ABSENT",
    statusLabel: globalPlan ? "À jour" : "À préparer",
    actionLabel: globalPlan ? "Ouvrir" : "Générer le planning",
    ready: !!globalPlan,
    syncHint: "Un seul planning pour tout le chantier — les lots sont des phases.",
    isReference: true,
  };

  const workflow: ChantierWorkflowStep[] = [
    {
      id: "visite",
      label: "Visite",
      title: visit
        ? visit.subject?.slice(0, 80) || "Visite rattachée"
        : suggestedVisitId
          ? "Visite détectée — à rattacher"
          : "Aucune visite rattachée",
      detail: visit
        ? `Statut ${visit.status}`
        : suggestedVisitId
          ? "Une visite existante correspond à ce chantier"
          : "Rattacher une visite terrain existante",
      href: visit ? `/dashboard/visites-metres/${visit.id}` : null,
      ready: !!visit,
      actionLabel: visit ? "Ouvrir" : suggestedVisitId ? "Rattacher la visite" : "—",
      primaryAction: visit ? "open" : suggestedVisitId ? "attach_visit" : null,
    },
    {
      id: "metre",
      label: "Métré & quantitatif",
      title: globalMetreCard.title,
      detail: globalMetreCard.detail,
      href: globalMetreCard.href,
      ready: globalMetreCard.ready,
      actionLabel: globalMetreCard.ready ? "Ouvrir" : "Générer depuis la visite",
      primaryAction: globalMetreCard.ready ? "open" : "create_global_prep",
    },
    {
      id: "devis",
      label: "Devis",
      title: globalDevisCard.title,
      detail: globalDevisCard.detail,
      href: globalDevisCard.href,
      ready: globalDevisCard.ready,
      actionLabel: globalDevisCard.ready ? "Ouvrir" : "Créer un devis",
      primaryAction: "open",
    },
    {
      id: "planning",
      label: "Planning chantier",
      title: globalPlanningCard.title,
      detail: globalPlanningCard.detail,
      href: globalPlanningCard.href,
      ready: globalPlanningCard.ready,
      actionLabel: globalPlanningCard.ready ? "Ouvrir" : "Générer le planning",
      primaryAction: globalPlanningCard.ready ? "open" : "create_global_prep",
    },
    {
      id: "suivi",
      label: "Suivi chantier",
      title: followUp?.title ?? (globalPlan ? "À créer depuis le planning" : "Non créé"),
      detail: followUp
        ? `Lié au planning · statut ${followUp.status}`
        : globalPlan
          ? "Créer le suivi depuis les tâches du planning global"
          : "Générez d’abord le planning global",
      href: followUp || globalPlan ? suiviHref : null,
      ready: !!followUp,
      actionLabel: followUp ? "Ouvrir" : globalPlan ? "Créer le suivi" : "Planning requis",
      primaryAction: followUp
        ? "open"
        : globalPlan
          ? "create_follow_up"
          : null,
    },
    {
      id: "compte_rendu",
      label: "Compte rendu",
      title: compteRendu ? `${compteRendu.number} — ${compteRendu.title}` : "Non créé",
      detail: compteRendu
        ? `Statut ${compteRendu.status}`
        : "Générer depuis le suivi et le chantier",
      href: compteRendu
        ? `/dashboard/projets/${projectId}/documents-chantier/${compteRendu.id}`
        : `/dashboard/projets/${projectId}/documents-chantier`,
      ready: !!compteRendu,
      actionLabel: compteRendu ? "Ouvrir" : "Générer",
      primaryAction: compteRendu ? "open" : "create_compte_rendu",
    },
    {
      id: "notice",
      label: "Notice explicative",
      title: noticeDoc
        ? `${noticeDoc.number} — ${noticeDoc.title}`
        : "Non créée",
      detail: noticeDoc
        ? `Statut ${noticeDoc.status}`
        : "Expliquer le déroulement du chantier (PDF client)",
      href: noticeDoc
        ? `/dashboard/projets/${projectId}/documents-chantier/${noticeDoc.id}`
        : `/dashboard/projets/${projectId}/documents-chantier`,
      ready: !!noticeDoc,
      actionLabel: noticeDoc ? "Ouvrir" : "Générer",
      primaryAction: noticeDoc ? "open" : "create_notice",
    },
  ];

  const scopeWorkspaces: ScopeWorkspace[] = scopes.map((scope) => {
    // Lots = phases / filtres uniquement — pas de chaîne métré/planning par lot.
    return {
      id: scope.id,
      code: scope.code,
      name: scope.name,
      description: scope.description,
      status: scope.status,
      displayOrder: scope.displayOrder,
      href: `/dashboard/projets/${projectId}/preparation/${scope.id}`,
      cards: [],
      alerts: [
        {
          level: "info" as const,
          message: "Phase / filtre du dossier chantier — métré et planning sont globaux.",
        },
      ],
      progress: {
        ready: globalStudy && globalQuote && globalPlan ? 1 : 0,
        total: 1,
      },
    };
  });

  const unscopedStudies = studies.filter(
    (s) => !s.scopeId && !isGlobalStudySources(s.sourcesJson),
  );
  const unscopedPlans = plans.filter(
    (p) =>
      !p.scopeId &&
      p.status !== "ARCHIVED" &&
      !(globalPlan && p.id === globalPlan.id),
  );
  // Devis déjà en référence d’un lot / devis global → plus « à organiser ».
  const unscopedQuotes = quotes.filter(
    (q) =>
      !q.scopeId &&
      !referencedQuoteIds.has(q.id) &&
      !(globalQuote && q.id === globalQuote.id),
  );

  const items: UnscopedItem[] = [
    ...unscopedQuotes.map((q) => ({
      kind: "quote" as const,
      id: q.id,
      label: q.number,
      detail: [q.subject?.trim() || null, euro(d(q.totalSellHt))]
        .filter(Boolean)
        .join(" · "),
      suggestedScopeName:
        suggestScopeNameFromText(q.subject) ??
        suggestScopeNameFromText(q.number),
    })),
    ...unscopedStudies.map((s) => ({
      kind: "study" as const,
      id: s.id,
      label: s.title,
      detail: `Métré · version ${s.version}`,
      suggestedScopeName: suggestScopeNameFromText(s.title),
    })),
    ...unscopedPlans.map((p) => ({
      kind: "plan" as const,
      id: p.id,
      label: planningDisplayTitle(p),
      detail: "Planning non rattaché",
      suggestedScopeName: suggestScopeNameFromText(p.title),
    })),
  ];

  return {
    projectId: project.id,
    title: project.title,
    chantierStatus: project.chantierStatus,
    href: `/dashboard/projets/${project.id}`,
    global: {
      metre: globalMetreCard,
      devis: globalDevisCard,
      planning: globalPlanningCard,
      workflow,
      phases: scopes.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        href: `/dashboard/projets/${projectId}/preparation/${s.id}`,
      })),
      canCreateFromQuote: !!globalQuote && (!globalStudy || !globalPlan),
      primaryQuoteId: globalQuote?.id ?? null,
      visitId: visit?.id ?? null,
      suggestedVisitId,
      followUpSheetId: followUp?.id ?? null,
      compteRenduId: compteRendu?.id ?? null,
    },
    scopes: scopeWorkspaces,
    unscoped: {
      studies: unscopedStudies.length,
      schedulePlans: unscopedPlans.length,
      quotes: unscopedQuotes.length,
      items,
    },
  };
}

export async function ensureProjectScope(input: {
  orgId: string;
  projectId: string;
  code: string;
  name: string;
  description?: string | null;
  displayOrder?: number;
}): Promise<{ id: string; created: boolean }> {
  const existing = await prisma.projectScope.findUnique({
    where: {
      projectId_code: { projectId: input.projectId, code: input.code },
    },
    select: { id: true },
  });
  if (existing) return { id: existing.id, created: false };

  const created = await prisma.projectScope.create({
    data: {
      organizationId: input.orgId,
      projectId: input.projectId,
      code: input.code,
      name: input.name,
      description: input.description ?? null,
      displayOrder: input.displayOrder ?? 0,
      status: "ACTIVE",
    },
    select: { id: true },
  });
  return { id: created.id, created: true };
}

/** Rattache étude + planning (+ baselines) à un périmètre. */
export async function attachStudyToScope(input: {
  orgId: string;
  scopeId: string;
  studyId: string;
  setAsReference?: boolean;
}): Promise<void> {
  const scope = await prisma.projectScope.findFirst({
    where: { id: input.scopeId, organizationId: input.orgId },
  });
  if (!scope) throw new Error("Périmètre introuvable");

  const study = await prisma.prepStudy.findFirst({
    where: {
      id: input.studyId,
      organizationId: input.orgId,
      projectId: scope.projectId,
    },
  });
  if (!study) throw new Error("Étude introuvable sur ce projet");

  await prisma.$transaction(async (tx) => {
    await tx.prepStudy.update({
      where: { id: study.id },
      data: { scopeId: scope.id },
    });
    await tx.prepSchedulePlan.updateMany({
      where: { studyId: study.id, organizationId: input.orgId },
      data: { scopeId: scope.id },
    });
    // Tous les devis issus de ce métré rejoignent le lot
    await tx.commercialQuote.updateMany({
      where: {
        organizationId: input.orgId,
        sourcePrepStudyId: study.id,
      },
      data: { scopeId: scope.id },
    });

    if (input.setAsReference !== false) {
      const quote = await tx.commercialQuote.findFirst({
        where: {
          organizationId: input.orgId,
          sourcePrepStudyId: study.id,
        },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      const plan = await tx.prepSchedulePlan.findFirst({
        where: { studyId: study.id, organizationId: input.orgId },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      await tx.projectScope.update({
        where: { id: scope.id },
        data: {
          referenceStudyId: study.id,
          referenceQuoteId: quote?.id ?? scope.referenceQuoteId,
          referenceSchedulePlanId: plan?.id ?? scope.referenceSchedulePlanId,
        },
      });
    }
  });
}

/**
 * Rattache un devis à un périmètre (N devis / lot).
 * `setAsReference` : true = forcer, false = jamais, "if_empty" (défaut) = seulement si aucune référence.
 */
export async function attachQuoteToScope(input: {
  orgId: string;
  scopeId: string;
  quoteId: string;
  setAsReference?: boolean | "if_empty";
}): Promise<void> {
  const scope = await prisma.projectScope.findFirst({
    where: { id: input.scopeId, organizationId: input.orgId },
  });
  if (!scope) throw new Error("Périmètre introuvable");

  const quote = await prisma.commercialQuote.findFirst({
    where: {
      id: input.quoteId,
      organizationId: input.orgId,
      OR: [{ projectId: scope.projectId }, { projectId: null }],
    },
    select: {
      id: true,
      projectId: true,
      organizationId: true,
      sourcePrepStudyId: true,
      scopeId: true,
    },
  });
  if (!quote) throw new Error("Devis introuvable");
  if (quote.organizationId !== input.orgId) {
    throw new Error("Ce devis appartient à une autre organisation");
  }
  if (quote.projectId && quote.projectId !== scope.projectId) {
    throw new Error("Ce devis appartient à un autre chantier");
  }

  if (quote.sourcePrepStudyId) {
    const study = await prisma.prepStudy.findFirst({
      where: {
        id: quote.sourcePrepStudyId,
        organizationId: input.orgId,
        projectId: scope.projectId,
      },
      select: { id: true },
    });
    if (!study) {
      throw new Error("Le métré source du devis n’appartient pas à ce chantier");
    }
    await attachStudyToScope({
      orgId: input.orgId,
      scopeId: scope.id,
      studyId: quote.sourcePrepStudyId,
      setAsReference:
        input.setAsReference === true ||
        (input.setAsReference !== false && !scope.referenceQuoteId),
    });
    await prisma.commercialQuote.update({
      where: { id: quote.id },
      data: { scopeId: scope.id },
    });
    if (input.setAsReference === true) {
      await setScopeReferenceQuote({
        orgId: input.orgId,
        scopeId: scope.id,
        quoteId: quote.id,
      });
    }
    return;
  }

  const mode = input.setAsReference ?? "if_empty";
  const makeReference =
    mode === true || (mode === "if_empty" && !scope.referenceQuoteId);

  await prisma.$transaction(async (tx) => {
    await tx.commercialQuote.update({
      where: { id: quote.id },
      data: {
        scopeId: scope.id,
        ...(quote.projectId ? {} : { projectId: scope.projectId }),
      },
    });
    if (makeReference) {
      await tx.projectScope.update({
        where: { id: scope.id },
        data: { referenceQuoteId: quote.id },
      });
    }
  });
}

/**
 * Définit le devis de référence d’un lot.
 * Le devis doit appartenir au même chantier (projectId).
 * Membership scopeId facultatif : un devis multi-sections peut être
 * référence de plusieurs lots sans y être « membre » unique.
 * Ne retire aucun autre devis du lot.
 */
export async function setScopeReferenceQuote(input: {
  orgId: string;
  scopeId: string;
  quoteId: string;
}): Promise<void> {
  const scope = await prisma.projectScope.findFirst({
    where: { id: input.scopeId, organizationId: input.orgId },
    select: { id: true, projectId: true, organizationId: true },
  });
  if (!scope) throw new Error("Périmètre introuvable");

  const quote = await prisma.commercialQuote.findFirst({
    where: { id: input.quoteId, organizationId: input.orgId },
    select: { id: true, scopeId: true, projectId: true, organizationId: true },
  });
  if (!quote) throw new Error("Devis introuvable");
  if (quote.organizationId !== scope.organizationId) {
    throw new Error("Ce devis appartient à une autre organisation");
  }
  if (quote.projectId && quote.projectId !== scope.projectId) {
    throw new Error("Ce devis appartient à un autre chantier");
  }

  await prisma.$transaction(async (tx) => {
    if (!quote.projectId) {
      await tx.commercialQuote.update({
        where: { id: quote.id },
        data: { projectId: scope.projectId },
      });
    }
    await tx.projectScope.update({
      where: { id: scope.id },
      data: { referenceQuoteId: quote.id },
    });
  });
}

/**
 * Retire un devis d’un périmètre.
 * Si c’était le devis de référence → referenceQuoteId = null (aucun remplacement auto).
 */
export async function detachQuoteFromScope(input: {
  orgId: string;
  quoteId: string;
}): Promise<{ clearedReference: boolean }> {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: input.quoteId, organizationId: input.orgId },
    select: { id: true, scopeId: true },
  });
  if (!quote) throw new Error("Devis introuvable");
  if (!quote.scopeId) return { clearedReference: false };

  const scope = await prisma.projectScope.findFirst({
    where: { id: quote.scopeId, organizationId: input.orgId },
    select: { id: true, referenceQuoteId: true },
  });

  const clearedReference = scope?.referenceQuoteId === quote.id;

  await prisma.$transaction(async (tx) => {
    if (clearedReference && scope) {
      await tx.projectScope.update({
        where: { id: scope.id },
        data: { referenceQuoteId: null },
      });
    }
    await tx.commercialQuote.update({
      where: { id: quote.id },
      data: { scopeId: null },
    });
  });

  return { clearedReference };
}

/** Vérifie les invariants membership / référence (outil de validation). */
export function assertQuoteScopeConsistency(input: {
  scope: { id: string; projectId: string; organizationId: string; referenceQuoteId: string | null };
  quote: {
    id: string;
    projectId: string | null;
    organizationId: string;
    scopeId: string | null;
  };
}): { ok: true } | { ok: false; error: string } {
  if (input.quote.organizationId !== input.scope.organizationId) {
    return { ok: false, error: "Organisation différente" };
  }
  if (input.quote.projectId && input.quote.projectId !== input.scope.projectId) {
    return { ok: false, error: "Projet différent" };
  }
  // Membership scopeId facultatif si même chantier (devis multi-lots).
  if (
    input.quote.scopeId &&
    input.quote.scopeId !== input.scope.id &&
    input.quote.projectId &&
    input.quote.projectId !== input.scope.projectId
  ) {
    return { ok: false, error: "Membership hors périmètre" };
  }
  return { ok: true };
}

export type QuoteSectionScopePreview = {
  sectionId: string;
  title: string;
  code: string;
  lineCount: number;
  selected: boolean;
  /** Lot existant au nom correspondant — rattachement sans doublon. */
  existingScopeId: string | null;
  existingScopeName: string | null;
  action: "create" | "link_existing";
};

export async function previewScopesFromQuoteSections(input: {
  orgId: string;
  projectId: string;
  quoteId: string;
}): Promise<{
  quote: { id: string; number: string; subject: string };
  sections: QuoteSectionScopePreview[];
}> {
  const quote = await prisma.commercialQuote.findFirst({
    where: {
      id: input.quoteId,
      organizationId: input.orgId,
      OR: [{ projectId: input.projectId }, { projectId: null }],
    },
    select: {
      id: true,
      number: true,
      subject: true,
      projectId: true,
      currentVersionId: true,
    },
  });
  if (!quote?.currentVersionId) throw new Error("Devis introuvable sur ce chantier");

  const [sections, existingScopes] = await Promise.all([
    prisma.commercialQuoteSection.findMany({
      where: { versionId: quote.currentVersionId, organizationId: input.orgId },
      select: {
        id: true,
        title: true,
        sortOrder: true,
        _count: { select: { lines: true } },
      },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.projectScope.findMany({
      where: {
        projectId: input.projectId,
        organizationId: input.orgId,
        status: "ACTIVE",
      },
      select: { id: true, name: true, code: true },
    }),
  ]);

  if (sections.length === 0) {
    throw new Error("Ce devis n’a aucune section / lot structuré");
  }

  const byName = new Map(
    existingScopes.map((s) => [normalizeLotLabel(s.name), s] as const),
  );
  const byCode = new Map(existingScopes.map((s) => [s.code.toUpperCase(), s]));

  return {
    quote: { id: quote.id, number: quote.number, subject: quote.subject },
    sections: sections.map((sec, index) => {
      const code = codeFromSectionTitle(sec.title, index);
      const existing =
        byName.get(normalizeLotLabel(sec.title)) ??
        byCode.get(code.toUpperCase()) ??
        null;
      return {
        sectionId: sec.id,
        title: sec.title,
        code,
        lineCount: sec._count.lines,
        selected: true,
        existingScopeId: existing?.id ?? null,
        existingScopeName: existing?.name ?? null,
        action: existing ? ("link_existing" as const) : ("create" as const),
      };
    }),
  };
}

/**
 * Crée / rattache des lots depuis les sections d’un devis.
 * - pas de doublon si lot homonyme ;
 * - devis en référence sur chaque lot retenu ;
 * - membership scopeId = premier lot créé/lié (si devis encore orphelin).
 */
export async function createScopesFromQuoteSections(input: {
  orgId: string;
  projectId: string;
  quoteId: string;
  sectionIds: string[];
}): Promise<{
  created: Array<{ scopeId: string; name: string; code: string; created: boolean }>;
  quoteId: string;
  primaryScopeId: string | null;
}> {
  const preview = await previewScopesFromQuoteSections(input);
  const wanted = new Set(input.sectionIds);
  const chosen = preview.sections.filter((s) => wanted.has(s.sectionId) && s.selected);
  if (chosen.length === 0) {
    throw new Error("Sélectionnez au moins une section");
  }

  const quote = await prisma.commercialQuote.findFirst({
    where: { id: input.quoteId, organizationId: input.orgId },
    select: { id: true, projectId: true, scopeId: true },
  });
  if (!quote) throw new Error("Devis introuvable");

  let displayOrder = await prisma.projectScope.count({
    where: { projectId: input.projectId, organizationId: input.orgId },
  });

  const results: Array<{
    scopeId: string;
    name: string;
    code: string;
    created: boolean;
  }> = [];

  for (const sec of chosen) {
    let scopeId = sec.existingScopeId;
    let created = false;
    if (scopeId) {
      // Lot existant — pas de doublon
    } else {
      // Éviter collision de code
      let code = sec.code;
      const codeTaken = await prisma.projectScope.findUnique({
        where: {
          projectId_code: { projectId: input.projectId, code },
        },
        select: { id: true },
      });
      if (codeTaken) {
        code = `${sec.code}-${String(displayOrder + 1).padStart(2, "0")}`.slice(0, 32);
      }
      const ensured = await ensureProjectScope({
        orgId: input.orgId,
        projectId: input.projectId,
        code,
        name: sec.title,
        description: `Lot créé depuis le devis ${preview.quote.number} — section « ${sec.title} ».`,
        displayOrder,
      });
      scopeId = ensured.id;
      created = ensured.created;
      displayOrder += 1;
    }

    await setScopeReferenceQuote({
      orgId: input.orgId,
      scopeId: scopeId!,
      quoteId: quote.id,
    });

    results.push({
      scopeId: scopeId!,
      name: sec.existingScopeName ?? sec.title,
      code: sec.code,
      created,
    });
  }

  const primaryScopeId = results[0]?.scopeId ?? null;

  // Membership : premier lot si le devis n’est encore rattaché à aucun lot
  if (primaryScopeId && !quote.scopeId) {
    await prisma.commercialQuote.update({
      where: { id: quote.id },
      data: {
        projectId: input.projectId,
        scopeId: primaryScopeId,
      },
    });
  } else if (!quote.projectId) {
    await prisma.commercialQuote.update({
      where: { id: quote.id },
      data: { projectId: input.projectId },
    });
  }

  return { created: results, quoteId: quote.id, primaryScopeId };
}

export async function attachSchedulePlanToScope(input: {
  orgId: string;
  scopeId: string;
  planId: string;
}): Promise<void> {
  const scope = await prisma.projectScope.findFirst({
    where: { id: input.scopeId, organizationId: input.orgId },
  });
  if (!scope) throw new Error("Périmètre introuvable");

  const plan = await prisma.prepSchedulePlan.findFirst({
    where: {
      id: input.planId,
      organizationId: input.orgId,
      projectId: scope.projectId,
    },
    select: { id: true, studyId: true },
  });
  if (!plan) throw new Error("Planning introuvable");

  await prisma.$transaction(async (tx) => {
    await tx.prepSchedulePlan.update({
      where: { id: plan.id },
      data: { scopeId: scope.id },
    });
    await tx.prepStudy.update({
      where: { id: plan.studyId },
      data: { scopeId: scope.id },
    });
    if (!scope.referenceSchedulePlanId) {
      await tx.projectScope.update({
        where: { id: scope.id },
        data: {
          referenceSchedulePlanId: plan.id,
          referenceStudyId: scope.referenceStudyId ?? plan.studyId,
        },
      });
    }
  });
}
