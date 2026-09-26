/**
 * Métré & Préparation — service serveur (études, import, modifications, annulation).
 * Toutes les requêtes sont filtrées par organisation.
 */
import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { parsePrepJsonText, type NormalizedPrepBundle } from "@/lib/preparation/bundle/parse";
import { prepBundleFingerprint } from "@/lib/preparation/bundle/fingerprint";
import { computeStudy, summarizeBases, type EngineResult } from "@/lib/preparation/engine/compute";
import type {
  DossierStatus,
  LineNature,
  LineRole,
  PrepCheck,
  PrepDecision,
  PrepElement,
  PrepHypothesis,
  PrepIssue,
  PrepLineDTO,
  PrepLineTextFields,
  PrepLot,
  PrepParamDTO,
  PrepSource,
  PrepTechnicalReference,
  StoredProvenance,
  StudyMode,
  TechRefKind,
} from "@/lib/preparation/types";
import {
  C01_ENRICHMENT_BUNDLE_ID,
  C01_LINE_TEXT_ENRICHMENTS,
  type PrepLineTextEnrichment,
} from "@/lib/preparation/enrichment/c01-fondations-texts";

type Db = PrismaClient | Prisma.TransactionClient;

export class PrepError extends Error {
  constructor(
    message: string,
    public status = 400,
    public issues: PrepIssue[] = [],
  ) {
    super(message);
  }
}

async function inTx<T>(db: Db, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  if ("$transaction" in db) {
    return (db as PrismaClient).$transaction(fn, { timeout: 30_000, maxWait: 10_000 });
  }
  return fn(db);
}

const jsonOrNull = (v: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull =>
  v === null || v === undefined ? Prisma.DbNull : (v as Prisma.InputJsonValue);

const numOrNull = (v: unknown): number | null => (v === null || v === undefined ? null : d(v));

const asArray = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

// ---------------------------------------------------------------------------
// DTO

export type PrepStudyListItem = {
  id: string;
  title: string;
  trade: string | null;
  mode: StudyMode;
  dossierStatus: DossierStatus;
  version: number;
  project: { id: string; title: string };
  lineCount: number;
  parameterCount: number;
  updatedAt: string;
};

export type PrepStudyView = {
  id: string;
  title: string;
  trade: string | null;
  description: string | null;
  mode: StudyMode;
  dossierStatus: DossierStatus;
  version: number;
  bundleId: string | null;
  sourceFormat: string | null;
  createdAt: string;
  updatedAt: string;
  project: { id: string; title: string };
  /** Périmètre technique (dossier chantier V2), si classé. */
  scope: { id: string; name: string; code: string } | null;
  orgIsDemo: boolean;
  params: PrepParamDTO[];
  lines: PrepLineDTO[];
  lots: PrepLot[];
  elements: PrepElement[];
  hypotheses: PrepHypothesis[];
  checks: PrepCheck[];
  decisions: PrepDecision[];
  sources: PrepSource[];
  disclaimers: string[];
  prepared: { workflowSteps: number; rates: number; scheduleTasks: number; variants: number };
  lastImport: {
    id: string;
    kind: string;
    appliedAt: string;
    canUndo: boolean;
    undoBlockedReason: string | null;
  } | null;
  lastPatch: {
    id: string;
    patchId: string;
    appliedAt: string;
    canUndo: boolean;
    undoBlockedReason: string | null;
  } | null;
  events: { id: string; kind: string; createdAt: string; summary: string }[];
};

type ParamRow = Prisma.PrepParameterGetPayload<object>;
type LineRow = Prisma.PrepTakeoffLineGetPayload<object>;

function paramRowToDTO(r: ParamRow): PrepParamDTO {
  return {
    key: r.key,
    label: r.label,
    unit: r.unit,
    value: numOrNull(r.value),
    formula: r.formula,
    provenance: (r.provenance as StoredProvenance | null) ?? null,
    sourceRef: r.sourceRef,
    evidence: (r.evidenceJson as PrepParamDTO["evidence"]) ?? null,
    hypothesisId: r.hypothesisId,
    note: r.note,
    sortOrder: r.sortOrder,
    originalValue: numOrNull(r.originalValue),
    originalProvenance: (r.originalProvenance as StoredProvenance | null) ?? null,
    modifiedAt: r.modifiedAt?.toISOString() ?? null,
  };
}

function asStringList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean);
}

function asTechRefs(v: unknown): PrepTechnicalReference[] {
  if (!Array.isArray(v)) return [];
  const out: PrepTechnicalReference[] = [];
  for (const item of v) {
    if (typeof item === "string" && item.trim()) {
      out.push({ label: item.trim(), kind: "INDICATIVE", note: null });
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const label = typeof o.label === "string" ? o.label.trim() : "";
    if (!label) continue;
    const kindRaw = typeof o.kind === "string" ? o.kind : "INDICATIVE";
    const kind = (["INDICATIVE", "DOSSIER", "TO_VERIFY"].includes(kindRaw) ? kindRaw : "INDICATIVE") as TechRefKind;
    out.push({
      label,
      kind,
      note: typeof o.note === "string" ? o.note : null,
    });
  }
  return out;
}

function lineRowToDTO(r: LineRow): PrepLineDTO {
  return {
    code: r.code,
    lot: r.lot,
    subLot: r.subLot,
    designation: r.designation,
    description: r.description,
    includedServices: asStringList(r.includedServicesJson),
    technicalReferences: asTechRefs(r.technicalReferencesJson),
    executionNotes: r.executionNotes,
    qualityControls: asStringList(r.qualityControlsJson),
    technicalReservations: asStringList(r.technicalReservationsJson),
    originalDesignation: r.originalDesignation,
    textsUserEdited: r.textsUserEdited,
    unit: r.unit,
    elementIds: asArray<string>(r.elementIdsJson),
    formula: r.formula,
    declaredQuantity: numOrNull(r.declaredQuantity),
    provenance: (r.provenance as StoredProvenance | null) ?? null,
    literalProvenance: (r.literalProvenance as StoredProvenance | null) ?? null,
    justification: r.justification,
    role: r.role as LineRole,
    nature: (r.nature as LineNature | null) ?? null,
    dependsOnDecisions: asArray<string>(r.dependsOnDecisionsJson),
    notes: r.notes,
    sortOrder: r.sortOrder,
    originalDeclared: numOrNull(r.originalDeclared),
    originalProvenance: (r.originalProvenance as StoredProvenance | null) ?? null,
    validatedQuantity: numOrNull(r.validatedQuantity),
    validatedAt: r.validatedAt?.toISOString() ?? null,
  };
}

// ---------------------------------------------------------------------------
// Lecture

export async function listOrgProjectsForPrep(orgId: string, db: Db = prisma) {
  return db.project.findMany({
    where: { organizationId: orgId },
    select: { id: true, title: true, siteCity: true },
    orderBy: { updatedAt: "desc" },
    take: 300,
  });
}

export async function listPrepStudies(
  orgId: string,
  opts: { projectId?: string | null } = {},
  db: Db = prisma,
): Promise<PrepStudyListItem[]> {
  const rows = await db.prepStudy.findMany({
    where: {
      organizationId: orgId,
      archivedAt: null,
      ...(opts.projectId ? { projectId: opts.projectId } : {}),
    },
    select: {
      id: true,
      title: true,
      trade: true,
      mode: true,
      dossierStatus: true,
      version: true,
      updatedAt: true,
      project: { select: { id: true, title: true } },
      _count: { select: { lines: true, parameters: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    trade: r.trade,
    mode: r.mode as StudyMode,
    dossierStatus: r.dossierStatus as DossierStatus,
    version: r.version,
    project: r.project,
    lineCount: r._count.lines,
    parameterCount: r._count.parameters,
    updatedAt: r.updatedAt.toISOString(),
  }));
}

const EVENT_LABELS: Record<string, string> = {
  IMPORT_CREATE: "Import initial",
  IMPORT_REPLACE: "Import de remplacement",
  EDIT: "Modification",
  EDIT_TEXTS: "Modification des fiches techniques",
  ENRICH_TEXTS: "Enrichissement des désignations techniques",
  CHATGPT_PATCH: "Modification ChatGPT (patch)",
  UNDO_CHATGPT_PATCH: "Annulation patch ChatGPT",
  VALIDATE_LINES: "Validation de quantités",
  UNVALIDATE_LINES: "Retrait de validation",
  UNDO_IMPORT: "Annulation d'import",
  TRANSFER_TO_QUOTE: "Transfert vers devis",
  TRANSFER_TO_SCHEDULE: "Génération planning de chantier",
  SYNC_QUOTE_LINE: "Synchronisation ligne devis",
};

function eventSummary(kind: string, detail: unknown): string {
  const base = EVENT_LABELS[kind] ?? kind;
  if (detail && typeof detail === "object") {
    const o = detail as Record<string, unknown>;
    if (typeof o.quoteNumber === "string") {
      return `${base} — ${o.quoteNumber}`;
    }
    if (typeof o.updated === "number") {
      return `${base} — ${o.updated} ligne(s)`;
    }
    if (Array.isArray(o.texts) && !asArray(o.params).length && !asArray(o.lines).length) {
      return `${base} — ${asArray(o.texts).length} fiche(s)`;
    }
    if (Array.isArray(o.params) || Array.isArray(o.lines)) {
      const n = asArray(o.params).length + asArray(o.lines).length;
      return `${base} — ${n} valeur(s), ${Number(o.impacted ?? 0)} quantité(s) recalculée(s)`;
    }
    if (Array.isArray(o.codes)) return `${base} — ${o.codes.length} ligne(s)`;
    if (typeof o.lineCount === "number") return `${base} — ${o.lineCount} ligne(s)`;
    if (typeof o.code === "string") return `${base} — ${o.code}`;
  }
  return base;
}

export async function getPrepStudyView(
  orgId: string,
  studyId: string,
  db: Db = prisma,
): Promise<PrepStudyView | null> {
  const study = await db.prepStudy.findFirst({
    where: { id: studyId, organizationId: orgId, archivedAt: null },
    include: {
      project: { select: { id: true, title: true } },
      scope: { select: { id: true, name: true, code: true } },
      organization: { select: { kind: true } },
      parameters: { orderBy: { sortOrder: "asc" } },
      lines: { orderBy: { sortOrder: "asc" } },
      imports: { orderBy: { appliedAt: "desc" }, take: 1 },
      events: { orderBy: { createdAt: "desc" }, take: 12 },
    },
  });
  if (!study) return null;

  const last = study.imports[0];
  let lastImport: PrepStudyView["lastImport"] = null;
  if (last && last.status === "APPLIED") {
    const canUndo = last.versionAfter === study.version;
    lastImport = {
      id: last.id,
      kind: last.kind,
      appliedAt: last.appliedAt.toISOString(),
      canUndo,
      undoBlockedReason: canUndo
        ? null
        : "Des modifications ont été enregistrées depuis cet import : l'annuler les ferait disparaître.",
    };
  }

  let lastPatch: PrepStudyView["lastPatch"] = null;
  const patchRow = await db.prepChatgptPatch.findFirst({
    where: { studyId, organizationId: orgId, status: "APPLIED" },
    orderBy: { appliedAt: "desc" },
    select: { id: true, patchId: true, versionAfter: true, appliedAt: true },
  });
  if (patchRow) {
    const canUndo = patchRow.versionAfter === study.version;
    lastPatch = {
      id: patchRow.id,
      patchId: patchRow.patchId,
      appliedAt: patchRow.appliedAt.toISOString(),
      canUndo,
      undoBlockedReason: canUndo
        ? null
        : "Des modifications ont été enregistrées depuis ce patch : annulation refusée.",
    };
  }

  const workflow = study.workflowJson as { steps?: unknown[] } | null;
  const resources = study.resourcesJson as { rates?: unknown[] } | null;
  const schedule = study.scheduleJson as { tasks?: unknown[] } | null;

  return {
    id: study.id,
    title: study.title,
    trade: study.trade,
    description: study.description,
    mode: study.mode as StudyMode,
    dossierStatus: study.dossierStatus as DossierStatus,
    version: study.version,
    bundleId: study.bundleId,
    sourceFormat: study.sourceFormat,
    createdAt: study.createdAt.toISOString(),
    updatedAt: study.updatedAt.toISOString(),
    project: study.project,
    scope: study.scope
      ? { id: study.scope.id, name: study.scope.name, code: study.scope.code }
      : null,
    orgIsDemo: study.organization.kind === "DEMO",
    params: study.parameters.map(paramRowToDTO),
    lines: study.lines.map(lineRowToDTO),
    lots: asArray<PrepLot>(study.lotsJson),
    elements: asArray<PrepElement>(study.elementsJson),
    hypotheses: asArray<PrepHypothesis>(study.hypothesesJson),
    checks: asArray<PrepCheck>(study.checksJson),
    decisions: asArray<PrepDecision>(study.decisionsJson),
    sources: asArray<PrepSource>(study.sourcesJson),
    disclaimers: asArray<string>(study.disclaimersJson),
    prepared: {
      workflowSteps: asArray(workflow?.steps).length,
      rates: asArray(resources?.rates).length,
      scheduleTasks: asArray(schedule?.tasks).length,
      variants: asArray(study.variantsJson).length,
    },
    lastImport,
    lastPatch,
    events: study.events.map((e) => ({
      id: e.id,
      kind: e.kind,
      createdAt: e.createdAt.toISOString(),
      summary: eventSummary(e.kind, e.detailJson),
    })),
  };
}

// ---------------------------------------------------------------------------
// Import

export type PrepImportPreview = {
  fingerprint: string;
  sourceFormat: string;
  adapted: boolean;
  mode: StudyMode;
  study: NormalizedPrepBundle["study"];
  params: PrepParamDTO[];
  lines: (PrepLineDTO & { computed: number | null; error: string | null; hypothesisCount: number; toVerifyCount: number })[];
  lots: PrepLot[];
  elements: PrepElement[];
  hypotheses: PrepHypothesis[];
  decisions: PrepDecision[];
  checks: (PrepCheck & { computed: number | null })[];
  prepared: PrepStudyView["prepared"];
  issues: PrepIssue[];
  duplicate: { studyId: string; title: string; importedAt: string } | null;
  target: {
    studyId: string;
    title: string;
    manualParams: number;
    manualLines: number;
    validatedLines: number;
    linesAdded: string[];
    linesRemoved: string[];
    paramsChanged: string[];
  } | null;
  orgIsDemo: boolean;
};

function bundleParamsToDTO(b: NormalizedPrepBundle): PrepParamDTO[] {
  return b.parameters.map((p) => ({
    ...p,
    originalValue: p.value,
    originalProvenance: p.provenance,
    modifiedAt: null,
  }));
}

function bundleLinesToDTO(b: NormalizedPrepBundle): PrepLineDTO[] {
  return b.lines.map((l) => ({
    ...l,
    originalDesignation: l.designation,
    textsUserEdited: false,
    originalDeclared: l.declaredQuantity,
    originalProvenance: l.provenance,
    validatedQuantity: null,
    validatedAt: null,
  }));
}

async function assertProject(db: Db, orgId: string, projectId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    select: { id: true, title: true },
  });
  if (!project) throw new PrepError("Projet introuvable dans votre organisation", 404);
  return project;
}

async function orgIsDemo(db: Db, orgId: string): Promise<boolean> {
  const org = await db.organization.findUnique({ where: { id: orgId }, select: { kind: true } });
  return org?.kind === "DEMO";
}

function parseOrThrow(raw: string) {
  const parsed = parsePrepJsonText(raw);
  if (!parsed.ok) {
    throw new PrepError("Le JSON contient des erreurs bloquantes", 422, parsed.issues);
  }
  return { ...parsed, fingerprint: prepBundleFingerprint(parsed.canonical) };
}

async function findDuplicate(db: Db, orgId: string, projectId: string, fingerprint: string) {
  const dup = await db.prepImport.findFirst({
    where: {
      organizationId: orgId,
      projectId,
      fingerprint,
      status: "APPLIED",
      study: { archivedAt: null },
    },
    select: { appliedAt: true, study: { select: { id: true, title: true } } },
    orderBy: { appliedAt: "desc" },
  });
  return dup
    ? { studyId: dup.study.id, title: dup.study.title, importedAt: dup.appliedAt.toISOString() }
    : null;
}

export async function previewPrepImport(
  input: { orgId: string; projectId: string; raw: string; targetStudyId?: string | null },
  db: Db = prisma,
): Promise<{ ok: true; preview: PrepImportPreview } | { ok: false; issues: PrepIssue[] }> {
  await assertProject(db, input.orgId, input.projectId);
  const parsed = parsePrepJsonText(input.raw);
  if (!parsed.ok) return { ok: false, issues: parsed.issues };
  const b = parsed.bundle;
  const fingerprint = prepBundleFingerprint(parsed.canonical);
  const engine = computeStudy({ params: b.parameters, lines: b.lines });

  let target: PrepImportPreview["target"] = null;
  if (input.targetStudyId) {
    const study = await db.prepStudy.findFirst({
      where: {
        id: input.targetStudyId,
        organizationId: input.orgId,
        projectId: input.projectId,
        archivedAt: null,
      },
      include: { parameters: true, lines: true },
    });
    if (!study) throw new PrepError("Étude cible introuvable", 404);
    const newCodes = new Set(b.lines.map((l) => l.code));
    const oldCodes = new Set(study.lines.map((l) => l.code));
    const oldParams = new Map(study.parameters.map((p) => [p.key, p]));
    target = {
      studyId: study.id,
      title: study.title,
      manualParams: study.parameters.filter((p) => p.provenance === "SAISIE_MANUELLE").length,
      manualLines: study.lines.filter((l) => l.provenance === "SAISIE_MANUELLE").length,
      validatedLines: study.lines.filter((l) => l.validatedAt).length,
      linesAdded: [...newCodes].filter((c) => !oldCodes.has(c)),
      linesRemoved: [...oldCodes].filter((c) => !newCodes.has(c)),
      paramsChanged: b.parameters
        .filter((p) => {
          const o = oldParams.get(p.key);
          return !o || numOrNull(o.value) !== p.value || (o.formula ?? null) !== p.formula;
        })
        .map((p) => p.key),
    };
  }

  const demoOrg = await orgIsDemo(db, input.orgId);
  const issues = [...parsed.issues];
  if (b.mode === "DEMONSTRATION" && !demoOrg) {
    issues.push({
      path: "mode",
      severity: "warn",
      message:
        "Étude de démonstration dans une organisation standard : elle reste marquée « DÉMONSTRATION — NON CONTRACTUEL ». Tout devis qui en sera issu portera ce marquage et sera protégé contre la facturation.",
    });
  }

  return {
    ok: true,
    preview: {
      fingerprint,
      sourceFormat: b.sourceFormat,
      adapted: b.adapted,
      mode: b.mode,
      study: b.study,
      params: bundleParamsToDTO(b),
      lines: bundleLinesToDTO(b).map((l) => {
        const node = engine.nodes.get(l.code);
        const s = node ? summarizeBases(node.bases) : null;
        return {
          ...l,
          computed: node?.value ?? null,
          error: node?.error ?? null,
          hypothesisCount: s?.hypotheses.length ?? 0,
          toVerifyCount: s?.toVerify.length ?? 0,
        };
      }),
      lots: b.lots,
      elements: b.elements,
      hypotheses: b.hypotheses,
      decisions: b.decisions,
      checks: b.checks.map((c) => ({
        ...c,
        computed: c.target ? engine.nodes.get(c.target)?.value ?? null : null,
      })),
      prepared: {
        workflowSteps: asArray((b.workflow as { steps?: unknown[] } | null)?.steps).length,
        rates: asArray((b.resources as { rates?: unknown[] } | null)?.rates).length,
        scheduleTasks: asArray((b.schedule as { tasks?: unknown[] } | null)?.tasks).length,
        variants: b.variants.length,
      },
      issues,
      duplicate: await findDuplicate(db, input.orgId, input.projectId, fingerprint),
      target,
      orgIsDemo: demoOrg,
    },
  };
}

function studyFieldsFromBundle(b: NormalizedPrepBundle) {
  return {
    title: b.study.title,
    trade: b.study.trade,
    description: b.study.description,
    mode: b.mode,
    dossierStatus: (b.mode === "DEMONSTRATION" ? "DEMONSTRATION" : "PRO_A_VALIDER") as DossierStatus,
    bundleId: b.bundleId,
    sourceFormat: b.sourceFormat,
    sourcesJson: jsonOrNull(b.sources),
    hypothesesJson: jsonOrNull(b.hypotheses),
    elementsJson: jsonOrNull(b.elements),
    lotsJson: jsonOrNull(b.lots),
    checksJson: jsonOrNull(b.checks),
    resourcesJson: jsonOrNull(b.resources),
    workflowJson: jsonOrNull(b.workflow),
    scheduleJson: jsonOrNull(b.schedule),
    decisionsJson: jsonOrNull(b.decisions),
    variantsJson: jsonOrNull(b.variants),
    disclaimersJson: jsonOrNull(b.disclaimers),
  };
}

function paramCreateRows(studyId: string, orgId: string, params: PrepParamDTO[]) {
  return params.map((p) => ({
    studyId,
    organizationId: orgId,
    key: p.key,
    label: p.label,
    unit: p.unit,
    value: p.value,
    formula: p.formula,
    provenance: p.provenance,
    sourceRef: p.sourceRef,
    evidenceJson: jsonOrNull(p.evidence),
    hypothesisId: p.hypothesisId,
    note: p.note,
    sortOrder: p.sortOrder,
    originalValue: p.originalValue,
    originalProvenance: p.originalProvenance,
    modifiedAt: p.modifiedAt ? new Date(p.modifiedAt) : null,
  }));
}

function lineCreateRows(studyId: string, orgId: string, lines: PrepLineDTO[], engine: EngineResult) {
  return lines.map((l) => {
    const node = engine.nodes.get(l.code);
    return {
      studyId,
      organizationId: orgId,
      code: l.code,
      lot: l.lot,
      subLot: l.subLot,
      designation: l.designation,
      description: l.description,
      includedServicesJson: jsonOrNull(l.includedServices),
      technicalReferencesJson: jsonOrNull(l.technicalReferences),
      executionNotes: l.executionNotes,
      qualityControlsJson: jsonOrNull(l.qualityControls),
      technicalReservationsJson: jsonOrNull(l.technicalReservations),
      originalDesignation: l.originalDesignation ?? l.designation,
      textsUserEdited: l.textsUserEdited,
      unit: l.unit,
      elementIdsJson: jsonOrNull(l.elementIds),
      formula: l.formula,
      declaredQuantity: l.declaredQuantity,
      provenance: l.provenance,
      literalProvenance: l.literalProvenance,
      justification: l.justification,
      role: l.role,
      nature: l.nature,
      dependsOnDecisionsJson: jsonOrNull(l.dependsOnDecisions),
      notes: l.notes,
      sortOrder: l.sortOrder,
      computedQuantity: node?.value ?? null,
      computeError: node?.error ?? null,
      originalDeclared: l.originalDeclared,
      originalProvenance: l.originalProvenance,
      validatedQuantity: l.validatedQuantity,
      validatedAt: l.validatedAt ? new Date(l.validatedAt) : null,
    };
  });
}

type StudySnapshot = {
  study: Record<string, unknown>;
  params: PrepParamDTO[];
  lines: PrepLineDTO[];
};

async function buildSnapshot(tx: Prisma.TransactionClient, studyId: string): Promise<StudySnapshot> {
  const s = await tx.prepStudy.findUniqueOrThrow({
    where: { id: studyId },
    include: { parameters: { orderBy: { sortOrder: "asc" } }, lines: { orderBy: { sortOrder: "asc" } } },
  });
  return {
    study: {
      title: s.title,
      trade: s.trade,
      description: s.description,
      mode: s.mode,
      dossierStatus: s.dossierStatus,
      bundleId: s.bundleId,
      sourceFormat: s.sourceFormat,
      sourcesJson: s.sourcesJson,
      hypothesesJson: s.hypothesesJson,
      elementsJson: s.elementsJson,
      lotsJson: s.lotsJson,
      checksJson: s.checksJson,
      resourcesJson: s.resourcesJson,
      workflowJson: s.workflowJson,
      scheduleJson: s.scheduleJson,
      decisionsJson: s.decisionsJson,
      variantsJson: s.variantsJson,
      disclaimersJson: s.disclaimersJson,
    },
    params: s.parameters.map(paramRowToDTO),
    lines: s.lines.map(lineRowToDTO),
  };
}

export async function commitPrepImport(
  input: {
    orgId: string;
    projectId: string;
    userId: string;
    raw: string;
    targetStudyId?: string | null;
    confirmReplace?: boolean;
    allowDuplicate?: boolean;
  },
  db: Db = prisma,
): Promise<{ studyId: string; importId: string; kind: "CREATE" | "REPLACE" }> {
  await assertProject(db, input.orgId, input.projectId);
  const { bundle: b, issues, fingerprint } = parseOrThrow(input.raw);

  if (!input.allowDuplicate) {
    const dup = await findDuplicate(db, input.orgId, input.projectId, fingerprint);
    if (dup) {
      throw new PrepError(
        `Ce JSON a déjà été importé dans ce projet (étude « ${dup.title} »). Confirmez pour créer une copie.`,
        409,
      );
    }
  }

  const params = bundleParamsToDTO(b);
  const lines = bundleLinesToDTO(b);
  const engine = computeStudy({ params, lines });
  const summary = {
    parameters: params.length,
    lines: lines.length,
    warnings: issues.filter((i) => i.severity === "warn").length,
    adapted: b.adapted,
    sourceFormat: b.sourceFormat,
  };

  return inTx(db, async (tx) => {
    if (input.targetStudyId) {
      if (!input.confirmReplace) {
        throw new PrepError("Le remplacement d'une étude existante doit être confirmé explicitement", 409);
      }
      const study = await tx.prepStudy.findFirst({
        where: {
          id: input.targetStudyId,
          organizationId: input.orgId,
          projectId: input.projectId,
          archivedAt: null,
        },
        select: { id: true, version: true },
      });
      if (!study) throw new PrepError("Étude cible introuvable", 404);
      const snapshot = await buildSnapshot(tx, study.id);
      const version = study.version + 1;
      await tx.prepParameter.deleteMany({ where: { studyId: study.id } });
      await tx.prepTakeoffLine.deleteMany({ where: { studyId: study.id } });
      await tx.prepStudy.update({
        where: { id: study.id },
        data: { ...studyFieldsFromBundle(b), version, updatedById: input.userId },
      });
      await tx.prepParameter.createMany({ data: paramCreateRows(study.id, input.orgId, params) });
      await tx.prepTakeoffLine.createMany({ data: lineCreateRows(study.id, input.orgId, lines, engine) });
      const imp = await tx.prepImport.create({
        data: {
          studyId: study.id,
          organizationId: input.orgId,
          projectId: input.projectId,
          format: b.sourceFormat,
          bundleId: b.bundleId,
          fingerprint,
          kind: "REPLACE",
          summaryJson: summary,
          snapshotBeforeJson: snapshot as unknown as Prisma.InputJsonValue,
          versionAfter: version,
          appliedById: input.userId,
        },
      });
      await tx.prepStudyEvent.create({
        data: {
          studyId: study.id,
          organizationId: input.orgId,
          kind: "IMPORT_REPLACE",
          detailJson: summary,
          actorUserId: input.userId,
        },
      });
      return { studyId: study.id, importId: imp.id, kind: "REPLACE" as const };
    }

    const study = await tx.prepStudy.create({
      data: {
        organizationId: input.orgId,
        projectId: input.projectId,
        ...studyFieldsFromBundle(b),
        version: 1,
        createdById: input.userId,
        updatedById: input.userId,
      },
      select: { id: true },
    });
    await tx.prepParameter.createMany({ data: paramCreateRows(study.id, input.orgId, params) });
    await tx.prepTakeoffLine.createMany({ data: lineCreateRows(study.id, input.orgId, lines, engine) });
    const imp = await tx.prepImport.create({
      data: {
        studyId: study.id,
        organizationId: input.orgId,
        projectId: input.projectId,
        format: b.sourceFormat,
        bundleId: b.bundleId,
        fingerprint,
        kind: "CREATE",
        summaryJson: summary,
        versionAfter: 1,
        appliedById: input.userId,
      },
    });
    await tx.prepStudyEvent.create({
      data: {
        studyId: study.id,
        organizationId: input.orgId,
        kind: "IMPORT_CREATE",
        detailJson: summary,
        actorUserId: input.userId,
      },
    });
    return { studyId: study.id, importId: imp.id, kind: "CREATE" as const };
  });
}

// ---------------------------------------------------------------------------
// Modifications

export type PrepEditInput = {
  orgId: string;
  studyId: string;
  userId: string;
  expectedVersion: number;
  params?: { key: string; value?: number | null; restore?: boolean }[];
  lines?: {
    code: string;
    quantity?: number | null;
    restore?: boolean;
    texts?: PrepLineTextFields;
  }[];
};

const MAX_ABS_VALUE = 1e12;

function assertEditableNumber(v: unknown, label: string): number {
  if (typeof v !== "number" || !Number.isFinite(v) || Math.abs(v) > MAX_ABS_VALUE) {
    throw new PrepError(`${label} : valeur numérique invalide`);
  }
  return v;
}

function clipText(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

function normalizeTextFields(raw: PrepLineTextFields): PrepLineTextFields {
  const out: PrepLineTextFields = {};
  if (raw.designation !== undefined) {
    const d = clipText(raw.designation, 500);
    if (!d) throw new PrepError("La désignation ne peut pas être vide");
    out.designation = d;
  }
  if (raw.description !== undefined) out.description = clipText(raw.description, 8000);
  if (raw.executionNotes !== undefined) out.executionNotes = clipText(raw.executionNotes, 8000);
  if (raw.includedServices !== undefined) {
    out.includedServices = (raw.includedServices ?? [])
      .map((x) => (typeof x === "string" ? x.trim().slice(0, 500) : ""))
      .filter(Boolean)
      .slice(0, 40);
  }
  if (raw.qualityControls !== undefined) {
    out.qualityControls = (raw.qualityControls ?? [])
      .map((x) => (typeof x === "string" ? x.trim().slice(0, 500) : ""))
      .filter(Boolean)
      .slice(0, 40);
  }
  if (raw.technicalReservations !== undefined) {
    out.technicalReservations = (raw.technicalReservations ?? [])
      .map((x) => (typeof x === "string" ? x.trim().slice(0, 500) : ""))
      .filter(Boolean)
      .slice(0, 40);
  }
  if (raw.technicalReferences !== undefined) {
    out.technicalReferences = asTechRefs(raw.technicalReferences).slice(0, 20);
  }
  return out;
}

async function loadForEdit(tx: Prisma.TransactionClient, orgId: string, studyId: string, expectedVersion: number) {
  const study = await tx.prepStudy.findFirst({
    where: { id: studyId, organizationId: orgId, archivedAt: null },
    include: { parameters: true, lines: true },
  });
  if (!study) throw new PrepError("Étude introuvable", 404);
  if (study.version !== expectedVersion) {
    throw new PrepError(
      "L'étude a été modifiée entre-temps (autre onglet ou autre utilisateur). Rechargez avant d'enregistrer.",
      409,
    );
  }
  return study;
}

export async function savePrepStudyEdits(input: PrepEditInput, db: Db = prisma) {
  const paramEdits = input.params ?? [];
  const lineEdits = input.lines ?? [];
  if (paramEdits.length + lineEdits.length === 0) throw new PrepError("Aucune modification à enregistrer");
  if (paramEdits.length + lineEdits.length > 500) throw new PrepError("Trop de modifications en une fois");

  return inTx(db, async (tx) => {
    const study = await loadForEdit(tx, input.orgId, input.studyId, input.expectedVersion);
    const params = study.parameters.map(paramRowToDTO);
    const lines = study.lines.map(lineRowToDTO);
    const pByKey = new Map(params.map((p) => [p.key, p]));
    const lByCode = new Map(lines.map((l) => [l.code, l]));
    const before = computeStudy({ params, lines });
    const now = new Date().toISOString();
    const paramLog: { key: string; from: number | null; to: number | null; restore: boolean }[] = [];
    const lineLog: { code: string; from: number | null; to: number | null; restore: boolean }[] = [];
    const textLog: { code: string; fields: string[] }[] = [];

    for (const e of paramEdits) {
      const p = pByKey.get(e.key);
      if (!p) throw new PrepError(`Paramètre inconnu : ${e.key}`);
      if (p.formula) throw new PrepError(`${e.key} est calculé par formule : modifiez ses paramètres d'origine`);
      const from = p.value;
      if (e.restore) {
        p.value = p.originalValue;
        p.provenance = p.originalProvenance;
        p.modifiedAt = null;
      } else {
        p.value = assertEditableNumber(e.value, p.label);
        p.provenance = "SAISIE_MANUELLE";
        p.modifiedAt = now;
      }
      paramLog.push({ key: p.key, from, to: p.value, restore: !!e.restore });
    }
    for (const e of lineEdits) {
      const l = lByCode.get(e.code);
      if (!l) throw new PrepError(`Ligne inconnue : ${e.code}`);
      const hasQty = e.restore || e.quantity !== undefined;
      if (hasQty) {
        if (l.formula && !e.restore) {
          throw new PrepError(`${e.code} est calculée par formule : modifiez ses paramètres`);
        }
        const from = l.declaredQuantity;
        if (e.restore) {
          l.declaredQuantity = l.originalDeclared;
          l.provenance = l.originalProvenance;
        } else {
          l.declaredQuantity = assertEditableNumber(e.quantity, l.designation);
          l.provenance = "SAISIE_MANUELLE";
        }
        lineLog.push({ code: l.code, from, to: l.declaredQuantity, restore: !!e.restore });
      }
      if (e.texts) {
        const texts = normalizeTextFields(e.texts);
        const fields: string[] = [];
        if (texts.designation !== undefined) {
          l.designation = texts.designation;
          fields.push("designation");
        }
        if (texts.description !== undefined) {
          l.description = texts.description;
          fields.push("description");
        }
        if (texts.includedServices !== undefined) {
          l.includedServices = texts.includedServices;
          fields.push("includedServices");
        }
        if (texts.technicalReferences !== undefined) {
          l.technicalReferences = texts.technicalReferences;
          fields.push("technicalReferences");
        }
        if (texts.executionNotes !== undefined) {
          l.executionNotes = texts.executionNotes;
          fields.push("executionNotes");
        }
        if (texts.qualityControls !== undefined) {
          l.qualityControls = texts.qualityControls;
          fields.push("qualityControls");
        }
        if (texts.technicalReservations !== undefined) {
          l.technicalReservations = texts.technicalReservations;
          fields.push("technicalReservations");
        }
        if (fields.length) {
          l.textsUserEdited = true;
          textLog.push({ code: l.code, fields });
        }
      }
    }

    const after = computeStudy({ params, lines });
    if (after.structural.length) {
      throw new PrepError("Recalcul impossible", 422, after.structural);
    }

    for (const log of paramLog) {
      const p = pByKey.get(log.key)!;
      await tx.prepParameter.update({
        where: { studyId_key: { studyId: study.id, key: p.key } },
        data: {
          value: p.value,
          provenance: p.provenance,
          modifiedAt: p.modifiedAt ? new Date(p.modifiedAt) : null,
          modifiedById: p.modifiedAt ? input.userId : null,
        },
      });
    }
    let impacted = 0;
    const textCodes = new Set(textLog.map((t) => t.code));
    for (const l of lines) {
      const a = after.nodes.get(l.code);
      const b = before.nodes.get(l.code);
      const editedQty = lineLog.some((x) => x.code === l.code);
      const editedText = textCodes.has(l.code);
      const changed = a?.value !== b?.value || a?.error !== b?.error;
      if (!editedQty && !editedText && !changed) continue;
      if (changed) impacted++;
      await tx.prepTakeoffLine.update({
        where: { studyId_code: { studyId: study.id, code: l.code } },
        data: {
          computedQuantity: a?.value ?? null,
          computeError: a?.error ?? null,
          ...(editedQty ? { declaredQuantity: l.declaredQuantity, provenance: l.provenance } : {}),
          ...(editedText
            ? {
                designation: l.designation,
                description: l.description,
                includedServicesJson: jsonOrNull(l.includedServices),
                technicalReferencesJson: jsonOrNull(l.technicalReferences),
                executionNotes: l.executionNotes,
                qualityControlsJson: jsonOrNull(l.qualityControls),
                technicalReservationsJson: jsonOrNull(l.technicalReservations),
                textsUserEdited: true,
              }
            : {}),
        },
      });
    }
    const version = study.version + 1;
    await tx.prepStudy.update({
      where: { id: study.id },
      data: { version, updatedById: input.userId },
    });
    await tx.prepStudyEvent.create({
      data: {
        studyId: study.id,
        organizationId: input.orgId,
        kind: textLog.length && !paramLog.length && !lineLog.length ? "EDIT_TEXTS" : "EDIT",
        detailJson: { params: paramLog, lines: lineLog, texts: textLog, impacted },
        actorUserId: input.userId,
      },
    });
    return { version, impacted, textsUpdated: textLog.length };
  });
}

function enrichmentFromBundleLines(lines: PrepLineDTO[]): Map<string, PrepLineTextEnrichment> {
  const map = new Map<string, PrepLineTextEnrichment>();
  for (const l of lines) {
    map.set(l.code, {
      designation: l.designation,
      technicalDescription: l.description ?? "",
      includedServices: l.includedServices,
      technicalReferences: l.technicalReferences,
      executionNotes: l.executionNotes,
      qualityControls: l.qualityControls,
      technicalReservations: l.technicalReservations,
    });
  }
  return map;
}

function resolveEnrichmentMap(input: {
  source?: "c01-fondations" | "bundle";
  raw?: string | null;
  bundleId?: string | null;
}): Map<string, PrepLineTextEnrichment> {
  if (input.source === "bundle" || input.raw) {
    if (!input.raw) throw new PrepError("JSON d'enrichissement manquant");
    const parsed = parsePrepJsonText(input.raw);
    if (!parsed.ok) throw new PrepError("Le JSON contient des erreurs bloquantes", 422, parsed.issues);
    return enrichmentFromBundleLines(bundleLinesToDTO(parsed.bundle));
  }
  if (input.source === "c01-fondations" || input.bundleId === C01_ENRICHMENT_BUNDLE_ID) {
    return new Map(Object.entries(C01_LINE_TEXT_ENRICHMENTS));
  }
  throw new PrepError(
    "Aucun catalogue d'enrichissement pour cette étude. Importez un JSON enrichi (source « bundle ») ou utilisez le scénario C-01.",
  );
}

/**
 * Enrichit les désignations / fiches techniques sans toucher aux quantités ni formules.
 * Ne remplace pas une fiche déjà retouchée manuellement (sauf champs encore vides).
 */
export async function enrichPrepStudyTexts(
  input: {
    orgId: string;
    studyId: string;
    userId: string;
    expectedVersion: number;
    source?: "c01-fondations" | "bundle";
    raw?: string | null;
  },
  db: Db = prisma,
) {
  return inTx(db, async (tx) => {
    const study = await loadForEdit(tx, input.orgId, input.studyId, input.expectedVersion);
    const map = resolveEnrichmentMap({
      source: input.source,
      raw: input.raw,
      bundleId: study.bundleId,
    });
    let updated = 0;
    let skippedUser = 0;
    let skippedMissing = 0;
    const beforeEngine = computeStudy({
      params: study.parameters.map(paramRowToDTO),
      lines: study.lines.map(lineRowToDTO),
    });

    for (const line of study.lines) {
      const enrich = map.get(line.code);
      if (!enrich) {
        skippedMissing++;
        continue;
      }
      const original = line.originalDesignation ?? line.designation;
      const designationUntouched =
        !line.textsUserEdited &&
        (line.designation === original ||
          line.designation === enrich.replacesDesignation ||
          line.designation === enrich.designation);

      const data: Prisma.PrepTakeoffLineUpdateInput = {};
      if (designationUntouched && line.designation !== enrich.designation) {
        data.designation = enrich.designation;
      }

      const fillEmpty = (current: string | null | undefined, next: string | null) => {
        if (line.textsUserEdited && current && current.trim()) return undefined;
        return next;
      };
      const fillEmptyList = (current: unknown, next: unknown) => {
        const cur = asStringList(current);
        if (line.textsUserEdited && cur.length) return undefined;
        return next;
      };

      const desc = fillEmpty(line.description, enrich.technicalDescription || null);
      if (desc !== undefined) data.description = desc;

      const services = fillEmptyList(line.includedServicesJson, enrich.includedServices);
      if (services !== undefined) data.includedServicesJson = jsonOrNull(services);

      const refs = (() => {
        const cur = asTechRefs(line.technicalReferencesJson);
        if (line.textsUserEdited && cur.length) return undefined;
        return enrich.technicalReferences;
      })();
      if (refs !== undefined) data.technicalReferencesJson = jsonOrNull(refs);

      const exec = fillEmpty(line.executionNotes, enrich.executionNotes);
      if (exec !== undefined) data.executionNotes = exec;

      const qc = fillEmptyList(line.qualityControlsJson, enrich.qualityControls);
      if (qc !== undefined) data.qualityControlsJson = jsonOrNull(qc);

      const res = fillEmptyList(line.technicalReservationsJson, enrich.technicalReservations);
      if (res !== undefined) data.technicalReservationsJson = jsonOrNull(res);

      if (!line.originalDesignation) data.originalDesignation = original;

      if (Object.keys(data).length === 0) {
        if (line.textsUserEdited) skippedUser++;
        continue;
      }

      await tx.prepTakeoffLine.update({ where: { id: line.id }, data });
      updated++;
    }

    const afterLines = (
      await tx.prepTakeoffLine.findMany({ where: { studyId: study.id }, orderBy: { sortOrder: "asc" } })
    ).map(lineRowToDTO);
    const afterEngine = computeStudy({
      params: study.parameters.map(paramRowToDTO),
      lines: afterLines,
    });
    for (const line of afterLines) {
      const a = afterEngine.nodes.get(line.code)?.value ?? null;
      const b = beforeEngine.nodes.get(line.code)?.value ?? null;
      if (a !== b) {
        throw new PrepError(
          `Enrichissement annulé : la quantité de ${line.code} aurait changé (${b} → ${a}). Les textes doivent rester indépendants du calcul.`,
          500,
        );
      }
    }

    const version = study.version + 1;
    await tx.prepStudy.update({
      where: { id: study.id },
      data: { version, updatedById: input.userId },
    });
    await tx.prepStudyEvent.create({
      data: {
        studyId: study.id,
        organizationId: input.orgId,
        kind: "ENRICH_TEXTS",
        detailJson: { updated, skippedUser, skippedMissing, source: input.source ?? "auto" },
        actorUserId: input.userId,
      },
    });
    return { version, updated, skippedUser, skippedMissing };
  });
}

export async function setPrepLinesValidation(
  input: {
    orgId: string;
    studyId: string;
    userId: string;
    expectedVersion: number;
    codes: string[];
    validated: boolean;
  },
  db: Db = prisma,
) {
  if (!input.codes.length || input.codes.length > 5000) throw new PrepError("Sélection de lignes invalide");
  return inTx(db, async (tx) => {
    const study = await loadForEdit(tx, input.orgId, input.studyId, input.expectedVersion);
    const engine = computeStudy({
      params: study.parameters.map(paramRowToDTO),
      lines: study.lines.map(lineRowToDTO),
    });
    const codes = new Set(input.codes);
    let count = 0;
    for (const line of study.lines) {
      if (!codes.has(line.code)) continue;
      const node = engine.nodes.get(line.code);
      if (input.validated && line.role === "indicator") {
        throw new PrepError(`${line.code} est un indicateur technique : il ne peut pas devenir une quantité validée`);
      }
      if (input.validated && (node?.value === null || node?.value === undefined)) {
        throw new PrepError(`${line.code} : quantité en erreur, validation impossible`);
      }
      await tx.prepTakeoffLine.update({
        where: { id: line.id },
        data: input.validated
          ? { validatedQuantity: node!.value, validatedAt: new Date(), validatedById: input.userId }
          : { validatedQuantity: null, validatedAt: null, validatedById: null },
      });
      count++;
    }
    const version = study.version + 1;
    await tx.prepStudy.update({ where: { id: study.id }, data: { version, updatedById: input.userId } });
    await tx.prepStudyEvent.create({
      data: {
        studyId: study.id,
        organizationId: input.orgId,
        kind: input.validated ? "VALIDATE_LINES" : "UNVALIDATE_LINES",
        detailJson: { codes: [...codes] },
        actorUserId: input.userId,
      },
    });
    return { version, count };
  });
}

// ---------------------------------------------------------------------------
// Annulation du dernier import

export async function undoLastPrepImport(
  input: { orgId: string; studyId: string; userId: string },
  db: Db = prisma,
): Promise<{ action: "archived" | "restored"; studyId: string; projectId: string }> {
  return inTx(db, async (tx) => {
    const study = await tx.prepStudy.findFirst({
      where: { id: input.studyId, organizationId: input.orgId, archivedAt: null },
      select: { id: true, version: true, projectId: true },
    });
    if (!study) throw new PrepError("Étude introuvable", 404);
    const imp = await tx.prepImport.findFirst({
      where: { studyId: study.id },
      orderBy: { appliedAt: "desc" },
    });
    if (!imp || imp.status !== "APPLIED") throw new PrepError("Aucun import à annuler");
    if (imp.versionAfter !== study.version) {
      throw new PrepError(
        "Des modifications ont été enregistrées depuis cet import : l'annulation les ferait disparaître. Annulation refusée.",
        409,
      );
    }

    if (imp.kind === "CREATE") {
      await tx.prepStudy.update({
        where: { id: study.id },
        data: { archivedAt: new Date(), updatedById: input.userId },
      });
    } else {
      const snap = imp.snapshotBeforeJson as unknown as StudySnapshot | null;
      if (!snap) throw new PrepError("Copie de l'état antérieur indisponible : annulation impossible", 409);
      const version = study.version + 1;
      await tx.prepParameter.deleteMany({ where: { studyId: study.id } });
      await tx.prepTakeoffLine.deleteMany({ where: { studyId: study.id } });
      const s = snap.study;
      await tx.prepStudy.update({
        where: { id: study.id },
        data: {
          title: String(s.title),
          trade: (s.trade as string | null) ?? null,
          description: (s.description as string | null) ?? null,
          mode: String(s.mode),
          dossierStatus: String(s.dossierStatus),
          bundleId: (s.bundleId as string | null) ?? null,
          sourceFormat: (s.sourceFormat as string | null) ?? null,
          sourcesJson: jsonOrNull(s.sourcesJson),
          hypothesesJson: jsonOrNull(s.hypothesesJson),
          elementsJson: jsonOrNull(s.elementsJson),
          lotsJson: jsonOrNull(s.lotsJson),
          checksJson: jsonOrNull(s.checksJson),
          resourcesJson: jsonOrNull(s.resourcesJson),
          workflowJson: jsonOrNull(s.workflowJson),
          scheduleJson: jsonOrNull(s.scheduleJson),
          decisionsJson: jsonOrNull(s.decisionsJson),
          variantsJson: jsonOrNull(s.variantsJson),
          disclaimersJson: jsonOrNull(s.disclaimersJson),
          version,
          updatedById: input.userId,
        },
      });
      const engine = computeStudy({ params: snap.params, lines: snap.lines });
      await tx.prepParameter.createMany({ data: paramCreateRows(study.id, input.orgId, snap.params) });
      await tx.prepTakeoffLine.createMany({
        data: lineCreateRows(study.id, input.orgId, snap.lines, engine),
      });
    }
    await tx.prepImport.update({
      where: { id: imp.id },
      data: { status: "UNDONE", undoneAt: new Date() },
    });
    await tx.prepStudyEvent.create({
      data: {
        studyId: study.id,
        organizationId: input.orgId,
        kind: "UNDO_IMPORT",
        detailJson: { importId: imp.id, kind: imp.kind },
        actorUserId: input.userId,
      },
    });
    return {
      action: imp.kind === "CREATE" ? ("archived" as const) : ("restored" as const),
      studyId: study.id,
      projectId: study.projectId,
    };
  });
}
