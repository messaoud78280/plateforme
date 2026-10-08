/**
 * BeWork Impact Engine V1 — analyse + simulation (lecture seule).
 *
 * TAKEOFF ↔ QUOTE ↔ PLANNING uniquement.
 * Aucune écriture · aucune propagation réelle.
 */
import type { BeworkPatchOperation, BeworkPatchV1 } from "@/lib/bework-patch/types";
import { buildCanonicalResolution } from "@/lib/bework-patch/context";
import type { BeworkPatchIssue } from "@/lib/bework-patch/errors";
import {
  classifyQuoteLink,
  isQuoteProtected,
  quoteProtectionReason,
} from "@/lib/bework-patch/impact/protection";
import {
  annotateDirectChangesWithProtection,
  detectValidatedQuantityDivergences,
  evaluatePatchSourceProtection,
} from "@/lib/bework-patch/impact/source-protection";
import { simulateTakeoffFromParamChange } from "@/lib/bework-patch/impact/simulate-takeoff";
import {
  simulateQuoteLine,
  simulateQuoteTotals,
} from "@/lib/bework-patch/impact/simulate-quote";
import {
  simulateDependencyDateImpact,
  simulatePlanFromQuantityMap,
} from "@/lib/bework-patch/impact/simulate-planning";
import type {
  AffectedEntity,
  AnalyzePatchImpactResult,
  DerivedChange,
  DirectChange,
  ImpactGraphNode,
  ImpactSubgraph,
  ProtectedEntity,
  OverrideFlag,
} from "@/lib/bework-patch/impact/types";

function issue(
  code: BeworkPatchIssue["code"],
  message: string,
  severity: "error" | "warn" = "warn",
  path = "impact",
): BeworkPatchIssue {
  return { code, path, message, severity };
}

function emptyResult(
  extras?: Partial<AnalyzePatchImpactResult>,
): AnalyzePatchImpactResult {
  return {
    directChanges: [],
    canonicalResolution: buildCanonicalResolution({}),
    derivedChanges: [],
    affectedEntities: [],
    protectedEntities: [],
    overrides: [],
    warnings: [],
    errors: [],
    impactSummary: {
      affectedSections: [],
      simulationOnly: true,
      canPropagate: false,
      certainCount: 0,
      partialCount: 0,
      potentialCount: 0,
      protectedCount: 0,
      overrideCount: 0,
    },
    graph: [],
    ...extras,
  };
}

function summarizeImpact(
  derived: DerivedChange[],
  protectedEntities: ProtectedEntity[],
  overrides: OverrideFlag[],
  sections: Set<"TAKEOFF" | "QUOTE" | "PLANNING">,
): AnalyzePatchImpactResult["impactSummary"] {
  return {
    affectedSections: [...sections],
    simulationOnly: true,
    canPropagate: false,
    certainCount: derived.filter((d) => d.certainty === "CERTAIN" && !d.blocked).length,
    partialCount: derived.filter((d) => d.certainty === "PARTIAL").length,
    potentialCount: derived.filter((d) => d.certainty === "POTENTIAL").length,
    protectedCount: protectedEntities.length,
    overrideCount: overrides.length,
  };
}

function pushAffected(
  list: AffectedEntity[],
  e: AffectedEntity,
) {
  if (list.some((x) => x.id === e.id && x.section === e.section)) return;
  list.push(e);
}

/**
 * Point d’entrée Impact Engine — pure (aucune I/O).
 */
export function analyzePatchImpact(input: {
  patch: BeworkPatchV1;
  subgraph: ImpactSubgraph;
}): AnalyzePatchImpactResult {
  const { patch, subgraph } = input;
  const section = patch.origin.section;

  // Sections hors V1 : pas de graphe cross-module
  if (section === "NOTICE") {
    return analyzeNoticeLocal(patch, subgraph);
  }

  if (section === "REPORT") {
    return analyzeReportLocal(patch, subgraph);
  }

  if (section === "FOLLOW_UP") {
    return analyzeFollowUpLocal(patch, subgraph);
  }

  if (section === "SUPPLY") {
    return analyzeSupplyLocal(patch, subgraph);
  }

  if (section === "VISIT") {
    return analyzeVisitLocal(patch, subgraph);
  }

  if (section === "QUOTE" && patch.change_intent === "COMMERCIAL_ADJUSTMENT") {
    return analyzeCommercialQuote(patch, subgraph);
  }

  if (section === "PLANNING") {
    return analyzePlanningLocal(patch, subgraph);
  }

  if (section === "TAKEOFF") {
    return analyzeTakeoffTechnical(patch, subgraph);
  }

  if (section === "QUOTE" && patch.change_intent === "TECHNICAL_CORRECTION") {
    return analyzeQuoteTechnical(patch, subgraph);
  }

  // Autres intents QUOTE → local devis
  if (section === "QUOTE") {
    return analyzeCommercialQuote(patch, subgraph);
  }

  return emptyResult({
    warnings: [
      issue(
        "IMPACT_UNSUPPORTED",
        `Intent ${patch.change_intent} / section ${section} non couvert par Impact Engine V1.`,
      ),
    ],
    directChanges: extractDirectChanges(patch, subgraph),
  });
}

/* ─── Direct changes (explicite uniquement) ─── */

function extractDirectChanges(
  patch: BeworkPatchV1,
  subgraph: ImpactSubgraph,
): DirectChange[] {
  const out: DirectChange[] = [];
  for (const op of patch.operations) {
    const d = describeDirectOp(op, subgraph, patch.origin.section);
    if (d) out.push(d);
  }
  return out;
}

function describeDirectOp(
  op: BeworkPatchOperation,
  subgraph: ImpactSubgraph,
  section: BeworkPatchV1["origin"]["section"],
): DirectChange | null {
  if (op.op === "update_parameter") {
    const key = op.target.parameter_key ?? null;
    const id = op.target.parameter_id ?? op.target.id ?? null;
    const param = subgraph.study?.params.find(
      (p) => p.key === key || p.id === id,
    );
    if (op.changes.value === undefined) return null;
    return {
      op: op.op,
      section,
      entityType: "PREP_PARAMETER",
      entityId: param?.id ?? id,
      label: param?.label ?? key ?? "paramètre",
      field: "value",
      before: param?.value ?? null,
      after: op.changes.value,
      unit: param?.unit ?? null,
    };
  }
  if (op.op === "update_line") {
    const code = op.target.line_code ?? op.target.code ?? null;
    const lineId = op.target.line_id ?? op.target.id ?? null;
    const line = subgraph.study?.lines.find(
      (l) =>
        (code != null && l.code === code) ||
        (lineId != null && l.id === lineId),
    );
    const sheetKeysTouched =
      op.changes.included_services !== undefined ||
      op.changes.technical_references !== undefined ||
      op.changes.execution_notes !== undefined ||
      op.changes.quality_controls !== undefined ||
      op.changes.technical_reservations !== undefined ||
      op.changes.designation !== undefined ||
      op.changes.description !== undefined;
    const manualTextsOverride = Boolean(
      line?.textsUserEdited && sheetKeysTouched,
    );
    if (op.changes.declared_quantity === undefined) {
      return {
        op: op.op,
        section,
        entityType: "PREP_LINE",
        entityId: line?.id ?? op.target.id ?? null,
        label: line?.designation ?? code ?? "ligne",
        field: "meta",
        before: {
          designation: line?.designation ?? null,
          description: line?.description ?? null,
          lot: line?.lot ?? null,
          notes: line?.notes ?? null,
          included_services: line?.includedServices ?? [],
          technical_references: line?.technicalReferences ?? [],
          execution_notes: line?.executionNotes ?? null,
          quality_controls: line?.qualityControls ?? [],
          technical_reservations: line?.technicalReservations ?? [],
          texts_user_edited: line?.textsUserEdited ?? false,
        },
        after: op.changes,
        unit: line?.unit ?? null,
        manualTextsOverride,
      };
    }
    return {
      op: op.op,
      section,
      entityType: "PREP_LINE",
      entityId: line?.id ?? null,
      label: line?.designation ?? code ?? "ligne",
      field: "declared_quantity",
      before: line?.declaredQuantity ?? null,
      after: op.changes.declared_quantity,
      unit: line?.unit ?? null,
      manualTextsOverride,
    };
  }
  if (op.op === "add_line") {
    const existing = subgraph.study?.lines.find((l) => l.code === op.line.code);
    return {
      op: op.op,
      section,
      entityType: "PREP_LINE",
      entityId: existing?.id ?? op.line.code,
      label: `${op.line.code} · ${op.line.designation}`.trim(),
      field: "line",
      before: null,
      after: {
        code: op.line.code,
        lot: op.line.lot,
        designation: op.line.designation,
        description: op.line.description ?? null,
        unit: op.line.unit,
        declared_quantity: op.line.declared_quantity ?? null,
        formula: op.line.formula ?? null,
        provenance: op.line.provenance ?? null,
        role: op.line.role ?? "quote",
        nature: op.line.nature ?? null,
        notes: op.line.notes ?? null,
        included_services: op.line.included_services ?? [],
        technical_references: op.line.technical_references ?? [],
        execution_notes: op.line.execution_notes ?? null,
        quality_controls: op.line.quality_controls ?? [],
        technical_reservations: op.line.technical_reservations ?? [],
        insert_after_code: op.insert_after_code ?? null,
      },
      unit: op.line.unit,
      proposalProvenanceKind: op.line.provenance ?? null,
      proposalProvenanceLabel: op.line.provenance ?? null,
    };
  }
  if (op.op === "delete_line") {
    const code = op.target.line_code ?? op.target.code ?? null;
    const lineId = op.target.line_id ?? op.target.id ?? null;
    const line = subgraph.study?.lines.find(
      (l) =>
        (code != null && l.code === code) ||
        (lineId != null && l.id === lineId),
    );
    return {
      op: op.op,
      section,
      entityType: "PREP_LINE",
      entityId: line?.id ?? code,
      label: line
        ? `${line.code} · ${line.designation}`
        : code ?? "ligne",
      field: "line",
      before: line
        ? {
            code: line.code,
            designation: line.designation,
            unit: line.unit,
            declared_quantity: line.declaredQuantity,
          }
        : { code },
      after: null,
      unit: line?.unit ?? null,
    };
  }
  if (op.op === "update_quote_item") {
    const quote = subgraph.quotes.find((q) => q.id === op.target.quote_id);
    const line = quote?.lines.find(
      (l) => l.id === op.target.item_id || l.id === op.target.id,
    );
    const field =
      op.changes.quantity !== undefined
        ? "quantity"
        : op.changes.unit_price_ht !== undefined
          ? "unit_price_ht"
          : op.changes.discount_percent !== undefined
            ? "discount_percent"
            : "meta";
    const before =
      field === "quantity"
        ? line?.quantity ?? null
        : field === "unit_price_ht"
          ? line?.unitSellHt ?? null
          : field === "discount_percent"
            ? line?.discountPercent ?? null
            : null;
    const after =
      field === "quantity"
        ? op.changes.quantity
        : field === "unit_price_ht"
          ? op.changes.unit_price_ht
          : field === "discount_percent"
            ? op.changes.discount_percent
            : op.changes;
    return {
      op: op.op,
      section,
      entityType: "QUOTE_ITEM",
      entityId: line?.id ?? op.target.item_id ?? null,
      label: line?.designation ?? quote?.number ?? "ligne devis",
      field,
      before,
      after,
      unit: line?.unit ?? null,
    };
  }
  if (op.op === "update_duration") {
    const plan = subgraph.plans.find((p) => p.id === op.target.plan_id);
    const task = plan?.tasks.find(
      (t) =>
        t.id === op.target.task_id ||
        t.id === op.target.id ||
        t.stepCode === op.target.step_code ||
        t.stepCode === op.target.code,
    );
    return {
      op: op.op,
      section,
      entityType: "PREP_SCHEDULE_TASK",
      entityId: task?.id ?? op.target.task_id ?? null,
      label: task?.name ?? op.target.step_code ?? "tâche",
      field: "duration_days",
      before: task?.durationDays ?? null,
      after: op.changes.duration_days,
      unit: "j",
    };
  }
  if (op.op === "update_task") {
    const plan = subgraph.plans.find((p) => p.id === op.target.plan_id);
    const task = plan?.tasks.find(
      (t) => t.id === op.target.task_id || t.stepCode === op.target.step_code,
    );
    return {
      op: op.op,
      section,
      entityType: "PREP_SCHEDULE_TASK",
      entityId: task?.id ?? null,
      label: task?.name ?? "tâche",
      field: "meta",
      before: {
        name: task?.name,
        description: task?.description ?? null,
        lot: task?.lot,
      },
      after: op.changes,
      unit: null,
    };
  }
  if (op.op === "update_crew") {
    const plan = subgraph.plans.find((p) => p.id === op.target.plan_id);
    const task = plan?.tasks.find(
      (t) =>
        t.id === op.target.task_id ||
        t.id === op.target.id ||
        t.stepCode === op.target.step_code ||
        t.stepCode === op.target.code,
    );
    return {
      op: op.op,
      section,
      entityType: "PREP_SCHEDULE_TASK",
      entityId: task?.id ?? op.target.task_id ?? null,
      label: task?.name ?? op.target.step_code ?? "tâche",
      field: "crew",
      before: null,
      after: op.changes,
      unit: null,
    };
  }
  if (op.op === "update_productivity") {
    const plan = subgraph.plans.find((p) => p.id === op.target.plan_id);
    const task = plan?.tasks.find(
      (t) =>
        t.id === op.target.task_id ||
        t.id === op.target.id ||
        t.stepCode === op.target.step_code ||
        t.stepCode === op.target.code,
    );
    return {
      op: op.op,
      section,
      entityType: "PREP_SCHEDULE_TASK",
      entityId: task?.id ?? op.target.task_id ?? null,
      label: task?.name ?? op.target.step_code ?? "tâche",
      field: "productivity",
      before: {
        rate_value: task?.rateValue ?? null,
        parallel_units: task?.parallelUnits ?? null,
      },
      after: op.changes,
      unit: null,
    };
  }
  if (op.op === "update_workload") {
    const plan = subgraph.plans.find((p) => p.id === op.target.plan_id);
    const task = plan?.tasks.find(
      (t) =>
        t.id === op.target.task_id ||
        t.id === op.target.id ||
        t.stepCode === op.target.step_code ||
        t.stepCode === op.target.code,
    );
    return {
      op: op.op,
      section,
      entityType: "PREP_SCHEDULE_TASK",
      entityId: task?.id ?? op.target.task_id ?? null,
      label: task?.name ?? op.target.step_code ?? "tâche",
      field: "workload_person_days",
      before: null,
      after: op.changes.workload_person_days ?? null,
      unit: "h.j",
    };
  }
  if (op.op === "update_dependency") {
    const plan = subgraph.plans.find((p) => p.id === op.target.plan_id);
    const task = plan?.tasks.find(
      (t) =>
        t.id === op.target.task_id ||
        t.id === op.target.id ||
        t.stepCode === op.target.step_code ||
        t.stepCode === op.target.code,
    );
    return {
      op: op.op,
      section,
      entityType: "PREP_SCHEDULE_TASK",
      entityId: task?.id ?? op.target.task_id ?? null,
      label: task?.name ?? op.target.step_code ?? "tâche",
      field: "depends_on",
      before: task?.dependsOnStepCodes ?? null,
      after: op.changes.depends_on,
      unit: null,
    };
  }
  if (op.op === "update_start_date") {
    const plan = subgraph.plans.find((p) => p.id === op.target.plan_id);
    return {
      op: op.op,
      section,
      entityType: "PREP_SCHEDULE_PLAN",
      entityId: plan?.id ?? op.target.plan_id,
      label: plan?.title ?? "planning",
      field: "start_date",
      before: plan?.startDate ?? null,
      after: op.changes.start_date,
      unit: null,
    };
  }
  if (op.op === "add_task") {
    const plan = subgraph.plans.find((p) => p.id === op.target.plan_id);
    return {
      op: op.op,
      section,
      entityType: "PREP_SCHEDULE_TASK",
      entityId: plan?.id ?? op.target.plan_id,
      label: `${op.task.step_code} · ${op.task.name}`,
      field: "create",
      before: null,
      after: op.task,
      unit: null,
    };
  }
  if (op.op === "update_visit") {
    const visit = subgraph.visit;
    const targetId = op.target.visit_id ?? op.target.id;
    if (visit && targetId && targetId !== visit.id) {
      return {
        op: op.op,
        section,
        entityType: "SITE_VISIT",
        entityId: null,
        label: "visite hors cible",
        field: "meta",
        before: null,
        after: op.changes,
        unit: null,
      };
    }
    return {
      op: op.op,
      section,
      entityType: "SITE_VISIT",
      entityId: visit?.id ?? targetId ?? null,
      label: visit?.subject ?? "visite",
      field: "meta",
      before: visit
        ? {
            subject: visit.subject,
            client_need: visit.clientNeed,
            comments: visit.comments,
          }
        : null,
      after: op.changes,
      unit: null,
    };
  }
  if (op.op === "update_follow_up") {
    const sheet = subgraph.followUp;
    const targetId = op.target.sheet_id ?? op.target.id;
    if (sheet && targetId && targetId !== sheet.id) {
      return {
        op: op.op,
        section,
        entityType: "FOLLOW_UP_SHEET",
        entityId: null,
        label: "suivi hors cible",
        field: "meta",
        before: null,
        after: op.changes,
        unit: null,
      };
    }
    return {
      op: op.op,
      section,
      entityType: "FOLLOW_UP_SHEET",
      entityId: sheet?.id ?? targetId ?? null,
      label: sheet?.title ?? "suivi",
      field: "meta",
      before: sheet
        ? {
            title: sheet.title,
            notes: sheet.notes,
          }
        : null,
      after: op.changes,
      unit: null,
    };
  }
  if (op.op === "update_report") {
    const report = subgraph.report;
    const targetId = op.target.document_id ?? op.target.id;
    if (report && targetId && targetId !== report.id) {
      return {
        op: op.op,
        section,
        entityType: "SITE_DOCUMENT",
        entityId: null,
        label: "compte rendu hors cible",
        field: "meta",
        before: null,
        after: op.changes,
        unit: null,
      };
    }
    const payload =
      report?.payloadJson &&
      typeof report.payloadJson === "object" &&
      !Array.isArray(report.payloadJson)
        ? (report.payloadJson as Record<string, unknown>)
        : null;
    return {
      op: op.op,
      section,
      entityType: "SITE_DOCUMENT",
      entityId: report?.id ?? targetId ?? null,
      label: report?.title ?? "compte rendu",
      field: "meta",
      before: report
        ? {
            title: report.title,
            quick_notes: report.quickNotes,
            summary: payload?.summary ?? null,
            additional_notes: payload?.additionalNotes ?? null,
          }
        : null,
      after: op.changes,
      unit: null,
    };
  }
  if (op.op === "update_notice") {
    const notice = subgraph.notice;
    const targetId = op.target.document_id ?? op.target.id;
    if (notice && targetId && targetId !== notice.id) {
      return {
        op: op.op,
        section,
        entityType: "SITE_DOCUMENT",
        entityId: null,
        label: "notice hors cible",
        field: "meta",
        before: null,
        after: op.changes,
        unit: null,
      };
    }
    const payload =
      notice?.payloadJson &&
      typeof notice.payloadJson === "object" &&
      !Array.isArray(notice.payloadJson)
        ? (notice.payloadJson as Record<string, unknown>)
        : null;
    return {
      op: op.op,
      section,
      entityType: "SITE_DOCUMENT",
      entityId: notice?.id ?? targetId ?? null,
      label: notice?.title ?? "notice",
      field: "meta",
      before: notice
        ? {
            title: notice.title,
            quick_notes: notice.quickNotes,
            summary: payload?.summary ?? null,
            additional_notes: payload?.additionalNotes ?? null,
          }
        : null,
      after: op.changes,
      unit: null,
    };
  }
  return {
    op: op.op,
    section,
    entityType: "UNKNOWN",
    entityId: null,
    label: op.op,
    field: "raw",
    before: null,
    after: "changes" in op ? op.changes : null,
    unit: null,
  };
}

/* ─── COMMERCIAL_ADJUSTMENT (QUOTE only) ─── */

function analyzeCommercialQuote(
  patch: BeworkPatchV1,
  subgraph: ImpactSubgraph,
): AnalyzePatchImpactResult {
  const directChanges = extractDirectChanges(patch, subgraph);
  const derived: DerivedChange[] = [];
  const affected: AffectedEntity[] = [];
  const protectedEntities: ProtectedEntity[] = [];
  const warnings: BeworkPatchIssue[] = [];
  const sections = new Set<"TAKEOFF" | "QUOTE" | "PLANNING">(["QUOTE"]);
  const lineOverrides = new Map<string, { quantity?: number; unitSellHt?: number }>();

  for (const op of patch.operations) {
    if (op.op !== "update_quote_item") continue;
    const quote = subgraph.quotes.find((q) => q.id === op.target.quote_id);
    const line = quote?.lines.find(
      (l) => l.id === op.target.item_id || l.id === op.target.id,
    );
    if (!quote || !line) {
      warnings.push(
        issue("TARGET_NOT_FOUND", "Ligne devis introuvable dans le sous-graphe."),
      );
      continue;
    }

    pushAffected(affected, {
      section: "QUOTE",
      entityType: "QUOTE_ITEM",
      id: line.id,
      label: line.designation,
      certainty: "CERTAIN",
    });

    if (isQuoteProtected(quote.status)) {
      protectedEntities.push({
        section: "QUOTE",
        entityType: "COMMERCIAL_QUOTE",
        id: quote.id,
        label: quote.number,
        reason: quoteProtectionReason(quote.status),
      });
      continue;
    }

    const sim = simulateQuoteLine({
      line,
      quantity: op.changes.quantity,
      unitSellHt: op.changes.unit_price_ht,
      discountPercent: op.changes.discount_percent,
    });
    lineOverrides.set(line.id, {
      quantity: sim.afterQty,
      unitSellHt: sim.afterUnitSellHt,
    });

    if (op.changes.unit_price_ht !== undefined) {
      derived.push({
        section: "QUOTE",
        entityType: "QUOTE_ITEM",
        entityId: line.id,
        label: `${quote.number} · ${line.designation}`,
        field: "unit_price_ht",
        before: sim.beforeUnitSellHt,
        after: sim.afterUnitSellHt,
        certainty: "CERTAIN",
        reason: "Ajustement commercial explicite",
      });
    }
    if (op.changes.quantity !== undefined) {
      derived.push({
        section: "QUOTE",
        entityType: "QUOTE_ITEM",
        entityId: line.id,
        label: `${quote.number} · ${line.designation}`,
        field: "quantity",
        before: sim.beforeQty,
        after: sim.afterQty,
        unit: line.unit,
        certainty: "CERTAIN",
        reason: "Quantité commerciale explicite",
      });
    }
    derived.push({
      section: "QUOTE",
      entityType: "QUOTE_ITEM",
      entityId: line.id,
      label: `${quote.number} · ${line.designation}`,
      field: "line_ht",
      before: sim.beforeLineHt,
      after: sim.afterLineHt,
      unit: "€ HT",
      certainty: "CERTAIN",
      reason: "Recalcul ligne devis",
    });
  }

  for (const quote of subgraph.quotes) {
    if (![...lineOverrides.keys()].some((id) => quote.lines.some((l) => l.id === id))) {
      continue;
    }
    if (isQuoteProtected(quote.status)) continue;
    const totals = simulateQuoteTotals(quote, lineOverrides);
    if (Math.abs(totals.beforeHt - totals.afterHt) > 0.001) {
      derived.push({
        section: "QUOTE",
        entityType: "COMMERCIAL_QUOTE",
        entityId: quote.id,
        label: quote.number,
        field: "total_sell_ht",
        before: totals.beforeHt,
        after: totals.afterHt,
        unit: "€ HT",
        certainty: "CERTAIN",
        reason: "Recalcul total devis",
      });
    }
  }

  return {
    directChanges,
    canonicalResolution: buildCanonicalResolution({}),
    derivedChanges: derived,
    affectedEntities: affected,
    protectedEntities,
    overrides: [],
    warnings: [
      ...warnings,
      issue(
        "COMMERCIAL_SCOPE",
        "COMMERCIAL_ADJUSTMENT : TAKEOFF et PLANNING non affectés.",
        "warn",
      ),
    ],
    errors: [],
    impactSummary: summarizeImpact(derived, protectedEntities, [], sections),
    graph: [
      {
        entityType: "COMMERCIAL_QUOTE",
        id: patch.origin.entity_id,
        label: "Devis (ajustement commercial)",
        relationType: null,
        confidence: "CERTAIN",
        mutable: protectedEntities.length === 0,
        protected: protectedEntities.length > 0,
      },
    ],
  };
}

/* ─── REPORT local (texte sûr COMPTE_RENDU) ─── */

function analyzeReportLocal(
  patch: BeworkPatchV1,
  subgraph: ImpactSubgraph,
): AnalyzePatchImpactResult {
  const errors: BeworkPatchIssue[] = [];
  const warnings: BeworkPatchIssue[] = [
    issue(
      "REPORT_SCOPE",
      "REPORT CTX-02D : sections JSON, médias, statut et PDF non modifiables via patch.",
      "warn",
    ),
  ];

  const supported = new Set(["update_report"]);
  const allowedFields = new Set([
    "title",
    "quick_notes",
    "summary",
    "additional_notes",
  ]);

  for (const op of patch.operations) {
    if (!supported.has(op.op)) {
      errors.push(
        issue(
          "OPERATION_NOT_ALLOWED_FOR_SECTION",
          `Opération ${op.op} non supportée pour le commit REPORT (CTX-02D).`,
          "error",
        ),
      );
      continue;
    }
    if (op.op === "update_report") {
      const targetId = op.target.document_id ?? op.target.id;
      if (targetId && targetId !== patch.origin.entity_id) {
        errors.push(
          issue("PROJECT_MISMATCH", "Cible hors compte rendu.", "error"),
        );
      }
      if (subgraph.report && targetId && targetId !== subgraph.report.id) {
        errors.push(
          issue("PROJECT_MISMATCH", "Cible hors document chargé.", "error"),
        );
      }
      if (subgraph.report && subgraph.report.kind !== "COMPTE_RENDU") {
        errors.push(
          issue(
            "PROJECT_MISMATCH",
            "Document hors type COMPTE_RENDU.",
            "error",
          ),
        );
      }
      const keys = Object.keys(op.changes).filter(
        (k) => (op.changes as Record<string, unknown>)[k] !== undefined,
      );
      if (!keys.length) {
        errors.push(
          issue("EMPTY_OPERATIONS", "update_report sans champ.", "error"),
        );
      }
      for (const key of keys) {
        if (!allowedFields.has(key)) {
          errors.push(
            issue(
              "INVALID_FIELD",
              `Champ « ${key} » non autorisé (whitelist: title, quick_notes, summary, additional_notes).`,
              "error",
            ),
          );
        }
      }
      if (
        op.changes.title !== undefined &&
        (!op.changes.title || !op.changes.title.trim())
      ) {
        errors.push(
          issue("INVALID_FIELD", "title ne peut pas être vide.", "error"),
        );
      }
    }
  }

  if (!subgraph.report) {
    errors.push(
      issue(
        "TARGET_NOT_FOUND",
        "Compte rendu introuvable dans le sous-graphe.",
        "error",
      ),
    );
  } else if (subgraph.report.id !== patch.origin.entity_id) {
    errors.push(issue("PROJECT_MISMATCH", "Document hors cible.", "error"));
  }

  const directChanges = extractDirectChanges(patch, subgraph).filter(
    (dc) => dc.op === "update_report",
  );

  return {
    directChanges,
    canonicalResolution: buildCanonicalResolution({}),
    derivedChanges: [],
    affectedEntities: [],
    protectedEntities: [],
    overrides: [],
    warnings,
    errors,
    impactSummary: {
      affectedSections: [],
      simulationOnly: true,
      canPropagate: false,
      certainCount: directChanges.length,
      partialCount: 0,
      potentialCount: 0,
      protectedCount: 0,
      overrideCount: 0,
    },
    graph: [
      {
        entityType: "SITE_DOCUMENT",
        id: patch.origin.entity_id,
        label: subgraph.report?.title ?? "Compte rendu",
        relationType: null,
        confidence: "CERTAIN",
        mutable: true,
        protected: false,
      },
    ],
  };
}

/* ─── SUPPLY local (Approvisionnements) ─── */

function analyzeSupplyLocal(
  patch: BeworkPatchV1,
  subgraph: ImpactSubgraph,
): AnalyzePatchImpactResult {
  const errors: BeworkPatchIssue[] = [];
  const warnings: BeworkPatchIssue[] = [
    issue(
      "SUPPLY_SCOPE",
      "SUPPLY : métré, devis, planning, PurchaseOrder et selectedOfferId hors périmètre commit.",
      "warn",
    ),
  ];

  const supported = new Set([
    "add_supply_need",
    "update_supply_need",
    "cancel_supply_need",
    "add_supply_offer",
    "update_supply_offer",
    "archive_supply_offer",
    "add_supplier",
  ]);

  const directChanges: DirectChange[] = [];

  if (!subgraph.supply) {
    errors.push(
      issue(
        "TARGET_NOT_FOUND",
        "Hub Approvisionnements introuvable pour ce chantier.",
        "error",
      ),
    );
  } else if (patch.origin.entity_id !== subgraph.supply.projectId) {
    errors.push(
      issue(
        "PROJECT_MISMATCH",
        "entity_id SUPPLY doit être le projectId du chantier.",
        "error",
      ),
    );
  }

  if (
    subgraph.supply &&
    patch.origin.base_version !== subgraph.supply.contextVersion
  ) {
    warnings.push(
      issue(
        "BASE_VERSION_MISMATCH",
        "base_version différente de l’empreinte Approvisionnements — Preview à rafraîchir avant commit.",
        "warn",
      ),
    );
  }

  for (const op of patch.operations) {
    if (!supported.has(op.op)) {
      errors.push(
        issue(
          "OPERATION_NOT_ALLOWED_FOR_SECTION",
          `Opération ${op.op} non supportée pour SUPPLY (sélection d’offre / BC / métré / devis / planning interdits).`,
          "error",
        ),
      );
      continue;
    }

    if (op.op === "add_supply_need") {
      directChanges.push({
        op: op.op,
        section: "SUPPLY",
        entityType: "MATERIAL_REQUIREMENT",
        entityId: "(new)",
        label: op.need.label,
        field: "add_supply_need",
        before: null,
        after: `${op.need.validated_order_quantity} ${op.need.unit}`,
      });
      if (op.need.is_hypothesis) {
        warnings.push(
          issue(
            "HYPOTHESIS",
            `Besoin « ${op.need.label} » marqué comme hypothèse — à valider.`,
            "warn",
          ),
        );
      }
    } else if (op.op === "update_supply_need" || op.op === "cancel_supply_need") {
      directChanges.push({
        op: op.op,
        section: "SUPPLY",
        entityType: "MATERIAL_REQUIREMENT",
        entityId: op.target.requirement_id,
        label: op.target.requirement_id,
        field: op.op,
        before: null,
        after: op.op === "cancel_supply_need" ? "CANCELLED" : "updated",
      });
      if (subgraph.supply && subgraph.supply.needsWithOrders > 0) {
        warnings.push(
          issue(
            "NEED_ALREADY_ORDERED",
            "Ce chantier a des besoins déjà engagés dans une commande — vérifier chaque ligne.",
            "warn",
          ),
        );
      }
    } else if (op.op === "add_supply_offer") {
      const o = op.offer;
      if (o.unit_price != null && o.price_source_type === "WEB_VERIFIED") {
        if (!o.source_url || !/^https?:\/\//i.test(o.source_url)) {
          errors.push(
            issue(
              "INVALID_FIELD",
              "SOURCE MANQUANTE / URL INVALIDE — WEB_VERIFIED avec prix exige une URL http(s).",
              "error",
            ),
          );
        }
        if (!o.observed_at) {
          errors.push(
            issue(
              "INVALID_FIELD",
              "WEB_VERIFIED avec prix exige observed_at.",
              "error",
            ),
          );
        }
      }
      if (o.unit_price != null && o.unit_price < 0) {
        errors.push(
          issue("INVALID_FIELD", "Prix négatif interdit.", "error"),
        );
      }
      if (o.delivery_fee === 0) {
        // ok — gratuit réel
      }
      if (o.delivery_fee == null) {
        warnings.push(
          issue(
            "DELIVERY_UNKNOWN",
            "LIVRAISON À CONFIRMER — deliveryFee null (≠ 0).",
            "warn",
          ),
        );
      }
      if (!o.availability_note) {
        warnings.push(
          issue(
            "AVAILABILITY_UNKNOWN",
            "DISPONIBILITÉ À CONFIRMER.",
            "warn",
          ),
        );
      }
      if (!o.units_per_pack && o.price_unit && /PALLET|PACK/i.test(o.price_unit)) {
        warnings.push(
          issue(
            "PACKAGING_UNKNOWN",
            "CONDITIONNEMENT INCONNU — unitsPerPack absent.",
            "warn",
          ),
        );
      }
      if (o.price_tax_mode === "TTC" && o.vat_rate == null && o.unit_price != null) {
        warnings.push(
          issue(
            "TTC_NO_VAT",
            "PRIX TTC — TVA INCONNUE (aucune conversion HT inventée).",
            "warn",
          ),
        );
      }
      if ((o.equivalence_status ?? "TO_VERIFY") === "TO_VERIFY") {
        warnings.push(
          issue(
            "EQUIVALENCE_TO_VERIFY",
            "ÉQUIVALENCE À VÉRIFIER.",
            "warn",
          ),
        );
      }
      directChanges.push({
        op: op.op,
        section: "SUPPLY",
        entityType: "SUPPLY_OFFER",
        entityId: "(new)",
        label: o.product_label,
        field: "add_supply_offer",
        before: null,
        after:
          o.unit_price == null
            ? "Prix à renseigner"
            : `${o.unit_price} ${o.price_unit ?? ""} ${o.price_tax_mode ?? ""}`.trim(),
      });
      if (o.source_url) {
        directChanges.push({
          op: op.op,
          section: "SUPPLY",
          entityType: "SUPPLY_OFFER",
          entityId: "(new)",
          label: "source_url",
          field: "source_url",
          before: null,
          after: o.source_url,
        });
      }
    } else if (op.op === "update_supply_offer" || op.op === "archive_supply_offer") {
      directChanges.push({
        op: op.op,
        section: "SUPPLY",
        entityType: "SUPPLY_OFFER",
        entityId: op.target.offer_id,
        label: op.target.offer_id,
        field: op.op,
        before: null,
        after: op.op === "archive_supply_offer" ? "archived" : "updated",
      });
    } else if (op.op === "add_supplier") {
      warnings.push(
        issue(
          "NEW_SUPPLIER",
          `NOUVEAU FOURNISSEUR proposé : ${op.supplier.name} (ref ${op.supplier.ref}) — création uniquement après Commit.`,
          "warn",
        ),
      );
      directChanges.push({
        op: op.op,
        section: "SUPPLY",
        entityType: "EXTERNAL_ORGANIZATION",
        entityId: `(new:${op.supplier.ref})`,
        label: op.supplier.name,
        field: "add_supplier",
        before: null,
        after: op.supplier.city ?? op.supplier.name,
      });
    }
  }

  return emptyResult({
    errors,
    warnings,
    directChanges,
    affectedEntities: [],
    // SUPPLY local — pas de résolution canonique cross-module (métré/devis/planning).
    canonicalResolution: buildCanonicalResolution({}),
  });
}

/* ─── NOTICE local (texte sûr kind NOTICE) ─── */

function analyzeNoticeLocal(
  patch: BeworkPatchV1,
  subgraph: ImpactSubgraph,
): AnalyzePatchImpactResult {
  const errors: BeworkPatchIssue[] = [];
  const warnings: BeworkPatchIssue[] = [
    issue(
      "NOTICE_SCOPE",
      "NOTICE CTX-02E : sections JSON, médias, statut et PDF non modifiables via patch.",
      "warn",
    ),
  ];

  const supported = new Set(["update_notice"]);
  const allowedFields = new Set([
    "title",
    "quick_notes",
    "summary",
    "additional_notes",
  ]);

  for (const op of patch.operations) {
    if (!supported.has(op.op)) {
      errors.push(
        issue(
          "OPERATION_NOT_ALLOWED_FOR_SECTION",
          `Opération ${op.op} non supportée pour le commit NOTICE (CTX-02E).`,
          "error",
        ),
      );
      continue;
    }
    if (op.op === "update_notice") {
      const targetId = op.target.document_id ?? op.target.id;
      if (targetId && targetId !== patch.origin.entity_id) {
        errors.push(
          issue("PROJECT_MISMATCH", "Cible hors notice.", "error"),
        );
      }
      if (subgraph.notice && targetId && targetId !== subgraph.notice.id) {
        errors.push(
          issue("PROJECT_MISMATCH", "Cible hors document chargé.", "error"),
        );
      }
      if (subgraph.notice && subgraph.notice.kind !== "NOTICE") {
        errors.push(
          issue("PROJECT_MISMATCH", "Document hors type NOTICE.", "error"),
        );
      }
      const keys = Object.keys(op.changes).filter(
        (k) => (op.changes as Record<string, unknown>)[k] !== undefined,
      );
      if (!keys.length) {
        errors.push(
          issue("EMPTY_OPERATIONS", "update_notice sans champ.", "error"),
        );
      }
      for (const key of keys) {
        if (!allowedFields.has(key)) {
          errors.push(
            issue(
              "INVALID_FIELD",
              `Champ « ${key} » non autorisé (whitelist: title, quick_notes, summary, additional_notes).`,
              "error",
            ),
          );
        }
      }
      if (
        op.changes.title !== undefined &&
        (!op.changes.title || !op.changes.title.trim())
      ) {
        errors.push(
          issue("INVALID_FIELD", "title ne peut pas être vide.", "error"),
        );
      }
    }
  }

  if (!subgraph.notice) {
    errors.push(
      issue(
        "TARGET_NOT_FOUND",
        "Notice introuvable dans le sous-graphe.",
        "error",
      ),
    );
  } else if (subgraph.notice.id !== patch.origin.entity_id) {
    errors.push(issue("PROJECT_MISMATCH", "Document hors cible.", "error"));
  }

  const directChanges = extractDirectChanges(patch, subgraph).filter(
    (dc) => dc.op === "update_notice",
  );

  return {
    directChanges,
    canonicalResolution: buildCanonicalResolution({}),
    derivedChanges: [],
    affectedEntities: [],
    protectedEntities: [],
    overrides: [],
    warnings,
    errors,
    impactSummary: {
      affectedSections: [],
      simulationOnly: true,
      canPropagate: false,
      certainCount: directChanges.length,
      partialCount: 0,
      potentialCount: 0,
      protectedCount: 0,
      overrideCount: 0,
    },
    graph: [
      {
        entityType: "SITE_DOCUMENT",
        id: patch.origin.entity_id,
        label: subgraph.notice?.title ?? "Notice",
        relationType: null,
        confidence: "CERTAIN",
        mutable: true,
        protected: false,
      },
    ],
  };
}

/* ─── FOLLOW_UP local (title/notes, pas de status/timeline) ─── */

function analyzeFollowUpLocal(
  patch: BeworkPatchV1,
  subgraph: ImpactSubgraph,
): AnalyzePatchImpactResult {
  const errors: BeworkPatchIssue[] = [];
  const warnings: BeworkPatchIssue[] = [
    issue(
      "FOLLOW_UP_SCOPE",
      "FOLLOW_UP CTX-02C : status, avancement, dates, timeline et médias non modifiables via patch.",
      "warn",
    ),
  ];

  const supported = new Set(["update_follow_up"]);
  const allowedFields = new Set(["title", "notes"]);

  for (const op of patch.operations) {
    if (!supported.has(op.op)) {
      errors.push(
        issue(
          "OPERATION_NOT_ALLOWED_FOR_SECTION",
          `Opération ${op.op} non supportée pour le commit FOLLOW_UP (CTX-02C).`,
          "error",
        ),
      );
      continue;
    }
    if (op.op === "update_follow_up") {
      const targetId = op.target.sheet_id ?? op.target.id;
      if (targetId && targetId !== patch.origin.entity_id) {
        errors.push(
          issue("PROJECT_MISMATCH", "Cible hors fiche de suivi.", "error"),
        );
      }
      if (subgraph.followUp && targetId && targetId !== subgraph.followUp.id) {
        errors.push(
          issue("PROJECT_MISMATCH", "Cible hors fiche chargée.", "error"),
        );
      }
      const keys = Object.keys(op.changes).filter(
        (k) => (op.changes as Record<string, unknown>)[k] !== undefined,
      );
      if (!keys.length) {
        errors.push(
          issue("EMPTY_OPERATIONS", "update_follow_up sans champ.", "error"),
        );
      }
      for (const key of keys) {
        if (!allowedFields.has(key)) {
          errors.push(
            issue(
              "INVALID_FIELD",
              `Champ « ${key} » non autorisé (whitelist: title, notes).`,
              "error",
            ),
          );
        }
      }
      if (
        op.changes.title !== undefined &&
        (!op.changes.title || !op.changes.title.trim())
      ) {
        errors.push(
          issue("INVALID_FIELD", "title ne peut pas être vide.", "error"),
        );
      }
    }
  }

  if (!subgraph.followUp) {
    errors.push(
      issue(
        "TARGET_NOT_FOUND",
        "Fiche de suivi introuvable dans le sous-graphe.",
        "error",
      ),
    );
  } else if (subgraph.followUp.id !== patch.origin.entity_id) {
    errors.push(issue("PROJECT_MISMATCH", "Fiche hors cible.", "error"));
  }

  const directChanges = extractDirectChanges(patch, subgraph).filter(
    (dc) => dc.op === "update_follow_up",
  );

  return {
    directChanges,
    canonicalResolution: buildCanonicalResolution({}),
    derivedChanges: [],
    affectedEntities: [],
    protectedEntities: [],
    overrides: [],
    warnings,
    errors,
    impactSummary: {
      affectedSections: [],
      simulationOnly: true,
      canPropagate: false,
      certainCount: directChanges.length,
      partialCount: 0,
      potentialCount: 0,
      protectedCount: 0,
      overrideCount: 0,
    },
    graph: [
      {
        entityType: "FOLLOW_UP_SHEET",
        id: patch.origin.entity_id,
        label: subgraph.followUp?.title ?? "Suivi",
        relationType: null,
        confidence: "CERTAIN",
        mutable: true,
        protected: false,
        before: subgraph.followUp
          ? {
              title: subgraph.followUp.title,
              notes: subgraph.followUp.notes,
            }
          : undefined,
        after: Object.assign(
          {},
          ...patch.operations
            .filter((o) => o.op === "update_follow_up")
            .map((o) => (o.op === "update_follow_up" ? o.changes : {})),
        ),
      },
    ],
  };
}

/* ─── VISIT local (texte + mesures ; médias/statut hors scope) ─── */

function analyzeVisitLocal(
  patch: BeworkPatchV1,
  subgraph: ImpactSubgraph,
): AnalyzePatchImpactResult {
  const errors: BeworkPatchIssue[] = [];
  const warnings: BeworkPatchIssue[] = [
    issue(
      "VISIT_SCOPE",
      "VISIT : médias et statut non modifiables via patch. PLAN ≠ PHOTO ≠ MEASURE.",
      "warn",
    ),
  ];

  const supported = new Set([
    "update_visit",
    "update_measurement",
    "add_measurement",
  ]);
  const allowedFields = new Set([
    "subject",
    "client_need",
    "comments",
    "findings",
    "proposed_works",
    "commercial",
    "constraints",
    "field_notes",
  ]);

  for (const op of patch.operations) {
    if (!supported.has(op.op)) {
      errors.push(
        issue(
          "OPERATION_NOT_ALLOWED_FOR_SECTION",
          `Opération ${op.op} non supportée pour le commit VISIT.`,
          "error",
        ),
      );
      continue;
    }
    if (op.op === "update_measurement" || op.op === "add_measurement") {
      const targetId = op.target.visit_id ?? op.target.id;
      if (targetId && targetId !== patch.origin.entity_id) {
        errors.push(
          issue("PROJECT_MISMATCH", "Cible hors visite.", "error"),
        );
      }
      continue;
    }
    if (op.op === "update_visit") {
      const targetId = op.target.visit_id ?? op.target.id;
      if (targetId && targetId !== patch.origin.entity_id) {
        errors.push(
          issue("PROJECT_MISMATCH", "Cible hors visite.", "error"),
        );
      }
      if (subgraph.visit && targetId && targetId !== subgraph.visit.id) {
        errors.push(
          issue("PROJECT_MISMATCH", "Cible hors visite chargée.", "error"),
        );
      }
      const keys = Object.keys(op.changes).filter(
        (k) => (op.changes as Record<string, unknown>)[k] !== undefined,
      );
      if (!keys.length) {
        errors.push(
          issue("EMPTY_OPERATIONS", "update_visit sans champ.", "error"),
        );
      }
      for (const key of keys) {
        if (!allowedFields.has(key)) {
          errors.push(
            issue(
              "INVALID_FIELD",
              `Champ « ${key} » non autorisé pour update_visit.`,
              "error",
            ),
          );
        }
      }
      if (
        op.changes.subject !== undefined &&
        (!op.changes.subject || !op.changes.subject.trim())
      ) {
        errors.push(
          issue("INVALID_FIELD", "subject ne peut pas être vide.", "error"),
        );
      }
    }
  }

  if (!subgraph.visit) {
    errors.push(
      issue("TARGET_NOT_FOUND", "Visite introuvable dans le sous-graphe.", "error"),
    );
  } else if (subgraph.visit.id !== patch.origin.entity_id) {
    errors.push(
      issue("PROJECT_MISMATCH", "Visite hors cible.", "error"),
    );
  }

  const directChanges = extractDirectChanges(patch, subgraph).filter(
    (dc) => dc.op === "update_visit",
  );

  return {
    directChanges,
    canonicalResolution: buildCanonicalResolution({}),
    derivedChanges: [],
    affectedEntities: [],
    protectedEntities: [],
    overrides: [],
    warnings,
    errors,
    impactSummary: {
      affectedSections: [],
      simulationOnly: true,
      canPropagate: false,
      certainCount: directChanges.length,
      partialCount: 0,
      potentialCount: 0,
      protectedCount: 0,
      overrideCount: 0,
    },
    graph: [
      {
        entityType: "SITE_VISIT",
        id: patch.origin.entity_id,
        label: subgraph.visit?.subject ?? "Visite",
        relationType: null,
        confidence: "CERTAIN",
        mutable: true,
        protected: false,
        before: subgraph.visit
          ? {
              subject: subgraph.visit.subject,
              client_need: subgraph.visit.clientNeed,
              comments: subgraph.visit.comments,
            }
          : undefined,
        after: Object.assign(
          {},
          ...patch.operations
            .filter((o) => o.op === "update_visit")
            .map((o) => (o.op === "update_visit" ? o.changes : {})),
        ),
      },
    ],
  };
}

/* ─── PLANNING local (pas de remontée métré/devis) ─── */

function analyzePlanningLocal(
  patch: BeworkPatchV1,
  subgraph: ImpactSubgraph,
): AnalyzePatchImpactResult {
  const errors: BeworkPatchIssue[] = [];
  const warnings: BeworkPatchIssue[] = [
    issue(
      "PLANNING_SCOPE",
      "PLANNING_ADJUSTMENT : TAKEOFF et QUOTE inchangés (pas de remontée).",
      "warn",
    ),
  ];

  const supported = new Set([
    "update_task",
    "update_duration",
    "update_crew",
    "update_productivity",
    "update_workload",
    "update_dependency",
    "update_start_date",
    "add_task",
  ]);
  for (const op of patch.operations) {
    if (!supported.has(op.op)) {
      errors.push(
        issue(
          "OPERATION_NOT_ALLOWED_FOR_SECTION",
          `Opération ${op.op} non supportée pour le commit PLANNING (CTX-02A).`,
          "error",
        ),
      );
    }
    if (
      "target" in op &&
      op.target &&
      typeof op.target === "object" &&
      "plan_id" in op.target &&
      op.target.plan_id &&
      op.target.plan_id !== patch.origin.entity_id
    ) {
      errors.push(
        issue(
          "PROJECT_MISMATCH",
          "Tâche hors planning ciblé.",
          "error",
        ),
      );
    }
  }

  const directChanges = extractDirectChanges(patch, subgraph);
  for (const dc of directChanges) {
    if (
      (dc.op === "update_task" ||
        dc.op === "update_duration" ||
        dc.op === "update_crew" ||
        dc.op === "update_productivity" ||
        dc.op === "update_workload" ||
        dc.op === "update_dependency") &&
      !dc.entityId
    ) {
      errors.push(
        issue(
          "TARGET_NOT_FOUND",
          `Tâche introuvable pour ${dc.op} (${dc.label}).`,
          "error",
        ),
      );
    }
  }

  const derived: DerivedChange[] = [];
  const affected: AffectedEntity[] = [];
  const sections = new Set<"TAKEOFF" | "QUOTE" | "PLANNING">(["PLANNING"]);
  const durationOverrides = new Map<string, number>();

  for (const op of patch.operations) {
    if (op.op === "update_duration") {
      const key = op.target.task_id ?? op.target.step_code ?? op.target.id;
      if (key) durationOverrides.set(key, op.changes.duration_days);
      if (!(op.changes.duration_days > 0)) {
        errors.push(
          issue("INVALID_FIELD", "duration_days doit être > 0.", "error"),
        );
      }
    }
  }

  const dependencyOverrides = new Map<
    string,
    Array<{ step_id: string; type: "FS" | "SS" | "FF"; lag_days: number }>
  >();
  for (const op of patch.operations) {
    if (op.op !== "update_dependency") continue;
    const key =
      op.target.task_id ?? op.target.step_code ?? op.target.id ?? op.target.code;
    if (!key) continue;
    dependencyOverrides.set(
      key,
      (op.changes.depends_on ?? []).map((d) => ({
        step_id: d.step_id,
        type: (d.type ?? "FS") as "FS" | "SS" | "FF",
        lag_days: d.lag_days ?? 0,
      })),
    );
  }

  for (const plan of subgraph.plans) {
    if (plan.id !== patch.origin.entity_id) continue;
    const sim = simulatePlanFromQuantityMap(plan, new Map(), durationOverrides);
    for (const t of sim.tasks) {
      if (Math.abs(t.afterDuration - t.beforeDuration) < 1e-9) continue;
      pushAffected(affected, {
        section: "PLANNING",
        entityType: "PREP_SCHEDULE_TASK",
        id: t.taskId,
        label: `${t.stepCode} · ${t.name}`,
        certainty: "CERTAIN",
      });
      derived.push({
        section: "PLANNING",
        entityType: "PREP_SCHEDULE_TASK",
        entityId: t.taskId,
        label: `${t.stepCode} · ${t.name}`,
        field: "duration_days",
        before: t.beforeDuration,
        after: t.afterDuration,
        unit: "j",
        certainty: "CERTAIN",
        reason: "Ajustement planning explicite",
      });
    }
    if (
      sim.beforeDurationWorkingDays != null &&
      sim.afterDurationWorkingDays != null &&
      Math.abs(sim.afterDurationWorkingDays - sim.beforeDurationWorkingDays) > 1e-6
    ) {
      derived.push({
        section: "PLANNING",
        entityType: "PREP_SCHEDULE_PLAN",
        entityId: plan.id,
        label: plan.title,
        field: "base_duration_working_days",
        before: sim.beforeDurationWorkingDays,
        after: sim.afterDurationWorkingDays,
        unit: "j",
        certainty: "CERTAIN",
        reason: "Recalcul durée chantier (simulation)",
      });
    }
    if (sim.beforeEndDate !== sim.afterEndDate) {
      derived.push({
        section: "PLANNING",
        entityType: "PREP_SCHEDULE_PLAN",
        entityId: plan.id,
        label: plan.title,
        field: "end_date",
        before: sim.beforeEndDate,
        after: sim.afterEndDate,
        certainty: "PARTIAL",
        reason: "Date de fin simulée (approximation calendaire V1)",
      });
    }

    if (dependencyOverrides.size > 0) {
      const dateSim = simulateDependencyDateImpact(plan, dependencyOverrides);
      for (const err of dateSim.errors) {
        errors.push(issue("SCHEDULE_RECOMPUTE_FAILED", err, "error"));
      }
      for (const t of dateSim.moved) {
        pushAffected(affected, {
          section: "PLANNING",
          entityType: "PREP_SCHEDULE_TASK",
          id: t.taskId,
          label: `${t.stepCode} · ${t.name}`,
          certainty: "CERTAIN",
        });
        if (t.beforeStart !== t.afterStart) {
          derived.push({
            section: "PLANNING",
            entityType: "PREP_SCHEDULE_TASK",
            entityId: t.taskId,
            label: `${t.stepCode} · ${t.name}`,
            field: "start_date",
            before: t.beforeStart,
            after: t.afterStart,
            unit: null,
            certainty: "CERTAIN",
            reason: "Replanification après dépendance (FS/SS/FF)",
          });
        }
        if (t.beforeEnd !== t.afterEnd) {
          derived.push({
            section: "PLANNING",
            entityType: "PREP_SCHEDULE_TASK",
            entityId: t.taskId,
            label: `${t.stepCode} · ${t.name}`,
            field: "end_date",
            before: t.beforeEnd,
            after: t.afterEnd,
            unit: null,
            certainty: "CERTAIN",
            reason: "Replanification après dépendance (FS/SS/FF)",
          });
        }
      }
      if (
        dateSim.beforeEndDate !== dateSim.afterEndDate &&
        !derived.some(
          (d) =>
            d.entityType === "PREP_SCHEDULE_PLAN" &&
            d.field === "end_date" &&
            d.entityId === plan.id,
        )
      ) {
        derived.push({
          section: "PLANNING",
          entityType: "PREP_SCHEDULE_PLAN",
          entityId: plan.id,
          label: plan.title,
          field: "end_date",
          before: dateSim.beforeEndDate,
          after: dateSim.afterEndDate,
          certainty: "CERTAIN",
          reason: "Fin chantier après replanification des dépendances",
        });
      }
    }
  }

  return {
    directChanges,
    canonicalResolution: buildCanonicalResolution({}),
    derivedChanges: derived,
    affectedEntities: affected,
    protectedEntities: [],
    overrides: [],
    warnings,
    errors,
    impactSummary: summarizeImpact(derived, [], [], sections),
    graph: [
      {
        entityType: "PREP_SCHEDULE_PLAN",
        id: patch.origin.entity_id,
        label: "Planning",
        relationType: null,
        confidence: "CERTAIN",
        mutable: true,
        protected: false,
        children: affected.map((a) => ({
          entityType: a.entityType,
          id: a.id,
          label: a.label,
          relationType: "task",
          confidence: "CERTAIN" as const,
          mutable: true,
          protected: false,
        })),
      },
    ],
  };
}

/* ─── TAKEOFF technical → quote + planning ─── */

function analyzeTakeoffTechnical(
  patch: BeworkPatchV1,
  subgraph: ImpactSubgraph,
): AnalyzePatchImpactResult {
  let directChanges = extractDirectChanges(patch, subgraph);
  const derived: DerivedChange[] = [];
  const affected: AffectedEntity[] = [];
  const protectedEntities: ProtectedEntity[] = [];
  const overrides: OverrideFlag[] = [];
  const warnings: BeworkPatchIssue[] = [];
  const errors: BeworkPatchIssue[] = [];
  const sections = new Set<"TAKEOFF" | "QUOTE" | "PLANNING">(["TAKEOFF"]);

  if (!subgraph.study) {
    return emptyResult({
      directChanges,
      errors: [issue("STUDY_MISSING", "Étude métré absente du sous-graphe.", "error")],
    });
  }

  // Garde centrale provenance — avant toute simulation / commit.
  const sourceGuard = evaluatePatchSourceProtection({ patch, subgraph });
  errors.push(...sourceGuard.errors);
  warnings.push(...sourceGuard.warnings);
  directChanges = annotateDirectChangesWithProtection(
    directChanges,
    sourceGuard.results,
  );
  for (const r of sourceGuard.results) {
    if (r.decision.status === "BLOCKED") {
      protectedEntities.push({
        section: "TAKEOFF",
        entityType: "PREP_PARAMETER",
        id: String(r.opIndex),
        label: r.label,
        reason: r.decision.message,
        gap: {
          field: r.field,
          current: r.before,
          wouldBe: r.after,
          unit: r.unit,
        },
      });
    }
  }
  warnings.push(...detectValidatedQuantityDivergences(subgraph.study));

  const study = subgraph.study;
  const paramUpdates: Record<string, number | null> = {};
  const lineDeclared: Record<string, number | null> = {};
  let resolvedParamKey: string | null = null;
  let resolvedParamId: string | null = null;
  let resolvedLineCode: string | null = null;

  for (const op of patch.operations) {
    if (op.op === "update_parameter") {
      const key =
        op.target.parameter_key ??
        study.params.find(
          (p) => p.id === op.target.parameter_id || p.id === op.target.id,
        )?.key ??
        null;
      if (!key) {
        errors.push(
          issue("TARGET_NOT_FOUND", "Paramètre introuvable pour update_parameter.", "error"),
        );
        continue;
      }
      if (op.changes.value !== undefined) {
        paramUpdates[key] = op.changes.value;
        resolvedParamKey = key;
        resolvedParamId =
          study.params.find((p) => p.key === key)?.id ??
          op.target.parameter_id ??
          null;
      }
    }
    if (op.op === "update_line" && op.changes.declared_quantity !== undefined) {
      const code =
        op.target.line_code ??
        op.target.code ??
        study.lines.find((l) => l.id === op.target.id)?.code ??
        null;
      if (code) {
        lineDeclared[code] = op.changes.declared_quantity;
        resolvedLineCode = code;
      }
    }
    if (op.op === "add_line") {
      pushAffected(affected, {
        section: "TAKEOFF",
        entityType: "PREP_LINE",
        id: op.line.code,
        label: `${op.line.code} · ${op.line.designation}`,
        certainty: "CERTAIN",
      });
    }
  }

  const canonical = buildCanonicalResolution({
    studyId: study.id,
    parameterId: resolvedParamId,
    parameterKey: resolvedParamKey,
    takeoffLineCode: resolvedLineCode,
  });

  // EXACT only if parameter resolved; PARTIAL if only line
  if (!resolvedParamKey && resolvedLineCode) {
    // keep PARTIAL from builder
  }

  const sim = simulateTakeoffFromParamChange({
    study,
    paramUpdates,
    lineDeclaredUpdates: lineDeclared,
  });
  warnings.push(...sim.unresolved);

  for (const code of sim.changedLineCodes) {
    const line = study.lines.find((l) => l.code === code);
    const before = sim.beforeByCode.get(code) ?? null;
    const after = sim.afterByCode.get(code) ?? null;
    const certainty =
      sim.unresolved.some((u) => u.path.includes(code))
        ? "PARTIAL"
        : "CERTAIN";
    derived.push({
      section: "TAKEOFF",
      entityType: "PREP_LINE",
      entityId: line?.id ?? null,
      label: `${code} · ${line?.designation ?? ""}`.trim(),
      field: "quantity",
      before,
      after,
      unit: line?.unit ?? null,
      certainty,
      reason:
        certainty === "CERTAIN"
          ? "Recalcul formule / quantité métré (moteur BeWork)"
          : "Recalcul partiel — formule non résolue",
      blocked: certainty !== "CERTAIN",
      blockReason:
        certainty !== "CERTAIN" ? "CALCULATION_UNRESOLVED" : null,
    });
    pushAffected(affected, {
      section: "TAKEOFF",
      entityType: "PREP_LINE",
      id: line?.id ?? code,
      label: code,
      certainty,
    });
  }

  // Quote impacts via PrepQuoteLink
  const qtyMap = new Map<string, number | null>();
  for (const [code, after] of sim.afterByCode) {
    qtyMap.set(code, after);
  }

  for (const link of subgraph.quoteLinks) {
    if (link.studyId !== study.id) continue;
    if (!sim.changedLineCodes.includes(link.studyLineCode) && !resolvedLineCode) {
      // also include if param change affects this line
      if (!sim.changedLineCodes.includes(link.studyLineCode)) continue;
    }
    if (!sim.changedLineCodes.includes(link.studyLineCode)) continue;

    const quote = subgraph.quotes.find((q) => q.id === link.quoteId);
    const qLine = quote?.lines.find((l) => l.id === link.quoteLineId);
    if (!quote || !qLine) continue;

    sections.add("QUOTE");
    const metreAfter = sim.afterByCode.get(link.studyLineCode) ?? null;
    const metreBefore = sim.beforeByCode.get(link.studyLineCode) ?? null;
    const classified = classifyQuoteLink({
      quote,
      line: qLine,
      link,
      metreQty: metreAfter,
    });

    if (classified.override) overrides.push(classified.override);

    if (classified.class === "PROTECTED") {
      protectedEntities.push({
        section: "QUOTE",
        entityType: "COMMERCIAL_QUOTE",
        id: quote.id,
        label: quote.number,
        reason: quoteProtectionReason(quote.status),
        gap:
          metreAfter != null
            ? {
                field: "quantity",
                current: qLine.quantity,
                wouldBe: metreAfter,
                unit: qLine.unit,
              }
            : undefined,
      });
      derived.push({
        section: "QUOTE",
        entityType: "QUOTE_ITEM",
        entityId: qLine.id,
        label: `${quote.number} · ${qLine.designation}`,
        field: "quantity",
        before: qLine.quantity,
        after: qLine.quantity,
        unit: qLine.unit,
        certainty: "NONE",
        reason: "Devis contractuel impacté — pas d’écrasement simulé.",
        blocked: true,
        blockReason: quoteProtectionReason(quote.status),
        quoteLinkClass: "PROTECTED",
      });
      continue;
    }

    if (classified.class === "LIKELY_OVERRIDE") {
      derived.push({
        section: "QUOTE",
        entityType: "QUOTE_ITEM",
        entityId: qLine.id,
        label: `${quote.number} · ${qLine.designation}`,
        field: "quantity",
        before: qLine.quantity,
        after: qLine.quantity,
        unit: qLine.unit,
        certainty: "POTENTIAL",
        reason:
          "Valeur commerciale différente de la valeur transférée — pas de resync auto.",
        blocked: true,
        blockReason: "LIKELY_OVERRIDE",
        quoteLinkClass: "LIKELY_OVERRIDE",
      });
      warnings.push(
        issue(
          "LIKELY_OVERRIDE",
          `⚠ Quantité commerciale probablement modifiée manuellement (${quote.number}). Métré ${metreAfter ?? "—"} · transfert ${link.quantityAtTransfer} · devis ${qLine.quantity}.`,
        ),
      );
      continue;
    }

    // LINKED_STANDARD — simulate qty sync if CERTAIN takeoff calc
    const takeoffCertain = derived.some(
      (d) =>
        d.section === "TAKEOFF" &&
        d.label.startsWith(link.studyLineCode) &&
        d.certainty === "CERTAIN",
    );
    if (!takeoffCertain || metreAfter == null) {
      derived.push({
        section: "QUOTE",
        entityType: "QUOTE_ITEM",
        entityId: qLine.id,
        label: `${quote.number} · ${qLine.designation}`,
        field: "quantity",
        before: qLine.quantity,
        after: null,
        certainty: "PARTIAL",
        reason: "Lien devis connu mais recalcul métré non certain.",
        blocked: true,
        blockReason: "CALCULATION_UNRESOLVED",
        quoteLinkClass: "LINKED_STANDARD",
      });
      continue;
    }

    const qSim = simulateQuoteLine({ line: qLine, quantity: metreAfter });
    derived.push({
      section: "QUOTE",
      entityType: "QUOTE_ITEM",
      entityId: qLine.id,
      label: `${quote.number} · ${qLine.designation}`,
      field: "quantity",
      before: metreBefore ?? qLine.quantity,
      after: metreAfter,
      unit: qLine.unit,
      certainty: "CERTAIN",
      reason: "Lien PrepQuoteLink — sync quantité simulée",
      quoteLinkClass: "LINKED_STANDARD",
    });
    derived.push({
      section: "QUOTE",
      entityType: "QUOTE_ITEM",
      entityId: qLine.id,
      label: `${quote.number} · ${qLine.designation}`,
      field: "line_ht",
      before: qSim.beforeLineHt,
      after: qSim.afterLineHt,
      unit: "€ HT",
      certainty: "CERTAIN",
      reason: "Recalcul ligne devis depuis quantité métré",
      quoteLinkClass: "LINKED_STANDARD",
    });
    pushAffected(affected, {
      section: "QUOTE",
      entityType: "QUOTE_ITEM",
      id: qLine.id,
      label: qLine.designation,
      certainty: "CERTAIN",
    });
  }

  // Planning via PrepScheduleTakeoffLink
  for (const plan of subgraph.plans) {
    const relevantLinks = plan.takeoffLinks.filter((l) =>
      sim.changedLineCodes.includes(l.studyLineCode),
    );
    if (!relevantLinks.length) continue;
    sections.add("PLANNING");
    const planSim = simulatePlanFromQuantityMap(plan, qtyMap);
    for (const t of planSim.tasks) {
      const linked = relevantLinks.some((l) => l.taskId === t.taskId);
      if (!linked) continue;
      if (
        t.mode === "unchanged" ||
        (Math.abs(t.afterDuration - t.beforeDuration) < 1e-9 &&
          t.beforeQty === t.afterQty)
      ) {
        if (t.afterQty != null && t.beforeQty !== t.afterQty) {
          derived.push({
            section: "PLANNING",
            entityType: "PREP_SCHEDULE_TASK",
            entityId: t.taskId,
            label: `${t.stepCode} · ${t.name}`,
            field: "quantity_snapshot",
            before: t.beforeQty,
            after: t.afterQty,
            unit: t.quantityUnit,
            certainty: "CERTAIN",
            reason: "Quantité pilote liée au métré",
          });
        }
        continue;
      }
      if (t.afterQty != null && t.beforeQty !== t.afterQty) {
        derived.push({
          section: "PLANNING",
          entityType: "PREP_SCHEDULE_TASK",
          entityId: t.taskId,
          label: `${t.stepCode} · ${t.name}`,
          field: "quantity_snapshot",
          before: t.beforeQty,
          after: t.afterQty,
          unit: t.quantityUnit,
          certainty: "CERTAIN",
          reason: "Quantité pilote liée au métré",
        });
      }
      if (Math.abs(t.afterDuration - t.beforeDuration) >= 1e-9) {
        const certainty =
          t.mode === "rate" ? "CERTAIN" : t.mode === "scale" ? "PARTIAL" : "POTENTIAL";
        derived.push({
          section: "PLANNING",
          entityType: "PREP_SCHEDULE_TASK",
          entityId: t.taskId,
          label: `${t.stepCode} · ${t.name}`,
          field: "duration_days",
          before: t.beforeDuration,
          after: t.afterDuration,
          unit: "j",
          certainty,
          reason:
            t.mode === "rate"
              ? "Recalcul durée via rendement"
              : t.mode === "locked"
                ? "Durée verrouillée — non recalculée"
                : "Recalcul durée proportionnel (rendement non disponible)",
          blocked: t.mode === "locked",
          blockReason: t.mode === "locked" ? "DURATION_LOCKED" : null,
        });
        pushAffected(affected, {
          section: "PLANNING",
          entityType: "PREP_SCHEDULE_TASK",
          id: t.taskId,
          label: t.stepCode,
          certainty,
        });
      }
    }
    if (
      planSim.beforeDurationWorkingDays != null &&
      planSim.afterDurationWorkingDays != null &&
      Math.abs(
        planSim.afterDurationWorkingDays - planSim.beforeDurationWorkingDays,
      ) > 1e-6
    ) {
      derived.push({
        section: "PLANNING",
        entityType: "PREP_SCHEDULE_PLAN",
        entityId: plan.id,
        label: plan.title,
        field: "base_duration_working_days",
        before: planSim.beforeDurationWorkingDays,
        after: planSim.afterDurationWorkingDays,
        unit: "j",
        certainty: "PARTIAL",
        reason: "Durée chantier simulée",
      });
    }
    if (planSim.beforeEndDate !== planSim.afterEndDate) {
      derived.push({
        section: "PLANNING",
        entityType: "PREP_SCHEDULE_PLAN",
        entityId: plan.id,
        label: plan.title,
        field: "end_date",
        before: planSim.beforeEndDate,
        after: planSim.afterEndDate,
        certainty: "PARTIAL",
        reason: "Fin chantier simulée",
      });
    }
  }

  const graph = buildTakeoffImpactGraph({
    study,
    resolvedParamKey,
    resolvedParamId,
    changedCodes: sim.changedLineCodes,
    quoteLinks: subgraph.quoteLinks,
    quotes: subgraph.quotes,
    plans: subgraph.plans,
    derived,
  });

  return {
    directChanges,
    canonicalResolution: canonical,
    derivedChanges: derived,
    affectedEntities: affected,
    protectedEntities,
    overrides,
    warnings,
    errors,
    impactSummary: summarizeImpact(derived, protectedEntities, overrides, sections),
    graph,
  };
}

/* ─── QUOTE TECHNICAL_CORRECTION → takeoff (EXACT/PARTIAL/NONE) ─── */

function analyzeQuoteTechnical(
  patch: BeworkPatchV1,
  subgraph: ImpactSubgraph,
): AnalyzePatchImpactResult {
  const directChanges = extractDirectChanges(patch, subgraph);
  const derived: DerivedChange[] = [];
  const affected: AffectedEntity[] = [];
  const protectedEntities: ProtectedEntity[] = [];
  const warnings: BeworkPatchIssue[] = [];
  const sections = new Set<"TAKEOFF" | "QUOTE" | "PLANNING">(["QUOTE"]);

  let bestCanonical = buildCanonicalResolution({});

  for (const op of patch.operations) {
    if (op.op !== "update_quote_item") continue;
    const quote = subgraph.quotes.find((q) => q.id === op.target.quote_id);
    const line = quote?.lines.find(
      (l) => l.id === op.target.item_id || l.id === op.target.id,
    );
    if (!quote || !line) continue;

    pushAffected(affected, {
      section: "QUOTE",
      entityType: "QUOTE_ITEM",
      id: line.id,
      label: line.designation,
      certainty: "CERTAIN",
    });

    const link = subgraph.quoteLinks.find((l) => l.quoteLineId === line.id);
    if (!link) {
      bestCanonical = buildCanonicalResolution({});
      warnings.push(
        issue(
          "NONE_CANONICAL",
          "Aucune PrepQuoteLink — aucune propagation métré/planning.",
        ),
      );
      // local quote change only if commercial-compatible fields
      if (op.changes.quantity !== undefined && !isQuoteProtected(quote.status)) {
        const sim = simulateQuoteLine({ line, quantity: op.changes.quantity });
        derived.push({
          section: "QUOTE",
          entityType: "QUOTE_ITEM",
          entityId: line.id,
          label: line.designation,
          field: "quantity",
          before: sim.beforeQty,
          after: sim.afterQty,
          unit: line.unit,
          certainty: "CERTAIN",
          reason: "Modification locale devis (pas de lien métré)",
          quoteLinkClass: "UNLINKED",
        });
      }
      continue;
    }

    // PARTIAL — ligne métré connue, pas de parameter_id
    bestCanonical = buildCanonicalResolution({
      studyId: link.studyId,
      takeoffLineCode: link.studyLineCode,
    });
    sections.add("TAKEOFF");
    warnings.push(
      issue(
        "PARTIAL_CANONICAL_RESOLUTION",
        `Ligne de métré retrouvée (${link.studyLineCode}). Source technique précise non résolue — aucun PrepParameter inventé.`,
      ),
    );

    // Si le patch cible explicitement la quantité ligne, simuler update_line declared
    if (
      op.changes.quantity !== undefined &&
      subgraph.study &&
      bestCanonical.status === "PARTIAL"
    ) {
      const takeoffLine = subgraph.study.lines.find(
        (l) => l.code === link.studyLineCode,
      );
      if (takeoffLine && !takeoffLine.formula) {
        derived.push({
          section: "TAKEOFF",
          entityType: "PREP_LINE",
          entityId: takeoffLine.id,
          label: takeoffLine.code,
          field: "declared_quantity",
          before: takeoffLine.declaredQuantity,
          after: op.changes.quantity,
          unit: takeoffLine.unit,
          certainty: "PARTIAL",
          reason:
            "Simulation quantité ligne métré (pas de formule) — paramètre source inconnu",
        });
      } else if (takeoffLine?.formula) {
        warnings.push(
          issue(
            "CALCULATION_UNRESOLVED",
            `Ligne ${link.studyLineCode} a une formule — impossible de propager depuis le devis sans parameter_id.`,
          ),
        );
      }
    }

    if (isQuoteProtected(quote.status)) {
      protectedEntities.push({
        section: "QUOTE",
        entityType: "COMMERCIAL_QUOTE",
        id: quote.id,
        label: quote.number,
        reason: quoteProtectionReason(quote.status),
      });
    } else if (op.changes.quantity !== undefined) {
      const sim = simulateQuoteLine({ line, quantity: op.changes.quantity });
      derived.push({
        section: "QUOTE",
        entityType: "QUOTE_ITEM",
        entityId: line.id,
        label: line.designation,
        field: "quantity",
        before: sim.beforeQty,
        after: sim.afterQty,
        unit: line.unit,
        certainty: "CERTAIN",
        reason: "Modification devis directe",
      });
    }
  }

  return {
    directChanges,
    canonicalResolution: bestCanonical,
    derivedChanges: derived,
    affectedEntities: affected,
    protectedEntities,
    overrides: [],
    warnings,
    errors: [],
    impactSummary: summarizeImpact(derived, protectedEntities, [], sections),
    graph: [],
  };
}

function buildTakeoffImpactGraph(input: {
  study: ImpactSubgraph["study"];
  resolvedParamKey: string | null;
  resolvedParamId: string | null;
  changedCodes: string[];
  quoteLinks: ImpactSubgraph["quoteLinks"];
  quotes: ImpactSubgraph["quotes"];
  plans: ImpactSubgraph["plans"];
  derived: DerivedChange[];
}): ImpactGraphNode[] {
  if (!input.study) return [];
  const paramNode: ImpactGraphNode | null = input.resolvedParamKey
    ? {
        entityType: "PREP_PARAMETER",
        id: input.resolvedParamId ?? input.resolvedParamKey,
        label: input.resolvedParamKey,
        relationType: null,
        confidence: "CERTAIN",
        mutable: true,
        protected: false,
        children: [],
      }
    : null;

  const lineNodes: ImpactGraphNode[] = input.changedCodes.map((code) => {
    const line = input.study!.lines.find((l) => l.code === code);
    const children: ImpactGraphNode[] = [];
    for (const link of input.quoteLinks.filter((l) => l.studyLineCode === code)) {
      const quote = input.quotes.find((q) => q.id === link.quoteId);
      children.push({
        entityType: "QUOTE_ITEM",
        id: link.quoteLineId,
        label: quote?.number ?? link.quoteId,
        relationType: "PrepQuoteLink",
        confidence: "CERTAIN",
        mutable: quote ? !isQuoteProtected(quote.status) : false,
        protected: quote ? isQuoteProtected(quote.status) : false,
      });
    }
    for (const plan of input.plans) {
      for (const tl of plan.takeoffLinks.filter((l) => l.studyLineCode === code)) {
        const task = plan.tasks.find((t) => t.id === tl.taskId);
        children.push({
          entityType: "PREP_SCHEDULE_TASK",
          id: tl.taskId,
          label: task?.stepCode ?? tl.taskId,
          relationType: "PrepScheduleTakeoffLink",
          confidence: "CERTAIN",
          mutable: true,
          protected: false,
          children: [
            {
              entityType: "PREP_SCHEDULE_PLAN",
              id: plan.id,
              label: plan.title,
              relationType: "plan",
              confidence: "CERTAIN",
              mutable: true,
              protected: false,
            },
          ],
        });
      }
    }
    return {
      entityType: "PREP_LINE",
      id: line?.id ?? code,
      label: code,
      relationType: "formula_dependent",
      confidence: "CERTAIN",
      mutable: true,
      protected: false,
      children,
    };
  });

  if (paramNode) {
    paramNode.children = lineNodes;
    return [paramNode];
  }
  return lineNodes;
}
