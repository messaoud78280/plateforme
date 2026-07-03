import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const batches = [1, 2, 3, 4].map((n) =>
  JSON.parse(readFileSync(resolve(root, `prisma/seed-data/_lot01-batch${n}.json`), "utf8")),
);
const merged = batches.flat();
if (merged.length !== 170) {
  throw new Error(`Attendu 170 termes, obtenu ${merged.length}`);
}
const terms = new Set();
for (const e of merged) {
  const k = e.terme.trim().toLowerCase();
  if (terms.has(k)) throw new Error(`Doublon : ${e.terme}`);
  terms.add(k);
}
writeFileSync(
  resolve(root, "prisma/seed-data/dico-btp-lot-01.json"),
  `${JSON.stringify(merged, null, 2)}\n`,
  "utf8",
);
console.log(`Fusion OK : ${merged.length} termes → dico-btp-lot-01.json`);
