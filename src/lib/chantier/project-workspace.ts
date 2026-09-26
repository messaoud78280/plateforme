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

export type WorkspaceCard = {
  kind: "plan" | "metre" | "devis" | "planning" | "suivi";
  label: string;
  title: string;
  href: string | null;
  detail: string | null;
  syncState: SyncState;
  syncHint: string | null;
  isReference: boolean;
  /** Actions / méta spécifiques plan source (optionnel). */
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
  };
};

function asIso(v: Date | string | null | undefined): string | null {
  if (!v) return null;
  if (typeof v === "string") return v.slice(0, 10);
  return v.toISOString().slice(0, 10);
}

function euro(n: number | null): string | null {
  if (n == null) return null;
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € HT`;
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
      message: "Planning à recalculer — le métré a évolué depuis la génération",
    });
  }

  if (study && !quote) {
    alerts.push({ level: "info", message: "Aucun devis de référence — génération possible depuis le métré" });
  }
  if (study && !plan) {
    alerts.push({ level: "info", message: "Aucun planning de référence — génération possible depuis le métré" });
  }
  if (!study) {
    alerts.push({ level: "info", message: "Aucun métré rattaché à ce périmètre" });
  }
  if (primary && fileMissing) {
    alerts.push({
      level: "warning",
      message: "Plan source identifié mais fichier non rattaché — rattachez le PDF dans la GED chantier",
    });
  }

  const rev = planSource?.revisionLabel ?? null;
  const planTitle = planSource
    ? planSource.displayTitle
    : primary
      ? planSourceDisplayTitle(primary)
      : "Aucun plan déclaré";

  const planDetailParts = [
    rev ? `Révision : ${rev}` : null,
    !fileMissing && primary ? "PDF disponible" : null,
    planSource?.file?.documentDate ? `Date ${planSource.file.documentDate}` : null,
    fileMissing && primary ? "Fichier non rattaché" : null,
  ].filter(Boolean);

  const cards: WorkspaceCard[] = [
    {
      kind: "plan",
      label: "Plan source",
      title: planTitle,
      href: openHref
        ? openHref
        : study
          ? `/dashboard/visites-metres/etudes/${study.id}?attachPlan=1`
          : gedHref,
      detail: planDetailParts.join(" · ") || null,
      syncState: !primary ? "ABSENT" : fileMissing ? "A_VERIFIER" : "A_JOUR",
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
      href: study ? `/dashboard/visites-metres/etudes/${study.id}` : null,
      detail: study
        ? `Version ${study.version} · ${study._count.lines} ligne(s)`
        : null,
      syncState: metreSync,
      syncHint: null,
      isReference: !!(study && input.refs.studyId === study.id),
    },
    {
      kind: "devis",
      label: "Devis",
      title: quote?.number ?? "Non créé",
      href: quote ? `/dashboard/devis-facturation/devis/${quote.id}` : null,
      detail: quote
        ? `${euro(d(quote.totalSellHt)) ?? ""}${quote.isDemonstration ? " · démo" : ""}`
        : null,
      syncState: devisSync,
      syncHint: devisHint,
      isReference: !!(quote && input.refs.quoteId === quote.id),
    },
    {
      kind: "planning",
      label: "Planning",
      title: plan
        ? `${plan.revisionKind}${plan.status ? ` · ${plan.status}` : ""}`
        : "Non créé",
      href:
        plan && study
          ? `/dashboard/visites-metres/etudes/${plan.studyId}/planning/${plan.id}`
          : null,
      detail: plan
        ? `${asIso(plan.startDate) ?? "—"} → ${asIso(plan.endDateBase) ?? "—"}`
        : null,
      syncState: planningSync,
      syncHint: planningHint,
      isReference: !!(plan && input.refs.planId === plan.id),
    },
    {
      kind: "suivi",
      label: "Suivi",
      title: "Non démarré",
      href: `/dashboard/projets/${input.projectId}`,
      detail: "Raccordement suivi réel — étapes ultérieures",
      syncState: "ABSENT",
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
      totalSellHt: true,
      isDemonstration: true,
      sourcePrepStudyId: true,
      projectId: true,
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
        q.id === scope.referenceQuoteId ||
        (refStudy && q.sourcePrepStudyId === refStudy.id),
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
      plan: refPlan,
      planSource: refStudy ? planSourceByStudyId.get(refStudy.id) ?? null : null,
      refs: {
        studyId: scope.referenceStudyId,
        quoteId: scope.referenceQuoteId,
        planId: scope.referenceSchedulePlanId,
      },
    });

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
    };
  });

  return {
    projectId: project.id,
    title: project.title,
    chantierStatus: project.chantierStatus,
    href: `/dashboard/projets/${project.id}`,
    scopes: scopeWorkspaces,
    unscoped: {
      studies: studies.filter((s) => !s.scopeId).length,
      schedulePlans: plans.filter((p) => !p.scopeId).length,
      quotes: quotes.filter((q) => {
        const study = studies.find((s) => s.id === q.sourcePrepStudyId);
        return !study?.scopeId;
      }).length,
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
          referenceQuoteId: quote?.id ?? null,
          referenceSchedulePlanId: plan?.id ?? null,
        },
      });
    }
  });
}
