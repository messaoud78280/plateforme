/**
 * Catalogue des opérations autorisées + compatibilité change_intent.
 */
import type {
  BeworkChangeIntent,
  BeworkEntityType,
  BeworkPatchOpName,
  BeworkPatchSection,
  BeworkSupportedOperationSpec,
} from "@/lib/bework-patch/types";
import { isPlanningCommitSupportedOp } from "@/lib/bework-patch/commit/planning-capability";
import { fieldContractsForOp } from "@/lib/bework-patch/operation-contracts";

const ALL_TECHNICAL: BeworkChangeIntent[] = [
  "TECHNICAL_CORRECTION",
  "TECHNICAL_OVERRIDE",
  "FIELD_UPDATE",
];
const COMMERCIAL: BeworkChangeIntent[] = [
  "COMMERCIAL_ADJUSTMENT",
  "ADMINISTRATIVE_UPDATE",
];
const PLANNING: BeworkChangeIntent[] = ["PLANNING_ADJUSTMENT", "TECHNICAL_CORRECTION"];
const PROGRESS: BeworkChangeIntent[] = ["PROGRESS_UPDATE"];
const DOCUMENT: BeworkChangeIntent[] = ["DOCUMENT_EDIT", "ADMINISTRATIVE_UPDATE"];
const FIELD: BeworkChangeIntent[] = ["FIELD_UPDATE", "TECHNICAL_CORRECTION"];

export const OPERATION_CATALOG: Record<
  BeworkPatchOpName,
  {
    entity_types: BeworkEntityType[];
    sections: BeworkPatchSection[];
    compatible_intents: BeworkChangeIntent[];
    allowed_change_fields: string[];
  }
> = {
  update_parameter: {
    entity_types: ["PREP_PARAMETER"],
    sections: ["TAKEOFF", "QUOTE", "VISIT"],
    compatible_intents: ALL_TECHNICAL,
    allowed_change_fields: ["value", "label", "note"],
  },
  update_line: {
    entity_types: ["PREP_LINE"],
    sections: ["TAKEOFF", "QUOTE"],
    compatible_intents: [...ALL_TECHNICAL, "DOCUMENT_EDIT"],
    allowed_change_fields: [
      "designation",
      "description",
      "declared_quantity",
      "unit",
      "lot",
      "notes",
    ],
  },
  add_line: {
    entity_types: ["PREP_STUDY"],
    sections: ["TAKEOFF"],
    compatible_intents: ["TECHNICAL_CORRECTION", "FIELD_UPDATE", "ADMINISTRATIVE_UPDATE"],
    allowed_change_fields: [],
  },
  delete_line: {
    entity_types: ["PREP_LINE"],
    sections: ["TAKEOFF"],
    compatible_intents: ["TECHNICAL_CORRECTION", "ADMINISTRATIVE_UPDATE"],
    allowed_change_fields: [],
  },
  update_hypothesis: {
    entity_types: ["PREP_HYPOTHESIS"],
    sections: ["TAKEOFF"],
    compatible_intents: [...ALL_TECHNICAL, "DOCUMENT_EDIT"],
    allowed_change_fields: ["statement", "reason"],
  },
  update_quote_item: {
    entity_types: ["QUOTE_ITEM"],
    sections: ["QUOTE"],
    compatible_intents: [
      ...COMMERCIAL,
      "TECHNICAL_CORRECTION",
      "TECHNICAL_OVERRIDE",
      "DOCUMENT_EDIT",
    ],
    allowed_change_fields: [
      "designation",
      "description",
      "quantity",
      "unit",
      "unit_price_ht",
      "vat_rate",
      "discount_percent",
    ],
  },
  add_quote_item: {
    entity_types: ["COMMERCIAL_QUOTE", "QUOTE_SECTION"],
    sections: ["QUOTE"],
    compatible_intents: [...COMMERCIAL, "TECHNICAL_CORRECTION"],
    allowed_change_fields: [],
  },
  delete_quote_item: {
    entity_types: ["QUOTE_ITEM"],
    sections: ["QUOTE"],
    compatible_intents: [...COMMERCIAL, "ADMINISTRATIVE_UPDATE"],
    allowed_change_fields: [],
  },
  update_quote_section: {
    entity_types: ["QUOTE_SECTION"],
    sections: ["QUOTE"],
    compatible_intents: [...COMMERCIAL, "DOCUMENT_EDIT", "ADMINISTRATIVE_UPDATE"],
    allowed_change_fields: ["title"],
  },
  update_quote_meta: {
    entity_types: ["COMMERCIAL_QUOTE"],
    sections: ["QUOTE"],
    compatible_intents: [...COMMERCIAL, "DOCUMENT_EDIT", "ADMINISTRATIVE_UPDATE"],
    allowed_change_fields: [
      "subject",
      "client_notes",
      "internal_notes",
      "payment_terms",
    ],
  },
  update_task: {
    entity_types: ["PREP_SCHEDULE_TASK"],
    sections: ["PLANNING"],
    compatible_intents: [...PLANNING, "DOCUMENT_EDIT"],
    allowed_change_fields: [
      "name",
      "description",
      "lot",
      "preconditions",
      "controls",
      "safety",
      "equipment",
      "supplies",
    ],
  },
  update_duration: {
    entity_types: ["PREP_SCHEDULE_TASK"],
    sections: ["PLANNING"],
    compatible_intents: PLANNING,
    allowed_change_fields: ["duration_days"],
  },
  update_productivity: {
    entity_types: ["PREP_SCHEDULE_TASK"],
    sections: ["PLANNING"],
    compatible_intents: PLANNING,
    allowed_change_fields: ["rate_id", "rate_value", "parallel_units"],
  },
  update_crew: {
    entity_types: ["PREP_SCHEDULE_TASK"],
    sections: ["PLANNING"],
    compatible_intents: PLANNING,
    allowed_change_fields: ["crew_id", "crew_size", "parallelizable"],
  },
  update_dependency: {
    entity_types: ["PREP_SCHEDULE_TASK"],
    sections: ["PLANNING"],
    compatible_intents: PLANNING,
    allowed_change_fields: ["depends_on"],
  },
  update_start_date: {
    entity_types: ["PREP_SCHEDULE_PLAN"],
    sections: ["PLANNING"],
    compatible_intents: PLANNING,
    allowed_change_fields: ["start_date"],
  },
  update_workload: {
    entity_types: ["PREP_SCHEDULE_TASK"],
    sections: ["PLANNING"],
    compatible_intents: PLANNING,
    allowed_change_fields: ["workload_person_days"],
  },
  add_task: {
    entity_types: ["PREP_SCHEDULE_PLAN"],
    sections: ["PLANNING"],
    compatible_intents: PLANNING,
    allowed_change_fields: [],
  },
  remove_task: {
    entity_types: ["PREP_SCHEDULE_TASK"],
    sections: ["PLANNING"],
    compatible_intents: PLANNING,
    allowed_change_fields: [],
  },
  update_visit: {
    entity_types: ["SITE_VISIT"],
    sections: ["VISIT"],
    compatible_intents: FIELD,
    allowed_change_fields: ["subject", "client_need", "comments"],
  },
  update_measurement: {
    entity_types: ["SITE_VISIT_MEASUREMENT"],
    sections: ["VISIT"],
    compatible_intents: FIELD,
    allowed_change_fields: [
      "label",
      "length_m",
      "width_m",
      "height_m",
      "quantity_value",
      "unit",
      "observation",
    ],
  },
  add_measurement: {
    entity_types: ["SITE_VISIT"],
    sections: ["VISIT"],
    compatible_intents: FIELD,
    allowed_change_fields: [],
  },
  update_follow_up: {
    entity_types: ["FOLLOW_UP_SHEET"],
    sections: ["FOLLOW_UP"],
    compatible_intents: [...DOCUMENT, "FIELD_UPDATE", "ADMINISTRATIVE_UPDATE"],
    allowed_change_fields: ["title", "notes"],
  },
  update_progress: {
    entity_types: ["FOLLOW_UP_SHEET", "PREP_SCHEDULE_TASK"],
    sections: ["FOLLOW_UP", "PLANNING"],
    compatible_intents: PROGRESS,
    allowed_change_fields: [
      "progress_percent",
      "status",
      "actual_quantity",
      "note",
    ],
  },
  update_report: {
    entity_types: ["SITE_DOCUMENT"],
    sections: ["REPORT"],
    compatible_intents: DOCUMENT,
    allowed_change_fields: [
      "title",
      "quick_notes",
      "summary",
      "additional_notes",
    ],
  },
  update_notice: {
    entity_types: ["SITE_DOCUMENT"],
    sections: ["NOTICE"],
    compatible_intents: DOCUMENT,
    allowed_change_fields: [
      "title",
      "quick_notes",
      "summary",
      "additional_notes",
    ],
  },
  update_document_section: {
    entity_types: ["SITE_DOCUMENT"],
    sections: ["REPORT", "NOTICE"],
    compatible_intents: DOCUMENT,
    allowed_change_fields: ["section_key", "title", "text"],
  },
  add_document_section: {
    entity_types: ["SITE_DOCUMENT"],
    sections: ["REPORT", "NOTICE"],
    compatible_intents: DOCUMENT,
    allowed_change_fields: [],
  },
  update_text: {
    entity_types: ["SITE_DOCUMENT", "FOLLOW_UP_SHEET"],
    sections: ["REPORT", "NOTICE", "FOLLOW_UP"],
    compatible_intents: DOCUMENT,
    allowed_change_fields: ["field", "text"],
  },
};

/** Règles supplémentaires : champs prix = commercial uniquement (sauf override technique explicite sur qty). */
export function isIntentCompatibleWithOp(
  intent: BeworkChangeIntent,
  op: BeworkPatchOpName,
  changeKeys: string[],
): { ok: boolean; message?: string } {
  const cat = OPERATION_CATALOG[op];
  if (!cat.compatible_intents.includes(intent)) {
    return {
      ok: false,
      message: `L'intent ${intent} n'est pas compatible avec l'opération ${op}.`,
    };
  }

  const priceFields = ["unit_price_ht", "vat_rate", "discount_percent"];
  const hasPrice = changeKeys.some((k) => priceFields.includes(k));
  if (hasPrice && intent === "FIELD_UPDATE") {
    return {
      ok: false,
      message: `Modification de prix incompatible avec FIELD_UPDATE (utiliser COMMERCIAL_ADJUSTMENT).`,
    };
  }
  if (hasPrice && intent === "TECHNICAL_CORRECTION" && !changeKeys.includes("quantity")) {
    return {
      ok: false,
      message: `Modification de prix seule incompatible avec TECHNICAL_CORRECTION (utiliser COMMERCIAL_ADJUSTMENT).`,
    };
  }
  if (
    changeKeys.includes("quantity") &&
    intent === "COMMERCIAL_ADJUSTMENT" &&
    !hasPrice &&
    changeKeys.length === 1
  ) {
    // Quantité seule en commercial = override possible — warning plutôt qu'erreur (géré ailleurs)
  }
  return { ok: true };
}

export function supportedOperationsForSection(
  section: BeworkPatchSection,
): BeworkSupportedOperationSpec[] {
  const out: BeworkSupportedOperationSpec[] = [];
  for (const [op, cat] of Object.entries(OPERATION_CATALOG) as Array<
    [BeworkPatchOpName, (typeof OPERATION_CATALOG)[BeworkPatchOpName]]
  >) {
    if (!cat.sections.includes(section)) continue;
    // Contrat honnête : PLANNING n'expose que les ops réellement commitables.
    if (section === "PLANNING" && !isPlanningCommitSupportedOp(op)) continue;
    out.push({
      op,
      entity_types: cat.entity_types,
      allowed_change_fields: cat.allowed_change_fields,
      compatible_intents: cat.compatible_intents,
      field_contracts: fieldContractsForOp(op),
    });
  }
  return out;
}

export function intentsForSection(section: BeworkPatchSection): BeworkChangeIntent[] {
  const set = new Set<BeworkChangeIntent>();
  for (const spec of supportedOperationsForSection(section)) {
    for (const i of spec.compatible_intents) set.add(i);
  }
  return [...set];
}
