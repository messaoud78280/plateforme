/**
 * Inventaire GED V2.0.2 — existants vs index (sans écriture).
 * Usage : NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/ged-v202-inventory.ts
 */
import { Prisma } from "@prisma/client";
import { getScriptDatabaseUrl, loadScriptEnv } from "./load-script-env";

loadScriptEnv();
process.env.NODE_TLS_REJECT_UNAUTHORIZED ??= "0";

function row(
  label: string,
  existants: number,
  indexes: number,
  sansChantier: number,
  doublons: number,
) {
  const manquants = Math.max(0, existants - indexes);
  console.log(
    `| ${label.padEnd(14)} | ${String(existants).padStart(9)} | ${String(indexes).padStart(7)} | ${String(sansChantier).padStart(13)} | ${String(doublons).padStart(8)} |`,
  );
  return { existants, indexes, manquants, sansChantier, doublons };
}

async function main() {
  const url = getScriptDatabaseUrl();
  if (!url) {
    console.error("DATABASE_URL manquant");
    process.exit(1);
  }
  const { prisma } = await import("../src/lib/prisma");
  const { parseAttachmentsJson, isDurableDocument } = await import("../src/lib/ged/durable-file");

  const linkCounts = async (entityType: string, ids: string[]) => {
    if (ids.length === 0) return new Set<string>();
    const links = await prisma.chantierFileLink.findMany({
      where: { entityType, entityId: { in: ids } },
      select: { entityId: true },
    });
    return new Set(links.map((l) => l.entityId).filter(Boolean) as string[]);
  };

  const dupes = async (entityType: string) => {
    const grouped = await prisma.$queryRaw<Array<{ c: bigint }>>`
      SELECT COUNT(*)::bigint AS c FROM (
        SELECT "entityId" FROM "ChantierFileLink"
        WHERE "entityType" = ${entityType} AND "entityId" IS NOT NULL
        GROUP BY "entityId" HAVING COUNT(*) > 1
      ) t
    `;
    return Number(grouped[0]?.c ?? 0);
  };

  // Messagerie durables
  const messages = await prisma.message.findMany({
    where: { deletedAt: null, attachmentsJson: { not: Prisma.DbNull } },
    select: { id: true, attachmentsJson: true },
  });
  const msgIds: string[] = [];
  let msgDurable = 0;
  for (const m of messages) {
    const durable = parseAttachmentsJson(m.attachmentsJson).filter((a) => isDurableDocument(a) && a.fileUrl);
    msgDurable += durable.length;
    if (durable.length) msgIds.push(m.id);
  }
  const msgIndexed = await prisma.chantierFileLink.count({
    where: { entityType: "message_attachment" },
  });
  const msgSans = await prisma.chantierFile.count({
    where: {
      deletedAt: null,
      projectId: null,
      links: { some: { entityType: "message_attachment" } },
    },
  });

  const poDocs = await prisma.purchaseOrderDocument.findMany({
    where: { fileUrl: { not: null }, order: { projectId: { not: null } } },
    select: { id: true },
  });
  const poIndexed = await linkCounts("purchase_order_document", poDocs.map((d) => d.id));

  const quotes = await prisma.commercialQuote.findMany({
    where: { status: { notIn: ["DRAFT", "TO_VALIDATE"] }, projectId: { not: null } },
    select: { id: true },
  });
  const quoteIndexed = await linkCounts("commercial_quote", quotes.map((d) => d.id));
  const invoices = await prisma.commercialInvoice.findMany({
    where: { status: { not: "DRAFT" }, OR: [{ projectId: { not: null } }, { quote: { projectId: { not: null } } }] },
    select: { id: true },
  });
  const invIndexed = await linkCounts("commercial_invoice", invoices.map((d) => d.id));
  const statements = await prisma.commercialProgressStatement.findMany({
    where: { status: { not: "DRAFT" }, OR: [{ projectId: { not: null } }, { quote: { projectId: { not: null } } }] },
    select: { id: true },
  });
  const stIndexed = await linkCounts("commercial_progress", statements.map((d) => d.id));
  const snapshots = await prisma.commercialQuoteSnapshot.count({
    where: { quote: { projectId: { not: null } } },
  });
  const snapIndexed = await prisma.chantierFileLink.count({
    where: { entityType: "commercial_quote_snapshot" },
  });

  const commercialExist = quotes.length + invoices.length + statements.length;
  const commercialIdx = quoteIndexed.size + invIndexed.size + stIndexed.size;

  const doe = await prisma.doeItem.findMany({
    where: { archivedAt: null, fileUrl: { not: null } },
    select: { id: true },
  });
  const doeIdx = await linkCounts("doe_item", doe.map((d) => d.id));

  const photos = await prisma.pilotagePhoto.findMany({
    where: { archivedAt: null },
    select: { id: true },
  });
  const photoIdx = await linkCounts("pilotage_photo", photos.map((d) => d.id));

  const chantierFiles = await prisma.chantierFile.count({
    where: { deletedAt: null, archivedAt: null },
  });
  const missingPlaceholders = await prisma.chantierFile.count({
    where: { deletedAt: null, status: { in: ["MANQUANT", "A_RELANCER"] } },
  });

  const legacy = await prisma.document.findMany({
    where: { fileUrl: { not: "" } },
    select: { id: true, projectId: true },
  });
  const legacyIdx = await prisma.chantierFile.count({
    where: { sourceDocumentId: { in: legacy.map((d) => d.id) } },
  });

  const followUp = 0;
  const stDocs = await prisma.pilotageSubcontractorDoc.count({ where: { fileUrl: { not: null } } });
  const stIdx = await prisma.chantierFileLink.count({ where: { entityType: "pilotage_subcontractor_doc" } });
  const market = await prisma.pilotageMarketDocument.count({
    where: { archivedAt: null, fileUrl: { not: null } },
  });
  const marketIdx = await prisma.chantierFileLink.count({
    where: { entityType: "pilotage_market_document" },
  });
  const dms = await prisma.directMessage.findMany({
    where: { deletedAt: null, attachmentsJson: { not: Prisma.DbNull } },
    select: { attachmentsJson: true },
  });
  let dmDurable = 0;
  for (const m of dms) {
    dmDurable += parseAttachmentsJson(m.attachmentsJson).filter((a) => isDurableDocument(a) && a.fileUrl).length;
  }

  const sansChantierFor = async (entityType: string) =>
    prisma.chantierFile.count({
      where: {
        deletedAt: null,
        projectId: null,
        links: { some: { entityType } },
      },
    });

  const appt = await prisma.appointmentAttachment.count();
  const reports = await prisma.reportAttachment.count();

  console.log("### Inventaire GED V2.0.3");
  console.log("| Source         | Existants | Indexés | Sans chantier | Doublons |");
  console.log("| -------------- | --------: | ------: | ------------: | -------: |");
  row("Messagerie", msgDurable + dmDurable, msgIndexed, await sansChantierFor("message_attachment"), await dupes("message_attachment"));
  row("Commandes", poDocs.length, poIndexed.size, await sansChantierFor("purchase_order_document"), await dupes("purchase_order_document"));
  row("Fournisseurs", stDocs, stIdx, await sansChantierFor("pilotage_subcontractor_doc"), await dupes("pilotage_subcontractor_doc"));
  const chantierSans = await prisma.chantierFile.count({
    where: { deletedAt: null, archivedAt: null, projectId: null },
  });
  row("Chantiers", chantierFiles, chantierFiles, chantierSans, 0);
  row("Fiches suivi", followUp, 0, 0, 0);
  row("Commercial", commercialExist, commercialIdx, await sansChantierFor("commercial_invoice") + await sansChantierFor("commercial_progress") + await sansChantierFor("commercial_quote_snapshot"), await dupes("commercial_invoice") + await dupes("commercial_progress") + await dupes("commercial_quote_snapshot"));
  row("DOE", doe.length, doeIdx.size, await sansChantierFor("doe_item"), await dupes("doe_item"));
  row("Autres", legacy.length + market + appt + reports, legacyIdx + marketIdx, await sansChantierFor("legacy_document"), 0);
  console.log("");
  console.log(`ChantierFile total (hors archive) : ${chantierFiles}`);
  console.log(`Dont sans chantier : ${chantierSans}`);
  console.log(`Pièces attendues (MANQUANT/A_RELANCER) : ${missingPlaceholders}`);
  console.log(`DM avec PJ : ${dms.length} · durables : ${dmDurable}`);
  console.log(`RDV PJ : ${appt} · Rapports PJ : ${reports} · Pièces marché : ${market}`);
  console.log("Fiches suivi : source non supportée actuellement (pas de champ fichier).");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
