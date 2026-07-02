import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PrismaClient } from "@prisma/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

const LOT_CODE = "09";
const LOT_NAME = "Électricité CFO CFA";
const SOURCE = "CCTP / expérience terrain";

function arr(v) {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()) : [];
}

async function main() {
  const path = join(__dirname, "..", "prisma", "seed-data", "dico-btp-lot-09.json");
  const entries = JSON.parse(readFileSync(path, "utf8"));

  const existing = await prisma.btpDictionaryTerm.findMany({
    where: { lotCode: LOT_CODE },
    select: { term: true },
  });
  const existingKeys = new Set(existing.map((e) => e.term.trim().toLowerCase()));

  let created = 0;
  let skipped = 0;

  for (const e of entries) {
    const term = String(e.terme ?? "").trim();
    if (!term) continue;
    if (existingKeys.has(term.toLowerCase())) {
      skipped += 1;
      continue;
    }
    await prisma.btpDictionaryTerm.create({
      data: {
        term,
        acronym: e.acronyme ? String(e.acronyme) : null,
        lotCode: LOT_CODE,
        lotName: LOT_NAME,
        family: e.famille ? String(e.famille) : null,
        category: e.categorie ? String(e.categorie) : null,
        shortDefinition: String(e.definition_courte ?? ""),
        beginnerExplanation: e.explication_pedagogique ? String(e.explication_pedagogique) : null,
        usageExample: e.exemple_utilisation ? String(e.exemple_utilisation) : null,
        keywords: arr(e.mots_cles),
        synonyms: arr(e.synonymes),
        vigilancePoints: arr(e.points_vigilance),
        linkedDocuments: arr(e.documents_lies),
        level: "débutant",
        source: SOURCE,
        status: "à vérifier",
      },
    });
    existingKeys.add(term.toLowerCase());
    created += 1;
  }

  console.log(`Import terminé : ${created} terme(s) créé(s), ${skipped} ignoré(s) (déjà présents).`);
}

main()
  .catch((err) => {
    console.error("Erreur import :", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
