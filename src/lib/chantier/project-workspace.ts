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

export type ProjectWorkspace = {
  projectId: string;
  title: string;
  chantierStatus: string;
  href: string;
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
}): { cards: WorkspaceCard[]; alerts: ScopeWorkspace["alerts"] } {
  const alerts: ScopeWorkspace["alerts"] = [];
  const study = input.study;
  const quote = input.quote;
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
  if (!study) {
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
      title: study?.title ?? "Non créé",
      href: study
        ? `/dashboard/visites-metres/etudes/${study.id}`
        : `/dashboard/visites-metres/nouveau?projectId=${encodeURIComponent(input.projectId)}`,
      detail: study
        ? [
            `Version ${study.version}`,
            study._count.lines > 0
              ? `${study._count.lines} quantité${study._count.lines > 1 ? "s" : ""}`
              : null,
          ]
            .filter(Boolean)
            .join(" · ")
        : "À créer ou importer",
      syncState: metreSync,
      statusLabel: statusLabelFromSync(metreSync, "metre"),
      actionLabel: study ? "Ouvrir" : "Créer / importer un métré",
      ready: !!study,
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
        plan && study
          ? `/dashboard/visites-metres/etudes/${plan.studyId}/planning/${plan.id}`
          : study
            ? `/dashboard/visites-metres/etudes/${study.id}`
            : null,
      detail: plan ? planningDetail : "À générer",
      syncState: planningSync,
      statusLabel: statusLabelFromSync(planningSync, "planning"),
      actionLabel: plan ? "Ouvrir" : "Générer un planning",
      ready: !!plan && planningSync === "A_JOUR",
      syncHint: planningHint,
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

  const scopeWorkspaces: ScopeWorkspace[] = scopes.map((scope) => {
    const scopeStudies = studies.filter((s) => s.scopeId === scope.id);
    const refStudy =
      scopeStudies.find((s) => s.id === scope.referenceStudyId) ??
      scopeStudies[0] ??
      null;

    const scopeQuotes = quotes.filter(
      (q) =>
        q.scopeId === scope.id ||
        q.id === scope.referenceQuoteId ||
        (refStudy != null && q.sourcePrepStudyId === refStudy.id),
    );
    const refQuote =
      scopeQuotes.find((q) => q.id === scope.referenceQuoteId) ??
      scopeQuotes[0] ??
      null;

    const scopePlans = plans.filter(
      (p) =>
        p.scopeId === scope.id ||
        (refStudy && p.studyId === refStudy.id),
    );
    const refPlan =
      scopePlans.find((p) => p.id === scope.referenceSchedulePlanId) ??
      scopePlans[0] ??
      null;

    const { cards, alerts } = buildScopeCards({
      projectId,
      scopeId: scope.id,
      study: refStudy,
      quote: refQuote,
      quotesCount: scopeQuotes.length,
      plan: refPlan,
      planSource: refStudy ? planSourceByStudyId.get(refStudy.id) ?? null : null,
      refs: {
        studyId: scope.referenceStudyId,
        quoteId: scope.referenceQuoteId,
        planId: scope.referenceSchedulePlanId,
      },
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
      alerts,
      progress: { ready, total: cards.length },
    };
  });

  const unscopedStudies = studies.filter((s) => !s.scopeId);
  const unscopedPlans = plans.filter((p) => !p.scopeId);
  const unscopedQuotes = quotes.filter((q) => !q.scopeId);

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
 * Le devis doit déjà appartenir au périmètre (scopeId).
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
  if (quote.scopeId !== scope.id) {
    throw new Error(
      "Le devis de référence doit d’abord être rattaché à ce lot de travaux",
    );
  }

  await prisma.projectScope.update({
    where: { id: scope.id },
    data: { referenceQuoteId: quote.id },
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
  if (input.quote.scopeId && input.quote.scopeId !== input.scope.id) {
    return { ok: false, error: "Membership hors périmètre" };
  }
  if (
    input.scope.referenceQuoteId === input.quote.id &&
    input.quote.scopeId !== input.scope.id
  ) {
    return { ok: false, error: "Référence sans membership" };
  }
  return { ok: true };
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
