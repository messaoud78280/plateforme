/**
 * Tests manuels — détection format collage bibliothèque.
 * Exécution : npx tsx scripts/test-structured-paste-format.ts
 */
import {
  detectStructuredPasteFormat,
  parseStructuredPasteBlock,
} from "../src/lib/be-work-devis-structured-paste";
import { tryParseChatGptMotherVariantsExport } from "../src/lib/be-work-devis-chatgpt-paste";

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

const TEST_HAIE = {
  code_categorie: "espaces_verts",
  fiche_mere: {
    designation: "Taille de reprise de haie sur 3 faces",
    description: "Description haie test",
  },
  variantes: [
    {
      code: "12.6.136",
      designation: "Taille de reprise de haie sur 3 faces — 50 ml",
      unite: "ML",
      temps_de_pose: "0,102",
      pose_seule_41h: "4,18",
      pose_seule_56h: "5,71",
      fourniture_seule: "0,92",
      fourniture_pose_41h: "5,10",
      fourniture_pose_56h: "6,63",
    },
  ],
};

const haie = tryParseChatGptMotherVariantsExport(TEST_HAIE);
if (!haie || haie.mothers.length !== 1) {
  console.error("✗ TEST haie — parsing fiche_mere+variantes");
  failed += 1;
} else {
  const m = haie.mothers[0]!;
  const priceCount = m.priceEntries.length;
  const unitOk = m.values.unit.toLowerCase() === "ml";
  const lotOk = m.values.lot.toLowerCase().includes("espaces verts");
  const pricesOk = priceCount === 5;
  if (!pricesOk || !unitOk || !lotOk) failed += 1;
  console.log(`${pricesOk && unitOk && lotOk ? "✓" : "✗"} TEST haie — prix FR décimaux`);
  console.log(`  unit=${m.values.unit} lot=${m.values.lot} priceEntries=${priceCount} (attendu ml, Espaces verts, 5)`);
  if (!pricesOk) {
    console.log("  détail prix:", m.priceEntries.map((p) => p.sourceName));
  }
  if (m.warnings.length) console.log("  warnings:", m.warnings);
}

if (failed > 0) {
  console.error(`\n${failed} test(s) en échec.`);
  process.exit(1);
}
console.log("\nTous les tests de détection sont passés.");
