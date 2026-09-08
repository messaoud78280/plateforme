/**
 * Selftest parseur bework_quote_bundle_v1 (sans DB).
 * Exécuter : npx tsx scripts/selftest-chatgpt-bundle.ts
 */
import { parseBeworkQuoteBundle } from "../src/lib/commercial/chatgpt-bundle/parse";
import { computeBundleTotals } from "../src/lib/commercial/chatgpt-bundle/notes";
import { normalizeUnit, normalizeMoneyOrQty } from "../src/lib/commercial/chatgpt-bundle/normalize";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const sample = {
  format: "bework_quote_bundle_v1",
  client: {
    first_name: "Test",
    last_name: "Client",
    phone: "+33600000000",
    emails: [
      { email: "a@example.com", role: "primary" },
      { email: "b@example.com", role: "secondary" },
    ],
    address: {
      line1: "1 rue Test",
      postal_code: "75001",
      city: "Paris",
      country: "France",
    },
  },
  site: {
    same_as_client_address: true,
    project_type: "Aménagement",
    surface: { value: "40 m²", unit: "m2" },
  },
  quote: {
    title: "Devis test",
    description: "Description commerciale",
    validity_days: 30,
    vat: { suggested_rate: 10, requires_confirmation: true },
  },
  sections: [
    {
      title: "Lot A",
      items: [
        {
          designation: "Ouvrage 1",
          quantity: "40,0",
          unit: "m²",
          unit_price_ht: "12,50 €",
          vat_rate: 10,
        },
        {
          designation: "Forfait chantier",
          quantity: 1,
          unit: "forf.",
          unit_price_ht: 250,
          vat_rate: 10,
        },
      ],
    },
  ],
  client_advice: [{ title: "Préco", content: "Solution drainante." }],
  reservations: [
    {
      visibility: "client",
      text: "Chiffrage sur éléments visibles.",
    },
  ],
  internal_notes: [
    {
      visibility: "internal",
      text: "Client sensible au prix.",
    },
  ],
  work_stages: [
    { order: 1, title: "Dépose", media_key: "stage_1" },
    { order: 2, title: "Finition", media_key: "stage_2" },
  ],
  warnings: ["TVA à confirmer"],
  media_manifest: [
    {
      key: "stage_1",
      label: "Étape 1",
      type: "ai_preview",
      client_visible: true,
    },
  ],
};

assert(normalizeUnit("m²") === "M²", "unit m²");
assert(normalizeUnit("m.l.") === "ML", "unit ml");
assert(normalizeUnit("forf.") === "Forfait", "unit forfait");
assert(normalizeMoneyOrQty("12,50 €") === 12.5, "money FR");
assert(normalizeMoneyOrQty("40 m²") === 40, "qty m2");

const parsed = parseBeworkQuoteBundle(JSON.stringify(sample));
assert(parsed.ok, "parse ok");
if (!parsed.ok) process.exit(1);

assert(parsed.bundle.client.emails.length === 2, "emails");
assert(parsed.bundle.sections[0]!.items[0]!.quantity === 40, "qty norm");
assert(parsed.bundle.sections[0]!.items[0]!.unit === "M²", "unit norm");
assert(parsed.bundle.sections[0]!.items[0]!.unitPriceHt === 12.5, "pu norm");
assert(parsed.bundle.sections[0]!.items[1]!.unit === "Forfait", "forfait");
assert(parsed.bundle.mediaManifest[0]!.disclaimer, "ai disclaimer");

const totals = computeBundleTotals(parsed.bundle);
// 40*12.5 + 250 = 500+250 = 750 HT
assert(totals.totalHt === 750, `totalHt ${totals.totalHt}`);
assert(totals.lineCount === 2, "lines");

const bad = parseBeworkQuoteBundle("{ broken");
assert(!bad.ok && bad.rawKept, "raw kept on error");

const wrongFmt = parseBeworkQuoteBundle(
  JSON.stringify({ format: "v0", sections: [] }),
);
assert(!wrongFmt.ok, "reject unknown format");

console.log("selftest-chatgpt-bundle: OK");
