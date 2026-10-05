/**
 * Champs fiche technique PrepTakeoffLine — parse canonique bework_patch_v1.
 * Aligné sur PrepLineTextFields / PrepTechnicalReference (pas de 2ᵉ modèle).
 */
import type { BeworkPatchIssue } from "@/lib/bework-patch/errors";
import { err } from "@/lib/bework-patch/errors";
import {
  TECH_REF_KINDS,
  type PrepTechnicalReference,
  type TechRefKind,
} from "@/lib/preparation/types";

export type TechSheetFields = {
  included_services?: string[];
  technical_references?: PrepTechnicalReference[];
  execution_notes?: string | null;
  quality_controls?: string[];
  technical_reservations?: string[];
};

/** Documentation contrat (ChatGPT / supported_operations). */
export const TECH_SHEET_FIELD_CONTRACTS = {
  included_services: {
    required: false,
    type: "string[]",
    aliases: ["includedServices"],
    max_items: 40,
    max_item_length: 500,
    meaning: "Prestations comprises (une entrée = une prestation)",
    example: ["Réglage du fond de fouille", "Mise en œuvre du béton"],
  },
  technical_references: {
    required: false,
    type: "array",
    aliases: ["technicalReferences"],
    max_items: 20,
    item: {
      label: { required: true, type: "string", max: 200 },
      kind: {
        required: true,
        type: "enum",
        enum: ["INDICATIVE", "DOSSIER", "TO_VERIFY", "PHOTO"] as const,
      },
      note: { required: false, type: "string|null", max: 2000 },
    },
    meaning:
      "Références techniques structurées (NF/DTU, dossier, à confirmer, photo)",
    example: [
      {
        label: "NF DTU 13.1",
        kind: "INDICATIVE",
        note: null,
      },
    ],
  },
  execution_notes: {
    required: false,
    type: "string|null",
    aliases: ["executionNotes"],
    max: 8000,
    meaning: "Notes d’exécution chantier",
  },
  quality_controls: {
    required: false,
    type: "string[]",
    aliases: ["qualityControls"],
    max_items: 40,
    max_item_length: 500,
    meaning: "Contrôles qualité à réaliser",
    example: ["Contrôle niveau", "Contrôle géométrie"],
  },
  technical_reservations: {
    required: false,
    type: "string[]",
    aliases: ["technicalReservations"],
    max_items: 40,
    max_item_length: 500,
    meaning: "Réserves / points à confirmer",
    example: ["Dimension à confirmer"],
  },
} as const;

const TECH_KIND_SET = new Set<string>(TECH_REF_KINDS);

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function asStr(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, max);
}

function readStringList(
  v: unknown,
  path: string,
  issues: BeworkPatchIssue[],
  maxItems: number,
  maxItem: number,
): string[] | undefined {
  if (v === undefined) return undefined;
  if (!Array.isArray(v)) {
    issues.push(err("INVALID_FIELD", path, "attendu un tableau de chaînes"));
    return undefined;
  }
  const out: string[] = [];
  for (let i = 0; i < v.length && out.length < maxItems; i++) {
    const s = asStr(v[i], maxItem);
    if (s) out.push(s);
  }
  return out;
}

/**
 * Parse tech refs — kind invalide = erreur bloquante (pas de commit).
 */
export function parseTechnicalReferences(
  v: unknown,
  path: string,
  issues: BeworkPatchIssue[],
): PrepTechnicalReference[] | undefined {
  if (v === undefined) return undefined;
  if (!Array.isArray(v)) {
    issues.push(err("INVALID_FIELD", path, "technical_references doit être un tableau"));
    return undefined;
  }
  const out: PrepTechnicalReference[] = [];
  const max = TECH_SHEET_FIELD_CONTRACTS.technical_references.max_items;
  for (let i = 0; i < v.length && out.length < max; i++) {
    const item = v[i];
    const ip = `${path}[${i}]`;
    if (typeof item === "string") {
      const label = asStr(item, 200);
      if (label) out.push({ label, kind: "INDICATIVE", note: null });
      continue;
    }
    if (!isObj(item)) {
      issues.push(err("INVALID_FIELD", ip, "référence technique invalide"));
      return undefined;
    }
    const label = asStr(item.label ?? item.name ?? item.ref, 200);
    if (!label) {
      issues.push(err("INVALID_FIELD", ip, "label requis"));
      return undefined;
    }
    if (!("kind" in item) || item.kind == null) {
      issues.push(
        err(
          "INVALID_FIELD",
          `${ip}.kind`,
          `kind requis (${TECH_REF_KINDS.join(" | ")})`,
        ),
      );
      return undefined;
    }
    const raw = String(item.kind).trim().toUpperCase().replace(/-/g, "_");
    if (!TECH_KIND_SET.has(raw)) {
      issues.push(
        err(
          "INVALID_FIELD",
          `${ip}.kind`,
          `kind invalide « ${item.kind} » (attendu ${TECH_REF_KINDS.join(" | ")})`,
        ),
      );
      return undefined;
    }
    out.push({
      label,
      kind: raw as TechRefKind,
      note:
        item.note === null
          ? null
          : asStr(item.note, 2000),
    });
  }
  return out;
}

/**
 * Extrait les champs fiche depuis un objet line/changes.
 * Tolère alias camelCase + wrapper optionnel `technical_sheet` (non canonique).
 */
export function parseTechSheetFieldsFromObject(
  raw: Record<string, unknown>,
  path: string,
  issues: BeworkPatchIssue[],
): TechSheetFields | null {
  const bag: Record<string, unknown> = { ...raw };
  if (isObj(raw.technical_sheet)) {
    Object.assign(bag, raw.technical_sheet);
  }

  const beforeErr = issues.length;
  const included_services = readStringList(
    bag.included_services ?? bag.includedServices,
    `${path}.included_services`,
    issues,
    TECH_SHEET_FIELD_CONTRACTS.included_services.max_items,
    TECH_SHEET_FIELD_CONTRACTS.included_services.max_item_length,
  );
  const technical_references = parseTechnicalReferences(
    bag.technical_references ?? bag.technicalReferences,
    `${path}.technical_references`,
    issues,
  );
  let execution_notes: string | null | undefined;
  if ("execution_notes" in bag || "executionNotes" in bag) {
    const v = bag.execution_notes ?? bag.executionNotes;
    execution_notes =
      v === null
        ? null
        : asStr(v, TECH_SHEET_FIELD_CONTRACTS.execution_notes.max);
  }
  const quality_controls = readStringList(
    bag.quality_controls ?? bag.qualityControls,
    `${path}.quality_controls`,
    issues,
    TECH_SHEET_FIELD_CONTRACTS.quality_controls.max_items,
    TECH_SHEET_FIELD_CONTRACTS.quality_controls.max_item_length,
  );
  const technical_reservations = readStringList(
    bag.technical_reservations ?? bag.technicalReservations,
    `${path}.technical_reservations`,
    issues,
    TECH_SHEET_FIELD_CONTRACTS.technical_reservations.max_items,
    TECH_SHEET_FIELD_CONTRACTS.technical_reservations.max_item_length,
  );

  if (issues.length > beforeErr) return null;

  const out: TechSheetFields = {};
  if (included_services !== undefined) out.included_services = included_services;
  if (technical_references !== undefined) {
    out.technical_references = technical_references;
  }
  if (execution_notes !== undefined) out.execution_notes = execution_notes;
  if (quality_controls !== undefined) out.quality_controls = quality_controls;
  if (technical_reservations !== undefined) {
    out.technical_reservations = technical_reservations;
  }
  return Object.keys(out).length ? out : {};
}

export function techSheetHasContent(sheet: TechSheetFields | null | undefined): boolean {
  if (!sheet) return false;
  return (
    (sheet.included_services?.length ?? 0) > 0 ||
    (sheet.technical_references?.length ?? 0) > 0 ||
    (sheet.execution_notes != null && sheet.execution_notes.trim() !== "") ||
    (sheet.quality_controls?.length ?? 0) > 0 ||
    (sheet.technical_reservations?.length ?? 0) > 0
  );
}

/** Mapping persist Prisma. */
export function techSheetToPrismaData(sheet: TechSheetFields): {
  includedServicesJson?: string[] | null;
  technicalReferencesJson?: PrepTechnicalReference[] | null;
  executionNotes?: string | null;
  qualityControlsJson?: string[] | null;
  technicalReservationsJson?: string[] | null;
} {
  const data: ReturnType<typeof techSheetToPrismaData> = {};
  if (sheet.included_services !== undefined) {
    data.includedServicesJson = sheet.included_services;
  }
  if (sheet.technical_references !== undefined) {
    data.technicalReferencesJson = sheet.technical_references;
  }
  if (sheet.execution_notes !== undefined) {
    data.executionNotes = sheet.execution_notes;
  }
  if (sheet.quality_controls !== undefined) {
    data.qualityControlsJson = sheet.quality_controls;
  }
  if (sheet.technical_reservations !== undefined) {
    data.technicalReservationsJson = sheet.technical_reservations;
  }
  return data;
}
