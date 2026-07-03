import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const batches = ["A", "B", "C", "D"].map((n) =>
  JSON.parse(readFileSync(resolve(root, `prisma/seed-data/_lot14-batch${n}.json`), "utf8")),
);
const merged = batches.flat();

const seen = new Set();
const dups = [];
for (const e of merged) {
  const k = (e.terme ?? "").trim().toLowerCase();
  if (!k) throw new Error("Terme vide détecté");
  if (seen.has(k)) dups.push(e.terme);
  seen.add(k);
}
if (dups.length) throw new Error(`Doublons : ${dups.join(", ")}`);

for (const e of merged) {
  if (!e.definition_courte || !e.points_vigilance) {
    console.warn(`Champ manquant sur : ${e.terme}`);
  }
}

writeFileSync(
  resolve(root, "prisma/seed-data/dico-btp-lot-14.json"),
  `${JSON.stringify(merged, null, 2)}\n`,
  "utf8",
);
console.log(
  `Fusion Lot 14 OK : ${merged.length} termes (A:${batches[0].length} B:${batches[1].length} C:${batches[2].length} D:${batches[3].length})`,
);
