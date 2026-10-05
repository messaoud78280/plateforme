/**
 * Parser pur bework_patch_v1 — aucune DB, aucune écriture.
 * Ne transforme jamais du langage naturel en opération.
 */
import {
  err,
  warn,
  type BeworkPatchIssue,
} from "@/lib/bework-patch/errors";
import {
  isIntentCompatibleWithOp,
  OPERATION_CATALOG,
} from "@/lib/bework-patch/operations-catalog";
import { normalizeDependsOnJson } from "@/lib/bework-patch/operation-contracts";
import {
  BEWORK_CHANGE_INTENTS,
  BEWORK_ENTITY_TYPES,
  BEWORK_PATCH_FORMAT,
  BEWORK_PATCH_SCHEMA_VERSION,
  BEWORK_PATCH_SECTIONS,
  type BeworkChangeIntent,
  type BeworkEntityType,
  type BeworkPatchOperation,
  type BeworkPatchOpName,
  type BeworkPatchOrigin,
  type BeworkPatchSection,
  type BeworkPatchTargetBase,
  type BeworkPatchV1,
} from "@/lib/bework-patch/types";

export type ParseBeworkPatchResult =
  | { ok: true; patch: BeworkPatchV1; warnings: BeworkPatchIssue[] }
  | { ok: false; errors: BeworkPatchIssue[]; warnings: BeworkPatchIssue[] };

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function str(v: unknown, max = 500): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, max);
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function bool(v: unknown): boolean | null {
  if (typeof v === "boolean") return v;
  return null;
}

function parseRawInput(rawInput: unknown): { obj: Record<string, unknown> | null; issues: BeworkPatchIssue[] } {
  const issues: BeworkPatchIssue[] = [];
  if (typeof rawInput === "string") {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      return { obj: null, issues: [err("INVALID_JSON", "$", "JSON vide")] };
    }
    // Extraire un éventuel bloc ```json
    let text = trimmed;
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence?.[1]) text = fence[1]!.trim();
    try {
      const parsed = JSON.parse(text) as unknown;
      if (!isObj(parsed)) {
        return {
          obj: null,
          issues: [err("INVALID_JSON", "$", "Le JSON racine doit être un objet")],
        };
      }
      return { obj: parsed, issues };
    } catch {
      return {
        obj: null,
        issues: [err("INVALID_JSON", "$", "JSON invalide — impossible de parser")],
      };
    }
  }
  if (!isObj(rawInput)) {
    return {
      obj: null,
      issues: [err("INVALID_JSON", "$", "Entrée non objet")],
    };
  }
  return { obj: rawInput, issues };
}

function parseSection(v: unknown, path: string, issues: BeworkPatchIssue[]): BeworkPatchSection | null {
  const s = str(v, 40);
  if (!s || !(BEWORK_PATCH_SECTIONS as readonly string[]).includes(s)) {
    issues.push(
      err(
        "INVALID_SECTION",
        path,
        `Section invalide « ${s ?? "?"} ». Attendu : ${BEWORK_PATCH_SECTIONS.join(", ")}`,
      ),
    );
    return null;
  }
  return s as BeworkPatchSection;
}

function parseIntent(v: unknown, path: string, issues: BeworkPatchIssue[]): BeworkChangeIntent | null {
  const s = str(v, 60);
  if (!s || !(BEWORK_CHANGE_INTENTS as readonly string[]).includes(s)) {
    issues.push(
      err(
        "UNSUPPORTED_INTENT",
        path,
        `change_intent invalide « ${s ?? "?"} »`,
      ),
    );
    return null;
  }
  return s as BeworkChangeIntent;
}

function parseEntityType(v: unknown, path: string, issues: BeworkPatchIssue[]): BeworkEntityType | null {
  const s = str(v, 60);
  if (!s || !(BEWORK_ENTITY_TYPES as readonly string[]).includes(s)) {
    issues.push(err("INVALID_TARGET", path, `entity_type invalide « ${s ?? "?"} »`));
    return null;
  }
  return s as BeworkEntityType;
}

function parseTarget(
  raw: unknown,
  path: string,
  issues: BeworkPatchIssue[],
): BeworkPatchTargetBase | null {
  if (!isObj(raw)) {
    issues.push(err("INVALID_TARGET", path, "target doit être un objet"));
    return null;
  }
  const entity_type = parseEntityType(raw.entity_type ?? raw.entityType, `${path}.entity_type`, issues);
  if (!entity_type) return null;

  const id = str(raw.id, 80);
  const code = str(raw.code ?? raw.line_code ?? raw.lineCode ?? raw.step_code ?? raw.stepCode, 80);
  const line_id = str(raw.line_id ?? raw.lineId, 80);
  const line_code = str(raw.line_code ?? raw.lineCode, 80);
  const item_id = str(raw.item_id ?? raw.itemId, 80);
  const parameter_id = str(raw.parameter_id ?? raw.parameterId, 80);
  const parameter_key = str(raw.parameter_key ?? raw.parameterKey ?? raw.key, 120);
  const study_id = str(raw.study_id ?? raw.studyId, 80);
  const quote_id = str(raw.quote_id ?? raw.quoteId, 80);
  const plan_id = str(raw.plan_id ?? raw.planId, 80);
  const visit_id = str(raw.visit_id ?? raw.visitId, 80);
  const document_id = str(raw.document_id ?? raw.documentId, 80);
  const sheet_id = str(raw.sheet_id ?? raw.sheetId, 80);
  const section_id = str(raw.section_id ?? raw.sectionId, 80);
  const task_id = str(raw.task_id ?? raw.taskId, 80);
  const step_code = str(raw.step_code ?? raw.stepCode, 80);
  const measurement_id = str(raw.measurement_id ?? raw.measurementId, 80);
  const project_id = str(raw.project_id ?? raw.projectId, 80);

  // ID + code fournis : on ne peut pas vérifier la cohérence DB ici,
  // mais on exige qu'ils soient tous deux non vides si présents en duo sur même niveau
  // (la cohérence ID↔code se fait en validatePatchContext).

  return {
    entity_type,
    id,
    code,
    project_id,
    study_id,
    quote_id,
    plan_id,
    visit_id,
    document_id,
    sheet_id,
    parameter_id,
    parameter_key,
    line_id,
    line_code,
    item_id,
    section_id,
    task_id,
    step_code,
    measurement_id,
  };
}

function requireTargetIds(
  target: BeworkPatchTargetBase,
  path: string,
  requirements: Array<keyof BeworkPatchTargetBase>,
  issues: BeworkPatchIssue[],
): boolean {
  let ok = true;
  for (const key of requirements) {
    const v = target[key];
    if (v == null || v === "") {
      issues.push(
        err("INVALID_TARGET", `${path}.${key}`, `Champ target.${String(key)} obligatoire`),
      );
      ok = false;
    }
  }
  return ok;
}

function parseChangesObject(
  raw: unknown,
  path: string,
  allowed: string[],
  issues: BeworkPatchIssue[],
): Record<string, unknown> | null {
  if (!isObj(raw)) {
    issues.push(err("INVALID_FIELD", path, "changes doit être un objet"));
    return null;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    const key = k.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
    const normalized =
      key === "unitpriceht" || key === "unit_price_ht"
        ? "unit_price_ht"
        : key === "vatrate" || key === "vat_rate"
          ? "vat_rate"
          : key === "discountpercent" || key === "discount_percent"
            ? "discount_percent"
            : key === "declaredquantity" || key === "declared_quantity"
              ? "declared_quantity"
              : key === "durationdays" || key === "duration_days"
                ? "duration_days"
                : key === "startdate" || key === "start_date"
                  ? "start_date"
                  : key === "clientnotes" || key === "client_notes"
                    ? "client_notes"
                    : key === "internalnotes" || key === "internal_notes"
                      ? "internal_notes"
                      : key === "paymentterms" || key === "payment_terms"
                        ? "payment_terms"
                        : key === "progresspercent" || key === "progress_percent"
                          ? "progress_percent"
                          : key === "actualquantity" || key === "actual_quantity"
                            ? "actual_quantity"
                            : key === "lengthm" || key === "length_m"
                              ? "length_m"
                              : key === "widthm" || key === "width_m"
                                ? "width_m"
                                : key === "heightm" || key === "height_m"
                                  ? "height_m"
                                  : key === "quantityvalue" || key === "quantity_value"
                                    ? "quantity_value"
                                    : key === "crewid" || key === "crew_id"
                                      ? "crew_id"
                                      : key === "crewsize" || key === "crew_size"
                                        ? "crew_size"
                                        : key === "rateid" || key === "rate_id"
                                          ? "rate_id"
                                          : key === "ratevalue" || key === "rate_value"
                                            ? "rate_value"
                                            : key === "parallelunits" || key === "parallel_units"
                                              ? "parallel_units"
                                              : key === "workloadpersondays" ||
                                                  key === "workload_person_days"
                                                ? "workload_person_days"
                                                : key === "dependson" || key === "depends_on"
                                                  ? "depends_on"
                                                  : key === "sectionkey" || key === "section_key"
                                                    ? "section_key"
                                                    : key;

    if (allowed.length && !allowed.includes(normalized)) {
      issues.push(
        err(
          "INVALID_FIELD",
          `${path}.${k}`,
          `Champ « ${k} » non autorisé. Autorisés : ${allowed.join(", ") || "(aucun)"}`,
        ),
      );
      continue;
    }
    out[normalized] = v;
  }
  if (!Object.keys(out).length && allowed.length) {
    issues.push(err("INVALID_FIELD", path, "changes vide"));
    return null;
  }
  return out;
}

function parseOperation(
  raw: unknown,
  index: number,
  intent: BeworkChangeIntent,
  originSection: BeworkPatchSection,
  issues: BeworkPatchIssue[],
): BeworkPatchOperation | null {
  const path = `operations[${index}]`;
  if (!isObj(raw)) {
    issues.push(err("UNKNOWN_OPERATION", path, "Opération non objet"));
    return null;
  }
  const opName = str(raw.op ?? raw.operation, 60);
  if (!opName || !(opName in OPERATION_CATALOG)) {
    issues.push(
      err("UNKNOWN_OPERATION", `${path}.op`, `Opération inconnue « ${opName ?? "?"} »`),
    );
    return null;
  }
  const op = opName as BeworkPatchOpName;
  const catalog = OPERATION_CATALOG[op];

  if (!catalog.sections.includes(originSection)) {
    // Origin ≠ section d'op autorisée : on autorise si target pointe ailleurs,
    // mais on warning — la règle métier stricte : op doit être dans le catalogue pour AU MOINS une section.
    // On n'errore que si l'op n'existe pour aucune section liée à l'intent.
  }

  const target = parseTarget(raw.target, `${path}.target`, issues);
  if (!target) return null;

  if (!catalog.entity_types.includes(target.entity_type)) {
    issues.push(
      err(
        "INVALID_TARGET",
        `${path}.target.entity_type`,
        `${op} n'accepte pas entity_type=${target.entity_type}`,
      ),
    );
    return null;
  }

  let changeKeys: string[] = [];
  let changes: Record<string, unknown> | null = null;

  const needChanges = ![
    "delete_line",
    "delete_quote_item",
    "remove_task",
    "add_line",
    "add_quote_item",
    "add_task",
    "add_measurement",
    "add_document_section",
  ].includes(op);

  if (needChanges) {
    changes = parseChangesObject(
      raw.changes,
      `${path}.changes`,
      catalog.allowed_change_fields,
      issues,
    );
    if (!changes) return null;
    changeKeys = Object.keys(changes);
  }

  const compat = isIntentCompatibleWithOp(intent, op, changeKeys);
  if (!compat.ok) {
    issues.push(
      err("INTENT_OPERATION_MISMATCH", path, compat.message ?? "Intent incompatible"),
    );
    return null;
  }

  switch (op) {
    case "update_parameter": {
      if (
        !requireTargetIds(target, `${path}.target`, ["study_id"], issues) ||
        (!target.parameter_id && !target.parameter_key && !target.id)
      ) {
        issues.push(
          err(
            "INVALID_TARGET",
            `${path}.target`,
            "parameter_id, parameter_key ou id requis",
          ),
        );
        return null;
      }
      const value = changes!.value !== undefined ? num(changes!.value) : undefined;
      if (changes!.value !== undefined && changes!.value !== null && value == null) {
        issues.push(err("INVALID_FIELD_TYPE", `${path}.changes.value`, "number attendu"));
        return null;
      }
      return {
        op,
        target: {
          ...target,
          entity_type: "PREP_PARAMETER",
          study_id: target.study_id!,
        },
        changes: {
          value: changes!.value === null ? null : value,
          label: str(changes!.label, 200) ?? undefined,
          note: str(changes!.note, 2000) ?? (changes!.note === null ? null : undefined),
        },
      };
    }
    case "update_line": {
      if (!requireTargetIds(target, `${path}.target`, ["study_id"], issues)) return null;
      if (!target.line_code && !target.code && !target.line_id && !target.id) {
        issues.push(err("INVALID_TARGET", `${path}.target`, "line_code ou line_id requis"));
        return null;
      }
      return {
        op,
        target: { ...target, entity_type: "PREP_LINE", study_id: target.study_id! },
        changes: {
          designation: str(changes!.designation, 300) ?? undefined,
          description:
            str(changes!.description, 5000) ??
            (changes!.description === null ? null : undefined),
          declared_quantity:
            changes!.declared_quantity !== undefined
              ? num(changes!.declared_quantity)
              : undefined,
          unit: str(changes!.unit, 40) ?? undefined,
          lot: str(changes!.lot, 120) ?? undefined,
          notes: str(changes!.notes, 2000) ?? (changes!.notes === null ? null : undefined),
        },
      };
    }
    case "add_line": {
      if (!requireTargetIds(target, `${path}.target`, ["study_id"], issues)) return null;
      if (!isObj(raw.line)) {
        issues.push(err("INVALID_FIELD", `${path}.line`, "line obligatoire"));
        return null;
      }
      const code = str(raw.line.code, 40);
      const lot = str(raw.line.lot, 120);
      const designation = str(raw.line.designation, 300);
      const unit = str(raw.line.unit, 40);
      if (!code || !lot || !designation || !unit) {
        issues.push(err("INVALID_FIELD", `${path}.line`, "code, lot, designation, unit requis"));
        return null;
      }
      return {
        op,
        target: { ...target, entity_type: "PREP_STUDY", study_id: target.study_id! },
        line: {
          code,
          lot,
          designation,
          unit,
          formula: str(raw.line.formula, 500),
          declared_quantity: num(raw.line.declared_quantity ?? raw.line.declaredQuantity),
          description: str(raw.line.description, 5000),
        },
        insert_after_code: str(raw.insert_after_code ?? raw.insertAfterCode, 40),
      };
    }
    case "delete_line": {
      if (!requireTargetIds(target, `${path}.target`, ["study_id"], issues)) return null;
      if (!target.line_code && !target.code && !target.id) {
        issues.push(err("INVALID_TARGET", `${path}.target`, "line_code requis"));
        return null;
      }
      return {
        op,
        target: { ...target, entity_type: "PREP_LINE", study_id: target.study_id! },
      };
    }
    case "update_hypothesis": {
      if (!requireTargetIds(target, `${path}.target`, ["study_id", "id"], issues)) return null;
      return {
        op,
        target: {
          ...target,
          entity_type: "PREP_HYPOTHESIS",
          study_id: target.study_id!,
          id: target.id!,
        },
        changes: {
          statement: str(changes!.statement, 2000) ?? undefined,
          reason: str(changes!.reason, 2000) ?? (changes!.reason === null ? null : undefined),
        },
      };
    }
    case "update_quote_item": {
      if (!requireTargetIds(target, `${path}.target`, ["quote_id"], issues)) return null;
      if (!target.item_id && !target.id) {
        issues.push(err("INVALID_TARGET", `${path}.target`, "item_id requis"));
        return null;
      }
      return {
        op,
        target: { ...target, entity_type: "QUOTE_ITEM", quote_id: target.quote_id! },
        changes: {
          designation: str(changes!.designation, 300) ?? undefined,
          description:
            str(changes!.description, 5000) ??
            (changes!.description === null ? null : undefined),
          quantity: changes!.quantity !== undefined ? num(changes!.quantity) ?? undefined : undefined,
          unit: str(changes!.unit, 40) ?? undefined,
          unit_price_ht:
            changes!.unit_price_ht !== undefined
              ? num(changes!.unit_price_ht) ?? undefined
              : undefined,
          vat_rate: changes!.vat_rate !== undefined ? num(changes!.vat_rate) ?? undefined : undefined,
          discount_percent:
            changes!.discount_percent !== undefined
              ? num(changes!.discount_percent) ?? undefined
              : undefined,
        },
      };
    }
    case "add_quote_item": {
      if (!requireTargetIds(target, `${path}.target`, ["quote_id"], issues)) return null;
      if (!isObj(raw.item)) {
        issues.push(err("INVALID_FIELD", `${path}.item`, "item obligatoire"));
        return null;
      }
      const designation = str(raw.item.designation, 300);
      const unit = str(raw.item.unit, 40);
      const quantity = num(raw.item.quantity);
      const unit_price_ht = num(raw.item.unit_price_ht ?? raw.item.unitPriceHt);
      if (!designation || !unit || quantity == null || unit_price_ht == null) {
        issues.push(
          err("INVALID_FIELD", `${path}.item`, "designation, unit, quantity, unit_price_ht requis"),
        );
        return null;
      }
      return {
        op,
        target: {
          ...target,
          entity_type:
            target.entity_type === "QUOTE_SECTION" ? "QUOTE_SECTION" : "COMMERCIAL_QUOTE",
          quote_id: target.quote_id!,
        },
        item: {
          designation,
          description: str(raw.item.description, 5000),
          quantity,
          unit,
          unit_price_ht,
          vat_rate: num(raw.item.vat_rate ?? raw.item.vatRate),
          discount_percent: num(raw.item.discount_percent ?? raw.item.discountPercent),
          item_id: str(raw.item.item_id ?? raw.item.itemId, 80),
        },
        section_id: str(raw.section_id ?? raw.sectionId, 80),
        section_title: str(raw.section_title ?? raw.sectionTitle, 200),
      };
    }
    case "delete_quote_item": {
      if (!requireTargetIds(target, `${path}.target`, ["quote_id"], issues)) return null;
      if (!target.item_id && !target.id) {
        issues.push(err("INVALID_TARGET", `${path}.target`, "item_id requis"));
        return null;
      }
      return {
        op,
        target: { ...target, entity_type: "QUOTE_ITEM", quote_id: target.quote_id! },
      };
    }
    case "update_quote_section": {
      if (!requireTargetIds(target, `${path}.target`, ["quote_id"], issues)) return null;
      const title = str(changes!.title, 200);
      if (!title) {
        issues.push(err("INVALID_FIELD", `${path}.changes.title`, "title requis"));
        return null;
      }
      return {
        op,
        target: { ...target, entity_type: "QUOTE_SECTION", quote_id: target.quote_id! },
        changes: { title },
      };
    }
    case "update_quote_meta": {
      if (!requireTargetIds(target, `${path}.target`, ["quote_id"], issues)) return null;
      return {
        op,
        target: {
          ...target,
          entity_type: "COMMERCIAL_QUOTE",
          quote_id: target.quote_id!,
        },
        changes: {
          subject: str(changes!.subject, 300) ?? undefined,
          client_notes: str(changes!.client_notes, 5000) ?? undefined,
          internal_notes: str(changes!.internal_notes, 5000) ?? undefined,
          payment_terms: str(changes!.payment_terms, 2000) ?? undefined,
        },
      };
    }
    case "update_task": {
      if (!requireTargetIds(target, `${path}.target`, ["plan_id"], issues)) return null;
      if (!target.task_id && !target.id && !target.step_code && !target.code) {
        issues.push(err("INVALID_TARGET", `${path}.target`, "task_id ou step_code requis"));
        return null;
      }
      const asStringArray = (v: unknown): string[] | undefined => {
        if (!Array.isArray(v)) return undefined;
        return v.filter((x): x is string => typeof x === "string");
      };
      const asEquip = (
        v: unknown,
      ): Array<{ equipment_id: string; count?: number }> | undefined => {
        if (!Array.isArray(v)) return undefined;
        const out: Array<{ equipment_id: string; count?: number }> = [];
        for (const x of v) {
          if (!x || typeof x !== "object") continue;
          const o = x as {
            equipment_id?: string;
            equipmentId?: string;
            count?: number;
          };
          const id = o.equipment_id ?? o.equipmentId;
          if (!id || typeof id !== "string") continue;
          out.push({
            equipment_id: id,
            count: typeof o.count === "number" ? o.count : 1,
          });
        }
        return out;
      };
      const asSupply = (
        v: unknown,
      ): Array<{ supply_id: string; count?: number }> | undefined => {
        if (!Array.isArray(v)) return undefined;
        const out: Array<{ supply_id: string; count?: number }> = [];
        for (const x of v) {
          if (!x || typeof x !== "object") continue;
          const o = x as { supply_id?: string; supplyId?: string; count?: number };
          const id = o.supply_id ?? o.supplyId;
          if (!id || typeof id !== "string") continue;
          out.push({
            supply_id: id,
            count: typeof o.count === "number" ? o.count : 1,
          });
        }
        return out;
      };
      return {
        op,
        target: {
          ...target,
          entity_type: "PREP_SCHEDULE_TASK",
          plan_id: target.plan_id!,
        },
        changes: {
          name: str(changes!.name, 200) ?? undefined,
          description:
            str(changes!.description, 4000) ??
            (changes!.description === null ? null : undefined),
          lot: str(changes!.lot, 120) ?? (changes!.lot === null ? null : undefined),
          preconditions: asStringArray(changes!.preconditions),
          controls: asStringArray(changes!.controls),
          safety: asStringArray(changes!.safety),
          equipment: asEquip(changes!.equipment),
          supplies: asSupply(changes!.supplies),
        },
      };
    }
    case "update_duration": {
      if (!requireTargetIds(target, `${path}.target`, ["plan_id"], issues)) return null;
      const duration_days = num(changes!.duration_days);
      if (duration_days == null || duration_days < 0) {
        issues.push(err("INVALID_FIELD_TYPE", `${path}.changes.duration_days`, "number ≥ 0"));
        return null;
      }
      return {
        op,
        target: {
          ...target,
          entity_type: "PREP_SCHEDULE_TASK",
          plan_id: target.plan_id!,
        },
        changes: { duration_days },
      };
    }
    case "update_productivity": {
      if (!requireTargetIds(target, `${path}.target`, ["plan_id"], issues)) return null;
      return {
        op,
        target: {
          ...target,
          entity_type: "PREP_SCHEDULE_TASK",
          plan_id: target.plan_id!,
        },
        changes: {
          rate_id: str(changes!.rate_id, 80),
          rate_value: num(changes!.rate_value),
          parallel_units: num(changes!.parallel_units) ?? undefined,
        },
      };
    }
    case "update_crew": {
      if (!requireTargetIds(target, `${path}.target`, ["plan_id"], issues)) return null;
      return {
        op,
        target: {
          ...target,
          entity_type: "PREP_SCHEDULE_TASK",
          plan_id: target.plan_id!,
        },
        changes: {
          crew_id: str(changes!.crew_id, 80),
          crew_size: num(changes!.crew_size),
          parallelizable: bool(changes!.parallelizable) ?? undefined,
        },
      };
    }
    case "update_dependency": {
      if (!requireTargetIds(target, `${path}.target`, ["plan_id"], issues)) return null;
      if (!Array.isArray(changes!.depends_on)) {
        issues.push(err("INVALID_FIELD", `${path}.changes.depends_on`, "tableau requis"));
        return null;
      }
      // Source unique = operation-contracts.normalizeDependsOnJson (contrat ChatGPT).
      const depends_on = normalizeDependsOnJson(changes!.depends_on);
      return {
        op,
        target: {
          ...target,
          entity_type: "PREP_SCHEDULE_TASK",
          plan_id: target.plan_id!,
        },
        changes: { depends_on },
      };
    }
    case "update_start_date": {
      if (!requireTargetIds(target, `${path}.target`, ["plan_id"], issues)) return null;
      const start_date =
        changes!.start_date === null
          ? null
          : str(changes!.start_date, 20);
      if (changes!.start_date !== null && start_date && !/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
        issues.push(
          err("INVALID_FIELD_TYPE", `${path}.changes.start_date`, "YYYY-MM-DD ou null"),
        );
        return null;
      }
      return {
        op,
        target: {
          ...target,
          entity_type: "PREP_SCHEDULE_PLAN",
          plan_id: target.plan_id!,
        },
        changes: { start_date: start_date ?? null },
      };
    }
    case "update_workload": {
      if (!requireTargetIds(target, `${path}.target`, ["plan_id"], issues)) return null;
      return {
        op,
        target: {
          ...target,
          entity_type: "PREP_SCHEDULE_TASK",
          plan_id: target.plan_id!,
        },
        changes: {
          workload_person_days: num(changes!.workload_person_days),
        },
      };
    }
    case "add_task": {
      if (!requireTargetIds(target, `${path}.target`, ["plan_id"], issues)) return null;
      if (!isObj(raw.task)) {
        issues.push(err("INVALID_FIELD", `${path}.task`, "task obligatoire"));
        return null;
      }
      const step_code = str(raw.task.step_code ?? raw.task.stepCode, 40);
      const name = str(raw.task.name, 200);
      const duration_days = num(raw.task.duration_days ?? raw.task.durationDays);
      if (!step_code || !name || duration_days == null) {
        issues.push(
          err("INVALID_FIELD", `${path}.task`, "step_code, name, duration_days requis"),
        );
        return null;
      }
      return {
        op,
        target: {
          ...target,
          entity_type: "PREP_SCHEDULE_PLAN",
          plan_id: target.plan_id!,
        },
        task: {
          step_code,
          name,
          duration_days,
          lot: str(raw.task.lot, 120),
          crew_id: str(raw.task.crew_id ?? raw.task.crewId, 80),
        },
      };
    }
    case "remove_task": {
      if (!requireTargetIds(target, `${path}.target`, ["plan_id"], issues)) return null;
      return {
        op,
        target: {
          ...target,
          entity_type: "PREP_SCHEDULE_TASK",
          plan_id: target.plan_id!,
        },
      };
    }
    case "update_visit": {
      const visitId = target.visit_id ?? target.id;
      if (!visitId) {
        issues.push(
          err("INVALID_TARGET", `${path}.target`, "visit_id requis"),
        );
        return null;
      }
      return {
        op,
        target: {
          ...target,
          entity_type: "SITE_VISIT",
          visit_id: visitId,
        },
        changes: {
          subject: str(changes!.subject, 200) ?? undefined,
          client_need:
            changes!.client_need === null
              ? null
              : str(changes!.client_need, 8000) ?? undefined,
          comments:
            changes!.comments === null
              ? null
              : str(changes!.comments, 8000) ?? undefined,
          findings: Array.isArray(changes!.findings)
            ? changes!.findings
            : undefined,
          proposed_works: Array.isArray(changes!.proposed_works)
            ? changes!.proposed_works
            : undefined,
          commercial:
            changes!.commercial && typeof changes!.commercial === "object"
              ? changes!.commercial
              : undefined,
          constraints:
            changes!.constraints && typeof changes!.constraints === "object"
              ? changes!.constraints
              : undefined,
          field_notes:
            changes!.field_notes === null
              ? null
              : str(changes!.field_notes, 8000) ?? undefined,
        },
      };
    }
    case "update_measurement": {
      if (!requireTargetIds(target, `${path}.target`, ["visit_id"], issues)) return null;
      if (!target.measurement_id && !target.id) {
        issues.push(err("INVALID_TARGET", `${path}.target`, "measurement_id requis"));
        return null;
      }
      return {
        op,
        target: {
          ...target,
          entity_type: "SITE_VISIT_MEASUREMENT",
          visit_id: target.visit_id!,
        },
        changes: {
          label: str(changes!.label, 200) ?? undefined,
          length_m: num(changes!.length_m),
          width_m: num(changes!.width_m),
          height_m: num(changes!.height_m),
          quantity_value: num(changes!.quantity_value),
          unit: str(changes!.unit, 40) ?? undefined,
          observation: str(changes!.observation, 2000) ?? undefined,
        },
      };
    }
    case "add_measurement": {
      if (!requireTargetIds(target, `${path}.target`, ["visit_id"], issues)) return null;
      if (!isObj(raw.measurement)) {
        issues.push(err("INVALID_FIELD", `${path}.measurement`, "measurement obligatoire"));
        return null;
      }
      const label = str(raw.measurement.label, 200);
      const unit = str(raw.measurement.unit, 40);
      if (!label || !unit) {
        issues.push(err("INVALID_FIELD", `${path}.measurement`, "label et unit requis"));
        return null;
      }
      return {
        op,
        target: { ...target, entity_type: "SITE_VISIT", visit_id: target.visit_id! },
        measurement: {
          label,
          unit,
          length_m: num(raw.measurement.length_m ?? raw.measurement.lengthM),
          width_m: num(raw.measurement.width_m ?? raw.measurement.widthM),
          height_m: num(raw.measurement.height_m ?? raw.measurement.heightM),
          quantity_value: num(
            raw.measurement.quantity_value ?? raw.measurement.quantityValue,
          ),
          observation: str(raw.measurement.observation, 2000),
        },
      };
    }
    case "update_follow_up": {
      const sheetId = target.sheet_id ?? target.id;
      if (!sheetId) {
        issues.push(
          err("INVALID_TARGET", `${path}.target`, "sheet_id requis"),
        );
        return null;
      }
      return {
        op,
        target: {
          ...target,
          entity_type: "FOLLOW_UP_SHEET",
          sheet_id: sheetId,
        },
        changes: {
          title: str(changes!.title, 200) ?? undefined,
          notes:
            changes!.notes === null
              ? null
              : str(changes!.notes, 8000) ?? undefined,
        },
      };
    }
    case "update_progress": {
      return {
        op,
        target: {
          ...target,
          entity_type:
            target.entity_type === "PREP_SCHEDULE_TASK"
              ? "PREP_SCHEDULE_TASK"
              : "FOLLOW_UP_SHEET",
        },
        changes: {
          progress_percent: num(changes!.progress_percent) ?? undefined,
          status: str(changes!.status, 40) ?? undefined,
          actual_quantity: num(changes!.actual_quantity),
          note: str(changes!.note, 2000) ?? undefined,
        },
      };
    }
    case "update_report": {
      const documentId = target.document_id ?? target.id;
      if (!documentId) {
        issues.push(
          err("INVALID_TARGET", `${path}.target`, "document_id requis"),
        );
        return null;
      }
      return {
        op,
        target: {
          ...target,
          entity_type: "SITE_DOCUMENT",
          document_id: documentId,
        },
        changes: {
          title: str(changes!.title, 200) ?? undefined,
          quick_notes:
            changes!.quick_notes === null
              ? null
              : str(changes!.quick_notes, 20000) ?? undefined,
          summary:
            changes!.summary === null
              ? null
              : str(changes!.summary, 20000) ?? undefined,
          additional_notes:
            changes!.additional_notes === null
              ? null
              : str(changes!.additional_notes, 20000) ?? undefined,
        },
      };
    }
    case "update_notice": {
      const documentId = target.document_id ?? target.id;
      if (!documentId) {
        issues.push(
          err("INVALID_TARGET", `${path}.target`, "document_id requis"),
        );
        return null;
      }
      return {
        op,
        target: {
          ...target,
          entity_type: "SITE_DOCUMENT",
          document_id: documentId,
        },
        changes: {
          title: str(changes!.title, 200) ?? undefined,
          quick_notes:
            changes!.quick_notes === null
              ? null
              : str(changes!.quick_notes, 20000) ?? undefined,
          summary:
            changes!.summary === null
              ? null
              : str(changes!.summary, 20000) ?? undefined,
          additional_notes:
            changes!.additional_notes === null
              ? null
              : str(changes!.additional_notes, 20000) ?? undefined,
        },
      };
    }
    case "update_document_section": {
      if (!requireTargetIds(target, `${path}.target`, ["document_id"], issues)) return null;
      return {
        op,
        target: {
          ...target,
          entity_type: "SITE_DOCUMENT",
          document_id: target.document_id!,
        },
        changes: {
          section_key: str(changes!.section_key, 80) ?? undefined,
          title: str(changes!.title, 200) ?? undefined,
          text: str(changes!.text, 20000) ?? undefined,
        },
      };
    }
    case "add_document_section": {
      if (!requireTargetIds(target, `${path}.target`, ["document_id"], issues)) return null;
      if (!isObj(raw.section)) {
        issues.push(err("INVALID_FIELD", `${path}.section`, "section obligatoire"));
        return null;
      }
      const title = str(raw.section.title, 200);
      if (!title) {
        issues.push(err("INVALID_FIELD", `${path}.section.title`, "title requis"));
        return null;
      }
      return {
        op,
        target: {
          ...target,
          entity_type: "SITE_DOCUMENT",
          document_id: target.document_id!,
        },
        section: {
          key: str(raw.section.key, 80) ?? undefined,
          title,
          text: str(raw.section.text, 20000) ?? undefined,
        },
      };
    }
    case "update_text": {
      const field = str(changes!.field, 80);
      const textVal = str(changes!.text, 20000);
      if (!field || textVal == null) {
        issues.push(err("INVALID_FIELD", `${path}.changes`, "field et text requis"));
        return null;
      }
      return {
        op,
        target: {
          ...target,
          entity_type:
            target.entity_type === "FOLLOW_UP_SHEET" ? "FOLLOW_UP_SHEET" : "SITE_DOCUMENT",
        },
        changes: { field, text: textVal },
      };
    }
    default: {
      issues.push(err("UNKNOWN_OPERATION", path, `Opération non gérée`));
      return null;
    }
  }
}

/**
 * Parse strict d’un bework_patch_v1 (texte collé ou objet).
 * Refuse le langage naturel et les bundles de création.
 */
export function parseBeworkPatch(rawInput: unknown): ParseBeworkPatchResult {
  const { obj, issues: parseIssues } = parseRawInput(rawInput);
  if (!obj) {
    return { ok: false, errors: parseIssues, warnings: [] };
  }

  const errors: BeworkPatchIssue[] = [...parseIssues];
  const warnings: BeworkPatchIssue[] = [];

  const type = str(obj.type ?? obj.format, 80);
  if (type === "bework_quote_patch_v1" || type === "bework_prep_patch_v1") {
    errors.push(
      err(
        "INVALID_PATCH_TYPE",
        "type",
        `Format legacy « ${type} » — utiliser le moteur historique dédié, ou envelopper en bework_patch_v1.`,
      ),
    );
    return { ok: false, errors, warnings };
  }
  if (type === "bework_technical_bundle_v1" || type === "bework_quote_bundle_v1") {
    errors.push(
      err(
        "INVALID_PATCH_TYPE",
        "type",
        `« ${type} » est un format de création/import, pas un patch. Utilisez bework_patch_v1.`,
      ),
    );
    return { ok: false, errors, warnings };
  }
  if (type !== BEWORK_PATCH_FORMAT) {
    errors.push(
      err(
        "INVALID_PATCH_TYPE",
        "type",
        `type attendu « ${BEWORK_PATCH_FORMAT} », reçu « ${type ?? "?"} »`,
      ),
    );
  }

  const schemaVersion = num(obj.schema_version ?? obj.schemaVersion);
  if (schemaVersion == null || schemaVersion !== BEWORK_PATCH_SCHEMA_VERSION) {
    errors.push(
      err(
        "UNSUPPORTED_SCHEMA_VERSION",
        "schema_version",
        `schema_version=${schemaVersion ?? "?"} non supportée (attendu ${BEWORK_PATCH_SCHEMA_VERSION})`,
      ),
    );
  }

  const patchId = str(obj.patch_id ?? obj.patchId, 120);
  if (!patchId || patchId.length < 4) {
    errors.push(
      err("INVALID_PATCH_ID", "patch_id", "patch_id requis (min. 4 caractères)"),
    );
  }

  if (!isObj(obj.origin)) {
    errors.push(err("INVALID_TARGET", "origin", "origin obligatoire"));
    return { ok: false, errors, warnings };
  }

  const section = parseSection(obj.origin.section, "origin.section", errors);
  const projectId = str(obj.origin.project_id ?? obj.origin.projectId, 80);
  const entityId = str(obj.origin.entity_id ?? obj.origin.entityId, 80);
  const baseVersion = num(obj.origin.base_version ?? obj.origin.baseVersion);
  if (!projectId) errors.push(err("INVALID_TARGET", "origin.project_id", "project_id requis"));
  if (!entityId) errors.push(err("INVALID_TARGET", "origin.entity_id", "entity_id requis"));
  if (baseVersion == null || !Number.isInteger(baseVersion) || baseVersion < 1) {
    errors.push(
      err("VERSION_CONFLICT", "origin.base_version", "base_version entier ≥ 1 requis"),
    );
  }

  const intent = parseIntent(obj.change_intent ?? obj.changeIntent, "change_intent", errors);
  const reason = str(obj.reason, 2000);
  if (!reason) {
    warnings.push(
      warn("REASON_MISSING", "reason", "Motif (reason) recommandé pour la traçabilité"),
    );
  }

  if (!Array.isArray(obj.operations) || obj.operations.length === 0) {
    errors.push(err("EMPTY_OPERATIONS", "operations", "Au moins une opération requise"));
  }

  if (errors.length || !section || !intent || !patchId || !projectId || !entityId || baseVersion == null) {
    return { ok: false, errors, warnings };
  }

  const origin: BeworkPatchOrigin = {
    section,
    project_id: projectId,
    entity_id: entityId,
    base_version: baseVersion,
  };

  const operations: BeworkPatchOperation[] = [];
  const rawOps = obj.operations as unknown[];
  for (let i = 0; i < rawOps.length; i++) {
    const op = parseOperation(rawOps[i], i, intent, section, errors);
    if (op) operations.push(op);
  }

  if (errors.length || !operations.length) {
    return { ok: false, errors, warnings };
  }

  const patch: BeworkPatchV1 = {
    type: BEWORK_PATCH_FORMAT,
    schema_version: BEWORK_PATCH_SCHEMA_VERSION,
    patch_id: patchId,
    origin,
    change_intent: intent,
    reason: reason ?? null,
    operations,
  };

  return { ok: true, patch, warnings };
}
