import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

// Synchronise un lexique Dico BTP depuis JSON vers la base (création + mise à jour).
// Usage :
//   node --env-file=.env --env-file=.env.local scripts/sync-dico-lot.mjs <jsonPath> <lotCode> "<lotName>" "<source>" [--prune]
// --prune : supprime en base les termes du lot absents du JSON (preview obligatoire via DRY_RUN=1)
//
// Exemple mise à jour Lot 01 :
//   node --env-file=.env --env-file=.env.local scripts/sync-dico-lot.mjs prisma/seed-data/dico-btp-lot-01.json 01 "Fondations - Gros Oeuvre" "CCTP Fondations - GO — révision BeWork v2" --prune

const prisma = new PrismaClient();
const dryRun = process.env.DRY_RUN === "1";

function arr(v) {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()) : [];
}

function str(v) {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function mapEntry(e, lotCode, lotName, source) {
  const term = str(e.terme ?? e.term);
  if (!term) return null;
  return {
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
    level: str(e.niveau ?? e.level) ?? "intermédiaire",
    source: str(e.source) ?? source ?? null,
    status: str(e.statut ?? e.status) ?? "à vérifier",
  };
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--prune");
  const prune = process.argv.includes("--prune");
  const [jsonArg, lotCode, lotName, source] = args;
  if (!jsonArg || !lotCode) {
    throw new Error(
      'Arguments requis : <jsonPath> <lotCode> "<lotName>" "<source>" [--prune]',
    );
  }

  const path = isAbsolute(jsonArg) ? jsonArg : resolve(process.cwd(), jsonArg);
  const raw = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(raw)) throw new Error("Le fichier JSON doit contenir un tableau de termes.");

  const entries = raw.map((e) => mapEntry(e, lotCode, lotName, source)).filter(Boolean);
  const jsonKeys = new Set(entries.map((e) => e.term.toLowerCase()));

  const existing = await prisma.btpDictionaryTerm.findMany({
    where: { lotCode },
    select: { id: true, term: true },
  });
  const existingByKey = new Map(existing.map((e) => [e.term.trim().toLowerCase(), e]));

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const toPrune = existing.filter((e) => !jsonKeys.has(e.term.trim().toLowerCase()));

  for (const data of entries) {
    const key = data.term.toLowerCase();
    const found = existingByKey.get(key);
    if (!found) {
      if (!dryRun) {
        await prisma.btpDictionaryTerm.create({ data });
      }
      created += 1;
      continue;
    }
    if (!dryRun) {
      await prisma.btpDictionaryTerm.update({
        where: { id: found.id },
        data: {
          acronym: data.acronym,
          lotName: data.lotName,
          family: data.family,
          category: data.category,
          shortDefinition: data.shortDefinition,
          beginnerExplanation: data.beginnerExplanation,
          usageExample: data.usageExample,
          keywords: data.keywords,
          synonyms: data.synonyms,
          vigilancePoints: data.vigilancePoints,
          linkedDocuments: data.linkedDocuments,
          level: data.level,
          source: data.source,
          status: data.status,
        },
      });
    }
    updated += 1;
  }

  let pruned = 0;
  if (prune && toPrune.length) {
    if (dryRun) {
      console.log("Termes à supprimer (--prune) :");
      for (const t of toPrune) console.log(`  - ${t.term}`);
    } else {
      const ids = toPrune.map((t) => t.id);
      const res = await prisma.btpDictionaryTerm.deleteMany({ where: { id: { in: ids } } });
      pruned = res.count;
    }
    pruned = dryRun ? toPrune.length : pruned;
  }

  const mode = dryRun ? "[DRY RUN] " : "";
  console.log(
    `${mode}Lot ${lotCode} : ${created} créé(s), ${updated} mis à jour, ${skipped} ignoré(s)` +
      (prune ? `, ${pruned} supprimé(s)` : "."),
  );
}

main()
  .catch((err) => {
    console.error("Erreur sync :", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
