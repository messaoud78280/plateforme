/**
 * Tests purs — enrichissement fiche technique TAKEOFF (détection + contexte).
 * Aucune écriture DB / ROCKMAN.
 */
import assert from "node:assert/strict";
import {
  applyEnrichTechSheetsToTakeoffContext,
  isTechSheetIncomplete,
  missingTechSheetFields,
  selectLinesForTechSheetEnrichment,
  summarizeEnrichLots,
  TECH_SHEET_ENRICH_INSTRUCTIONS,
  toEnrichContextLine,
} from "@/lib/bework-patch/tech-sheet-enrichment";
import { UPDATE_LINE_CONTRACT } from "@/lib/bework-patch/operation-contracts";
import {
  countTechSheetUpdates,
  isTechSheetUpdateChange,
  summarizeTechSheetUpdateLots,
} from "@/lib/bework-patch/add-line-preview";
import type { DirectChange } from "@/lib/bework-patch/impact/types";
import type { BeworkChatgptContextV1 } from "@/lib/bework-patch/types";

function line(partial: {
  id: string;
  code: string;
  lot?: string;
  role?: string;
  includedServices?: string[];
  technicalReferences?: Array<{ label: string; kind: string; note: string | null }>;
  executionNotes?: string | null;
  qualityControls?: string[];
  technicalReservations?: string[];
}) {
  return {
    id: partial.id,
    code: partial.code,
    lot: partial.lot ?? "GO-01",
    designation: `Ligne ${partial.code}`,
    unit: "m2",
    role: partial.role ?? "quote",
    includedServices: partial.includedServices ?? [],
    technicalReferences: partial.technicalReferences ?? [],
    executionNotes: partial.executionNotes ?? null,
    qualityControls: partial.qualityControls ?? [],
    technicalReservations: partial.technicalReservations ?? [],
  };
}

function completeLine(id: string, code: string, lot = "GO-01") {
  return line({
    id,
    code,
    lot,
    includedServices: ["Pose"],
    technicalReferences: [{ label: "DTU", kind: "INDICATIVE", note: null }],
    executionNotes: "Exécuter soigneusement",
    qualityControls: ["Niveau"],
    technicalReservations: ["À confirmer"],
  });
}

// --- Détection ---

assert.equal(
  isTechSheetIncomplete(line({ id: "1", code: "A" })),
  true,
  "vide → incomplet",
);
assert.equal(
  isTechSheetIncomplete(completeLine("1", "A")),
  false,
  "complet → ignoré",
);
assert.deepEqual(
  missingTechSheetFields(line({ id: "1", code: "A", includedServices: ["x"] })),
  [
    "technical_references",
    "execution_notes",
    "quality_controls",
    "technical_reservations",
  ],
);

const mix = [
  line({ id: "q1", code: "GO-01", lot: "GO-01", role: "quote" }),
  completeLine("q2", "GO-02", "GO-02"),
  line({ id: "i1", code: "IND-01", lot: "GO-00", role: "indicator" }),
  line({ id: "l1", code: "LOG-01", lot: "GO-00", role: "logistics" }),
];
const selected = selectLinesForTechSheetEnrichment(mix);
assert.equal(selected.length, 2);
assert.deepEqual(
  selected.map((l) => l.code).sort(),
  ["GO-01", "LOG-01"],
);
assert.ok(!selected.some((l) => l.role === "indicator"));
assert.ok(!selected.some((l) => l.code === "GO-02"));

// 1 / 10 / 35 lignes incomplètes
for (const n of [1, 10, 35]) {
  const many = Array.from({ length: n }, (_, i) =>
    line({ id: `id-${i}`, code: `GO-${String(i).padStart(2, "0")}`, lot: `GO-${String(i % 5).padStart(2, "0")}` }),
  );
  assert.equal(selectLinesForTechSheetEnrichment(many).length, n);
}

const lots = summarizeEnrichLots([
  { lot: "GO-02" },
  { lot: "GO-01" },
  { lot: "GO-01" },
]);
assert.deepEqual(lots, [
  { lot: "GO-01", count: 2 },
  { lot: "GO-02", count: 1 },
]);

// --- Target explicite ---

const enriched = toEnrichContextLine(
  line({ id: "line-uuid-1", code: "GO-01", lot: "GO-01" }),
  "study-uuid-1",
);
assert.deepEqual(enriched.patch_target, {
  entity_type: "PREP_LINE",
  study_id: "study-uuid-1",
  line_id: "line-uuid-1",
  line_code: "GO-01",
});
assert.ok(
  (enriched.missing_fields as string[]).includes("included_services"),
);

// --- Contexte enrich ---

const baseCtx = {
  type: "bework_chatgpt_context_v1",
  schema_version: 1,
  section: "TAKEOFF",
  project: { id: "p1", title: "Rockman" },
  target: {
    entity_type: "PREP_STUDY",
    id: "study-1",
    version: 3,
    base_version: 3,
  },
  data: {
    trade: "GO",
    lines: [
      {
        id: "l1",
        code: "GO-01",
        lot: "GO-01",
        designation: "Semelle",
        unit: "m3",
        role: "quote",
        included_services: [],
        technical_references: [],
        execution_notes: null,
        quality_controls: [],
        technical_reservations: [],
      },
      {
        id: "l2",
        code: "GO-02",
        lot: "GO-02",
        designation: "Complète",
        unit: "m2",
        role: "quote",
        included_services: ["Pose"],
        technical_references: [{ label: "DTU", kind: "INDICATIVE", note: null }],
        execution_notes: "OK",
        quality_controls: ["Ctrl"],
        technical_reservations: ["Rien"],
      },
      {
        id: "l3",
        code: "IND-01",
        lot: "GO-00",
        designation: "Indicateur",
        unit: "u",
        role: "indicator",
        included_services: [],
        technical_references: [],
        execution_notes: null,
        quality_controls: [],
        technical_reservations: [],
      },
    ],
    instructions: ["ancienne"],
  },
  relationships: { quote_items: [] },
  supported_change_intents: ["DOCUMENT_EDIT"],
  supported_operations: [
    { op: "update_line", entity_types: ["PREP_LINE"] },
    { op: "add_line", entity_types: ["PREP_STUDY"] },
  ],
  expected_output: "bework_patch_v1",
} as unknown as BeworkChatgptContextV1;

const enrichCtx = applyEnrichTechSheetsToTakeoffContext(baseCtx);
const data = enrichCtx.data as Record<string, unknown>;
assert.equal(data.lines, undefined);
assert.ok(Array.isArray(data.lines_to_enrich));
assert.equal((data.lines_to_enrich as unknown[]).length, 1);
const first = (data.lines_to_enrich as Array<Record<string, unknown>>)[0];
assert.equal(first.code, "GO-01");
assert.deepEqual(first.patch_target, {
  entity_type: "PREP_LINE",
  study_id: "study-1",
  line_id: "l1",
  line_code: "GO-01",
});
assert.ok(
  (data.instructions as string[]).some((s) =>
    s.includes("Retourne UN SEUL bework_patch_v1"),
  ),
);
assert.equal(TECH_SHEET_ENRICH_INSTRUCTIONS.length > 5, true);
assert.equal(
  (enrichCtx.supported_operations ?? []).every((o) => o.op === "update_line"),
  true,
);
assert.ok(
  (data.operation_contracts as { update_line?: unknown })?.update_line,
);
assert.equal(
  UPDATE_LINE_CONTRACT.target.required.includes("study_id"),
  true,
);
assert.equal(
  UPDATE_LINE_CONTRACT.target.required.includes("line_id"),
  true,
);
assert.equal(
  UPDATE_LINE_CONTRACT.minimal_valid_example.target.entity_type,
  "PREP_LINE",
);

const task = data.enrichment_task as {
  lines_to_enrich: number;
  skipped_complete: number;
  skipped_indicator: number;
};
assert.equal(task.lines_to_enrich, 1);
assert.equal(task.skipped_complete, 1);
assert.equal(task.skipped_indicator, 1);

// --- Preview helpers ---

const dc: DirectChange[] = [
  {
    op: "update_line",
    section: "TAKEOFF",
    entityType: "PREP_LINE",
    entityId: "l1",
    label: "Semelle",
    field: "meta",
    before: { lot: "GO-01", included_services: [] },
    after: { included_services: ["Pose"] },
  },
  {
    op: "update_line",
    section: "TAKEOFF",
    entityType: "PREP_LINE",
    entityId: "l2",
    label: "Mur",
    field: "meta",
    before: { lot: "GO-02", included_services: [] },
    after: { included_services: ["Coffrage"] },
  },
  {
    op: "update_line",
    section: "TAKEOFF",
    entityType: "PREP_LINE",
    entityId: "l3",
    label: "Qty",
    field: "declared_quantity",
    before: 1,
    after: 2,
  },
];
assert.equal(isTechSheetUpdateChange(dc[0]!), true);
assert.equal(isTechSheetUpdateChange(dc[2]!), false);
assert.equal(countTechSheetUpdates(dc), 2);
assert.deepEqual(summarizeTechSheetUpdateLots(dc), [
  { lot: "GO-01", count: 1 },
  { lot: "GO-02", count: 1 },
]);

console.log("tech-sheet-enrichment.test.ts OK");
