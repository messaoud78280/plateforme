/**
 * Contrat canonique bework_patch_v1 exposé à ChatGPT.
 *
 * Les opérations viennent exclusivement de supportedOperationsForSection :
 * une opération absente du commit n'est donc jamais annoncée dans le contexte.
 * Le parser réutilise les constantes racine ci-dessous.
 */
import { supportedOperationsForSection } from "@/lib/bework-patch/operations-catalog";
import {
  BEWORK_PATCH_FORMAT,
  BEWORK_PATCH_SCHEMA_VERSION,
  type BeworkPatchOpName,
  type BeworkPatchOperationOutputContract,
  type BeworkPatchOrigin,
  type BeworkPatchOutputContractV1,
  type BeworkPatchSection,
  type BeworkSupportedOperationSpec,
} from "@/lib/bework-patch/types";

export const BEWORK_PATCH_ROOT_REQUIRED = [
  "type",
  "schema_version",
  "patch_id",
  "origin",
  "change_intent",
  "operations",
] as const;

export const BEWORK_PATCH_ORIGIN_REQUIRED = [
  "section",
  "project_id",
  "entity_id",
  "base_version",
] as const;

export const BEWORK_PATCH_ORIGIN_MEANING =
  "origin décrit la cible métier et sa version. C'est obligatoirement un objet ; ce champ ne décrit jamais la provenance IA et ne doit jamais valoir « CHATGPT ».";

type Obj = Record<string, unknown>;

function isObj(value: unknown): value is Obj {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function firstRecordInArray(value: unknown, key: string): Obj | null {
  if (!isObj(value)) return null;
  const direct = value[key];
  if (Array.isArray(direct)) {
    const found = direct.find(isObj);
    if (found) return found;
  }
  for (const child of Object.values(value)) {
    if (isObj(child)) {
      const found = firstRecordInArray(child, key);
      if (found) return found;
    }
    if (Array.isArray(child)) {
      for (const item of child) {
        if (!isObj(item)) continue;
        const found = firstRecordInArray(item, key);
        if (found) return found;
      }
    }
  }
  return null;
}

function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function finite(value: unknown, fallback: number | null): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function targetContract(op: BeworkPatchOpName): {
  required: string[];
  one_of?: string[][];
} {
  switch (op) {
    case "update_parameter":
      return {
        required: ["study_id"],
        one_of: [["parameter_id"], ["parameter_key"], ["id"]],
      };
    case "update_line":
    case "delete_line":
      return {
        required: ["study_id"],
        one_of: [["line_id"], ["line_code"], ["id"], ["code"]],
      };
    case "add_line":
      return { required: ["study_id"] };
    case "update_hypothesis":
      return { required: ["study_id", "id"] };
    case "update_quote_item":
    case "delete_quote_item":
      return { required: ["quote_id"], one_of: [["item_id"], ["id"]] };
    case "add_quote_item":
    case "update_quote_section":
    case "update_quote_meta":
      return { required: ["quote_id"] };
    case "update_start_date":
    case "add_task":
      return { required: ["plan_id"] };
    case "update_task":
    case "update_duration":
    case "update_productivity":
    case "update_crew":
    case "update_dependency":
    case "update_workload":
    case "remove_task":
      return {
        required: ["plan_id"],
        one_of: [["task_id"], ["step_code"], ["id"], ["code"]],
      };
    case "update_visit":
      return { required: [], one_of: [["visit_id"], ["id"]] };
    case "update_measurement":
      return {
        required: ["visit_id"],
        one_of: [["measurement_id"], ["id"]],
      };
    case "add_measurement":
      return { required: ["visit_id"] };
    case "update_follow_up":
      return { required: [], one_of: [["sheet_id"], ["id"]] };
    case "update_progress":
      return { required: [], one_of: [["sheet_id"], ["task_id"], ["id"]] };
    case "update_report":
    case "update_notice":
      return { required: [], one_of: [["document_id"], ["id"]] };
    case "update_document_section":
    case "add_document_section":
      return { required: ["document_id"] };
    case "update_text":
      return { required: [], one_of: [["document_id"], ["sheet_id"], ["id"]] };
    case "add_supply_need":
    case "add_supplier":
      return { required: [], one_of: [["project_id"], ["id"]] };
    case "update_supply_need":
    case "cancel_supply_need":
    case "add_supply_offer":
      return { required: [], one_of: [["requirement_id"], ["id"]] };
    case "update_supply_offer":
    case "archive_supply_offer":
      return { required: [], one_of: [["offer_id"], ["id"]] };
  }
}

function payloadContract(
  spec: BeworkSupportedOperationSpec,
): BeworkPatchOperationOutputContract["payload"] {
  const structural: Partial<
    Record<
      BeworkPatchOpName,
      {
        key: Exclude<BeworkPatchOperationOutputContract["payload"]["key"], "changes" | null>;
        required_fields: string[];
        allowed_fields: string[];
        rule?: string;
      }
    >
  > = {
    add_line: {
      key: "line",
      required_fields: ["code", "lot", "designation", "unit"],
      allowed_fields: [
        "code",
        "lot",
        "designation",
        "unit",
        "description",
        "formula",
        "declared_quantity",
        "provenance",
        "role",
        "nature",
        "notes",
        "included_services",
        "technical_references",
        "execution_notes",
        "quality_controls",
        "technical_reservations",
      ],
      rule: "Le payload est line, jamais changes.",
    },
    add_task: {
      key: "task",
      required_fields: ["step_code", "name", "duration_days"],
      allowed_fields: [
        "step_code",
        "name",
        "duration_days",
        "kind",
        "duration_calendar",
        "lot",
        "crew_id",
        "crew_size",
        "members",
        "depends_on",
        "description",
        "preconditions",
        "controls",
        "constraints",
        "safety",
        "proofs",
        "assumptions",
        "technical_references",
        "hold_point",
      ],
    },
    add_measurement: {
      key: "measurement",
      required_fields: ["label", "unit"],
      allowed_fields: [
        "label",
        "unit",
        "length_m",
        "width_m",
        "height_m",
        "quantity_value",
        "observation",
      ],
    },
    add_supply_need: {
      key: "need",
      required_fields: ["label", "unit", "validated_order_quantity"],
      allowed_fields: [
        "label",
        "unit",
        "validated_order_quantity",
        "category",
        "procurement_mode",
        "description",
        "source_quantity",
        "source_unit",
        "calculated_quantity",
        "loss_factor",
        "packaging",
        "packaging_size",
        "packaging_unit",
        "takeoff_codes",
        "schedule_task_ids",
        "needed_at",
        "notes",
        "source_type",
        "source_label",
        "status",
        "is_hypothesis",
      ],
      rule:
        "validated_order_quantity doit être > 0. Toute quantité incertaine doit être marquée is_hypothesis: true.",
    },
    add_supply_offer: {
      key: "offer",
      required_fields: ["product_label", "price_source_type"],
      allowed_fields: [
        "supplier_external_org_id",
        "supplier_ref",
        "product_label",
        "product_ref",
        "tech_attributes",
        "equivalence_status",
        "unit_price",
        "price_unit",
        "price_tax_mode",
        "vat_rate",
        "price_source_type",
        "source_url",
        "quote_number",
        "quote_document_ref",
        "source_note",
        "observed_at",
        "valid_until",
        "packaging_label",
        "units_per_pack",
        "minimum_order_quantity",
        "lead_time_days",
        "availability_note",
        "delivery_fee",
        "crane_fee",
        "other_fees",
      ],
      rule:
        "WEB_VERIFIED exige une URL http(s) et une date observée réelles. Une absence de prix vaut null, jamais 0.",
    },
    add_supplier: {
      key: "supplier",
      required_fields: ["ref", "name"],
      allowed_fields: [
        "ref",
        "name",
        "trade_name",
        "parent_external_org_id",
        "address",
        "zip_code",
        "city",
        "phone",
        "email",
        "website",
        "activity",
        "notes",
      ],
    },
  };
  const value = structural[spec.op];
  if (value) return { ...value, type: "object" };

  const withoutPayload = new Set<BeworkPatchOpName>([
    "delete_line",
    "delete_quote_item",
    "remove_task",
    "cancel_supply_need",
    "archive_supply_offer",
  ]);
  if (withoutPayload.has(spec.op)) {
    return {
      key: null,
      type: null,
      required_fields: [],
      allowed_fields: [],
    };
  }
  return {
    key: "changes",
    type: "object",
    required_fields: [],
    allowed_fields: spec.allowed_change_fields ?? [],
    rule:
      spec.op === "update_dependency"
        ? "changes.depends_on est un tableau d'objets { step_id, type?: FS|SS|FF, lag_days?: number }, jamais un tableau de chaînes."
        : "Au moins un champ autorisé doit être fourni.",
  };
}

function exampleOperation(input: {
  section: BeworkPatchSection;
  origin: BeworkPatchOrigin;
  data: Record<string, unknown>;
}): Obj {
  const { section, origin, data } = input;
  switch (section) {
    case "TAKEOFF": {
      const parameter = firstRecordInArray(data, "parameters");
      if (parameter) {
        return {
          op: "update_parameter",
          target: {
            entity_type: "PREP_PARAMETER",
            study_id: origin.entity_id,
            parameter_id: text(parameter.id, "<PARAMETER_ID_FROM_DATA>"),
            parameter_key: text(parameter.key, "<PARAMETER_KEY_FROM_DATA>"),
          },
          changes: { value: finite(parameter.value, null) },
        };
      }
      const line = firstRecordInArray(data, "lines");
      if (line) {
        return {
          op: "update_line",
          target: {
            entity_type: "PREP_LINE",
            study_id: origin.entity_id,
            line_id: text(line.id, "<LINE_ID_FROM_DATA>"),
            line_code: text(line.code, "<LINE_CODE_FROM_DATA>"),
          },
          changes: {
            designation: text(
              line.designation,
              "Désignation existante à remplacer par la modification proposée",
            ),
          },
        };
      }
      return {
        op: "add_line",
        target: {
          entity_type: "PREP_STUDY",
          study_id: origin.entity_id,
        },
        line: {
          code: "EXAMPLE-01",
          lot: "À CONFIRMER",
          designation: "EXEMPLE STRUCTUREL À REMPLACER — prestation à confirmer",
          unit: "u",
          declared_quantity: 1,
          provenance: "HYPOTHESE",
          role: "quote",
          technical_reservations: [
            "Exemple non applicable sans validation des données chantier.",
          ],
        },
      };
    }
    case "QUOTE": {
      const item = firstRecordInArray(data, "items");
      return {
        op: "update_quote_item",
        target: {
          entity_type: "QUOTE_ITEM",
          quote_id: origin.entity_id,
          item_id: text(item?.item_id, "<ITEM_ID_FROM_DATA>"),
        },
        changes: {
          designation: text(
            item?.designation,
            "Désignation existante à remplacer par la modification proposée",
          ),
        },
      };
    }
    case "PLANNING": {
      const task = firstRecordInArray(data, "tasks");
      return {
        op: "update_task",
        target: {
          entity_type: "PREP_SCHEDULE_TASK",
          plan_id: origin.entity_id,
          task_id: text(task?.task_id, "<TASK_ID_FROM_DATA>"),
          step_code: text(task?.step_code, "<STEP_CODE_FROM_DATA>"),
        },
        changes: {
          name: text(task?.name, "Nom existant à remplacer par la modification proposée"),
        },
      };
    }
    case "VISIT":
      return {
        op: "update_visit",
        target: {
          entity_type: "SITE_VISIT",
          visit_id: origin.entity_id,
        },
        changes: {
          comments: "Observation terrain à renseigner uniquement si elle est confirmée",
        },
      };
    case "FOLLOW_UP":
      return {
        op: "update_follow_up",
        target: {
          entity_type: "FOLLOW_UP_SHEET",
          sheet_id: origin.entity_id,
        },
        changes: {
          notes: "Note de suivi factuelle à remplacer par la modification proposée",
        },
      };
    case "REPORT":
      return {
        op: "update_report",
        target: {
          entity_type: "SITE_DOCUMENT",
          document_id: origin.entity_id,
        },
        changes: {
          quick_notes: "Fait constaté à remplacer par la modification proposée",
        },
      };
    case "NOTICE":
      return {
        op: "update_notice",
        target: {
          entity_type: "SITE_DOCUMENT",
          document_id: origin.entity_id,
        },
        changes: {
          quick_notes: "Point à vérifier à remplacer par la modification proposée",
        },
      };
    case "SUPPLY": {
      const need = firstRecordInArray(data, "supply_needs");
      if (need) {
        return {
          op: "update_supply_need",
          target: {
            entity_type: "MATERIAL_REQUIREMENT",
            requirement_id: text(need.requirement_id, "<REQUIREMENT_ID_FROM_DATA>"),
          },
          changes: {
            notes: "Information à confirmer avant commande",
          },
        };
      }
      return {
        op: "add_supply_need",
        target: {
          entity_type: "SUPPLY_WORKSPACE",
          project_id: origin.project_id,
        },
        need: {
          label: "EXEMPLE STRUCTUREL À REMPLACER — besoin à confirmer",
          unit: "u",
          validated_order_quantity: 1,
          source_type: "HYPOTHESIS",
          is_hypothesis: true,
          notes: "Ne pas appliquer cet exemple sans données chantier confirmées.",
        },
      };
    }
  }
}

export function buildPatchOutputContract(input: {
  section: BeworkPatchSection;
  projectId: string | null;
  entityId: string;
  baseVersion: number;
  data?: Record<string, unknown>;
}): BeworkPatchOutputContractV1 {
  const origin: BeworkPatchOrigin = {
    section: input.section,
    project_id: input.projectId,
    entity_id: input.entityId,
    base_version: input.baseVersion,
  };
  const supported = supportedOperationsForSection(input.section);
  const operations: BeworkPatchOperationOutputContract[] = supported.map((spec) => {
    const target = targetContract(spec.op);
    return {
      op: spec.op,
      commit_supported: true,
      target: {
        type: "object",
        entity_types: spec.entity_types,
        required: target.required,
        ...(target.one_of ? { one_of: target.one_of } : {}),
      },
      payload: payloadContract(spec),
      compatible_intents: spec.compatible_intents,
    };
  });
  const firstOperation = exampleOperation({
    section: input.section,
    origin,
    data: input.data ?? {},
  });
  const firstSpec =
    supported.find((spec) => spec.op === firstOperation.op) ?? supported[0];
  const intent = firstSpec?.compatible_intents[0] ?? "TECHNICAL_CORRECTION";
  const patchTemplate = {
    type: BEWORK_PATCH_FORMAT,
    schema_version: BEWORK_PATCH_SCHEMA_VERSION,
    patch_id: "<PATCH_ID_UNIQUE>",
    origin,
    change_intent: `<UN_DES_ENUMS_supported_change_intents>`,
    reason: "<MOTIF_TRAÇABLE>",
    operations: ["<UNE_OU_PLUSIEURS_OPERATIONS_DU_CONTRAT>"],
  };
  const validPatchExample = {
    type: BEWORK_PATCH_FORMAT,
    schema_version: BEWORK_PATCH_SCHEMA_VERSION,
    patch_id: `example-${input.section.toLowerCase()}-${input.entityId}`.slice(0, 120),
    origin,
    change_intent: intent,
    reason:
      "EXEMPLE STRUCTUREL — remplacer les valeurs métier, puis contrôler la prévisualisation avant validation.",
    operations: [firstOperation],
  };
  const validationRules = [
    BEWORK_PATCH_ORIGIN_MEANING,
    "target n'existe pas à la racine : chaque opération possède son propre objet target.",
    "Utiliser exclusivement une opération listée dans patch_contract.operations : elles seules sont prises en charge au commit.",
    "patch_id doit être unique ; un second commit du même patch_id est refusé.",
    "origin.base_version doit être exactement target.version du contexte ; sinon le patch est périmé.",
    "TECHNICAL_OVERRIDE exige un reason explicite et reste soumis aux protections des données validées.",
    "Une modification de prix seule utilise COMMERCIAL_ADJUSTMENT ; FIELD_UPDATE ne peut jamais modifier un prix.",
    "Pour SUPPLY, WEB_VERIFIED exige une source URL http(s) et une date observée réelles ; une valeur inconnue reste null.",
    "Pour SUPPLY, plusieurs add_supply_need sont autorisés dans un patch. Une offre exige toutefois un requirement_id déjà présent dans data.supply_needs : après création des besoins, valider puis recopier le contexte avant de proposer leurs offres.",
    "La prévisualisation et la validation humaine sont obligatoires avant toute écriture.",
    "Ne jamais inventer prix, quantité, mesure, fournisseur, disponibilité ou information technique manquante.",
  ];

  return {
    format: BEWORK_PATCH_FORMAT,
    schema_version: BEWORK_PATCH_SCHEMA_VERSION,
    root: {
      type: "object",
      required: BEWORK_PATCH_ROOT_REQUIRED,
      additional_root_target_forbidden: true,
    },
    origin: {
      meaning: BEWORK_PATCH_ORIGIN_MEANING,
      type: "object",
      required:
        input.section === "VISIT"
          ? BEWORK_PATCH_ORIGIN_REQUIRED.filter((field) => field !== "project_id")
          : [...BEWORK_PATCH_ORIGIN_REQUIRED],
      exact_value: origin,
      forbidden_examples: ["CHATGPT"],
    },
    operations,
    validation_rules: validationRules,
    patch_template: patchTemplate,
    valid_patch_example: validPatchExample,
  };
}
