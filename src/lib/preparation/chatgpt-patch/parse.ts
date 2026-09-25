/**
 * Parse strict d'un bework_prep_patch_v1 (texte collé ou objet).
 */
import { LINE_CODE_RE, PARAM_KEY_RE } from "@/lib/preparation/engine/formula";
import { normalizePrepUnit } from "@/lib/preparation/units";
import {
  IMPORT_PROVENANCES,
  LINE_NATURES,
  LINE_ROLES,
  PREP_BUNDLE_FORMAT,
  TECH_REF_KINDS,
  type LineNature,
  type LineRole,
  type PrepTechnicalReference,
  type StoredProvenance,
  type TechRefKind,
} from "@/lib/preparation/types";
import {
  PREP_PATCH_FORMAT,
  type BeworkPrepPatchV1,
  type PrepPatchHypothesisChanges,
  type PrepPatchLineChanges,
  type PrepPatchLinePayload,
  type PrepPatchOperation,
  type PrepPatchParameterChanges,
  type PrepPatchParseIssue,
  type PrepPatchParseResult,
  type PrepPatchStudyChanges,
} from "@/lib/preparation/chatgpt-patch/types";

function issue(path: string, message: string, severity: "error" | "warn" = "error"): PrepPatchParseIssue {
  return { path, message, severity };
}

function asString(v: unknown, max = 8000): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

function asNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v.replace(",", ".").trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function stripFences(raw: string): string {
  return raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
}

function strList(v: unknown, maxItem = 500): string[] | undefined {
  if (v === undefined) return undefined;
  if (typeof v === "string") {
    return v
      .split(/\n|;/)
      .map((x) => x.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean)
      .map((x) => x.slice(0, maxItem));
  }
  if (!Array.isArray(v)) return undefined;
  return v.map((x) => asString(x, maxItem)).filter((x): x is string => !!x);
}

function readTechRefs(v: unknown, path: string, issues: PrepPatchParseIssue[]): PrepTechnicalReference[] | undefined {
  if (v === undefined) return undefined;
  if (!Array.isArray(v)) {
    issues.push(issue(path, "technical_references doit être un tableau"));
    return undefined;
  }
  const out: PrepTechnicalReference[] = [];
  v.forEach((item, i) => {
    if (typeof item === "string") {
      const label = asString(item, 200);
      if (label) out.push({ label, kind: "INDICATIVE", note: null });
      return;
    }
    if (!item || typeof item !== "object") {
      issues.push(issue(`${path}[${i}]`, "référence invalide", "warn"));
      return;
    }
    const o = item as Record<string, unknown>;
    const label = asString(o.label ?? o.name ?? o.ref, 200);
    if (!label) {
      issues.push(issue(`${path}[${i}]`, "libellé manquant", "warn"));
      return;
    }
    let kind: TechRefKind = "INDICATIVE";
    const raw = asString(o.kind ?? o.type, 40)?.toUpperCase().replace(/-/g, "_");
    if (raw && (TECH_REF_KINDS as string[]).includes(raw)) kind = raw as TechRefKind;
    out.push({ label, kind, note: asString(o.note, 2000) });
  });
  return out;
}

function readProvenance(v: unknown, path: string, issues: PrepPatchParseIssue[]): StoredProvenance | undefined {
  if (v === undefined) return undefined;
  const p = String(v);
  if ((IMPORT_PROVENANCES as readonly string[]).includes(p)) return p as StoredProvenance;
  if (p === "SAISIE_MANUELLE") {
    issues.push(issue(path, "SAISIE_MANUELLE est réservé à BeWork — utilisez HYPOTHESE", "warn"));
    return "HYPOTHESE";
  }
  issues.push(issue(path, `provenance « ${p} » inconnue`));
  return undefined;
}

function parseParameterChanges(
  raw: unknown,
  path: string,
  issues: PrepPatchParseIssue[],
): PrepPatchParameterChanges | null {
  if (!raw || typeof raw !== "object") {
    issues.push(issue(path, "Objet changes requis"));
    return null;
  }
  const o = raw as Record<string, unknown>;
  const changes: PrepPatchParameterChanges = {};
  let any = false;
  if ("value" in o) {
    if (o.value === null) changes.value = null;
    else {
      const n = asNum(o.value);
      if (n === null) {
        issues.push(issue(`${path}.value`, "Valeur numérique invalide"));
        return null;
      }
      changes.value = n;
    }
    any = true;
  }
  if ("label" in o) {
    const l = asString(o.label, 500);
    if (!l) {
      issues.push(issue(`${path}.label`, "Libellé vide interdit"));
      return null;
    }
    changes.label = l;
    any = true;
  }
  if ("note" in o) {
    changes.note = asString(o.note, 4000);
    any = true;
  }
  if ("provenance" in o) {
    const p = readProvenance(o.provenance, `${path}.provenance`, issues);
    if (p) {
      changes.provenance = p;
      any = true;
    }
  }
  if (!any) {
    issues.push(issue(path, "Aucun champ paramètre à modifier"));
    return null;
  }
  return changes;
}

function parseLineChanges(raw: unknown, path: string, issues: PrepPatchParseIssue[]): PrepPatchLineChanges | null {
  if (!raw || typeof raw !== "object") {
    issues.push(issue(path, "Objet changes requis"));
    return null;
  }
  const o = raw as Record<string, unknown>;
  const changes: PrepPatchLineChanges = {};
  let any = false;

  if ("designation" in o) {
    const d = asString(o.designation, 500);
    if (!d) {
      issues.push(issue(`${path}.designation`, "Désignation vide interdite"));
      return null;
    }
    changes.designation = d;
    any = true;
  }
  if ("description" in o || "technical_description" in o) {
    changes.description = asString(o.technical_description ?? o.description, 8000);
    changes.technicalDescription = changes.description;
    any = true;
  }
  if ("included_services" in o || "includedServices" in o) {
    changes.includedServices = strList(o.included_services ?? o.includedServices) ?? [];
    any = true;
  }
  if ("technical_references" in o || "technicalReferences" in o) {
    const refs = readTechRefs(o.technical_references ?? o.technicalReferences, `${path}.technical_references`, issues);
    if (refs) {
      changes.technicalReferences = refs;
      any = true;
    }
  }
  if ("execution_notes" in o || "executionNotes" in o) {
    changes.executionNotes = asString(o.execution_notes ?? o.executionNotes, 8000);
    any = true;
  }
  if ("quality_controls" in o || "qualityControls" in o) {
    changes.qualityControls = strList(o.quality_controls ?? o.qualityControls) ?? [];
    any = true;
  }
  if ("technical_reservations" in o || "technicalReservations" in o) {
    changes.technicalReservations = strList(o.technical_reservations ?? o.technicalReservations) ?? [];
    any = true;
  }
  if ("notes" in o) {
    changes.notes = asString(o.notes, 4000);
    any = true;
  }
  if ("justification" in o) {
    changes.justification = asString(o.justification, 4000);
    any = true;
  }
  if ("declared_quantity" in o || "declaredQuantity" in o || "quantity" in o) {
    const n = asNum(o.declared_quantity ?? o.declaredQuantity ?? o.quantity);
    if (n === null && (o.declared_quantity ?? o.declaredQuantity ?? o.quantity) !== null) {
      issues.push(issue(`${path}.declared_quantity`, "Quantité invalide"));
      return null;
    }
    changes.declaredQuantity = n;
    any = true;
  }
  if ("provenance" in o) {
    const p = readProvenance(o.provenance, `${path}.provenance`, issues);
    if (p) {
      changes.provenance = p;
      any = true;
    }
  }
  if ("role" in o) {
    const r = String(o.role);
    if ((LINE_ROLES as string[]).includes(r)) {
      changes.role = r as LineRole;
      any = true;
    } else issues.push(issue(`${path}.role`, `Rôle inconnu « ${r} »`));
  }
  if ("nature" in o) {
    if (o.nature === null) {
      changes.nature = null;
      any = true;
    } else {
      const n = String(o.nature);
      if ((LINE_NATURES as string[]).includes(n)) {
        changes.nature = n as LineNature;
        any = true;
      } else issues.push(issue(`${path}.nature`, `Nature inconnue « ${n} »`));
    }
  }
  if ("lot" in o) {
    const lot = asString(o.lot, 20);
    if (!lot) {
      issues.push(issue(`${path}.lot`, "Lot vide interdit"));
      return null;
    }
    changes.lot = lot;
    any = true;
  }
  if ("sub_lot" in o || "subLot" in o) {
    changes.subLot = asString(o.sub_lot ?? o.subLot, 120);
    any = true;
  }

  if (!any) {
    issues.push(issue(path, "Aucun champ de ligne à modifier"));
    return null;
  }
  return changes;
}

function parseLinePayload(raw: unknown, path: string, issues: PrepPatchParseIssue[]): PrepPatchLinePayload | null {
  if (!raw || typeof raw !== "object") {
    issues.push(issue(path, "Objet line requis"));
    return null;
  }
  const o = raw as Record<string, unknown>;
  const code = asString(o.id ?? o.code, 20);
  if (!code || !LINE_CODE_RE.test(code)) {
    issues.push(issue(`${path}.id`, `Identifiant de ligne invalide : « ${String(o.id ?? o.code ?? "")} »`));
    return null;
  }
  const designation = asString(o.designation, 500);
  if (!designation) {
    issues.push(issue(`${path}.designation`, "Désignation obligatoire"));
    return null;
  }
  const lot = asString(o.lot, 20);
  if (!lot) {
    issues.push(issue(`${path}.lot`, "Lot obligatoire"));
    return null;
  }
  const unitRaw = asString(o.unit, 20);
  if (!unitRaw) {
    issues.push(issue(`${path}.unit`, "Unité obligatoire"));
    return null;
  }
  const formula = asString(o.formula, 500);
  const declaredQuantity = asNum(o.declared_quantity ?? o.declaredQuantity ?? o.quantity);
  if (!formula && declaredQuantity === null) {
    issues.push(issue(path, `${code} : ni formule ni quantité déclarée`));
    return null;
  }
  let provenance: StoredProvenance | null = null;
  if (!formula) {
    provenance = readProvenance(o.provenance ?? "HYPOTHESE", `${path}.provenance`, issues) ?? "HYPOTHESE";
  }
  let role: LineRole = "quote";
  if (typeof o.role === "string" && (LINE_ROLES as string[]).includes(o.role)) role = o.role as LineRole;
  let nature: LineNature | null = null;
  if (typeof o.nature === "string" && (LINE_NATURES as string[]).includes(o.nature)) nature = o.nature as LineNature;

  return {
    code,
    lot,
    subLot: asString(o.sub_lot ?? o.subLot, 120),
    designation,
    description: asString(o.technical_description ?? o.description, 8000),
    technicalDescription: asString(o.technical_description ?? o.description, 8000),
    includedServices: strList(o.included_services ?? o.includedServices) ?? [],
    technicalReferences: readTechRefs(o.technical_references ?? o.technicalReferences, `${path}.technical_references`, issues) ?? [],
    executionNotes: asString(o.execution_notes ?? o.executionNotes, 8000),
    qualityControls: strList(o.quality_controls ?? o.qualityControls) ?? [],
    technicalReservations: strList(o.technical_reservations ?? o.technicalReservations) ?? [],
    unit: normalizePrepUnit(unitRaw).unit,
    elementIds: strList(o.element_ids ?? o.elementIds, 40) ?? [],
    formula,
    declaredQuantity,
    provenance,
    justification: asString(o.justification, 4000),
    role,
    nature,
    dependsOnDecisions: strList(o.depends_on_decisions ?? o.dependsOnDecisions, 40) ?? [],
    notes: asString(o.notes, 4000),
  };
}

function parseHypothesisChanges(
  raw: unknown,
  path: string,
  issues: PrepPatchParseIssue[],
): PrepPatchHypothesisChanges | null {
  if (!raw || typeof raw !== "object") {
    issues.push(issue(path, "Objet changes requis"));
    return null;
  }
  const o = raw as Record<string, unknown>;
  const changes: PrepPatchHypothesisChanges = {};
  let any = false;
  if ("statement" in o) {
    const s = asString(o.statement, 4000);
    if (!s) {
      issues.push(issue(`${path}.statement`, "Énoncé vide interdit"));
      return null;
    }
    changes.statement = s;
    any = true;
  }
  if ("reason" in o) {
    changes.reason = asString(o.reason, 4000);
    any = true;
  }
  if ("to_confirm_with" in o || "toConfirmWith" in o) {
    changes.toConfirmWith = asString(o.to_confirm_with ?? o.toConfirmWith, 500);
    any = true;
  }
  if (!any) {
    issues.push(issue(path, "Aucun champ d'hypothèse à modifier"));
    return null;
  }
  return changes;
}

function parseStudyChanges(raw: unknown, path: string, issues: PrepPatchParseIssue[]): PrepPatchStudyChanges | null {
  if (!raw || typeof raw !== "object") {
    issues.push(issue(path, "Objet changes requis"));
    return null;
  }
  const o = raw as Record<string, unknown>;
  const changes: PrepPatchStudyChanges = {};
  let any = false;
  if ("title" in o) {
    const t = asString(o.title, 500);
    if (!t) {
      issues.push(issue(`${path}.title`, "Titre vide interdit"));
      return null;
    }
    changes.title = t;
    any = true;
  }
  if ("trade" in o) {
    changes.trade = asString(o.trade, 120);
    any = true;
  }
  if ("description" in o) {
    changes.description = asString(o.description, 8000);
    any = true;
  }
  if (!any) {
    issues.push(issue(path, "Aucun champ d'étude à modifier"));
    return null;
  }
  return changes;
}

function normalizeOp(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
}

function parseOperation(raw: unknown, path: string, issues: PrepPatchParseIssue[]): PrepPatchOperation | null {
  if (!raw || typeof raw !== "object") {
    issues.push(issue(path, "Opération invalide"));
    return null;
  }
  const o = raw as Record<string, unknown>;
  const op = normalizeOp(o.op ?? o.operation ?? o.type);

  if (op === "update_parameter" || op === "update_param") {
    const key = asString(o.key ?? o.parameter_key ?? o.param, 120);
    if (!key || !PARAM_KEY_RE.test(key)) {
      issues.push(issue(`${path}.key`, `Clé de paramètre invalide : « ${String(o.key ?? "")} »`));
      return null;
    }
    const changes = parseParameterChanges(o.changes, `${path}.changes`, issues);
    if (!changes) return null;
    return { op: "update_parameter", key, changes };
  }

  if (op === "update_line" || op === "update_item" || op === "update_takeoff") {
    const code = asString(o.code ?? o.line_id ?? o.lineId ?? o.id, 20);
    if (!code || !LINE_CODE_RE.test(code)) {
      issues.push(issue(`${path}.code`, `Code de ligne invalide : « ${String(o.code ?? o.id ?? "")} »`));
      return null;
    }
    const changes = parseLineChanges(o.changes, `${path}.changes`, issues);
    if (!changes) return null;
    return { op: "update_line", code, changes };
  }

  if (op === "add_line" || op === "add_item" || op === "add_takeoff") {
    const line = parseLinePayload(o.line ?? o.item, `${path}.line`, issues);
    if (!line) return null;
    return {
      op: "add_line",
      line,
      insertAfterCode: asString(o.insert_after_code ?? o.insertAfterCode, 20),
    };
  }

  if (op === "delete_line" || op === "remove_line" || op === "deactivate_line") {
    const code = asString(o.code ?? o.line_id ?? o.lineId ?? o.id, 20);
    if (!code || !LINE_CODE_RE.test(code)) {
      issues.push(issue(`${path}.code`, `Code de ligne invalide`));
      return null;
    }
    return { op: "delete_line", code };
  }

  if (op === "update_hypothesis" || op === "update_hypothese") {
    const id = asString(o.id ?? o.hypothesis_id ?? o.hypothesisId, 40);
    if (!id) {
      issues.push(issue(`${path}.id`, "Identifiant d'hypothèse requis"));
      return null;
    }
    const changes = parseHypothesisChanges(o.changes, `${path}.changes`, issues);
    if (!changes) return null;
    return { op: "update_hypothesis", id, changes };
  }

  if (op === "update_study" || op === "update_meta") {
    const changes = parseStudyChanges(o.changes, `${path}.changes`, issues);
    if (!changes) return null;
    return { op: "update_study", changes };
  }

  if (op === "update_workflow" || op === "set_workflow") {
    const workflow = o.workflow ?? o.changes;
    if (!workflow || typeof workflow !== "object" || Array.isArray(workflow)) {
      issues.push(issue(`${path}.workflow`, "Objet workflow requis"));
      return null;
    }
    return { op: "update_workflow", workflow: workflow as Record<string, unknown> };
  }

  if (op === "update_resources" || op === "set_resources") {
    const resources = o.resources ?? o.changes;
    if (!resources || typeof resources !== "object" || Array.isArray(resources)) {
      issues.push(issue(`${path}.resources`, "Objet resources requis"));
      return null;
    }
    return { op: "update_resources", resources: resources as Record<string, unknown> };
  }

  issues.push(issue(`${path}.op`, `Opération non supportée : « ${String(o.op ?? "")} »`));
  return null;
}

/** Analyse le texte brut (JSON) collé ou téléversé. */
export function parsePrepPatchText(raw: string): PrepPatchParseResult {
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: false, errors: [issue("$", "Aucun contenu JSON fourni")] };
  }
  if (raw.length > 2_000_000) {
    return { ok: false, errors: [issue("$", "Fichier trop volumineux (2 Mo maximum)")] };
  }
  let data: unknown;
  try {
    data = JSON.parse(stripFences(raw));
  } catch (e) {
    return {
      ok: false,
      errors: [issue("$", `JSON invalide : ${e instanceof Error ? e.message : "structure illisible"}`)],
    };
  }
  return parsePrepPatch(data);
}

export function parsePrepPatch(input: unknown): PrepPatchParseResult {
  const errors: PrepPatchParseIssue[] = [];
  const warnings: PrepPatchParseIssue[] = [];
  const push = (i: PrepPatchParseIssue) => (i.severity === "error" ? errors : warnings).push(i);

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, errors: [issue("$", "Le JSON doit être un objet")] };
  }
  const root = input as Record<string, unknown>;
  const format = String(root.format ?? root.type ?? "");

  if (format === PREP_BUNDLE_FORMAT || format.startsWith("bework_prep_bundle")) {
    return {
      ok: false,
      errors: [
        issue(
          "format",
          `Ce JSON est un bundle d'import complet (${PREP_BUNDLE_FORMAT}). Utilisez « Réimporter un JSON », ou générez un ${PREP_PATCH_FORMAT}.`,
        ),
      ],
    };
  }
  if (format.startsWith("bework_quote_")) {
    return {
      ok: false,
      errors: [
        issue("format", "Ce format relève du module Devis & Facturation, pas du Métré."),
      ],
    };
  }
  if (format !== PREP_PATCH_FORMAT) {
    return {
      ok: false,
      errors: [
        issue(
          "format",
          `Format non reconnu : « ${format || "absent"} ». Attendu : ${PREP_PATCH_FORMAT}.`,
        ),
      ],
    };
  }

  const patchId = asString(root.patch_id ?? root.patchId, 120);
  if (!patchId || patchId.length < 4) {
    errors.push(issue("patch_id", "patch_id obligatoire (au moins 4 caractères)"));
  }

  const targetRaw = (root.target && typeof root.target === "object" ? root.target : {}) as Record<
    string,
    unknown
  >;
  const baseVersion =
    targetRaw.base_version !== undefined || targetRaw.baseVersion !== undefined
      ? asNum(targetRaw.base_version ?? targetRaw.baseVersion)
      : null;
  if (
    (targetRaw.base_version !== undefined || targetRaw.baseVersion !== undefined) &&
    (baseVersion === null || !Number.isInteger(baseVersion) || baseVersion < 1)
  ) {
    errors.push(issue("target.base_version", "base_version doit être un entier ≥ 1"));
  }

  const opsRaw = root.operations ?? root.ops ?? root.changes;
  if (!Array.isArray(opsRaw) || opsRaw.length === 0) {
    errors.push(issue("operations", "Au moins une opération est requise"));
  }
  if (Array.isArray(opsRaw) && opsRaw.length > 500) {
    errors.push(issue("operations", "Trop d'opérations (maximum 500)"));
  }

  const operations: PrepPatchOperation[] = [];
  const localIssues: PrepPatchParseIssue[] = [];
  if (Array.isArray(opsRaw)) {
    opsRaw.slice(0, 500).forEach((op, i) => {
      const parsed = parseOperation(op, `operations[${i}]`, localIssues);
      if (parsed) operations.push(parsed);
    });
  }
  for (const i of localIssues) push(i);

  if (errors.length || !patchId || operations.length === 0) {
    return { ok: false, errors: errors.length ? errors : [issue("operations", "Aucune opération valide")] };
  }

  const patch: BeworkPrepPatchV1 = {
    format: PREP_PATCH_FORMAT,
    patchId,
    target: {
      studyId: asString(targetRaw.study_id ?? targetRaw.studyId, 64),
      bundleId: asString(targetRaw.bundle_id ?? targetRaw.bundleId, 120),
      titleMatch: asString(targetRaw.title_match ?? targetRaw.titleMatch, 500),
      baseVersion,
    },
    operations,
  };
  return { ok: true, patch, warnings };
}
