/**
 * Tests unitaires parse + règles bework_quote_patch_v1 (sans DB).
 * Usage: npx tsx scripts/test-chatgpt-quote-patch.ts
 */
import { parseBeworkQuotePatch } from "../src/lib/commercial/chatgpt-patch/parse";

let failed = 0;

function assert(cond: boolean, msg: string) {
  if (!cond) {
    failed += 1;
    console.error("FAIL:", msg);
  } else {
    console.log("OK:", msg);
  }
}

const validPatch = {
  type: "bework_quote_patch_v1",
  patch_id: "patch_DEV-2026-0150_001",
  target: { quote_number: "DEV-2026-0150", base_version: 1 },
  operations: [
    {
      op: "update_item",
      item_id: "item_grave",
      changes: {
        description: "Grave 15 cm",
        quantity: 180,
        unit: "m²",
        unit_price_ht: "18,50",
      },
    },
    {
      op: "add_item",
      section_id: "section_ep",
      item: {
        designation: "Gestion des eaux pluviales",
        description: "Création et raccordement EP",
        quantity: 1,
        unit: "forfait",
        unit_price_ht: 1250,
      },
    },
  ],
};

{
  const r = parseBeworkQuotePatch(JSON.stringify(validPatch));
  assert(r.ok === true, "CAS parse: patch valide snake_case + décimal FR");
  if (r.ok) {
    assert(r.patch.patchId === "patch_DEV-2026-0150_001", "patch_id normalisé");
    assert(r.patch.target.quoteNumber === "DEV-2026-0150", "quote_number");
    const upd = r.patch.operations[0];
    assert(upd?.op === "update_item", "op update_item");
    if (upd?.op === "update_item") {
      assert(upd.changes.unitPriceHt === 18.5, 'prix "18,50" → 18.5');
      assert(upd.changes.quantity === 180, "quantity préservée");
      assert(upd.changes.description === "Grave 15 cm", "description");
      assert(upd.changes.unit === "M²", "unit normalisée M²");
      assert(upd.changes.designation === undefined, "designation absente = non ciblée");
    }
  }
}

{
  const r = parseBeworkQuotePatch("{ invalid");
  assert(r.ok === false, "CAS JSON invalide");
}

{
  const r = parseBeworkQuotePatch(
    JSON.stringify({
      type: "bework_quote_bundle_v1",
      patch_id: "x",
      target: { quote_number: "A" },
      operations: [],
    }),
  );
  assert(r.ok === false, "CAS refus bundle_v1 (création ≠ patch)");
}

{
  const r = parseBeworkQuotePatch(
    JSON.stringify({
      type: "bework_quote_patch_v1",
      patch_id: "patch_p1",
      target: { quote_number: "DEV-1" },
      operations: [{ op: "update_item", changes: { quantity: 2 } }],
    }),
  );
  assert(r.ok === false, "CAS update_item sans item_id ni designation");
}

{
  const r = parseBeworkQuotePatch(
    JSON.stringify({
      type: "bework_quote_patch_v1",
      patch_id: "patch_p2",
      target: { quote_number: "DEV-1" },
      operations: [
        {
          op: "add_item",
          item: {
            designation: "X",
            quantity: 1,
            unit: "u",
            unit_price_ht: "abc",
          },
        },
      ],
    }),
  );
  assert(r.ok === false, "CAS prix NaN refusé");
}

{
  const r = parseBeworkQuotePatch(
    JSON.stringify({
      type: "bework_quote_patch_v1",
      patch_id: "patch_p3",
      target: { quote_number: "DEV-1" },
      operations: [
        {
          op: "update_item",
          item_id: "abc",
          changes: { quantity: 10 },
        },
      ],
    }),
  );
  assert(r.ok === true, "CAS update quantity seule (patch sémantique)");
  if (r.ok && r.patch.operations[0]?.op === "update_item") {
    const c = r.patch.operations[0].changes;
    assert(
      Object.keys(c).length === 1 && c.quantity === 10,
      "seule quantity dans changes",
    );
  }
}

{
  const r = parseBeworkQuotePatch(
    JSON.stringify({
      type: "bework_quote_patch_v1",
      patch_id: "patch_p4",
      target: { quote_number: "DEV-1" },
      operations: [{ op: "delete_item", item_id: "item_x" }],
    }),
  );
  assert(r.ok === true, "CAS delete_item explicite");
}

if (failed > 0) {
  console.error(`\n${failed} échec(s)`);
  process.exit(1);
}
console.log("\nTous les tests parse patch OK");
