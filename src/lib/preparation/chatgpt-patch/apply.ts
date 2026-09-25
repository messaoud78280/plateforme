/**
 * Prévisualisation et application d'un bework_prep_patch_v1.
 * Recalcule via le moteur existant ; ne touche pas au module devis.
 */
import { createHash } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeStudy } from "@/lib/preparation/engine/compute";
import type { BeworkPrepPatchV1, PrepPatchLinePayload } from "@/lib/preparation/chatgpt-patch/types";
import {
  getPrepStudyView,
  PrepError,
  type PrepStudyView,
} from "@/lib/preparation/service";
import type {
  PrepHypothesis,
  PrepLineDTO,
  PrepParamDTO,
  PrepTechnicalReference,
  StoredProvenance,
} from "@/lib/preparation/types";
import { formatQty } from "@/lib/preparation/units";

type Db = PrismaClient | Prisma.TransactionClient;

export type PrepPatchFieldChange = {
  field: string;
  label: string;
  before: string | number | null;
  after: string | number | null;
};

export type PrepPatchPreviewOp =
  | {
      kind: "update";
      target: string;
      label: string;
      fields: PrepPatchFieldChange[];
      quantityImpacts: { code: string; designation: string; before: number | null; after: number | null }[];
    }
  | {
      kind: "add";
      target: string;
      label: string;
      detail: string;
    }
  | {
      kind: "delete";
      target: string;
      label: string;
      detail: string;
    }
  | {
      kind: "meta";
      target: string;
      label: string;
      fields: PrepPatchFieldChange[];
    }
  | {
      kind: "error";
      target: string;
      label: string;
      detail: string;
    };

export type PrepPatchPreview = {
  ok: boolean;
  studyId: string;
  studyTitle: string;
  version: number;
  versionMismatch: boolean;
  alreadyApplied: boolean;
  blockedReason: string | null;
  operations: PrepPatchPreviewOp[];
  quantityImpacts: { code: string; designation: string; before: number | null; after: number | null; unit: string }[];
  warnings: string[];
  errors: string[];
};

type WorkingState = {
  title: string;
  trade: string | null;
  description: string | null;
  params: PrepParamDTO[];
  lines: PrepLineDTO[];
  hypotheses: PrepHypothesis[];
  workflow: Record<string, unknown> | null;
  resources: Record<string, unknown> | null;
};

function cloneState(study: PrepStudyView): WorkingState {
  return {
    title: study.title,
    trade: study.trade,
    description: study.description,
    params: study.params.map((p) => ({ ...p })),
    lines: study.lines.map((l) => ({
      ...l,
      elementIds: [...l.elementIds],
      dependsOnDecisions: [...l.dependsOnDecisions],
      includedServices: [...l.includedServices],
      technicalReferences: l.technicalReferences.map((r) => ({ ...r })),
      qualityControls: [...l.qualityControls],
      technicalReservations: [...l.technicalReservations],
    })),
    hypotheses: study.hypotheses.map((h) => ({ ...h })),
    workflow: study.prepared ? ((study as unknown as { workflowJson?: unknown }).workflowJson as never) : null,
    resources: null,
  };
}

/** Charge l'état de travail depuis la vue (+ JSON bruts workflow/resources). */
async function loadWorkingState(orgId: string, studyId: string, db: Db): Promise<{
  study: PrepStudyView;
  state: WorkingState;
  version: number;
  projectId: string;
  bundleId: string | null;
}> {
  const row = await db.prepStudy.findFirst({
    where: { id: studyId, organizationId: orgId, archivedAt: null },
    select: {
      id: true,
      version: true,
      projectId: true,
      bundleId: true,
      workflowJson: true,
      resourcesJson: true,
    },
  });
  if (!row) throw new PrepError("Étude introuvable", 404);
  const study = await getPrepStudyView(orgId, studyId, db);
  if (!study) throw new PrepError("Étude introuvable", 404);
  const state = cloneState(study);
  state.workflow =
    row.workflowJson && typeof row.workflowJson === "object" && !Array.isArray(row.workflowJson)
      ? (JSON.parse(JSON.stringify(row.workflowJson)) as Record<string, unknown>)
      : null;
  state.resources =
    row.resourcesJson && typeof row.resourcesJson === "object" && !Array.isArray(row.resourcesJson)
      ? (JSON.parse(JSON.stringify(row.resourcesJson)) as Record<string, unknown>)
      : null;
  return { study, state, version: row.version, projectId: row.projectId, bundleId: row.bundleId };
}

function fmt(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return formatQty(v);
}

function lineFromPayload(payload: PrepPatchLinePayload, sortOrder: number): PrepLineDTO {
  const description = payload.technicalDescription ?? payload.description ?? null;
  return {
    code: payload.code,
    lot: payload.lot,
    subLot: payload.subLot ?? null,
    designation: payload.designation,
    description,
    includedServices: payload.includedServices ?? [],
    technicalReferences: payload.technicalReferences ?? [],
    executionNotes: payload.executionNotes ?? null,
    qualityControls: payload.qualityControls ?? [],
    technicalReservations: payload.technicalReservations ?? [],
    originalDesignation: payload.designation,
    textsUserEdited: false,
    unit: payload.unit,
    elementIds: payload.elementIds ?? [],
    formula: payload.formula ?? null,
    declaredQuantity: payload.declaredQuantity ?? null,
    provenance: payload.provenance ?? null,
    literalProvenance: null,
    justification: payload.justification ?? null,
    role: payload.role ?? "quote",
    nature: payload.nature ?? null,
    dependsOnDecisions: payload.dependsOnDecisions ?? [],
    notes: payload.notes ?? null,
    sortOrder,
    originalDeclared: payload.declaredQuantity ?? null,
    originalProvenance: payload.provenance ?? null,
    validatedQuantity: null,
    validatedAt: null,
  };
}

function applyOpsToState(
  state: WorkingState,
  patch: BeworkPrepPatchV1,
): { ops: PrepPatchPreviewOp[]; errors: string[] } {
  const ops: PrepPatchPreviewOp[] = [];
  const errors: string[] = [];
  const beforeEngine = computeStudy({ params: state.params, lines: state.lines });

  for (const op of patch.operations) {
    if (op.op === "update_parameter") {
      const p = state.params.find((x) => x.key === op.key);
      if (!p) {
        errors.push(`Paramètre inconnu : ${op.key}`);
        ops.push({ kind: "error", target: op.key, label: op.key, detail: "Paramètre introuvable" });
        continue;
      }
      if (p.formula && op.changes.value !== undefined) {
        errors.push(`${op.key} est calculé par formule : modifiez ses paramètres d'origine`);
        ops.push({
          kind: "error",
          target: op.key,
          label: p.label,
          detail: "Paramètre calculé — valeur non modifiable directement",
        });
        continue;
      }
      const fields: PrepPatchFieldChange[] = [];
      if (op.changes.value !== undefined && op.changes.value !== p.value) {
        fields.push({ field: "value", label: "Valeur", before: p.value, after: op.changes.value });
        p.value = op.changes.value;
        p.provenance = op.changes.provenance ?? "SAISIE_MANUELLE";
        p.modifiedAt = new Date().toISOString();
      }
      if (op.changes.label !== undefined && op.changes.label !== p.label) {
        fields.push({ field: "label", label: "Libellé", before: p.label, after: op.changes.label });
        p.label = op.changes.label;
      }
      if (op.changes.note !== undefined && op.changes.note !== p.note) {
        fields.push({ field: "note", label: "Note", before: p.note, after: op.changes.note });
        p.note = op.changes.note;
      }
      if (op.changes.provenance !== undefined && op.changes.value === undefined) {
        fields.push({
          field: "provenance",
          label: "Provenance",
          before: p.provenance,
          after: op.changes.provenance,
        });
        p.provenance = op.changes.provenance;
      }
      if (!fields.length) {
        ops.push({
          kind: "update",
          target: op.key,
          label: p.label,
          fields: [],
          quantityImpacts: [],
        });
        continue;
      }
      const afterEngine = computeStudy({ params: state.params, lines: state.lines });
      const quantityImpacts = state.lines
        .map((l) => {
          const b = beforeEngine.nodes.get(l.code)?.value ?? null;
          const a = afterEngine.nodes.get(l.code)?.value ?? null;
          return b !== a
            ? { code: l.code, designation: l.designation, before: b, after: a }
            : null;
        })
        .filter((x): x is NonNullable<typeof x> => !!x);
      ops.push({
        kind: "update",
        target: op.key,
        label: `Paramètre ${op.key} — ${p.label}`,
        fields,
        quantityImpacts,
      });
      continue;
    }

    if (op.op === "update_line") {
      const l = state.lines.find((x) => x.code === op.code);
      if (!l) {
        errors.push(`Ligne inconnue : ${op.code}`);
        ops.push({ kind: "error", target: op.code, label: op.code, detail: "Ligne introuvable" });
        continue;
      }
      const fields: PrepPatchFieldChange[] = [];
      const c = op.changes;
      if (c.designation !== undefined && c.designation !== l.designation) {
        fields.push({ field: "designation", label: "Désignation", before: l.designation, after: c.designation });
        l.designation = c.designation;
        l.textsUserEdited = true;
      }
      const nextDesc = c.technicalDescription ?? c.description;
      if (nextDesc !== undefined && nextDesc !== l.description) {
        fields.push({ field: "description", label: "Description technique", before: l.description, after: nextDesc });
        l.description = nextDesc;
        l.textsUserEdited = true;
      }
      if (c.includedServices !== undefined) {
        fields.push({
          field: "includedServices",
          label: "Prestations comprises",
          before: l.includedServices.join(" · ") || null,
          after: c.includedServices.join(" · ") || null,
        });
        l.includedServices = c.includedServices;
        l.textsUserEdited = true;
      }
      if (c.technicalReferences !== undefined) {
        fields.push({
          field: "technicalReferences",
          label: "Références techniques",
          before: l.technicalReferences.map((r) => r.label).join(", ") || null,
          after: c.technicalReferences.map((r) => r.label).join(", ") || null,
        });
        l.technicalReferences = c.technicalReferences as PrepTechnicalReference[];
        l.textsUserEdited = true;
      }
      if (c.executionNotes !== undefined && c.executionNotes !== l.executionNotes) {
        fields.push({
          field: "executionNotes",
          label: "Notes d'exécution",
          before: l.executionNotes,
          after: c.executionNotes,
        });
        l.executionNotes = c.executionNotes;
        l.textsUserEdited = true;
      }
      if (c.qualityControls !== undefined) {
        fields.push({
          field: "qualityControls",
          label: "Contrôles",
          before: l.qualityControls.join(" · ") || null,
          after: c.qualityControls.join(" · ") || null,
        });
        l.qualityControls = c.qualityControls;
        l.textsUserEdited = true;
      }
      if (c.technicalReservations !== undefined) {
        fields.push({
          field: "technicalReservations",
          label: "Réserves",
          before: l.technicalReservations.join(" · ") || null,
          after: c.technicalReservations.join(" · ") || null,
        });
        l.technicalReservations = c.technicalReservations;
        l.textsUserEdited = true;
      }
      if (c.notes !== undefined && c.notes !== l.notes) {
        fields.push({ field: "notes", label: "Notes", before: l.notes, after: c.notes });
        l.notes = c.notes;
      }
      if (c.justification !== undefined && c.justification !== l.justification) {
        fields.push({
          field: "justification",
          label: "Justification",
          before: l.justification,
          after: c.justification,
        });
        l.justification = c.justification;
      }
      if (c.declaredQuantity !== undefined) {
        if (l.formula) {
          errors.push(`${op.code} est calculée par formule : la quantité ne peut pas être forcée par patch`);
          ops.push({
            kind: "error",
            target: op.code,
            label: l.designation,
            detail: "Quantité calculée — modifiez les paramètres",
          });
          continue;
        }
        if (c.declaredQuantity !== l.declaredQuantity) {
          fields.push({
            field: "declaredQuantity",
            label: "Quantité",
            before: l.declaredQuantity,
            after: c.declaredQuantity,
          });
          l.declaredQuantity = c.declaredQuantity;
          l.provenance = (c.provenance ?? "SAISIE_MANUELLE") as StoredProvenance;
        }
      }
      if (c.role !== undefined && c.role !== l.role) {
        fields.push({ field: "role", label: "Rôle", before: l.role, after: c.role });
        l.role = c.role;
      }
      if (c.nature !== undefined && c.nature !== l.nature) {
        fields.push({ field: "nature", label: "Nature", before: l.nature, after: c.nature });
        l.nature = c.nature;
      }
      if (c.lot !== undefined && c.lot !== l.lot) {
        fields.push({ field: "lot", label: "Lot", before: l.lot, after: c.lot });
        l.lot = c.lot;
      }
      if (c.subLot !== undefined && c.subLot !== l.subLot) {
        fields.push({ field: "subLot", label: "Sous-lot", before: l.subLot, after: c.subLot });
        l.subLot = c.subLot;
      }
      const afterEngine = computeStudy({ params: state.params, lines: state.lines });
      const quantityImpacts = state.lines
        .map((line) => {
          const b = beforeEngine.nodes.get(line.code)?.value ?? null;
          const a = afterEngine.nodes.get(line.code)?.value ?? null;
          return b !== a
            ? { code: line.code, designation: line.designation, before: b, after: a }
            : null;
        })
        .filter((x): x is NonNullable<typeof x> => !!x);
      ops.push({
        kind: "update",
        target: op.code,
        label: `${op.code} — ${l.designation}`,
        fields,
        quantityImpacts,
      });
      continue;
    }

    if (op.op === "add_line") {
      if (state.lines.some((l) => l.code === op.line.code)) {
        errors.push(`Ligne déjà présente : ${op.line.code}`);
        ops.push({
          kind: "error",
          target: op.line.code,
          label: op.line.code,
          detail: "Code déjà utilisé dans l'étude",
        });
        continue;
      }
      let sortOrder = state.lines.reduce((m, l) => Math.max(m, l.sortOrder), -1) + 1;
      if (op.insertAfterCode) {
        const idx = state.lines.findIndex((l) => l.code === op.insertAfterCode);
        if (idx >= 0) {
          sortOrder = state.lines[idx]!.sortOrder + 1;
          for (const l of state.lines) {
            if (l.sortOrder >= sortOrder) l.sortOrder += 1;
          }
        }
      }
      const line = lineFromPayload(op.line, sortOrder);
      state.lines.push(line);
      state.lines.sort((a, b) => a.sortOrder - b.sortOrder);
      const engine = computeStudy({ params: state.params, lines: state.lines });
      if (engine.structural.length) {
        errors.push(...engine.structural.map((i) => i.message));
      }
      const qty = engine.nodes.get(line.code)?.value ?? line.declaredQuantity;
      ops.push({
        kind: "add",
        target: line.code,
        label: `${line.code} — ${line.designation}`,
        detail: `Nouvelle prestation · ${fmt(qty)} ${line.unit}`,
      });
      continue;
    }

    if (op.op === "delete_line") {
      const idx = state.lines.findIndex((l) => l.code === op.code);
      if (idx < 0) {
        errors.push(`Ligne inconnue : ${op.code}`);
        ops.push({ kind: "error", target: op.code, label: op.code, detail: "Ligne introuvable" });
        continue;
      }
      const [removed] = state.lines.splice(idx, 1);
      const engine = computeStudy({ params: state.params, lines: state.lines });
      if (engine.structural.some((i) => i.message.includes(op.code) || i.path?.includes(op.code))) {
        // références cassées
      }
      const broken = engine.structural.filter((i) => i.severity === "error");
      if (broken.length) {
        errors.push(...broken.map((i) => i.message));
        // rollback line for preview accuracy of subsequent ops? keep deleted and report error
      }
      ops.push({
        kind: "delete",
        target: op.code,
        label: `${op.code} — ${removed!.designation}`,
        detail: "Prestation retirée de l'étude",
      });
      continue;
    }

    if (op.op === "update_hypothesis") {
      const h = state.hypotheses.find((x) => x.id === op.id);
      if (!h) {
        errors.push(`Hypothèse inconnue : ${op.id}`);
        ops.push({ kind: "error", target: op.id, label: op.id, detail: "Hypothèse introuvable" });
        continue;
      }
      const fields: PrepPatchFieldChange[] = [];
      if (op.changes.statement !== undefined && op.changes.statement !== h.statement) {
        fields.push({ field: "statement", label: "Énoncé", before: h.statement, after: op.changes.statement });
        h.statement = op.changes.statement;
      }
      if (op.changes.reason !== undefined && op.changes.reason !== h.reason) {
        fields.push({ field: "reason", label: "Motif", before: h.reason, after: op.changes.reason });
        h.reason = op.changes.reason;
      }
      if (op.changes.toConfirmWith !== undefined && op.changes.toConfirmWith !== h.toConfirmWith) {
        fields.push({
          field: "toConfirmWith",
          label: "À confirmer avec",
          before: h.toConfirmWith,
          after: op.changes.toConfirmWith,
        });
        h.toConfirmWith = op.changes.toConfirmWith;
      }
      ops.push({ kind: "meta", target: op.id, label: `Hypothèse ${op.id}`, fields });
      continue;
    }

    if (op.op === "update_study") {
      const fields: PrepPatchFieldChange[] = [];
      if (op.changes.title !== undefined && op.changes.title !== state.title) {
        fields.push({ field: "title", label: "Titre", before: state.title, after: op.changes.title });
        state.title = op.changes.title;
      }
      if (op.changes.trade !== undefined && op.changes.trade !== state.trade) {
        fields.push({ field: "trade", label: "Corps d'état", before: state.trade, after: op.changes.trade });
        state.trade = op.changes.trade;
      }
      if (op.changes.description !== undefined && op.changes.description !== state.description) {
        fields.push({
          field: "description",
          label: "Description",
          before: state.description,
          after: op.changes.description,
        });
        state.description = op.changes.description;
      }
      ops.push({ kind: "meta", target: "study", label: "Métadonnées de l'étude", fields });
      continue;
    }

    if (op.op === "update_workflow") {
      state.workflow = { ...(state.workflow ?? {}), ...op.workflow };
      ops.push({
        kind: "meta",
        target: "workflow",
        label: "Mode opératoire",
        fields: [{ field: "workflow", label: "Workflow", before: "(existant)", after: "(mis à jour)" }],
      });
      continue;
    }

    if (op.op === "update_resources") {
      state.resources = { ...(state.resources ?? {}), ...op.resources };
      ops.push({
        kind: "meta",
        target: "resources",
        label: "Ressources / rendements",
        fields: [{ field: "resources", label: "Resources", before: "(existant)", after: "(mis à jour)" }],
      });
    }
  }

  const finalEngine = computeStudy({ params: state.params, lines: state.lines });
  if (finalEngine.structural.some((i) => i.severity === "error")) {
    for (const i of finalEngine.structural.filter((x) => x.severity === "error")) {
      if (!errors.includes(i.message)) errors.push(i.message);
    }
  }

  return { ops, errors };
}

function collectQuantityImpacts(
  before: ReturnType<typeof computeStudy>,
  after: ReturnType<typeof computeStudy>,
  lines: PrepLineDTO[],
) {
  return lines
    .map((l) => {
      const b = before.nodes.get(l.code)?.value ?? null;
      const a = after.nodes.get(l.code)?.value ?? null;
      if (b === a) return null;
      return { code: l.code, designation: l.designation, before: b, after: a, unit: l.unit };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
}

function fingerprintState(state: WorkingState): string {
  const payload = JSON.stringify({
    title: state.title,
    trade: state.trade,
    description: state.description,
    params: state.params.map((p) => ({
      key: p.key,
      value: p.value,
      formula: p.formula,
      provenance: p.provenance,
      label: p.label,
      note: p.note,
    })),
    lines: state.lines.map((l) => ({
      code: l.code,
      designation: l.designation,
      description: l.description,
      formula: l.formula,
      declaredQuantity: l.declaredQuantity,
      provenance: l.provenance,
      includedServices: l.includedServices,
      technicalReferences: l.technicalReferences,
      executionNotes: l.executionNotes,
      qualityControls: l.qualityControls,
      technicalReservations: l.technicalReservations,
      notes: l.notes,
      role: l.role,
      lot: l.lot,
      sortOrder: l.sortOrder,
    })),
    hypotheses: state.hypotheses,
    workflow: state.workflow,
    resources: state.resources,
  });
  return createHash("sha256").update(payload).digest("hex");
}

export async function previewPrepPatch(input: {
  orgId: string;
  studyId: string;
  patch: BeworkPrepPatchV1;
}): Promise<PrepPatchPreview> {
  const loaded = await loadWorkingState(input.orgId, input.studyId, prisma);
  const { study, state, version, bundleId } = loaded;

  const warnings: string[] = [];
  const errors: string[] = [];

  if (input.patch.target.studyId && input.patch.target.studyId !== study.id) {
    return {
      ok: false,
      studyId: study.id,
      studyTitle: study.title,
      version,
      versionMismatch: false,
      alreadyApplied: false,
      blockedReason: `Ce patch cible l'étude ${input.patch.target.studyId}, pas l'étude ouverte.`,
      operations: [],
      quantityImpacts: [],
      warnings,
      errors: [`Cible study_id incorrecte`],
    };
  }
  if (input.patch.target.bundleId && bundleId && input.patch.target.bundleId !== bundleId) {
    warnings.push(
      `bundle_id du patch (${input.patch.target.bundleId}) ≠ bundle de l'étude (${bundleId}).`,
    );
  }
  if (input.patch.target.titleMatch) {
    const needle = input.patch.target.titleMatch.trim().toLowerCase();
    if (!study.title.trim().toLowerCase().includes(needle)) {
      warnings.push(`Le titre de l'étude ne contient pas « ${input.patch.target.titleMatch} ».`);
    }
  }

  const already = await prisma.prepChatgptPatch.findFirst({
    where: {
      studyId: study.id,
      organizationId: input.orgId,
      patchId: input.patch.patchId,
      status: "APPLIED",
    },
    select: { id: true },
  });
  if (already) {
    return {
      ok: false,
      studyId: study.id,
      studyTitle: study.title,
      version,
      versionMismatch: false,
      alreadyApplied: true,
      blockedReason: "Ce patch a déjà été appliqué sur cette étude.",
      operations: [],
      quantityImpacts: [],
      warnings,
      errors: ["Patch déjà appliqué (même patch_id)."],
    };
  }

  const versionMismatch =
    input.patch.target.baseVersion != null && input.patch.target.baseVersion !== version;
  if (versionMismatch) {
    warnings.push(
      `Version attendue ${input.patch.target.baseVersion}, version actuelle ${version}. Vérifiez avant d'appliquer.`,
    );
  }

  const beforeEngine = computeStudy({ params: state.params, lines: state.lines });
  const { ops, errors: applyErrors } = applyOpsToState(state, input.patch);
  errors.push(...applyErrors);
  const afterEngine = computeStudy({ params: state.params, lines: state.lines });
  const quantityImpacts = collectQuantityImpacts(beforeEngine, afterEngine, state.lines);

  const ok = errors.length === 0 && !ops.some((o) => o.kind === "error");
  return {
    ok,
    studyId: study.id,
    studyTitle: study.title,
    version,
    versionMismatch: Boolean(versionMismatch),
    alreadyApplied: false,
    blockedReason: ok ? null : errors[0] ?? "Patch non applicable",
    operations: ops,
    quantityImpacts,
    warnings,
    errors,
  };
}

const jsonOrNull = (v: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull =>
  v === null || v === undefined ? Prisma.DbNull : (v as Prisma.InputJsonValue);

export async function applyPrepPatch(input: {
  orgId: string;
  studyId: string;
  userId: string;
  patch: BeworkPrepPatchV1;
  forceVersionMismatch?: boolean;
}): Promise<
  | { ok: true; version: number; patchRecordId: string; quantityImpacts: PrepPatchPreview["quantityImpacts"] }
  | { ok: false; error: string; code?: string; preview?: PrepPatchPreview }
> {
  const preview = await previewPrepPatch({
    orgId: input.orgId,
    studyId: input.studyId,
    patch: input.patch,
  });

  if (preview.alreadyApplied) {
    return { ok: false, error: preview.blockedReason ?? "Patch déjà appliqué", code: "ALREADY_APPLIED", preview };
  }
  if (!preview.ok) {
    return { ok: false, error: preview.errors[0] ?? preview.blockedReason ?? "Patch invalide", code: "INVALID", preview };
  }
  if (preview.versionMismatch && !input.forceVersionMismatch) {
    return {
      ok: false,
      error: preview.warnings[0] ?? "Version de l'étude différente — confirmation requise",
      code: "VERSION_MISMATCH",
      preview,
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const loaded = await loadWorkingState(input.orgId, input.studyId, tx);
      if (loaded.version !== preview.version) {
        throw new PrepError(
          "L'étude a été modifiée entre-temps. Rechargez puis réessayez.",
          409,
        );
      }
      const beforeState = JSON.parse(JSON.stringify(loaded.state)) as WorkingState;
      const beforeEngine = computeStudy({ params: loaded.state.params, lines: loaded.state.lines });
      const { errors } = applyOpsToState(loaded.state, input.patch);
      if (errors.length) throw new PrepError(errors[0]!, 422);
      const afterEngine = computeStudy({ params: loaded.state.params, lines: loaded.state.lines });
      if (afterEngine.structural.some((i) => i.severity === "error")) {
        throw new PrepError(afterEngine.structural.find((i) => i.severity === "error")!.message, 422);
      }

      const version = loaded.version + 1;
      await tx.prepStudy.update({
        where: { id: loaded.study.id },
        data: {
          title: loaded.state.title,
          trade: loaded.state.trade,
          description: loaded.state.description,
          hypothesesJson: jsonOrNull(loaded.state.hypotheses),
          workflowJson: jsonOrNull(loaded.state.workflow),
          resourcesJson: jsonOrNull(loaded.state.resources),
          version,
          updatedById: input.userId,
        },
      });

      // Paramètres : update un par un
      for (const p of loaded.state.params) {
        await tx.prepParameter.update({
          where: { studyId_key: { studyId: loaded.study.id, key: p.key } },
          data: {
            label: p.label,
            value: p.value,
            provenance: p.provenance,
            note: p.note,
            modifiedAt: p.modifiedAt ? new Date(p.modifiedAt) : null,
            modifiedById: p.modifiedAt ? input.userId : null,
          },
        });
      }

      const beforeCodes = new Set(beforeState.lines.map((l) => l.code));
      const afterCodes = new Set(loaded.state.lines.map((l) => l.code));
      for (const code of beforeCodes) {
        if (!afterCodes.has(code)) {
          await tx.prepTakeoffLine.delete({
            where: { studyId_code: { studyId: loaded.study.id, code } },
          });
        }
      }
      for (const l of loaded.state.lines) {
        const node = afterEngine.nodes.get(l.code);
        const data = {
          lot: l.lot,
          subLot: l.subLot,
          designation: l.designation,
          description: l.description,
          includedServicesJson: jsonOrNull(l.includedServices),
          technicalReferencesJson: jsonOrNull(l.technicalReferences),
          executionNotes: l.executionNotes,
          qualityControlsJson: jsonOrNull(l.qualityControls),
          technicalReservationsJson: jsonOrNull(l.technicalReservations),
          textsUserEdited: l.textsUserEdited,
          unit: l.unit,
          elementIdsJson: jsonOrNull(l.elementIds),
          formula: l.formula,
          declaredQuantity: l.declaredQuantity,
          provenance: l.provenance,
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
          originalDesignation: l.originalDesignation ?? l.designation,
        };
        if (beforeCodes.has(l.code)) {
          await tx.prepTakeoffLine.update({
            where: { studyId_code: { studyId: loaded.study.id, code: l.code } },
            data,
          });
        } else {
          await tx.prepTakeoffLine.create({
            data: {
              studyId: loaded.study.id,
              organizationId: input.orgId,
              code: l.code,
              ...data,
            },
          });
        }
      }

      // Mettre à jour les caches quantité même pour lignes non touchées (recalcul en cascade)
      for (const l of loaded.state.lines) {
        const a = afterEngine.nodes.get(l.code);
        const b = beforeEngine.nodes.get(l.code);
        if (a?.value !== b?.value || a?.error !== b?.error) {
          await tx.prepTakeoffLine.update({
            where: { studyId_code: { studyId: loaded.study.id, code: l.code } },
            data: { computedQuantity: a?.value ?? null, computeError: a?.error ?? null },
          });
        }
      }

      const fingerprintAfter = fingerprintState(loaded.state);
      const record = await tx.prepChatgptPatch.create({
        data: {
          organizationId: input.orgId,
          studyId: loaded.study.id,
          patchId: input.patch.patchId,
          versionBefore: loaded.version,
          versionAfter: version,
          status: "APPLIED",
          summaryJson: {
            operationsCount: input.patch.operations.length,
            quantityImpacts: collectQuantityImpacts(beforeEngine, afterEngine, loaded.state.lines),
            ops: preview.operations.map((o) => ({ kind: o.kind, target: o.target, label: o.label })),
          },
          snapshotBeforeJson: beforeState as unknown as Prisma.InputJsonValue,
          fingerprintAfter,
          appliedById: input.userId,
        },
      });
      await tx.prepStudyEvent.create({
        data: {
          studyId: loaded.study.id,
          organizationId: input.orgId,
          kind: "CHATGPT_PATCH",
          detailJson: {
            patchId: input.patch.patchId,
            recordId: record.id,
            operations: input.patch.operations.length,
            quantityImpacts: collectQuantityImpacts(beforeEngine, afterEngine, loaded.state.lines).length,
          },
          actorUserId: input.userId,
        },
      });
      return {
        version,
        patchRecordId: record.id,
        quantityImpacts: collectQuantityImpacts(beforeEngine, afterEngine, loaded.state.lines),
      };
    });

    return { ok: true, ...result };
  } catch (e) {
    if (e instanceof PrepError) {
      return { ok: false, error: e.message, code: String(e.status) };
    }
    console.error("[prep-chatgpt-patch/apply]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Impossible d'appliquer le patch", code: "ERROR" };
  }
}

export async function undoLastPrepPatch(input: {
  orgId: string;
  studyId: string;
  userId: string;
}): Promise<{ ok: true; version: number } | { ok: false; error: string }> {
  try {
    return await prisma.$transaction(async (tx) => {
      const loaded = await loadWorkingState(input.orgId, input.studyId, tx);
      const last = await tx.prepChatgptPatch.findFirst({
        where: {
          studyId: input.studyId,
          organizationId: input.orgId,
          status: "APPLIED",
        },
        orderBy: { appliedAt: "desc" },
      });
      if (!last) return { ok: false as const, error: "Aucune modification ChatGPT à annuler." };
      if (last.versionAfter !== loaded.version) {
        return {
          ok: false as const,
          error:
            "Des modifications ont été enregistrées depuis ce patch. L'annulation est refusée pour ne pas écraser votre travail.",
        };
      }
      const currentFp = fingerprintState(loaded.state);
      if (currentFp !== last.fingerprintAfter) {
        return {
          ok: false as const,
          error:
            "L'étude a été modifiée manuellement depuis ce patch. L'annulation automatique est désactivée.",
        };
      }
      const snap = last.snapshotBeforeJson as unknown as WorkingState;
      if (!snap?.params || !snap?.lines) {
        return { ok: false as const, error: "Copie antérieure indisponible." };
      }

      const version = loaded.version + 1;
      const engine = computeStudy({ params: snap.params, lines: snap.lines });

      await tx.prepParameter.deleteMany({ where: { studyId: input.studyId } });
      await tx.prepTakeoffLine.deleteMany({ where: { studyId: input.studyId } });

      await tx.prepStudy.update({
        where: { id: input.studyId },
        data: {
          title: snap.title,
          trade: snap.trade,
          description: snap.description,
          hypothesesJson: jsonOrNull(snap.hypotheses),
          workflowJson: jsonOrNull(snap.workflow),
          resourcesJson: jsonOrNull(snap.resources),
          version,
          updatedById: input.userId,
        },
      });

      for (const p of snap.params) {
        await tx.prepParameter.create({
          data: {
            studyId: input.studyId,
            organizationId: input.orgId,
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
          },
        });
      }
      for (const l of snap.lines) {
        const node = engine.nodes.get(l.code);
        await tx.prepTakeoffLine.create({
          data: {
            studyId: input.studyId,
            organizationId: input.orgId,
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
            originalDesignation: l.originalDesignation,
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
          },
        });
      }

      await tx.prepChatgptPatch.update({
        where: { id: last.id },
        data: { status: "UNDONE", undoneAt: new Date() },
      });
      await tx.prepStudyEvent.create({
        data: {
          studyId: input.studyId,
          organizationId: input.orgId,
          kind: "UNDO_CHATGPT_PATCH",
          detailJson: { patchId: last.patchId, recordId: last.id },
          actorUserId: input.userId,
        },
      });
      return { ok: true as const, version };
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Annulation impossible" };
  }
}

export async function getLastPrepPatchInfo(orgId: string, studyId: string, version: number) {
  const last = await prisma.prepChatgptPatch.findFirst({
    where: { studyId, organizationId: orgId, status: "APPLIED" },
    orderBy: { appliedAt: "desc" },
    select: {
      id: true,
      patchId: true,
      versionAfter: true,
      appliedAt: true,
      summaryJson: true,
    },
  });
  if (!last) return null;
  return {
    id: last.id,
    patchId: last.patchId,
    appliedAt: last.appliedAt.toISOString(),
    canUndo: last.versionAfter === version,
    undoBlockedReason:
      last.versionAfter === version
        ? null
        : "Des modifications ont été enregistrées depuis ce patch : annulation refusée.",
  };
}
