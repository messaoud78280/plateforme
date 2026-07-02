import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

// Import générique d'un lexique Dico BTP depuis un fichier JSON.
// Usage :
//   node --env-file=.env --env-file=.env.local scripts/import-dico-lot.mjs <jsonPath> <lotCode> "<lotName>" "<source>"
// Exemple :
//   node --env-file=.env --env-file=.env.local scripts/import-dico-lot.mjs prisma/seed-data/dico-btp-lot-01.json 01 "Fondations / Gros œuvre" "CCTP Fondations - GO"

const prisma = new PrismaClient();

function arr(v) {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()) : [];
}

function str(v) {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

async function main() {
  const [jsonArg, lotCode, lotName, source] = process.argv.slice(2);
  if (!jsonArg || !lotCode) {
    throw new Error(
      'Arguments requis : <jsonPath> <lotCode> "<lotName>" "<source>" (lotName et source optionnels).',
    );
  }

  const path = isAbsolute(jsonArg) ? jsonArg : resolve(process.cwd(), jsonArg);
  const entries = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(entries)) throw new Error("Le fichier JSON doit contenir un tableau de termes.");

  const existing = await prisma.btpDictionaryTerm.findMany({
    where: { lotCode },
    select: { term: true },
  });
  const existingKeys = new Set(existing.map((e) => e.term.trim().toLowerCase()));

  let created = 0;
  let skipped = 0;

  for (const e of entries) {
    const term = str(e.terme ?? e.term);
    if (!term) continue;
    if (existingKeys.has(term.toLowerCase())) {
      skipped += 1;
      continue;
    }
    await prisma.btpDictionaryTerm.create({
      data: {
        term,
        acronym: str(e.acronyme ?? e.acronym),
        lotCode,
        lotName: lotName ?? null,
        family: str(e.famille ?? e.family),
        category: str(e.categorie ?? e.category),
        shortDefinition: str(e.definition_courte ?? e.short_definition) ?? "",
        beginnerExplanation: str(e.explication_pedagogique ?? e.beginner_explanation),
        usageExample: str(e.exemple_utilisation ?? e.usage_example),
        keywords: arr(e.mots_cles ?? e.keywords),
        synonyms: arr(e.synonymes ?? e.synonyms),
        vigilancePoints: arr(e.points_vigilance ?? e.vigilance_points),
        linkedDocuments: arr(e.documents_lies ?? e.linked_documents),
        level: str(e.niveau ?? e.level) ?? "débutant",
        source: str(e.source) ?? source ?? null,
        status: str(e.statut ?? e.status) ?? "à vérifier",
      },
    });
    existingKeys.add(term.toLowerCase());
    created += 1;
  }

  console.log(`Lot ${lotCode} : ${created} terme(s) créé(s), ${skipped} ignoré(s) (déjà présents).`);
}

main()
  .catch((err) => {
    console.error("Erreur import :", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
