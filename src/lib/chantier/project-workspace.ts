/**
 * Dossier chantier V2 — agrégateur lecture Project / ProjectScope.
 * Aucune synchronisation automatique entre modules.
 */
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import {
  planSourceDisplayTitle,
  primaryPrepSource,
  resolvePrepPlanSource,
} from "@/lib/preparation/plan-source";
import {
  extractVisitSearchBits,
  isGlobalStudySources,
  resolveCurrentSchedulePlan,
  resolvePrepSchedulePlanForWorkspace,
  resolvePrepStudyForWorkspace,
  resolveSchedulePlanForScope,
  workspaceOpenOrGenerateLabel,
} from "@/lib/chantier/resolve-workspace-entities";
import { evaluatePlanningStudyVersionSync } from "@/lib/preparation/schedule/planning-sync-state";
import {
  evaluateQuoteStudySyncState,
  hasQuantityDiffAgainstTransfer,
} from "@/lib/preparation/quote-bridge/quote-sync-state";
import { evaluateCorePreparationTriple } from "@/lib/chantier/core-preparation-state";
import { buildPreparationSnapshot } from "@/lib/chantier/preparation-state";
import type { ProjectPreparationState } from "@/lib/chantier/project-preparation-state";
import {
  isQuotePreparationReady,
  quoteEditorHref,
  quotePreparationStateLabel,
  quoteWorkflowActionLabel,
} from "@/lib/chantier/quote-workflow-status";
import {
  classifyFollowUpRelation,
  classifyPlanRelation,
  classifyQuoteRelation,
  classifyStudyRelation,
  matchQuoteSectionForScope,
  relationBadgeLabel,
  sumSectionSellHt,
  type QuoteSectionAmount,
  type ScopeCardRelation,
} from "@/lib/chantier/scope-card-relation";
import { STATUS_LABELS } from "@/lib/follow-up/types";
import type { FollowUpSheetStatus } from "@prisma/client";

function cardStatusFromQuote(
  status: string | null | undefined,
): CardStatusLabel {
  return quotePreparationStateLabel(status) as CardStatusLabel;
}

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
  | "Brouillon"
  | "Prêt"
  | "Émis"
  | "Accepté"
  | "Refusé"
  | "Expiré"
  | "Annulé"
  | "Action requise"
  | "À revalider"
  | "Modification disponible"
  | "À valider"
  | "Non démarré";

export type WorkspaceCardKind = "plan" | "metre" | "devis" | "planning" | "suivi";

export type {
  ScopeCardRelation,
} from "@/lib/chantier/scope-card-relation";

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
  /**
   * Provenance vs scope courant (vue lot).
   * Absent sur les cartes purement globales chantier.
   */
  relation?: import("@/lib/chantier/scope-card-relation").ScopeCardRelation;
  /** Badge UI : « Global chantier », « Section devis », … */
  relationLabel?: string | null;
  /** Ligne secondaire (ex. total devis multi-lots). */
  secondaryDetail?: string | null;
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
    | "prepare_takeoff_chatgpt"
    | "prepare_quote_chatgpt"
    | "prepare_planning_chatgpt"
    | "create_follow_up"
    | "create_compte_rendu"
    | "create_notice"
    | "attach_visit"
    | null;
};

/** Accès plan source (PDF) — lecture seule, lien vers viewer existant. */
export type ProjectPlanSourceLink = {
  fileName: string;
  title: string;
  href: string;
  studyId: string | null;
  chantierFileId: string;
};

/** Pilotage global chantier (métré / devis / planning uniques). */
export type ProjectGlobalWorkspace = {
  metre: WorkspaceCard;
  devis: WorkspaceCard;
  planning: WorkspaceCard;
  /** Chaîne Visite → … → Notice (une seule, pas par lot). */
  workflow: ChantierWorkflowStep[];
  /** Plan d’exécution rattaché au métré chantier (si présent). */
  planSource: ProjectPlanSourceLink | null;
  phases: Array<{ id: string; code: string; name: string; href: string }>;
  canCreateFromQuote: boolean;
  primaryQuoteId: string | null;
  visitId: string | null;
  /** Visite orpheline détectée (même org, sujet proche) — à rattacher. */
  suggestedVisitId: string | null;
  followUpSheetId: string | null;
  compteRenduId: string | null;
  /** État métier unique liste ↔ fiche (7 étapes + progression + nextAction). */
  preparationState: ProjectPreparationState;
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
  if (sync === "MODIFICATION_DISPONIBLE") {
    // CTX-03 : devis → « À revalider » ; planning → « Action requise »
    return kind === "devis" ? "À revalider" : "Action requise";
  }
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
  scopeName: string;
  study: {
    id: string;
    title: string;
    version: number;
    scopeId: string | null;
    sourcesJson: unknown;
    _count: { lines: number };
  } | null;
  /** true si study vient d’un fallback chantier (pas rattaché au scope). */
  studyIsGlobalFallback: boolean;
  quote: {
    id: string;
    number: string;
    totalSellHt: unknown;
    isDemonstration: boolean;
    status: string;
    scopeId: string | null;
  } | null;
  /** Nombre total de devis rattachés au lot (référence + autres). */
  quotesCount?: number;
  /** Section devis associée au lot (si multi-lots). */
  quoteSection: QuoteSectionAmount | null;
  plan: {
    id: string;
    studyId: string;
    scopeId: string | null;
    title: string;
    revisionKind: string;
    status: string;
    startDate: Date | null;
    endDateBase: Date | null;
    studyVersionAtGeneration: number;
  } | null;
  /**
   * Version du PrepStudy réellement lié au planning (plan.studyId).
   * Ne pas utiliser un métré d’un autre scope.
   */
  planLinkedStudyVersion?: number | null;
  /**
   * Provenance métré du devis (PrepQuoteTransfer / liens).
   * Ne pas utiliser un métré d’un autre scope.
   */
  quoteMetreProvenance?: {
    hasMetreProvenance: boolean;
    linkedStudyVersion: number | null;
    transferStudyVersion: number | null;
    hasSignificantQuantityDiffs?: boolean | null;
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
  /** Suivi chantier global (FollowUpSheet n’a pas de scopeId). */
  globalFollowUp?: {
    id: string;
    title: string;
    status: string;
  } | null;
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
  const section = input.quoteSection;
  const globalFollowUp = input.globalFollowUp ?? null;

  const metreRelation = study
    ? classifyStudyRelation({
        studyScopeId: study.scopeId,
        currentScopeId: input.scopeId,
        usedFallback: input.studyIsGlobalFallback || study.scopeId !== input.scopeId,
      })
    : fallbackStudyId
      ? ("GLOBAL_FALLBACK" as const)
      : ("ABSENT" as const);

  const quoteRelation = classifyQuoteRelation({
    hasQuote: !!quote,
    sectionMatched: !!section,
    quoteScopeId: quote?.scopeId,
    currentScopeId: input.scopeId,
  });

  const planRelation = classifyPlanRelation({
    planScopeId: plan?.scopeId,
    currentScopeId: input.scopeId,
    hasPlan: !!plan,
  });

  const planSourceRelation: ScopeCardRelation =
    !primary && !planSource
      ? metreRelation === "GLOBAL_FALLBACK"
        ? "GLOBAL_FALLBACK"
        : "ABSENT"
      : metreRelation === "SCOPE_SPECIFIC"
        ? "SCOPE_SPECIFIC"
        : "GLOBAL_FALLBACK";

  const suiviRelation = classifyFollowUpRelation({
    hasScopeSpecific: false,
    hasGlobal: !!globalFollowUp,
  });

  const gedHref = `/dashboard/documents?projectId=${encodeURIComponent(input.projectId)}`;
  const openHref = planSource?.file
    ? `/dashboard/projets/${input.projectId}/plan-source?studyId=${encodeURIComponent(study?.id ?? "")}&fileId=${encodeURIComponent(planSource.file.id)}`
    : null;
  const fileMissing = !planSource || planSource.fileMissing;

  let devisHint: string | null = null;

  // CTX-03 — sync devis / métré (par devis, via transfer + diffs quantité).
  const quoteProv = input.quoteMetreProvenance;
  const devisEval = evaluateQuoteStudySyncState({
    hasQuote: !!quote,
    hasMetreProvenance: quoteProv?.hasMetreProvenance ?? false,
    currentStudyVersion: quoteProv?.linkedStudyVersion ?? null,
    transferStudyVersion: quoteProv?.transferStudyVersion ?? null,
    hasSignificantQuantityDiffs: quoteProv?.hasSignificantQuantityDiffs,
  });
  const devisSync = devisEval.syncState;
  devisHint = devisEval.hint;

  if (devisSync === "MODIFICATION_DISPONIBLE") {
    alerts.push({
      level: "warning",
      message:
        metreRelation === "GLOBAL_FALLBACK"
          ? "Le devis doit être revalidé — le métré global du chantier a évolué."
          : "Le devis doit être revalidé — le métré a évolué.",
    });
  } else if (devisSync === "A_VERIFIER" && quote && quoteProv?.hasMetreProvenance) {
    alerts.push({
      level: "warning",
      message: devisHint ?? "Alignement métré / devis à vérifier.",
    });
  }

  // CTX-04 — comparer uniquement avec le métré lié au plan (pas latest du projet).
  const linkedVersion =
    input.planLinkedStudyVersion ??
    (study && plan && study.id === plan.studyId ? study.version : null);
  const planningEval = evaluatePlanningStudyVersionSync({
    hasPlan: !!plan,
    currentStudyVersion: linkedVersion,
    studyVersionAtGeneration: plan?.studyVersionAtGeneration,
  });
  const planningSync = planningEval.syncState;
  const planningHint = planningEval.hint;

  if (planningSync === "MODIFICATION_DISPONIBLE") {
    alerts.push({
      level: "warning",
      message:
        planRelation === "GLOBAL_FALLBACK" || metreRelation === "GLOBAL_FALLBACK"
          ? "Le planning global du chantier doit être recalculé — le métré global a évolué."
          : "Le planning doit être recalculé — le métré a évolué.",
    });
  } else if (planningSync === "A_VERIFIER" && plan) {
    alerts.push({
      level: "warning",
      message: planningHint ?? "Alignement métré / planning à vérifier.",
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
      message: "Aucun métré spécifique n’est rattaché à ce lot.",
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
      : planSourceRelation === "GLOBAL_FALLBACK"
        ? "Aucun plan source global rattaché"
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

  const quoteTotalHt = quote ? euro(d(quote.totalSellHt)) : null;
  const sectionTotalHt = section ? euro(section.totalSellHt) : null;
  const isMultiLotQuote = !!quote && (!!section || quotesCount > 1);

  const followUpStatusLabel = globalFollowUp
    ? STATUS_LABELS[globalFollowUp.status as FollowUpSheetStatus] ??
      globalFollowUp.status
    : null;

  const cards: WorkspaceCard[] = [
    {
      kind: "plan",
      label:
        planSourceRelation === "GLOBAL_FALLBACK" ? "Plan · Global chantier" : "Plan",
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
          : planSourceRelation === "GLOBAL_FALLBACK"
            ? "Aucun plan source global rattaché"
            : "À ajouter",
      syncState: planSync,
      statusLabel: statusLabelFromSync(planSync, "plan"),
      actionLabel: planReady
        ? "Ouvrir"
        : planSourceRelation === "GLOBAL_FALLBACK"
          ? "Gérer le plan du chantier"
          : "Ajouter un plan",
      ready: planReady,
      syncHint: fileMissing
        ? "Plan source identifié mais fichier non rattaché"
        : rev
          ? `Révision figée pour le métré : ${rev}`
          : planSourceRelation === "GLOBAL_FALLBACK"
            ? "Plan au niveau chantier — pas uniquement ce lot"
            : null,
      isReference: false,
      relation: planSourceRelation,
      relationLabel: relationBadgeLabel(planSourceRelation),
      secondaryDetail: null,
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
      label:
        metreRelation === "GLOBAL_FALLBACK"
          ? "Métré · Global chantier"
          : "Métré",
      title:
        metreRelation === "GLOBAL_FALLBACK"
          ? "Métré global du chantier"
          : study?.title ?? (fallbackStudyId ? "Métré chantier" : "Non créé"),
      href: effectiveStudyId
        ? `/dashboard/visites-metres/etudes/${effectiveStudyId}`
        : null,
      detail: study
        ? [
            `Version ${study.version}`,
            study._count.lines > 0
              ? metreRelation === "GLOBAL_FALLBACK"
                ? `${study._count.lines} quantité${study._count.lines > 1 ? "s" : ""} au total`
                : `${study._count.lines} quantité${study._count.lines > 1 ? "s" : ""}`
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
      syncHint:
        metreRelation === "GLOBAL_FALLBACK"
          ? "Aucun métré spécifique n’est rattaché à ce lot."
          : null,
      isReference: !!(study && input.refs.studyId === study.id),
      relation: metreRelation,
      relationLabel: relationBadgeLabel(metreRelation),
      secondaryDetail:
        metreRelation === "GLOBAL_FALLBACK"
          ? "Ouverture du métré chantier (pas un métré du lot)."
          : null,
    },
    {
      kind: "devis",
      label:
        quoteRelation === "SECTION_SPECIFIC"
          ? "Devis du lot"
          : quoteRelation === "GLOBAL_FALLBACK"
            ? "Devis · Global chantier"
            : "Devis",
      title:
        quoteRelation === "SECTION_SPECIFIC" && section
          ? sectionTotalHt ?? input.scopeName
          : quote?.number ?? "Non créé",
      href: quote
        ? `/dashboard/devis-facturation/devis/${quote.id}`
        : study
          ? `/dashboard/visites-metres/etudes/${study.id}`
          : `/dashboard/devis-facturation/devis/nouveau?projectId=${encodeURIComponent(input.projectId)}`,
      detail:
        quoteRelation === "SECTION_SPECIFIC" && quote && section
          ? [
              `Section du devis multi-lots ${quote.number}`,
              quotePreparationStateLabel(quote.status),
            ]
              .filter(Boolean)
              .join(" · ")
          : quote
            ? [
                isMultiLotQuote ? "Devis multi-lots" : null,
                quotePreparationStateLabel(quote.status),
                quoteRelation === "SECTION_SPECIFIC" ? null : quoteTotalHt,
                quotesCount > 1
                  ? `réf. · +${quotesCount - 1} autre${quotesCount - 1 > 1 ? "s" : ""}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ") || null
            : "À générer",
      syncState: devisSync,
      statusLabel: quote
        ? devisSync === "MODIFICATION_DISPONIBLE" || devisSync === "A_VERIFIER"
          ? statusLabelFromSync(devisSync, "devis")
          : cardStatusFromQuote(quote.status)
        : statusLabelFromSync(devisSync, "devis"),
      actionLabel: quote
        ? devisSync === "MODIFICATION_DISPONIBLE"
          ? "Revalider"
          : quoteWorkflowActionLabel(quote.status)
        : "Générer un devis",
      ready: isQuotePreparationReady(quote?.status),
      syncHint:
        devisHint ??
        (quoteRelation === "SECTION_SPECIFIC"
          ? "Montant = total de la section du lot — le devis multi-lots reste unique."
          : quotesCount > 1
            ? `${quotesCount} devis sur ce lot — ${quote?.number ?? "—"} en référence`
            : null),
      isReference: !!(quote && input.refs.quoteId === quote.id),
      relation: quoteRelation,
      relationLabel: relationBadgeLabel(quoteRelation),
      secondaryDetail:
        quoteRelation === "SECTION_SPECIFIC" && quoteTotalHt
          ? `Total du devis ${quote?.number ?? ""} : ${quoteTotalHt}`
          : null,
    },
    {
      kind: "planning",
      label:
        planRelation === "GLOBAL_FALLBACK"
          ? "Planning · Global chantier"
          : "Planning",
      title:
        planRelation === "GLOBAL_FALLBACK"
          ? "Planning global du chantier"
          : plan
            ? planningDisplayTitle(plan)
            : "Non créé",
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
      actionLabel: plan ? "Ouvrir" : "Générer le planning chantier",
      ready: !!plan,
      syncHint:
        planRelation === "GLOBAL_FALLBACK"
          ? "Aucun planning spécifique n’est rattaché à ce lot."
          : planningHint ?? "Un seul planning pour tout le chantier.",
      isReference: !!(plan && input.refs.planId === plan.id),
      relation: planRelation,
      relationLabel: relationBadgeLabel(planRelation),
      secondaryDetail:
        planRelation === "GLOBAL_FALLBACK"
          ? "Ouverture du planning chantier (pas un planning du lot)."
          : null,
    },
    {
      kind: "suivi",
      label: "Suivi du lot",
      title:
        suiviRelation === "ABSENT"
          ? "Aucun suivi spécifique"
          : "Aucun suivi spécifique",
      href: globalFollowUp
        ? `/dashboard/fiches-suivi/${globalFollowUp.id}`
        : `/dashboard/projets/${input.projectId}`,
      detail: null,
      syncState: "ABSENT",
      statusLabel: "À préparer",
      actionLabel: globalFollowUp ? "Voir le suivi chantier" : "Retour chantier",
      ready: false,
      syncHint: null,
      isReference: false,
      relation: suiviRelation,
      relationLabel: null,
      secondaryDetail: globalFollowUp
        ? `Suivi global du chantier : ${followUpStatusLabel ?? globalFollowUp.status}`
        : "Aucun suivi chantier démarré.",
    },
  ];

  return { cards, alerts };
}

async function getProjectWorkspaceUncached(
  orgId: string,
  projectId: string,
  hasResponsible = true,
): Promise<ProjectWorkspace | null> {
  const t0 = Date.now();
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    select: {
      id: true,
      title: true,
      chantierStatus: true,
      siteAddress: true,
      siteCity: true,
    },
  });
  if (!project) return null;

  // Vague 1 — lectures indépendantes (plus de cascade scopes→studies→quotes→plans)
  const [scopes, studies, plans, followUpSheets, siteDocs, visitsByProject] =
    await Promise.all([
      prisma.projectScope.findMany({
        where: { projectId, organizationId: orgId, status: "ACTIVE" },
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      }),
      prisma.prepStudy.findMany({
        where: { projectId, organizationId: orgId, archivedAt: null },
        select: {
          id: true,
          title: true,
          version: true,
          scopeId: true,
          sourcesJson: true,
          dossierStatus: true,
          _count: { select: { lines: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.prepSchedulePlan.findMany({
        where: { projectId, organizationId: orgId },
        select: {
          id: true,
          studyId: true,
          scopeId: true,
          title: true,
          revisionKind: true,
          status: true,
          revisionNumber: true,
          startDate: true,
          endDateBase: true,
          studyVersionAtGeneration: true,
          createdAt: true,
        },
        orderBy: [
          { revisionNumber: "desc" },
          { createdAt: "desc" },
        ],
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
      prisma.siteVisit.findMany({
        where: { organizationId: orgId, projectId },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          subject: true,
          status: true,
          projectId: true,
          commercialQuoteId: true,
        },
      }),
    ]);

  const studyIds = studies.map((s) => s.id);
  const quotes = await prisma.commercialQuote.findMany({
    where: {
      organizationId: orgId,
      OR: [
        { projectId },
        ...(studyIds.length ? [{ sourcePrepStudyId: { in: studyIds } }] : []),
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
      status: true,
      currentVersionId: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const quoteIdsForProv = quotes.map((q) => q.id);
  const versionIdsForSections = [
    ...new Set(
      quotes
        .map((q) => q.currentVersionId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const [quoteTransfers, quoteLinks, takeoffQtyRows, quoteSectionsRaw] =
    await Promise.all([
    quoteIdsForProv.length
      ? prisma.prepQuoteTransfer.findMany({
          where: { organizationId: orgId, quoteId: { in: quoteIdsForProv } },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            quoteId: true,
            studyId: true,
            studyVersion: true,
          },
        })
      : Promise.resolve([]),
    quoteIdsForProv.length
      ? prisma.prepQuoteLink.findMany({
          where: { organizationId: orgId, quoteId: { in: quoteIdsForProv } },
          select: {
            quoteId: true,
            studyId: true,
            studyLineCode: true,
            quantityAtTransfer: true,
          },
        })
      : Promise.resolve([]),
    prisma.prepTakeoffLine.findMany({
      where: {
        organizationId: orgId,
        studyId: { in: studyIds.length ? studyIds : ["__none__"] },
      },
      select: {
        studyId: true,
        code: true,
        validatedQuantity: true,
        computedQuantity: true,
        declaredQuantity: true,
      },
    }),
    versionIdsForSections.length
      ? prisma.commercialQuoteSection.findMany({
          where: {
            organizationId: orgId,
            versionId: { in: versionIdsForSections },
          },
          select: {
            id: true,
            versionId: true,
            title: true,
            sortOrder: true,
            lines: {
              select: {
                lineSellHt: true,
                isOptional: true,
                kind: true,
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        })
      : Promise.resolve([]),
  ]);

  /** quoteId → sections avec totaux HT (batch, pas de N+1). */
  const sectionsByQuoteId = new Map<string, QuoteSectionAmount[]>();
  {
    const versionToQuoteId = new Map<string, string>();
    for (const q of quotes) {
      if (q.currentVersionId) versionToQuoteId.set(q.currentVersionId, q.id);
    }
    for (const sec of quoteSectionsRaw) {
      const quoteId = versionToQuoteId.get(sec.versionId);
      if (!quoteId) continue;
      const list = sectionsByQuoteId.get(quoteId) ?? [];
      list.push({
        sectionId: sec.id,
        title: sec.title,
        sortOrder: sec.sortOrder,
        totalSellHt: sumSectionSellHt(sec.lines),
        lineCount: sec.lines.length,
      });
      sectionsByQuoteId.set(quoteId, list);
    }
  }

  const latestTransferByQuoteId = new Map<
    string,
    (typeof quoteTransfers)[number]
  >();
  for (const t of quoteTransfers) {
    if (!latestTransferByQuoteId.has(t.quoteId)) {
      latestTransferByQuoteId.set(t.quoteId, t);
    }
  }

  const qtyByStudyCode = new Map<string, number | null>();
  for (const row of takeoffQtyRows) {
    const raw =
      row.validatedQuantity ?? row.computedQuantity ?? row.declaredQuantity;
    qtyByStudyCode.set(
      `${row.studyId}:${row.code}`,
      raw != null ? Number(raw) : null,
    );
  }

  const studyById = (id: string | null | undefined) =>
    id ? studies.find((s) => s.id === id) ?? null : null;
  const planById = (id: string | null | undefined) =>
    id ? plans.find((p) => p.id === id) ?? null : null;

  function quoteMetreProvenanceFor(quoteId: string | null | undefined): {
    hasMetreProvenance: boolean;
    linkedStudyVersion: number | null;
    transferStudyVersion: number | null;
    hasSignificantQuantityDiffs: boolean | null;
  } {
    if (!quoteId) {
      return {
        hasMetreProvenance: false,
        linkedStudyVersion: null,
        transferStudyVersion: null,
        hasSignificantQuantityDiffs: null,
      };
    }
    const transfer = latestTransferByQuoteId.get(quoteId) ?? null;
    const links = quoteLinks.filter((l) => l.quoteId === quoteId);
    const hasMetreProvenance = !!transfer || links.length > 0;
    const studyId =
      transfer?.studyId ??
      links[0]?.studyId ??
      quotes.find((q) => q.id === quoteId)?.sourcePrepStudyId ??
      null;
    const linkedStudyVersion = studyId
      ? studyById(studyId)?.version ?? null
      : null;
    let hasSignificantQuantityDiffs: boolean | null = null;
    if (links.length > 0) {
      hasSignificantQuantityDiffs = links.some((l) =>
        hasQuantityDiffAgainstTransfer({
          quantityAtTransfer:
            l.quantityAtTransfer != null ? Number(l.quantityAtTransfer) : null,
          currentQuantity: qtyByStudyCode.get(`${l.studyId}:${l.studyLineCode}`),
        }),
      );
    }
    return {
      hasMetreProvenance,
      linkedStudyVersion,
      transferStudyVersion: transfer?.studyVersion ?? null,
      hasSignificantQuantityDiffs,
    };
  }

  const planSourceByStudyId = new Map<
    string,
    Awaited<ReturnType<typeof resolvePrepPlanSource>>
  >();
  await Promise.all(
    studies.map(async (s) => {
      planSourceByStudyId.set(
        s.id,
        await resolvePrepPlanSource({
          projectId,
          sourcesJson: s.sourcesJson,
        }),
      );
    }),
  );

  // Lecture robuste centralisée (CAS global + scopé) — aucune mutation.

  // Remonter via les tableaux Prisma (titre, version, dates…) — pas le type StudyLike/PlanLike.
  const globalStudy = studyById(
    resolvePrepStudyForWorkspace({ studies, scopes })?.id,
  );
  const globalPlan = planById(
    resolvePrepSchedulePlanForWorkspace({
      plans,
      scopes,
      study: globalStudy,
    })?.id,
  );

  const referencedQuoteIds = new Set(
    scopes.map((s) => s.referenceQuoteId).filter((id): id is string => Boolean(id)),
  );
  const globalQuote =
    quotes.find((q) => q.id === scopes[0]?.referenceQuoteId) ??
    quotes.find((q) => referencedQuoteIds.has(q.id)) ??
    quotes.find((q) => q.projectId === projectId) ??
    (globalStudy
      ? quotes.find((q) => q.sourcePrepStudyId === globalStudy.id)
      : null) ??
    quotes[0] ??
    null;

  const quoteIds = quotes.map((q) => q.id);
  // Visites liées au devis (complément si pas déjà liées au projet)
  const linkedVisits =
    quoteIds.length === 0
      ? visitsByProject
      : await (async () => {
          const extra = await prisma.siteVisit.findMany({
            where: {
              organizationId: orgId,
              projectId: null,
              commercialQuoteId: { in: quoteIds },
            },
            orderBy: { updatedAt: "desc" },
            take: 5,
            select: {
              id: true,
              subject: true,
              status: true,
              projectId: true,
              commercialQuoteId: true,
            },
          });
          const seen = new Set(visitsByProject.map((v) => v.id));
          return [
            ...visitsByProject,
            ...extra.filter((v) => !seen.has(v.id)),
          ].slice(0, 5);
        })();

  if (process.env.BEWORK_PERF_LOG === "1" || process.env.NODE_ENV === "development") {
    console.info(`[PROJECT PERF] getProjectWorkspace: ${Date.now() - t0}ms`);
  }

  const visit = linkedVisits[0] ?? null;
  let suggestedVisitId: string | null = null;
  let addressCandidates: Array<{
    id: string;
    status: string;
    projectId: string | null;
    commercialQuoteId: string | null;
    subject: string | null;
    clientNeed: string | null;
    siteAddress: string | null;
  }> = [];
  if (!visit) {
    const searchBits = extractVisitSearchBits({
      title: project.title,
      siteAddress: project.siteAddress,
      siteCity: project.siteCity,
    });
    if (searchBits.length > 0) {
      addressCandidates = await prisma.siteVisit.findMany({
        where: {
          organizationId: orgId,
          projectId: null,
          OR: searchBits.flatMap((b) => [
            { subject: { contains: b, mode: "insensitive" as const } },
            { clientNeed: { contains: b, mode: "insensitive" as const } },
            { siteAddress: { contains: b, mode: "insensitive" as const } },
            { siteName: { contains: b, mode: "insensitive" as const } },
          ]),
        },
        orderBy: { updatedAt: "desc" },
        take: 12,
        select: {
          id: true,
          status: true,
          projectId: true,
          commercialQuoteId: true,
          subject: true,
          clientNeed: true,
          siteAddress: true,
        },
      });
    }
  }

  const preparation = buildPreparationSnapshot({
    projectId,
    title: project.title,
    siteAddress: project.siteAddress,
    siteCity: project.siteCity,
    chantierStatus: project.chantierStatus,
    hasResponsible,
    visits: [
      ...linkedVisits.map((v) => ({
        id: v.id,
        status: v.status,
        projectId: v.projectId,
        commercialQuoteId: v.commercialQuoteId,
        siteAddress: null,
        subject: v.subject,
        clientNeed: null,
      })),
      ...addressCandidates,
    ],
    studies: studies.map((s) => ({
      id: s.id,
      scopeId: s.scopeId,
      sourcesJson: s.sourcesJson,
      dossierStatus: s.dossierStatus,
      lineCount: s._count.lines,
      version: s.version,
    })),
    scopes,
    quotes,
    plans: plans.map((p) => ({
      id: p.id,
      studyId: p.studyId,
      scopeId: p.scopeId,
      status: p.status,
      revisionKind: p.revisionKind,
      studyVersionAtGeneration: p.studyVersionAtGeneration,
      startDateLabel: p.startDate
        ? fmtShortFr(asIso(p.startDate))
        : null,
    })),
    followUps: followUpSheets.map((f) => ({
      id: f.id,
      status: f.status,
      title: f.title,
    })),
    reports: siteDocs
      .filter((d) => d.kind === "COMPTE_RENDU")
      .map((d) => ({
        id: d.id,
        kind: d.kind,
        status: d.status,
        number: d.number,
        title: d.title,
      })),
    notices: siteDocs
      .filter((d) => d.kind === "NOTICE")
      .map((d) => ({
        id: d.id,
        kind: d.kind,
        status: d.status,
        number: d.number,
        title: d.title,
      })),
    studyVersionById: Object.fromEntries(
      studies.map((s) => [s.id, s.version as number | null]),
    ),
    quoteSyncByQuoteId: Object.fromEntries(
      quotes.map((q) => {
        const prov = quoteMetreProvenanceFor(q.id);
        return [
          q.id,
          {
            quoteId: q.id,
            hasMetreProvenance: prov.hasMetreProvenance,
            currentStudyVersion: prov.linkedStudyVersion,
            transferStudyVersion: prov.transferStudyVersion,
            hasSignificantQuantityDiffs: prov.hasSignificantQuantityDiffs,
          },
        ];
      }),
    ),
  });
  const prepState = preparation.preparation;
  const visitView = preparation.modules.find((m) => m.key === "visite");
  const resolvedVisitId = visit?.id ?? preparation.visitId;
  if (!visit) suggestedVisitId = preparation.visitId;

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
    globalPlan
      ? `/dashboard/visites-metres/etudes/${globalPlan.studyId}/planning/${globalPlan.id}`
      : null;

  const globalQuoteProv = quoteMetreProvenanceFor(globalQuote?.id);
  const globalCore = evaluateCorePreparationTriple({
    study: globalStudy
      ? {
          id: globalStudy.id,
          dossierStatus: globalStudy.dossierStatus,
          lineCount: globalStudy._count.lines,
          version: globalStudy.version,
        }
      : null,
    quote: globalQuote
      ? { id: globalQuote.id, status: globalQuote.status }
      : null,
    quoteSync: {
      hasMetreProvenance: globalQuoteProv.hasMetreProvenance,
      currentStudyVersion: globalQuoteProv.linkedStudyVersion,
      transferStudyVersion: globalQuoteProv.transferStudyVersion,
      hasSignificantQuantityDiffs: globalQuoteProv.hasSignificantQuantityDiffs,
    },
    plan: globalPlan
      ? {
          id: globalPlan.id,
          status: globalPlan.status,
          studyId: globalPlan.studyId,
          studyVersionAtGeneration: globalPlan.studyVersionAtGeneration,
          startDateLabel: globalPlan.startDate
            ? fmtShortFr(asIso(globalPlan.startDate))
            : null,
        }
      : null,
    planStudyVersion: globalPlan
      ? studyById(globalPlan.studyId)?.version ?? null
      : null,
  });

  const globalMetreCard: WorkspaceCard = {
    kind: "metre",
    label: "Métré & quantitatif",
    title: globalStudy?.title ?? "Non créé",
    href: globalStudy
      ? `/dashboard/visites-metres/etudes/${globalStudy.id}`
      : null,
    detail: globalStudy
      ? [
          `Version ${globalStudy.version}`,
          globalCore.metre.displayLabel,
        ]
          .filter(Boolean)
          .join(" · ")
      : globalQuote
        ? "Générer depuis la visite et/ou le devis — sans nouvelle visite"
        : "Un devis est requis avant de générer le métré",
    syncState: globalStudy ? "A_JOUR" : "ABSENT",
    statusLabel: globalCore.metre.exists
      ? (globalCore.metre.kind === "VALIDATED"
          ? "À jour"
          : globalCore.metre.kind === "NEEDS_VALIDATION"
            ? "À valider"
            : "En cours")
      : "À préparer",
    actionLabel: globalStudy ? "Ouvrir" : "Générer le métré",
    ready: prepState.takeoff.countsAsCompleted,
    syncHint: null,
    isReference: true,
  };

  const devisReady = prepState.quote.countsAsCompleted;
  const devisAmount = globalQuote ? euro(d(globalQuote.totalSellHt)) : null;
  const globalDevisEval = {
    syncState: globalCore.devis.syncState,
    hint:
      globalCore.devis.needsRevalidation ||
      globalCore.devis.syncState === "A_VERIFIER"
        ? evaluateQuoteStudySyncState({
            hasQuote: !!globalQuote,
            hasMetreProvenance: globalQuoteProv.hasMetreProvenance,
            currentStudyVersion: globalQuoteProv.linkedStudyVersion,
            transferStudyVersion: globalQuoteProv.transferStudyVersion,
            hasSignificantQuantityDiffs:
              globalQuoteProv.hasSignificantQuantityDiffs,
          }).hint
        : null,
  };

  const globalDevisCard: WorkspaceCard = {
    kind: "devis",
    label: "Devis global",
    title: globalQuote?.number ?? "Non créé",
    href: globalQuote
      ? quoteEditorHref(globalQuote.id, globalQuote.status)
      : globalStudy
        ? null
        : `/dashboard/devis-facturation/devis/nouveau?projectId=${encodeURIComponent(projectId)}`,
    detail: globalQuote
      ? [globalCore.devis.displayLabel, devisAmount]
          .filter(Boolean)
          .join(" · ")
      : globalStudy
        ? "Métré disponible — préparez le devis avec ChatGPT"
        : "Métré requis avant le devis",
    syncState: globalCore.devis.syncState,
    statusLabel: globalQuote
      ? (globalCore.devis.displayLabel as CardStatusLabel)
      : "À préparer",
    actionLabel: globalQuote
      ? globalCore.devis.needsRevalidation
        ? "Revalider"
        : quoteWorkflowActionLabel(globalQuote.status)
      : globalStudy
        ? "Préparer avec ChatGPT"
        : "Métré requis",
    ready: devisReady,
    syncHint: globalDevisEval.hint,
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
          globalCore.planning.displayLabel,
          globalCore.planning.secondaryLabel,
          globalPlan.endDateBase
            ? `→ ${fmtShortFr(asIso(globalPlan.endDateBase))}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : globalStudy
        ? "Métré disponible — préparez le planning avec ChatGPT (devis facultatif)"
        : globalQuote
          ? "Générez d’abord le métré"
          : "À préparer",
    syncState: globalCore.planning.syncState,
    statusLabel: globalCore.planning.exists
      ? (globalCore.planning.displayLabel as CardStatusLabel)
      : "À préparer",
    actionLabel: globalPlan
      ? globalCore.planning.needsUpdate
        ? "Mettre à jour avec ChatGPT"
        : "Ouvrir"
      : globalStudy
        ? "Préparer avec ChatGPT"
        : "Métré requis",
    ready: prepState.planning.countsAsCompleted,
    syncHint:
      globalCore.planning.needsUpdate ||
      globalCore.planning.syncState === "A_VERIFIER"
        ? evaluatePlanningStudyVersionSync({
            hasPlan: !!globalPlan,
            currentStudyVersion: globalPlan
              ? studyById(globalPlan.studyId)?.version ?? null
              : null,
            studyVersionAtGeneration: globalPlan?.studyVersionAtGeneration,
          }).hint
        : "Un seul planning pour tout le chantier — les lots sont des phases.",
    isReference: true,
  };

  const visitsListHref = `/dashboard/visites-metres?projectId=${encodeURIComponent(projectId)}`;
  const documentsChantierHref = `/dashboard/projets/${projectId}/documents-chantier`;

  const workflow: ChantierWorkflowStep[] = [
    {
      id: "visite",
      label: "Visite",
      title: prepState.visit.displayLabel,
      detail:
        prepState.visit.kind === "NOT_APPLICABLE"
          ? "La visite terrain n’est pas une étape de ce dossier"
          : visit
            ? prepState.visit.displayLabel
            : resolvedVisitId
              ? prepState.visit.displayLabel
              : "Aucune visite terrain liée",
      href: resolvedVisitId
        ? `/dashboard/visites-metres/${resolvedVisitId}`
        : visitsListHref,
      ready: prepState.visit.countsAsCompleted || !prepState.visit.applicable,
      actionLabel: resolvedVisitId
        ? visit
          ? "Ouvrir"
          : "Ouvrir la visite"
        : "Ouvrir les visites",
      primaryAction: "open",
    },
    {
      id: "metre",
      label: "Métré & quantitatif",
      title: globalStudy
        ? globalMetreCard.title
        : "À préparer",
      detail: globalStudy
        ? globalMetreCard.detail
        : resolvedVisitId || visit
          ? "Visite disponible — préparez le métré avec ChatGPT (plan facultatif)"
          : "Saisissez une visite, puis préparez le métré avec ChatGPT",
      href: globalMetreCard.href,
      ready: prepState.takeoff.countsAsCompleted,
      actionLabel: globalStudy
        ? "Ouvrir"
        : "Préparer avec ChatGPT",
      primaryAction: globalStudy ? "open" : "prepare_takeoff_chatgpt",
    },
    {
      id: "devis",
      label: "Devis",
      title: globalQuote
        ? globalDevisCard.title
        : "À préparer",
      detail: globalDevisCard.detail,
      href: globalDevisCard.href,
      ready: prepState.quote.countsAsCompleted,
      actionLabel: globalQuote
        ? "Ouvrir"
        : globalStudy
          ? "Préparer avec ChatGPT"
          : "Métré requis",
      primaryAction: globalQuote
        ? "open"
        : globalStudy
          ? "prepare_quote_chatgpt"
          : "open",
    },
    {
      id: "planning",
      label: "Planning chantier",
      title: globalPlan
        ? globalPlanningCard.title
        : "À préparer",
      detail: globalPlanningCard.detail,
      href: globalPlan ? globalPlanningCard.href : null,
      ready: prepState.planning.countsAsCompleted,
      actionLabel: globalPlan
        ? globalCore.planning.needsUpdate
          ? "Mettre à jour avec ChatGPT"
          : "Ouvrir"
        : globalStudy
          ? "Préparer avec ChatGPT"
          : "Métré requis",
      primaryAction: globalPlan
        ? "open"
        : globalStudy
          ? "prepare_planning_chatgpt"
          : "open",
    },
    {
      id: "suivi",
      label: "Suivi chantier",
      title: followUp?.title ?? (globalPlan ? "À créer depuis le planning" : "Non créé"),
      detail: followUp
        ? `Lié au planning · ${prepState.followUp.displayLabel}`
        : globalPlan
          ? "Créer le suivi depuis les tâches du planning global"
          : "Générez d’abord le planning global",
      href:
        followUp || globalPlan
          ? suiviHref
          : globalPlanningCard.href ??
            globalMetreCard.href ??
            `/dashboard/projets/${projectId}`,
      ready: prepState.followUp.countsAsCompleted,
      actionLabel: followUp ? "Ouvrir" : globalPlan ? "Créer le suivi" : "Planning requis",
      primaryAction: followUp
        ? "open"
        : globalPlan
          ? "create_follow_up"
          : "open",
    },
    {
      id: "compte_rendu",
      label: "Compte rendu",
      title: compteRendu ? `${compteRendu.number} — ${compteRendu.title}` : "Non créé",
      detail: compteRendu
        ? prepState.report.displayLabel
        : "Ouvrir les documents chantier pour générer le compte rendu",
      href: compteRendu
        ? `/dashboard/projets/${projectId}/documents-chantier/${compteRendu.id}`
        : documentsChantierHref,
      ready: prepState.report.countsAsCompleted,
      actionLabel: compteRendu ? "Ouvrir" : "Générer",
      primaryAction: "open",
    },
    {
      id: "notice",
      label: "Notice explicative",
      title: noticeDoc
        ? `${noticeDoc.number} — ${noticeDoc.title}`
        : "Non créée",
      detail: noticeDoc
        ? prepState.notice.displayLabel
        : "Ouvrir les documents chantier pour générer la notice",
      href: noticeDoc
        ? `/dashboard/projets/${projectId}/documents-chantier/${noticeDoc.id}`
        : documentsChantierHref,
      ready: prepState.notice.countsAsCompleted,
      actionLabel: noticeDoc ? "Ouvrir" : "Générer",
      primaryAction: "open",
    },
  ];

  const globalPlanSourceResolved = globalStudy
    ? planSourceByStudyId.get(globalStudy.id) ?? null
    : null;
  const globalPlanSourceFile = globalPlanSourceResolved?.file ?? null;
  const globalPlanSourceLink: ProjectPlanSourceLink | null =
    globalPlanSourceFile && !globalPlanSourceResolved?.fileMissing
      ? {
          fileName: globalPlanSourceFile.name,
          title:
            globalPlanSourceResolved?.displayTitle ??
            globalPlanSourceFile.name,
          href: `/dashboard/projets/${projectId}/plan-source?studyId=${encodeURIComponent(globalStudy?.id ?? "")}&fileId=${encodeURIComponent(globalPlanSourceFile.id)}`,
          studyId: globalStudy?.id ?? null,
          chantierFileId: globalPlanSourceFile.id,
        }
      : null;

  const scopeWorkspaces: ScopeWorkspace[] = scopes.map((scope) => {
    const scopeStudies = studies.filter((s) => s.scopeId === scope.id);
    const studyFromScope =
      scopeStudies.find((s) => s.id === scope.referenceStudyId) ??
      studyById(scope.referenceStudyId) ??
      scopeStudies[0] ??
      null;
    const studyIsGlobalFallback = !studyFromScope;
    const refStudy =
      studyFromScope ??
      // Fallback lecture : même métré chantier affiché depuis le lot (sans duplication).
      (studies.length === 1 ? studies[0]! : null) ??
      globalStudy;

    const scopeQuotes = quotes.filter(
      (q) =>
        q.scopeId === scope.id ||
        q.id === scope.referenceQuoteId ||
        (refStudy != null && q.sourcePrepStudyId === refStudy.id),
    );
    const refQuote =
      scopeQuotes.find((q) => q.id === scope.referenceQuoteId) ??
      scopeQuotes[0] ??
      globalQuote ??
      null;

    const quoteSection =
      refQuote != null
        ? matchQuoteSectionForScope(
            {
              name: scope.name,
              code: scope.code,
              description: scope.description,
            },
            sectionsByQuoteId.get(refQuote.id) ?? [],
          )
        : null;

    // Helper canonique : CURRENT > non archivé > revisionNumber > createdAt.
    // Ne jamais préférer referenceSchedulePlanId s’il pointe vers un ARCHIVED.
    const refPlan =
      resolveSchedulePlanForScope({
        plans,
        scope,
        studyId: refStudy?.id ?? null,
      }) ??
      (refStudy && globalPlan && globalPlan.studyId === refStudy.id
        ? globalPlan
        : null) ??
      null;

    const { cards, alerts } = buildScopeCards({
      projectId,
      scopeId: scope.id,
      scopeName: scope.name,
      study: refStudy,
      studyIsGlobalFallback:
        studyIsGlobalFallback ||
        (refStudy != null && refStudy.scopeId !== scope.id),
      quote: refQuote,
      quotesCount: Math.max(scopeQuotes.length, refQuote ? 1 : 0),
      quoteSection,
      plan: refPlan,
      planLinkedStudyVersion: refPlan
        ? studyById(refPlan.studyId)?.version ?? null
        : null,
      quoteMetreProvenance: quoteMetreProvenanceFor(refQuote?.id),
      planSource: refStudy
        ? planSourceByStudyId.get(refStudy.id) ?? null
        : null,
      refs: {
        studyId: scope.referenceStudyId,
        quoteId: scope.referenceQuoteId,
        // Affichage « référence » = plan réellement résolu (CURRENT), pas le pointeur stale.
        planId: refPlan?.id ?? scope.referenceSchedulePlanId,
      },
      fallbackStudyId: globalStudy?.id ?? null,
      fallbackPlanHref: globalPlanHref,
      globalFollowUp: followUp,
    });
    const ready = cards.filter((c) => c.ready).length;

    return {
      id: scope.id,
      code: scope.code,
      name: scope.name,
      description: scope.description,
      status: scope.status,
      displayOrder: scope.displayOrder,
      href: `/dashboard/projets/${projectId}/preparation/${scope.id}`,
      cards,
      alerts: [
        ...alerts,
        {
          level: "info" as const,
          message:
            "Vue du lot dans le dossier chantier — les éléments globaux sont signalés comme tels.",
        },
      ],
      progress: { ready, total: Math.max(cards.length, 1) },
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
      planSource: globalPlanSourceLink,
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
      preparationState: prepState,
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

/** Dedupée dans le même rendu React (layout + page / Suspense). */
export const getProjectWorkspace = cache(getProjectWorkspaceUncached);

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
      // CURRENT canonique du study — jamais ARCHIVED / jamais « dernier créé ».
      const planCandidates = await tx.prepSchedulePlan.findMany({
        where: {
          studyId: study.id,
          organizationId: input.orgId,
          status: { not: "ARCHIVED" },
        },
        select: {
          id: true,
          studyId: true,
          scopeId: true,
          status: true,
          revisionKind: true,
          revisionNumber: true,
          createdAt: true,
        },
      });
      const plan =
        resolveCurrentSchedulePlan(
          planCandidates.filter(
            (p) => p.scopeId === scope.id || p.scopeId == null,
          ),
        ) ?? resolveCurrentSchedulePlan(planCandidates);
      await tx.projectScope.update({
        where: { id: scope.id },
        data: {
          referenceStudyId: study.id,
          referenceQuoteId: quote?.id ?? scope.referenceQuoteId,
          // Baseline uniquement si plan actif cohérent.
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
    select: { id: true, studyId: true, status: true },
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
    // Baseline : jamais pointer une référence vers ARCHIVED.
    if (
      !scope.referenceSchedulePlanId &&
      (plan.status ?? "").toUpperCase() !== "ARCHIVED"
    ) {
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
