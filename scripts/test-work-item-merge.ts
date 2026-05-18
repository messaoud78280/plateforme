/**
 * Test cas baignoire — exécution : npx tsx scripts/test-work-item-merge.ts
 */
import {
  analyzeWorkItemDuplicates,
  normalizeWorkItemDesignation,
} from "../src/lib/work-item-merge";

const CANONICAL =
  "Baignoire d'angle en matériau de synthèse série grand confort 145 x 145 cm balnéo eau/air";

const variants = [
  CANONICAL,
  "Baignoire angle matériau synthèse grand confort 145x145 balnéo eau air",
  "Baignoire d'angle 145 x 145 cm balnéo eau/air",
];

function mk(id: string, title: string) {
  return {
    id,
    code: `TEST-${id}`,
    title,
    fullDescription: title,
    lot: "Plomberie / Sanitaire",
    unit: "u",
  };
}

const items = [
  ...variants.map((t, i) => mk(`v${i}`, t)),
  ...Array.from({ length: 7 }, (_, i) => mk(`dup${i}`, CANONICAL)),
];

const key = normalizeWorkItemDesignation(CANONICAL);
console.log("Clé normalisée:", key);

const analysis = analyzeWorkItemDuplicates(items);
console.log("Analysées:", analysis.analyzed);
console.log("Groupes exacts:", analysis.exactDuplicateGroups);
console.log("Auto fusion:", analysis.autoMergeGroups.length);
console.log("À vérifier:", analysis.reviewGroups.length);

const main = analysis.autoMergeGroups.find((g) => g.members.length >= 10);
if (main && main.members.length === 10) {
  console.log("OK — 10 lignes regroupées en 1 fiche canonique proposée");
  console.log("Canonique:", main.canonicalDesignation.slice(0, 80) + "…");
} else {
  console.error("ÉCHEC — attendu 1 groupe de 10 membres, reçu:", main?.members.length ?? 0);
  process.exit(1);
}
