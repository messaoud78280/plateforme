/**
 * buildProjectContext — snapshot chantier canonique, LECTURE SEULE.
 * CTX-01 : aucune écriture, aucun seed, aucun backfill.
 */
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import {
  normalizePrepSources,
  planSourceDisplayTitle,
} from "@/lib/preparation/plan-source";
import { resolveCurrentSchedulePlan } from "@/lib/chantier/resolve-workspace-entities";
import { mapProvenanceKind } from "./provenance";
import { computeVisitContextVersion } from "./visit-context-version";
import {
  PROJECT_CONTEXT_FORMAT,
  PROJECT_CONTEXT_SCHEMA_VERSION,
  type ProjectContextDocument,
  type ProjectContextFileRef,
  type ProjectContextQuote,
  type ProjectContextSnapshot,
  type ProjectContextSource,
  type ProjectContextTakeoff,
  type ProjectContextVisit,
} from "./types";

const VISIT_LIMIT = 50;
const VISIT_MEDIA_LIMIT = 30;
const DOCUMENT_LIMIT = 100;
const FOLLOW_UP_LIMIT = 50;
/** Garde-fou lignes métré / devis (signaler si atteint). */
export const TAKEOFF_LINE_SOFT_LIMIT = 2000;
export const QUOTE_LINE_SOFT_LIMIT = 2000;

function isoDay(v: Date | null | undefined): string | null {
  return v ? v.toISOString().slice(0, 10) : null;
}

function numOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export type BuildProjectContextOptions = {
  /** Si fourni, isole strictement le chantier à cette organisation. */
  organizationId?: string | null;
  /**
   * Inclure les lignes de devis / métré (défaut true).
   * Passer false pour un snapshot léger (métadonnées + relations).
   */
  includeLines?: boolean;
};

export class ProjectContextError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_FOUND" | "ORG_MISMATCH" | "NO_ORG",
  ) {
    super(message);
    this.name = "ProjectContextError";
  }
}

/**
 * Assemble la vérité chantier en lecture seule.
 * Retourne `null` si le chantier est introuvable sous le scope organisation.
 */
export async function buildProjectContext(
  projectId: string,
  organizationId?: string | null,
  options?: Omit<BuildProjectContextOptions, "organizationId">,
): Promise<ProjectContextSnapshot | null> {
  const includeLines = options?.includeLines !== false;

  const project = await prisma.project.findFirst({
    where: organizationId
      ? { id: projectId, organizationId }
      : { id: projectId },
    select: {
      id: true,
      title: true,
      description: true,
      siteAddress: true,
      siteCity: true,
      chantierStatus: true,
      status: true,
      plannedStartDate: true,
      plannedEndDate: true,
      updatedAt: true,
      organizationId: true,
      organization: { select: { id: true, name: true } },
    },
  });

  if (!project) return null;
  if (!project.organizationId || !project.organization) {
    // Isolation multi-org : pas de contexte sans organisation rattachée.
    return null;
  }

  const orgId = project.organizationId;
  if (organizationId && organizationId !== orgId) {
    return null;
  }

  const [
    scopes,
    studies,
    quotes,
    schedules,
    visits,
    followUps,
    siteDocuments,
  ] = await Promise.all([
    prisma.projectScope.findMany({
      where: { projectId, organizationId: orgId },
      orderBy: [{ displayOrder: "asc" }, { code: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        displayOrder: true,
        referenceStudyId: true,
        referenceQuoteId: true,
        referenceSchedulePlanId: true,
      },
    }),
    prisma.prepStudy.findMany({
      where: { projectId, organizationId: orgId, archivedAt: null },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        trade: true,
        mode: true,
        dossierStatus: true,
        version: true,
        scopeId: true,
        sourceFormat: true,
        hypothesesJson: true,
        sourcesJson: true,
        updatedAt: true,
        parameters: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            key: true,
            label: true,
            unit: true,
            value: true,
            formula: true,
            provenance: true,
            note: true,
            sourceRef: true,
            hypothesisId: true,
          },
        },
        ...(includeLines
          ? {
              lines: {
                orderBy: { sortOrder: "asc" as const },
                take: TAKEOFF_LINE_SOFT_LIMIT,
                select: {
                  id: true,
                  code: true,
                  lot: true,
                  designation: true,
                  description: true,
                  unit: true,
                  formula: true,
                  declaredQuantity: true,
                  computedQuantity: true,
                  validatedQuantity: true,
                  provenance: true,
                  role: true,
                  nature: true,
                  notes: true,
                },
              },
            }
          : {}),
      },
    }),
    prisma.commercialQuote.findMany({
      where: { projectId, organizationId: orgId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        number: true,
        subject: true,
        status: true,
        isDemonstration: true,
        scopeId: true,
        sourcePrepStudyId: true,
        totalSellHt: true,
        totalTtc: true,
        updatedAt: true,
        currentVersion: {
          select: {
            versionNumber: true,
            ...(includeLines
              ? {
                  sections: {
                    orderBy: { sortOrder: "asc" as const },
                    select: { id: true, title: true, sortOrder: true },
                  },
                  lines: {
                    orderBy: { sortOrder: "asc" as const },
                    take: QUOTE_LINE_SOFT_LIMIT,
                    select: {
                      id: true,
                      sectionId: true,
                      designation: true,
                      quantity: true,
                      unit: true,
                      unitSellHt: true,
                      lineSellHt: true,
                    },
                  },
                }
              : {}),
          },
        },
        prepQuoteTransfers: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            studyId: true,
            studyVersion: true,
            createdAt: true,
          },
        },
        ...(includeLines
          ? {
              prepQuoteLinks: {
                select: {
                  quoteLineId: true,
                  studyLineCode: true,
                },
              },
            }
          : {}),
      },
    }),
    prisma.prepSchedulePlan.findMany({
      where: { projectId, organizationId: orgId },
      orderBy: [{ revisionNumber: "desc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        status: true,
        revisionKind: true,
        revisionNumber: true,
        studyId: true,
        scopeId: true,
        studyVersionAtGeneration: true,
        startDate: true,
        endDateBase: true,
        baseDurationWorkingDays: true,
        updatedAt: true,
        tasks: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            stepCode: true,
            name: true,
            durationDays: true,
            lot: true,
            startDate: true,
            endDate: true,
            takeoffLinks: {
              select: { studyLineCode: true },
            },
            quoteLinks: {
              select: { quoteLineId: true },
            },
          },
        },
      },
    }),
    prisma.siteVisit.findMany({
      where: { projectId, organizationId: orgId },
      orderBy: { updatedAt: "desc" },
      take: VISIT_LIMIT,
      select: {
        id: true,
        subject: true,
        status: true,
        clientName: true,
        siteAddress: true,
        clientNeed: true,
        comments: true,
        projectId: true,
        commercialQuoteId: true,
        updatedAt: true,
        measurements: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            zone: true,
            label: true,
            measureType: true,
            unit: true,
            lengthM: true,
            widthM: true,
            heightM: true,
            quantityValue: true,
            computedQuantity: true,
            lot: true,
            observation: true,
          },
        },
        medias: {
          orderBy: { createdAt: "desc" },
          take: VISIT_MEDIA_LIMIT,
          select: {
            id: true,
            name: true,
            kind: true,
            category: true,
            observation: true,
            fileUrl: true,
            storagePath: true,
          },
        },
      },
    }),
    prisma.followUpSheet.findMany({
      where: { projectId, organizationId: orgId },
      orderBy: { updatedAt: "desc" },
      take: FOLLOW_UP_LIMIT,
      select: {
        id: true,
        title: true,
        status: true,
        prepSchedulePlanId: true,
        notes: true,
        updatedAt: true,
      },
    }),
    prisma.siteDocument.findMany({
      where: { projectId, organizationId: orgId },
      orderBy: { updatedAt: "desc" },
      take: DOCUMENT_LIMIT,
      select: {
        id: true,
        kind: true,
        title: true,
        number: true,
        status: true,
        versionNumber: true,
        updatedAt: true,
      },
    }),
  ]);

  // Sources : agrégation sourcesJson des études + métadonnées GED (pas de binaire).
  const sourceEntries: Array<{
    studyId: string;
    scopeId: string | null;
    sourcesJson: unknown;
  }> = studies.map((s) => ({
    studyId: s.id,
    scopeId: s.scopeId,
    sourcesJson: s.sourcesJson,
  }));

  const fileIds = new Set<string>();
  for (const entry of sourceEntries) {
    for (const src of normalizePrepSources(entry.sourcesJson)) {
      if (src.chantierFileId) fileIds.add(src.chantierFileId);
    }
  }

  const files =
    fileIds.size > 0
      ? await prisma.chantierFile.findMany({
          where: {
            id: { in: [...fileIds] },
            deletedAt: null,
            OR: [
              { projectId },
              { organizationId: orgId },
            ],
          },
          select: {
            id: true,
            name: true,
            documentType: true,
            mimeType: true,
            status: true,
            indice: true,
            versionLabel: true,
            documentDate: true,
            category: true,
            fileUrl: true,
          },
        })
      : [];

  const fileById = new Map(files.map((f) => [f.id, f]));

  const sources: ProjectContextSource[] = [];
  for (const entry of sourceEntries) {
    for (const src of normalizePrepSources(entry.sourcesJson)) {
      const fileRow = src.chantierFileId
        ? fileById.get(src.chantierFileId) ?? null
        : null;
      const file: ProjectContextFileRef | null = fileRow
        ? {
            id: fileRow.id,
            name: fileRow.name,
            documentType: fileRow.documentType,
            mimeType: fileRow.mimeType,
            status: fileRow.status,
            indice: fileRow.indice,
            versionLabel: fileRow.versionLabel,
            documentDate: isoDay(fileRow.documentDate),
            category: fileRow.category,
            hasUrl: Boolean(fileRow.fileUrl),
            previewHref: `/api/chantier/files/${fileRow.id}/preview`,
          }
        : null;
      sources.push({
        id: src.id,
        studyId: entry.studyId,
        scopeId: entry.scopeId,
        filename: src.filename,
        planNumber: src.planNumber,
        title: src.title,
        revision: src.revision,
        scale: src.scale,
        page: src.page,
        legibility: src.legibility,
        note: src.note,
        chantierFileId: src.chantierFileId,
        file,
        displayTitle: planSourceDisplayTitle(src),
      });
    }
  }

  const sourcesByStudy = new Map<string, ProjectContextSource[]>();
  for (const s of sources) {
    if (!s.studyId) continue;
    const list = sourcesByStudy.get(s.studyId) ?? [];
    list.push(s);
    sourcesByStudy.set(s.studyId, list);
  }

  const referenceQuoteIds = new Set(
    scopes.map((s) => s.referenceQuoteId).filter((id): id is string => !!id),
  );

  const takeoffs: ProjectContextTakeoff[] = studies.map((study) => {
    const lines =
      "lines" in study && Array.isArray(study.lines) ? study.lines : [];
    return {
      id: study.id,
      title: study.title,
      trade: study.trade,
      mode: study.mode,
      dossierStatus: study.dossierStatus,
      version: study.version,
      scopeId: study.scopeId,
      sourceFormat: study.sourceFormat,
      hypothesesJson: study.hypothesesJson ?? null,
      sources: sourcesByStudy.get(study.id) ?? [],
      parameters: study.parameters.map((p) => ({
        id: p.id,
        key: p.key,
        label: p.label,
        unit: p.unit,
        value: numOrNull(p.value),
        formula: p.formula,
        provenance: p.provenance,
        provenanceKind: mapProvenanceKind({
          provenance: p.provenance,
          formula: p.formula,
        }),
        note: p.note,
        sourceRef: "sourceRef" in p ? (p.sourceRef as string | null) : null,
        hypothesisId:
          "hypothesisId" in p ? (p.hypothesisId as string | null) : null,
      })),
      lines: lines.map((l) => {
        const row = l as {
          id: string;
          code: string;
          lot: string;
          designation: string;
          description?: string | null;
          unit: string;
          formula: string | null;
          declaredQuantity: unknown;
          computedQuantity: unknown;
          validatedQuantity: unknown;
          provenance: string | null;
          role: string;
          nature?: string | null;
          notes?: string | null;
        };
        return {
          id: row.id,
          code: row.code,
          lot: row.lot,
          designation: row.designation,
          description: row.description ?? null,
          unit: row.unit,
          formula: row.formula,
          declaredQuantity: numOrNull(row.declaredQuantity),
          computedQuantity: numOrNull(row.computedQuantity),
          validatedQuantity: numOrNull(row.validatedQuantity),
          provenance: row.provenance,
          provenanceKind: mapProvenanceKind({
            provenance: row.provenance,
            formula: row.formula,
          }),
          role: row.role,
          nature: row.nature ?? null,
          notes: row.notes ?? null,
        };
      }),
      updatedAt: study.updatedAt.toISOString(),
    };
  });

  const quoteSnapshots: ProjectContextQuote[] = quotes.map((q) => {
    const linkByLine = new Map(
      "prepQuoteLinks" in q && Array.isArray(q.prepQuoteLinks)
        ? q.prepQuoteLinks.map((l: { quoteLineId: string; studyLineCode: string }) => [
            l.quoteLineId,
            l.studyLineCode,
          ])
        : [],
    );
    const version = q.currentVersion;
    const sectionsRaw =
      version && "sections" in version && Array.isArray(version.sections)
        ? version.sections
        : [];
    const linesRaw =
      version && "lines" in version && Array.isArray(version.lines)
        ? version.lines
        : [];
    const sections = sectionsRaw.map(
      (s: { id: string; title: string; sortOrder: number }) => ({
          id: s.id,
          title: s.title,
          sortOrder: s.sortOrder,
          lines: linesRaw
            .filter(
              (l: { sectionId: string | null }) => l.sectionId === s.id,
            )
            .map(
              (l: {
                id: string;
                sectionId: string | null;
                designation: string;
                quantity: unknown;
                unit: string;
                unitSellHt: unknown;
                lineSellHt: unknown;
              }) => ({
              id: l.id,
              sectionId: l.sectionId,
              designation: l.designation,
              quantity: d(l.quantity),
              unit: l.unit,
              unitSellHt: d(l.unitSellHt),
              lineSellHt: d(l.lineSellHt),
              studyLineCode: linkByLine.get(l.id) ?? null,
            })),
        }),
    );

    const orphans = linesRaw.filter(
      (l: { sectionId: string | null }) => !l.sectionId,
    );
    if (orphans.length > 0) {
      sections.push({
        id: "__without_section__",
        title: "Sans section",
        sortOrder: 9999,
        lines: orphans.map(
          (l: {
            id: string;
            sectionId: string | null;
            designation: string;
            quantity: unknown;
            unit: string;
            unitSellHt: unknown;
            lineSellHt: unknown;
          }) => ({
          id: l.id,
          sectionId: l.sectionId,
          designation: l.designation,
          quantity: d(l.quantity),
          unit: l.unit,
          unitSellHt: d(l.unitSellHt),
          lineSellHt: d(l.lineSellHt),
          studyLineCode: linkByLine.get(l.id) ?? null,
        })),
      });
    }

    const transfer = q.prepQuoteTransfers[0] ?? null;

    return {
      id: q.id,
      number: q.number,
      subject: q.subject,
      status: q.status,
      isDemonstration: q.isDemonstration,
      scopeId: q.scopeId,
      sourcePrepStudyId: q.sourcePrepStudyId,
      versionNumber: version?.versionNumber ?? null,
      totalSellHt: d(q.totalSellHt),
      totalTtc: d(q.totalTtc),
      isScopeReference: referenceQuoteIds.has(q.id),
      transfer: transfer
        ? {
            id: transfer.id,
            studyId: transfer.studyId,
            studyVersion: transfer.studyVersion,
            createdAt: transfer.createdAt.toISOString(),
          }
        : null,
      sections,
      updatedAt: q.updatedAt.toISOString(),
    };
  });

  const visitSnapshots: ProjectContextVisit[] = visits.map((v) => {
    const measurements = v.measurements.map((m) => ({
      id: m.id,
      zone: m.zone,
      label: m.label,
      measureType: m.measureType,
      unit: m.unit,
      lengthM: numOrNull(m.lengthM),
      widthM: numOrNull(m.widthM),
      heightM: numOrNull(m.heightM),
      quantityValue: numOrNull(m.quantityValue),
      computedQuantity: d(m.computedQuantity),
      lot: m.lot,
      observation: m.observation,
    }));
    const mediaRefs = v.medias.map((m) => ({
      id: m.id,
      name: m.name,
      kind: m.kind,
      category: m.category,
      observation: m.observation,
      hasUrl: Boolean(m.fileUrl || m.storagePath),
    }));
    return {
      id: v.id,
      subject: v.subject,
      status: v.status,
      clientName: v.clientName,
      siteAddress: v.siteAddress,
      clientNeed: v.clientNeed,
      comments: v.comments,
      projectId: v.projectId,
      commercialQuoteId: v.commercialQuoteId,
      contextVersion: computeVisitContextVersion({
        id: v.id,
        subject: v.subject,
        status: v.status,
        clientName: v.clientName,
        siteAddress: v.siteAddress,
        clientNeed: v.clientNeed,
        comments: v.comments,
        measurements,
        mediaRefs,
      }),
      updatedAt: v.updatedAt.toISOString(),
      measurements,
      mediaRefs,
    };
  });

  const notices: ProjectContextDocument[] = [];
  const reports: ProjectContextDocument[] = [];
  const other: ProjectContextDocument[] = [];
  for (const doc of siteDocuments) {
    const mapped = {
      id: doc.id,
      kind: doc.kind,
      title: doc.title,
      number: doc.number,
      status: doc.status,
      versionNumber: doc.versionNumber,
      updatedAt: doc.updatedAt.toISOString(),
    };
    if (doc.kind === "NOTICE") notices.push(mapped);
    else if (doc.kind === "COMPTE_RENDU") reports.push(mapped);
    else other.push(mapped);
  }

  return {
    type: PROJECT_CONTEXT_FORMAT,
    schema_version: PROJECT_CONTEXT_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    organization: {
      id: project.organization.id,
      name: project.organization.name,
    },
    project: {
      id: project.id,
      title: project.title,
      description: project.description,
      siteAddress: project.siteAddress,
      siteCity: project.siteCity,
      chantierStatus: project.chantierStatus,
      status: project.status,
      plannedStartDate: isoDay(project.plannedStartDate),
      plannedEndDate: isoDay(project.plannedEndDate),
      updatedAt: project.updatedAt.toISOString(),
    },
    scopes: scopes.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      status: s.status,
      displayOrder: s.displayOrder,
      referenceStudyId: s.referenceStudyId,
      referenceQuoteId: s.referenceQuoteId,
      referenceSchedulePlanId: s.referenceSchedulePlanId,
    })),
    sources,
    visits: visitSnapshots,
    takeoffs,
    quotes: quoteSnapshots,
    schedules: schedules.map((plan) => ({
      id: plan.id,
      title: plan.title,
      status: plan.status,
      revisionKind: plan.revisionKind,
      revisionNumber: plan.revisionNumber,
      studyId: plan.studyId,
      scopeId: plan.scopeId,
      studyVersionAtGeneration: plan.studyVersionAtGeneration,
      startDate: isoDay(plan.startDate),
      endDateBase: isoDay(plan.endDateBase),
      baseDurationWorkingDays: numOrNull(plan.baseDurationWorkingDays),
      tasks: plan.tasks.map((t) => ({
        id: t.id,
        stepCode: t.stepCode,
        name: t.name,
        durationDays: d(t.durationDays),
        lot: t.lot,
        startDate: isoDay(t.startDate),
        endDate: isoDay(t.endDate),
        takeoffLineCodes: t.takeoffLinks.map((l) => l.studyLineCode),
        quoteLineIds: t.quoteLinks.map((l) => l.quoteLineId),
      })),
      updatedAt: plan.updatedAt.toISOString(),
    })),
    followUps: followUps.map((f) => ({
      id: f.id,
      title: f.title,
      status: f.status,
      prepSchedulePlanId: f.prepSchedulePlanId,
      notes: f.notes,
      updatedAt: f.updatedAt.toISOString(),
    })),
    documents: { notices, reports, other },
    versions: {
      takeoffVersions: takeoffs.map((t) => ({
        studyId: t.id,
        version: t.version,
      })),
      quoteVersions: quoteSnapshots.map((q) => ({
        quoteId: q.id,
        versionNumber: q.versionNumber,
      })),
      planRevisions: schedules.map((p) => ({
        planId: p.id,
        revisionNumber: p.revisionNumber,
        studyVersionAtGeneration: p.studyVersionAtGeneration,
      })),
      currentSchedulePlanIds: (() => {
        const byStudy = new Map<string, typeof schedules>();
        for (const p of schedules) {
          const list = byStudy.get(p.studyId) ?? [];
          list.push(p);
          byStudy.set(p.studyId, list);
        }
        const out: Array<{ studyId: string; planId: string }> = [];
        for (const [studyId, list] of byStudy) {
          const current = resolveCurrentSchedulePlan(list);
          if (current) out.push({ studyId, planId: current.id });
        }
        return out;
      })(),
    },
  };
}
