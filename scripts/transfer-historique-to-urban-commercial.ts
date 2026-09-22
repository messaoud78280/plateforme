/**
 * Transfert bibliothèque historique (WorkItem) → bibliothèque commerciale URBAN
 * (CommercialWorkItem). Idempotent via sourceWorkItemId.
 *
 * Usage:
 *   npx tsx scripts/transfer-historique-to-urban-commercial.ts
 *   npx tsx scripts/transfer-historique-to-urban-commercial.ts --dry-run
 *   ORG_ID=... CATALOG_SLUG=historique npx tsx scripts/transfer-historique-to-urban-commercial.ts
 */
import { PrismaClient, Prisma } from "@prisma/client";
import {
  getScriptDatabaseUrlCandidatesForLongJobs,
  loadScriptEnv,
} from "./load-script-env";
import { normalizeUnit } from "../src/lib/commercial/chatgpt-bundle/normalize";

loadScriptEnv();

const DEFAULT_ORG_ID = "cmt2nx23j00021k6btoov39gr"; // URBAN AMÉNAGEMENTS
const DEFAULT_CATALOG_SLUG = "historique";
const BATCH_SIZE = 150;

function parseArgs() {
  const dryRun = process.argv.includes("--dry-run");
  const orgId = (process.env.ORG_ID ?? DEFAULT_ORG_ID).trim();
  const catalogSlug = (process.env.CATALOG_SLUG ?? DEFAULT_CATALOG_SLUG).trim();
  return { dryRun, orgId, catalogSlug };
}

function maskUrl(url: string) {
  return url.replace(/:[^:@]+@/, ":***@");
}

async function pickWorkingDatabaseUrl(): Promise<string> {
  const candidates = getScriptDatabaseUrlCandidatesForLongJobs();
  if (candidates.length === 0) {
    throw new Error("DATABASE_URL manquant (.env ou .env.local)");
  }
  const errors: string[] = [];
  for (const url of candidates) {
    const prisma = new PrismaClient({ datasourceUrl: url });
    try {
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
      console.log(`Connexion OK : ${maskUrl(url)}`);
      return url;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${maskUrl(url)} → ${msg.split("\n")[0]}`);
      await prisma.$disconnect().catch(() => {});
    }
  }
  throw new Error(
    `Aucune URL Supabase joignable.\n${errors.map((l) => `   • ${l}`).join("\n")}`,
  );
}

function cleanLabel(raw: string | null | undefined, max = 180): string | null {
  if (!raw?.trim()) return null;
  const parts = raw
    .split(/\s*·\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const p of parts) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(p);
  }
  const out = unique.join(" · ").trim();
  if (!out) return null;
  return out.length > max ? `${out.slice(0, max - 1)}…` : out;
}

function buildDescription(wi: {
  fullDescription: string;
  shortDescription: string | null;
  includedItems: string | null;
  excludedItems: string | null;
}): string | null {
  const base = (wi.fullDescription || wi.shortDescription || "").trim();
  const blocks: string[] = [];
  if (base) blocks.push(base);
  if (wi.includedItems?.trim()) {
    blocks.push(`Compris :\n${wi.includedItems.trim()}`);
  }
  if (wi.excludedItems?.trim()) {
    blocks.push(`Non compris :\n${wi.excludedItems.trim()}`);
  }
  const text = blocks.join("\n\n").trim();
  return text || null;
}

async function main() {
  const { dryRun, orgId, catalogSlug } = parseArgs();
  connectionUrl = await pickWorkingDatabaseUrl();
  const prisma = new PrismaClient({ datasourceUrl: connectionUrl });

  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true },
    });
    if (!org) {
      throw new Error(`Organisation introuvable: ${orgId}`);
    }

    const catalog = await prisma.workItemCatalog.findFirst({
      where: { slug: catalogSlug },
      select: { id: true, name: true, slug: true },
    });
    if (!catalog) {
      throw new Error(`Catalogue introuvable: ${catalogSlug}`);
    }

    const owner = await prisma.user.findFirst({
      where: {
        OR: [
          { company: { contains: "URBAN", mode: "insensitive" } },
          {
            organizationMemberships: {
              some: { organizationId: orgId, status: "ACTIVE" },
            },
          },
        ],
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, email: true },
    });

    console.log(
      `\nTransfert « ${catalog.name} » (${catalog.slug}) → ${org.name} (${org.id})`,
    );
    if (owner) {
      console.log(`Créateur : ${owner.name ?? owner.email} (${owner.id})`);
    }
    if (dryRun) console.log("Mode --dry-run (aucune écriture)\n");

    const already = await prisma.commercialWorkItem.findMany({
      where: {
        organizationId: orgId,
        sourceWorkItemId: { not: null },
      },
      select: { sourceWorkItemId: true },
    });
    const alreadyIds = new Set(
      already
        .map((r) => r.sourceWorkItemId)
        .filter((id): id is string => Boolean(id)),
    );
    console.log(`Déjà importés (sourceWorkItemId) : ${alreadyIds.size}`);

    const sourceItems = await prisma.workItem.findMany({
      where: { catalogId: catalog.id },
      select: {
        id: true,
        code: true,
        codeBework: true,
        title: true,
        unit: true,
        lot: true,
        subLot: true,
        family: true,
        familleNom: true,
        sousFamilleNom: true,
        shortDescription: true,
        fullDescription: true,
        includedItems: true,
        excludedItems: true,
        status: true,
        mergeStatus: true,
        priceEntries: {
          orderBy: [{ dateObserved: "desc" }, { createdAt: "desc" }],
          take: 1,
          select: { unitPriceHT: true },
        },
      },
      orderBy: [{ lot: "asc" }, { code: "asc" }],
    });

    const toImport = sourceItems.filter((wi) => !alreadyIds.has(wi.id));
    console.log(
      `Source : ${sourceItems.length} ouvrages — à créer : ${toImport.length}`,
    );

    if (toImport.length === 0) {
      console.log("Rien à faire (déjà à jour).");
      return;
    }

    if (dryRun) {
      const withPrice = toImport.filter((wi) => wi.priceEntries[0]).length;
      console.log(`Dry-run OK — ${toImport.length} lignes, dont ${withPrice} avec prix.`);
      const sample = toImport.slice(0, 3).map((wi) => ({
        code: wi.codeBework || wi.code,
        title: wi.title,
        unit: normalizeUnit(wi.unit),
        price: wi.priceEntries[0]
          ? Number(wi.priceEntries[0].unitPriceHT)
          : 0,
        family: cleanLabel(wi.lot || wi.familleNom || wi.family),
      }));
      console.log("Échantillon :", sample);
      return;
    }

    let created = 0;
    let withPrice = 0;

    for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
      const chunk = toImport.slice(i, i + BATCH_SIZE);
      const data: Prisma.CommercialWorkItemCreateManyInput[] = chunk.map(
        (wi) => {
          const priceRaw = wi.priceEntries[0]?.unitPriceHT;
          const unitSellHt = priceRaw != null ? Number(priceRaw) : 0;
          if (unitSellHt > 0) withPrice += 1;
          const reference = (wi.codeBework || wi.code || "").trim() || null;
          return {
            organizationId: orgId,
            reference,
            name: wi.title.trim() || reference || "Ouvrage sans titre",
            description: buildDescription(wi),
            family: cleanLabel(wi.lot || wi.familleNom || wi.family),
            subFamily: cleanLabel(
              wi.sousFamilleNom || wi.subLot || wi.family || null,
            ),
            tags: wi.mergeStatus !== "unique" ? `merge:${wi.mergeStatus}` : null,
            saleUnit: normalizeUnit(wi.unit),
            kind: "SIMPLE",
            unitCostHt: 0,
            unitSellHt,
            marginPercent: 0,
            feesPercent: 0,
            feesAmountHt: 0,
            sellMode: unitSellHt > 0 ? "FIXED_SELL" : "MARGIN",
            sourceWorkItemId: wi.id,
            isFavorite: false,
            isActive: true,
            createdById: owner?.id ?? null,
          };
        },
      );

      await prisma.commercialWorkItem.createMany({ data });
      created += chunk.length;
      const pct = Math.round((created / toImport.length) * 100);
      console.log(
        `  … ${created}/${toImport.length} (${pct}%)`,
      );
    }

    const finalCount = await prisma.commercialWorkItem.count({
      where: { organizationId: orgId },
    });
    const pricedCount = await prisma.commercialWorkItem.count({
      where: {
        organizationId: orgId,
        unitSellHt: { gt: 0 },
      },
    });

    console.log(`\nTerminé.`);
    console.log(`  Créés cette exécution : ${created}`);
    console.log(`  Dont avec prix HT    : ${withPrice}`);
    console.log(`  Total biblio URBAN   : ${finalCount}`);
    console.log(`  Dont prix > 0        : ${pricedCount}`);
  } finally {
    await prisma.$disconnect();
  }
}

let connectionUrl = "";

main().catch((err) => {
  console.error("\nÉchec transfert :", err instanceof Error ? err.message : err);
  process.exit(1);
});
