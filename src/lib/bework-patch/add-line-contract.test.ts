/**
 * Tests contrat add_line — source unique ADD_LINE_CONTRACT ↔ parseBeworkPatch.
 * Aucune écriture DB.
 * node --import tsx src/lib/bework-patch/add-line-contract.test.ts
 */
import assert from "node:assert/strict";
import {
  ADD_LINE_CONTRACT,
  fieldContractsForOp,
  parseAddLinePayload,
} from "@/lib/bework-patch/operation-contracts";
import { parseBeworkPatch } from "@/lib/bework-patch/parse";
import { supportedOperationsForSection } from "@/lib/bework-patch/operations-catalog";
import { toLegacyPrepPatch } from "@/lib/bework-patch/adapters/prep";
import type { BeworkPatchIssue } from "@/lib/bework-patch/errors";

const STUDY_ID = "cmuvgohrt0002vhqid2s811c4";

function run() {
  // Contrat exposé dans supported_operations TAKEOFF
  {
    const ops = supportedOperationsForSection("TAKEOFF");
    const add = ops.find((o) => o.op === "add_line");
    assert.ok(add, "add_line exposé TAKEOFF");
    assert.deepEqual(add!.entity_types, ["PREP_STUDY"]);
    assert.ok(add!.field_contracts && add!.field_contracts.length > 0);
    const fc = add!.field_contracts![0]!;
    assert.equal(fc.field, "line");
    assert.equal(fc.payload_key, "line");
    assert.ok(fc.line?.code);
    assert.ok(fc.minimal_valid_example);
    assert.equal(
      (fc.minimal_valid_example as { op: string }).op,
      "add_line",
    );
    // Champs demandés documentés
    for (const key of [
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
      "provenance_kind",
      "source_ref",
    ]) {
      assert.ok(
        key in (fc.line as Record<string, unknown>),
        `line.${key} documenté`,
      );
    }
    assert.equal(
      (fc.line as { provenance_kind: { accepted: boolean } }).provenance_kind
        .accepted,
      false,
    );
    assert.equal(
      (fc.line as { source_ref: { accepted: boolean } }).source_ref.accepted,
      false,
    );
  }

  // fieldContractsForOp === ADD_LINE_CONTRACT (pas de duplication)
  {
    const fromFn = fieldContractsForOp("add_line")[0]!;
    assert.equal(fromFn.field, ADD_LINE_CONTRACT.field);
    assert.deepEqual(
      fromFn.minimal_valid_example,
      ADD_LINE_CONTRACT.minimal_valid_example,
    );
  }

  // Parse minimal valide
  {
    const example = {
      ...ADD_LINE_CONTRACT.minimal_valid_example,
      target: {
        entity_type: "PREP_STUDY",
        study_id: STUDY_ID,
      },
    };
    const patchRaw = {
      format: "bework_patch_v1",
      schema_version: 1,
      patch_id: "test-add-line-1",
      change_intent: "TECHNICAL_CORRECTION",
      origin: {
        section: "TAKEOFF",
        project_id: "cmuv9hj9v000411pbta21yz7b",
        entity_id: STUDY_ID,
        base_version: 1,
      },
      operations: [example],
    };
    const parsed = parseBeworkPatch(patchRaw);
    assert.equal(parsed.ok, true, JSON.stringify(parsed.errors));
    if (!parsed.ok) return;
    const op = parsed.patch.operations[0];
    assert.equal(op?.op, "add_line");
    if (op?.op === "add_line") {
      assert.equal(op.target.study_id, STUDY_ID);
      assert.equal(op.line.code, "GO.NEW-01");
      assert.equal(op.line.declared_quantity, 1);
      assert.equal(op.line.provenance, "HYPOTHESE");
      assert.equal(op.line.role, "quote");
    }

    // Délégation prep (chemin commit) — sans écriture
    const legacy = toLegacyPrepPatch(parsed.patch);
    assert.equal(legacy.ok, true);
    if (legacy.ok) {
      const add = legacy.prepPatch.operations.find((o) => o.op === "add_line");
      assert.ok(add && add.op === "add_line");
      if (add && add.op === "add_line") {
        assert.equal(add.line.code, "GO.NEW-01");
        assert.equal(add.line.declaredQuantity, 1);
        assert.equal(add.line.provenance, "HYPOTHESE");
      }
    }
  }

  // Rejet sans champs requis
  {
    const issues: BeworkPatchIssue[] = [];
    const bad = parseAddLinePayload(
      { line: { code: "X" } },
      "operations[0]",
      issues,
    );
    assert.equal(bad, null);
    assert.ok(issues.some((i) => i.message.includes("requis")));
  }

  // provenance_kind ignoré / non accepté — parse ne lit pas le champ
  {
    const issues: BeworkPatchIssue[] = [];
    const ok = parseAddLinePayload(
      {
        line: {
          code: "A1",
          lot: "GO",
          designation: "Test",
          unit: "u",
          declared_quantity: 1,
          provenance_kind: "PLAN",
        },
      },
      "operations[0]",
      issues,
    );
    assert.ok(ok);
    assert.equal(
      (ok!.line as { provenance_kind?: unknown }).provenance_kind,
      undefined,
    );
  }

  console.log("add-line-contract.test.ts: ok");
}

run();
