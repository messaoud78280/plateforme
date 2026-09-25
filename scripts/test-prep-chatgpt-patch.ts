/**
 * Tests bework_prep_patch_v1 (parse + preview moteur, sans DB).
 *   node --import tsx scripts/test-prep-chatgpt-patch.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parsePrepJsonText } from "../src/lib/preparation/bundle/parse";
import { computeStudy } from "../src/lib/preparation/engine/compute";
import { parsePrepPatch, parsePrepPatchText } from "../src/lib/preparation/chatgpt-patch/parse";
import type { BeworkPrepPatchV1 } from "../src/lib/preparation/chatgpt-patch/types";
import type { PrepLineDTO, PrepParamDTO } from "../src/lib/preparation/types";

const ROOT = path.resolve(__dirname, "..");
const C01 = parsePrepJsonText(
  readFileSync(path.join(ROOT, "docs/preparation/exemples/c01-fondations.prep.json"), "utf8"),
);
assert.ok(C01.ok);

function asDTO() {
  const params: PrepParamDTO[] = C01.bundle.parameters.map((p) => ({
    ...p,
    originalValue: p.value,
    originalProvenance: p.provenance,
    modifiedAt: null,
  }));
  const lines: PrepLineDTO[] = C01.bundle.lines.map((l) => ({
    ...l,
    includedServices: l.includedServices ?? [],
    technicalReferences: l.technicalReferences ?? [],
    executionNotes: l.executionNotes ?? null,
    qualityControls: l.qualityControls ?? [],
    technicalReservations: l.technicalReservations ?? [],
    originalDesignation: l.designation,
    textsUserEdited: false,
    originalDeclared: l.declaredQuantity,
    originalProvenance: l.provenance,
    validatedQuantity: null,
    validatedAt: null,
  }));
  return { params, lines };
}

function applyParamPatch(params: PrepParamDTO[], key: string, value: number) {
  return params.map((p) => (p.key === key ? { ...p, value, provenance: "SAISIE_MANUELLE" as const } : p));
}

function applyLineText(lines: PrepLineDTO[], code: string, designation: string) {
  return lines.map((l) => (l.code === code ? { ...l, designation } : l));
}

// --- Parse ---
const depthPatch: BeworkPrepPatchV1 = {
  format: "bework_prep_patch_v1",
  patchId: "patch_c01_depth_090",
  target: { baseVersion: 2, bundleId: "c01-fondations-demo-v1" },
  operations: [
    {
      op: "update_parameter",
      key: "fouille.profondeur_commune",
      changes: { value: 0.9 },
    },
  ],
};

const parsed = parsePrepPatch(depthPatch);
assert.ok(parsed.ok);
assert.equal(parsed.patch.patchId, "patch_c01_depth_090");

// Bundle rejeté
const asBundle = parsePrepPatchText(
  JSON.stringify({ format: "bework_prep_bundle_v1", study: { title: "x" }, takeoff: { items: [] } }),
);
assert.equal(asBundle.ok, false);

// Quote rejeté
const asQuote = parsePrepPatch({ type: "bework_quote_patch_v1", patch_id: "x", operations: [] });
assert.equal(asQuote.ok, false);

// Patch invalide (param inconnu côté parse OK, détecté à l'apply)
const badOp = parsePrepPatchText(`{
  "format": "bework_prep_patch_v1",
  "patch_id": "patch_bad_line",
  "operations": [{ "op": "update_line", "code": "ZZ-99", "changes": { "designation": "X" } }]
}`);
assert.ok(badOp.ok);

// --- Recalcul profondeur 0.80 → 0.90 ---
const { params, lines } = asDTO();
const before = computeStudy({ params, lines });
assert.ok(Math.abs((before.nodes.get("TE-01")?.value ?? 0) - 36.48) < 1e-9);

const afterParams = applyParamPatch(params, "fouille.profondeur_commune", 0.9);
const after = computeStudy({ params: afterParams, lines });
assert.ok(Math.abs((after.nodes.get("TE-01")?.value ?? 0) - 41.04) < 1e-9, `TE-01=${after.nodes.get("TE-01")?.value}`);

// --- Désignation sans impact quantité ---
const renamed = applyLineText(lines, "TE-01", "Terrassement modifié pour test");
const afterRename = computeStudy({ params, lines: renamed });
assert.equal(afterRename.nodes.get("TE-01")?.value, before.nodes.get("TE-01")?.value);

// --- Texte technique ---
const textPatch = parsePrepPatchText(`{
  "format": "bework_prep_patch_v1",
  "patch_id": "patch_c01_texts",
  "operations": [{
    "op": "update_line",
    "code": "IM-01",
    "changes": {
      "designation": "Installation générale enrichie",
      "technical_description": "Description technique de test.",
      "included_services": ["Balisage", "Accès"]
    }
  }]
}`);
assert.ok(textPatch.ok);
assert.equal(textPatch.patch.operations[0]?.op, "update_line");

// --- Ajout ligne ---
const addPatch = parsePrepPatchText(`{
  "format": "bework_prep_patch_v1",
  "patch_id": "patch_c01_add",
  "operations": [{
    "op": "add_line",
    "line": {
      "id": "XX-01",
      "lot": "IMP",
      "designation": "Poste test ajouté",
      "unit": "forfait",
      "declared_quantity": 1,
      "provenance": "HYPOTHESE",
      "justification": "Test",
      "role": "quote"
    }
  }]
}`);
assert.ok(addPatch.ok);

// --- Quantité forcée sur ligne calculée : parse OK, logique métier refuse ---
const forceQty = parsePrepPatchText(`{
  "format": "bework_prep_patch_v1",
  "patch_id": "patch_force_qty",
  "operations": [{
    "op": "update_line",
    "code": "TE-01",
    "changes": { "declared_quantity": 99 }
  }]
}`);
assert.ok(forceQty.ok);

console.log("OK — bework_prep_patch_v1 parse + recalcul 0,80→0,90 (36,48→41,04) + indépendance textes");
