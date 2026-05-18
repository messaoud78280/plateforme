/**
 * Tests manuels — détection format collage bibliothèque.
 * Exécution : npx tsx scripts/test-structured-paste-format.ts
 */
import {
  detectStructuredPasteFormat,
  parseStructuredPasteBlock,
} from "../src/lib/be-work-devis-structured-paste";

const TEST1 = {
  fiche_mere: {
    designation: "Fosses toutes eaux en polyéthylène sans préfiltre",
    description: "Description test",
    unite: "U",
    famille: "Assainissement",
  },
  variantes: [
    {
      code: "4.2.59",
      designation: "Fosse toutes eaux 1000 L",
      volume_litres: 1000,
      temps_pose: 6.3,
      prix: { fourniture_pose_41h: 1147.47 },
    },
  ],
};

const TEST2 = {
  famille: "Assainissement",
  ouvrages: [
    {
      fiche_mere: {
        designation: "Fosses toutes eaux en polyéthylène sans préfiltre",
        description: "Description test",
        unite: "U",
      },
      variantes: [
        { code: "4.2.59", designation: "Fosse toutes eaux 1000 L", volume_litres: 1000 },
        { code: "4.2.60", designation: "Fosse toutes eaux 1500 L", volume_litres: 1500 },
      ],
    },
  ],
};

const TEST3 = [
  { code: "4.2.59", designation: "Fosse toutes eaux 1000 L" },
  { code: "4.2.60", designation: "Fosse toutes eaux 1500 L" },
];

const TEST4 = { code: "4.2.59", designation: "Fosse toutes eaux 1000 L" };

type Case = { name: string; json: unknown; expected: string };

const cases: Case[] = [
  { name: "TEST 1 — fiche directe", json: TEST1, expected: "fiche_mere_variantes" },
  { name: "TEST 2 — export complet", json: TEST2, expected: "export_fiches_meres_variantes" },
  { name: "TEST 3 — tableau simple", json: TEST3, expected: "tableau_ouvrages" },
  { name: "TEST 4 — objet simple", json: TEST4, expected: "objet_ouvrage_simple" },
];

let failed = 0;

for (const c of cases) {
  const detected = detectStructuredPasteFormat(c.json);
  const parsed = parseStructuredPasteBlock(JSON.stringify(c.json));
  const mode = parsed.ok ? parsed.result.mode : "error";
  const mothers = parsed.ok && parsed.result.mode === "motherVariants" ? parsed.result.mothers.length : 0;
  const variants =
    parsed.ok && parsed.result.mode === "motherVariants" ? parsed.result.totalVariantCount : 0;

  const ok = detected === c.expected;
  if (!ok) failed += 1;

  console.log(`${ok ? "✓" : "✗"} ${c.name}`);
  console.log(`  detectStructuredPasteFormat → ${detected} (attendu: ${c.expected})`);
  console.log(`  parseStructuredPasteBlock → mode=${mode}, fiches=${mothers}, variantes=${variants}`);
}

if (failed > 0) {
  console.error(`\n${failed} test(s) en échec.`);
  process.exit(1);
}
console.log("\nTous les tests de détection sont passés.");
