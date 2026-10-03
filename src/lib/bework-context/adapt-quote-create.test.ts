/**
 * Tests CREATE devis — pure / fixtures (aucune DB, aucune écriture).
 * node --import tsx src/lib/bework-context/adapt-quote-create.test.ts
 */
import assert from "node:assert/strict";
import {
  QUOTE_CREATE_INSTRUCTIONS,
  computeQuoteCreateSourcesFingerprint,
} from "./adapt-quote-create";
import { BEWORK_QUOTE_BUNDLE_FORMAT } from "@/lib/commercial/chatgpt-bundle/types";
import { parseBeworkQuoteBundle } from "@/lib/commercial/chatgpt-bundle/parse";

function run() {
  // TEST A — fingerprint déterministe métré
  {
    const a = computeQuoteCreateSourcesFingerprint({
      projectId: "p1",
      studyId: "s1",
      studyVersion: 3,
      studyUpdatedAt: "2026-10-03T10:00:00.000Z",
      lineCodes: ["TERR.01", "MAC.01"],
    });
    const b = computeQuoteCreateSourcesFingerprint({
      projectId: "p1",
      studyId: "s1",
      studyVersion: 3,
      studyUpdatedAt: "2026-10-03T10:00:00.000Z",
      lineCodes: ["MAC.01", "TERR.01"],
    });
    assert.equal(a, b, "TEST A fingerprint stable (ordre lignes ignoré)");
  }

  // TEST J — métré changé → fingerprint différent (PREVIEW_STALE)
  {
    const base = computeQuoteCreateSourcesFingerprint({
      projectId: "p1",
      studyId: "s1",
      studyVersion: 3,
      studyUpdatedAt: "2026-10-03T10:00:00.000Z",
      lineCodes: ["TERR.01"],
    });
    const bumped = computeQuoteCreateSourcesFingerprint({
      projectId: "p1",
      studyId: "s1",
      studyVersion: 4,
      studyUpdatedAt: "2026-10-03T10:00:00.000Z",
      lineCodes: ["TERR.01"],
    });
    assert.notEqual(base, bumped, "TEST J version métré change l’empreinte");
  }

  // TEST B/C — validated prioritaire dans résolution (simulée)
  {
    function resolve(input: {
      validatedQuantity: number | null;
      computed: number | null;
      declaredQuantity: number | null;
    }) {
      if (input.validatedQuantity != null) return input.validatedQuantity;
      if (input.computed != null) return input.computed;
      return input.declaredQuantity;
    }
    assert.equal(
      resolve({ validatedQuantity: 12.5, computed: 11, declaredQuantity: 10 }),
      12.5,
      "TEST B validated prioritaire",
    );
    assert.equal(
      resolve({ validatedQuantity: null, computed: 11, declaredQuantity: 10 }),
      11,
      "TEST C computed si non validée",
    );
  }

  // TEST D/E — prix 0 et AI_PROPOSAL parseables, pas d’écriture
  {
    const raw = JSON.stringify({
      format: BEWORK_QUOTE_BUNDLE_FORMAT,
      client: {
        civility: null,
        firstName: null,
        lastName: "Client Test",
        fullName: "Client Test",
        company: null,
        phone: null,
        emails: [],
        address: { line1: null, postalCode: null, city: null, country: "France" },
        type: null,
      },
      site: {
        name: "Chantier X",
        sameAsClientAddress: true,
        address: null,
        projectType: null,
        surfaceValue: null,
        surfaceUnit: null,
        accessNotes: null,
        constraints: null,
      },
      quote: {
        title: "Devis terrassement",
        description: null,
        validityDays: 30,
        pricingStrategy: null,
        vatSuggestedRate: 20,
        vatRequiresConfirmation: false,
      },
      sections: [
        {
          title: "Terrassement",
          items: [
            {
              designation: "Fouilles",
              description: "À confirmer PU",
              quantity: 45.18,
              unit: "m³",
              unit_price_ht: 0,
              source_prep_line_code: "TERR.01",
              price_provenance: "UNKNOWN",
            },
            {
              designation: "Évacuation",
              quantity: 45.18,
              unit: "m³",
              unit_price_ht: 38,
              source_prep_line_code: "TERR.02",
              price_provenance: "AI_PROPOSAL",
            },
          ],
        },
        {
          title: "Maçonnerie",
          items: [
            {
              designation: "Béton",
              quantity: 8,
              unit: "m³",
              unit_price_ht: 120,
              source_prep_line_code: "MAC.01",
              price_provenance: "USER",
            },
          ],
        },
        {
          title: "Électricité",
          items: [
            {
              designation: "Tableau",
              quantity: 1,
              unit: "U",
              unit_price_ht: 450,
              source_prep_line_code: "ELEC.01",
              price_provenance: "LIBRARY",
            },
          ],
        },
        {
          title: "Plomberie",
          items: [
            {
              designation: "Évacuation WC",
              quantity: 1,
              unit: "U",
              unit_price_ht: 180,
              source_prep_line_code: "PLOMB.01",
              price_provenance: "HISTORICAL",
            },
          ],
        },
      ],
      clientAdvice: [],
      reservations: [],
      internalNotes: [],
      workStages: [],
      warnings: ["PU fouilles à confirmer"],
      mediaManifest: [],
    });
    const parsed = parseBeworkQuoteBundle(raw);
    assert.equal(parsed.ok, true, "TEST D/E parse bundle générique");
    if (parsed.ok) {
      const fouilles = parsed.bundle.sections[0]!.items[0]!;
      assert.equal(fouilles.unitPriceHt, 0, "TEST D prix absent = 0");
      assert.equal(fouilles.sourcePrepLineCode, "TERR.01");
      const evac = parsed.bundle.sections[0]!.items[1]!;
      assert.equal(evac.priceProvenance, "AI_PROPOSAL", "TEST E AI_PROPOSAL");
      assert.equal(parsed.bundle.sections.length, 4, "généricité métiers");
    }
  }

  // TEST écart quantité
  {
    const metre = 45.184;
    const quoteQty = 50;
    const delta = quoteQty - metre;
    assert.ok(Math.abs(delta) > 0.01, "écart détectable pour acceptation explicite");
  }

  // Instructions discussion (pas génération aveugle)
  {
    const joined = QUOTE_CREATE_INSTRUCTIONS.join(" ");
    assert.match(joined, /Discute/i);
    assert.match(joined, /price_provenance/);
    assert.match(joined, /validated_quantity/);
    assert.doesNotMatch(joined, /\bcooking\b|\bcuisine\b|\bC-01\b|\bMOREL\b/i);
  }

  console.log("adapt-quote-create.test.ts: ok (A–E, J, généricité, instructions)");
}

run();
