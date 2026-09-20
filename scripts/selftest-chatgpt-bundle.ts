/**
 * Selftest parseur bework_quote_bundle_v1 (sans DB).
 * Exécuter : npx tsx scripts/selftest-chatgpt-bundle.ts
 */
import { parseBeworkQuoteBundle } from "../src/lib/commercial/chatgpt-bundle/parse";
import {
  clientDisplayName,
  clientIsExploitable,
  computeBundleTotals,
} from "../src/lib/commercial/chatgpt-bundle/notes";
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

// --- Cas Sophie Lefèvre (champs FR ChatGPT) ---
const lefevre = {
  format: "bework_quote_bundle_v1",
  client: {
    type: "particulier",
    prenom: "Sophie",
    nom: "Lefèvre",
    nom_complet: "Sophie Lefèvre",
    raison_sociale: "Maison Lefèvre",
    email: null,
    telephone: null,
    adresse: {
      ligne1: null,
      complement: null,
      code_postal: "78960",
      ville: "Voisins-le-Bretonneux",
      pays: "France",
    },
  },
  chantier: {
    nom: "Maison Lefèvre - Salle de bains",
    adresse: {
      ligne1: null,
      code_postal: "78960",
      ville: "Voisins-le-Bretonneux",
      pays: "France",
    },
  },
  devis: {
    objet: "Réfection salle de bains — Maison Lefèvre",
    tva: { taux: 10, requires_confirmation: true },
    duree_validite: 30,
    observations: "Chiffrage estimatif.",
  },
  sections: [
    {
      title: "Salle de bains",
      items: [
        {
          designation: "Dépose et évacuation",
          quantity: 1,
          unit: "forf.",
          unit_price_ht: 850,
          vat_rate: 10,
        },
      ],
    },
  ],
};

const lf = parseBeworkQuoteBundle(JSON.stringify(lefevre));
assert(lf.ok, "parse Lefèvre ok");
if (!lf.ok) process.exit(1);

assert(lf.bundle.client.firstName === "Sophie", "prenom");
assert(lf.bundle.client.lastName === "Lefèvre", "nom");
assert(lf.bundle.client.fullName === "Sophie Lefèvre", "nom_complet");
assert(lf.bundle.client.company === "Maison Lefèvre", "raison_sociale");
assert(lf.bundle.client.address.postalCode === "78960", "code_postal");
assert(lf.bundle.client.address.city === "Voisins-le-Bretonneux", "ville");
assert(clientDisplayName(lf.bundle) === "Sophie Lefèvre", "display name");
assert(clientIsExploitable(lf.bundle), "client exploitable");
assert(clientDisplayName(lf.bundle) !== "Client à préciser", "pas Client à préciser");
assert(lf.bundle.site.name === "Maison Lefèvre - Salle de bains", "chantier.nom");
assert(lf.bundle.site.address?.city === "Voisins-le-Bretonneux", "chantier ville");
assert(
  lf.bundle.quote.title === "Réfection salle de bains — Maison Lefèvre",
  "devis.objet",
);
assert(lf.bundle.quote.vatSuggestedRate === 10, "tva 10%");
assert(lf.bundle.quote.validityDays === 30, "duree_validite");
assert(lf.bundle.quote.description === "Chiffrage estimatif.", "observations");

console.log("selftest-chatgpt-bundle: OK");
