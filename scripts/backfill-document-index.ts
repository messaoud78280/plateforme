/**
 * GED V2.0.1 — indexe les documents déjà présents (sans re-upload).
 *
 * Usage :
 *   npm run db:backfill-document-index              # dry-run
 *   npm run db:backfill-document-index -- --apply   # écriture
 *   npm run db:backfill-document-index -- --apply --project=<id>
 */
import { Prisma } from "@prisma/client";
import {
  getScriptDatabaseUrl,
  loadScriptEnv,
} from "./load-script-env";

loadScriptEnv();
process.env.NODE_TLS_REJECT_UNAUTHORIZED ??= "0";

const apply = process.argv.includes("--apply");
const dryRun = !apply;
const projectArg = process.argv.find((a) => a.startsWith("--project="));
const projectFilter = projectArg?.slice("--project=".length).trim() || null;

type Stats = {
  analyzed: number;
  indexed: number;
  existing: number;
  skipped: number;
  errors: number;
};

function emptyStats(): Stats {
  return { analyzed: 0, indexed: 0, existing: 0, skipped: 0, errors: 0 };
}

function line(label: string, s: Stats): string {
  return `${label} : ${s.analyzed} analysés / ${s.indexed} indexés / ${s.existing} déjà présents / ${s.skipped} ignorés / ${s.errors} erreurs`;
}

function tally(
  s: Stats,
  r: { linked?: boolean; created?: boolean; reason?: string; chantierFileId?: string | null },
) {
  const created = r.created === true || r.linked === true;
  if (created) s.indexed += 1;
  else if (r.reason === "already_linked") s.existing += 1;
  else s.skipped += 1;
}

const BATCH = 80;

async function main() {
  const url = getScriptDatabaseUrl();
  if (!url) {
    console.error("❌ DATABASE_URL manquant (.env ou .env.local)");
    process.exit(1);
  }

  const { prisma } = await import("../src/lib/prisma");
  const { parseAttachmentsJson, isDurableDocument } = await import("../src/lib/ged/durable-file");
  const { ingestDurableMessageAttachments } = await import("../src/lib/ged/ingest-message-durable");
  const { resolveSharedOrganizationId } = await import("../src/lib/ged/org-scope");
  const { linkPurchaseOrderDocumentToChantier } = await import("../src/lib/ged/link-po-bl-to-chantier");
  const { classifyDocumentType } = await import("../src/lib/ged/classify-document");
  const {
    ingestCommercialQuoteToGed,
    ingestCommercialInvoiceToGed,
    ingestCommercialProgressToGed,
  } = await import("../src/lib/ged/ingest-commercial-document");
  const {
    ingestDoeItemToGed,
    ingestPilotagePhotoToGed,
    ingestMarketDocumentToGed,
    ingestSubcontractorDocToGed,
    ingestLegacyDocumentToGed,
  } = await import("../src/lib/ged/ingest-pilotage-document");

  console.log(dryRun ? "→ Mode simulation (--apply pour écrire)\n" : "→ Écriture en base\n");
  if (projectFilter) console.log(`→ Filtre chantier ${projectFilter}\n`);

  if (apply) {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const sql = await fs.readFile(
      path.resolve(__dirname, "../prisma/migrations/add-ged-v201-source-identity.sql"),
      "utf8",
    );
    const statements = sql
      .split(/;\s*\n/)
      .map((s) => s.replace(/--[^\n]*/g, "").trim())
      .filter((s) => s.length > 20);
    for (const stmt of statements) {
      await prisma.$executeRawUnsafe(stmt);
    }
    console.log("→ Indexes / contrainte unique appliqués");

    const sql203 = await fs.readFile(
      path.resolve(__dirname, "../prisma/migrations/add-ged-v203-org-scope.sql"),
      "utf8",
    );
    const parts203 = sql203
      .split(/;\s*\n/)
      .map((s) => s.replace(/--[^\n]*/g, "").trim())
      .filter((s) => s.length > 20);
    for (const stmt of parts203) {
      await prisma.$executeRawUnsafe(stmt);
    }
    console.log("→ projectId nullable / organizationId appliqués\n");
  }

  const messagerie = emptyStats();
  const dmStats = emptyStats();
  const missions = emptyStats();
  const commandes = emptyStats();
  const commercial = emptyStats();
  const doe = emptyStats();
  const photos = emptyStats();
  const marche = emptyStats();
  const stDocs = emptyStats();
  const legacy = emptyStats();

  // --- Messagerie chantier ---
  {
    let cursor: string | undefined;
    for (;;) {
      const rows = await prisma.message.findMany({
        where: {
          deletedAt: null,
          attachmentsJson: { not: Prisma.DbNull },
          ...(projectFilter ? { projectId: projectFilter } : {}),
        },
        orderBy: { id: "asc" },
        take: BATCH,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        select: {
          id: true,
          projectId: true,
          senderId: true,
          attachmentsJson: true,
          createdAt: true,
          channel: true,
          project: {
            select: {
              title: true,
              clientId: true,
            },
          },
          projectChannel: {
            select: { externalOrganization: { select: { name: true, tradeName: true } } },
          },
        },
      });
      if (rows.length === 0) break;
      cursor = rows[rows.length - 1]!.id;
      for (const row of rows) {
        const atts = parseAttachmentsJson(row.attachmentsJson);
        const durable = atts.filter((a) => isDurableDocument(a));
        messagerie.analyzed += durable.length;
        if (durable.length === 0) continue;
        try {
          const companyName =
            row.projectChannel?.externalOrganization?.tradeName ||
            row.projectChannel?.externalOrganization?.name ||
            null;
          const r = await ingestDurableMessageAttachments({
            projectId: row.projectId,
            clientId: row.project.clientId,
            addedById: row.senderId,
            messageKind: "PROJECT",
            messageId: row.id,
            attachments: durable,
            conversationLabel: row.project.title,
            companyName,
            visibility:
              row.channel === "INTERNE" ? "Interne BeWork" : "Interne entreprise cliente",
            createdAt: row.createdAt,
            dryRun,
          });
          messagerie.indexed += r.linked;
          messagerie.existing += r.existing;
          messagerie.skipped += r.skipped;
        } catch (e) {
          messagerie.errors += 1;
          if (messagerie.errors <= 5) console.error("  Messagerie", row.id, e);
        }
      }
      if (rows.length < BATCH) break;
    }
  }

  // --- DM (sans chantier, via organizationId) ---
  if (!projectFilter) {
    let cursor: string | undefined;
    for (;;) {
      const rows = await prisma.directMessage.findMany({
        where: { deletedAt: null, attachmentsJson: { not: Prisma.DbNull } },
        orderBy: { id: "asc" },
        take: BATCH,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        select: {
          id: true,
          senderId: true,
          receiverId: true,
          attachmentsJson: true,
          createdAt: true,
          sender: { select: { name: true, company: true } },
          receiver: { select: { name: true, company: true } },
        },
      });
      if (rows.length === 0) break;
      cursor = rows[rows.length - 1]!.id;
      for (const row of rows) {
        const atts = parseAttachmentsJson(row.attachmentsJson);
        const durable = atts.filter((a) => isDurableDocument(a));
        dmStats.analyzed += durable.length;
        if (durable.length === 0) {
          dmStats.skipped += atts.length;
          continue;
        }
        try {
          const organizationId = await resolveSharedOrganizationId([row.senderId, row.receiverId]);
          if (!organizationId) {
            dmStats.skipped += durable.length;
            continue;
          }
          const org = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { ownerUserId: true },
          });
          if (!org) {
            dmStats.skipped += durable.length;
            continue;
          }
          const companyName =
            row.sender.company?.trim() ||
            row.receiver.company?.trim() ||
            row.sender.name ||
            row.receiver.name ||
            null;
          const r = await ingestDurableMessageAttachments({
            projectId: null,
            organizationId,
            clientId: org.ownerUserId,
            addedById: row.senderId,
            messageKind: "DIRECT",
            messageId: row.id,
            attachments: durable,
            conversationLabel: companyName,
            companyName,
            visibility: "Interne entreprise cliente",
            createdAt: row.createdAt,
            dryRun,
          });
          dmStats.indexed += r.linked;
          dmStats.existing += r.existing;
          dmStats.skipped += r.skipped;
        } catch (e) {
          dmStats.errors += 1;
          if (dmStats.errors <= 5) console.error("  DM", row.id, e);
        }
      }
      if (rows.length < BATCH) break;
    }
  }

  // --- Missions ---
  {
    let cursor: string | undefined;
    for (;;) {
      const rows = await prisma.taskMessage.findMany({
        where: {
          deletedAt: null,
          attachmentsJson: { not: Prisma.DbNull },
          task: projectFilter ? { projectId: projectFilter } : { projectId: { not: null } },
        },
        orderBy: { id: "asc" },
        take: BATCH,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        select: {
          id: true,
          senderId: true,
          attachmentsJson: true,
          createdAt: true,
          isInternal: true,
          task: { select: { projectId: true, clientId: true, title: true } },
        },
      });
      if (rows.length === 0) break;
      cursor = rows[rows.length - 1]!.id;
      for (const row of rows) {
        const atts = parseAttachmentsJson(row.attachmentsJson);
        const durable = atts.filter((a) => isDurableDocument(a));
        missions.analyzed += durable.length;
        if (!row.task.projectId || durable.length === 0) {
          missions.skipped += durable.length;
          continue;
        }
        try {
          const r = await ingestDurableMessageAttachments({
            projectId: row.task.projectId,
            clientId: row.task.clientId,
            addedById: row.senderId,
            messageKind: "TASK",
            messageId: row.id,
            attachments: durable,
            conversationLabel: row.task.title,
            visibility: row.isInternal ? "Interne BeWork" : "Interne entreprise cliente",
            createdAt: row.createdAt,
            dryRun,
          });
          missions.indexed += r.linked;
          missions.existing += r.existing;
          missions.skipped += r.skipped;
        } catch (e) {
          missions.errors += 1;
          if (missions.errors <= 5) console.error("  Mission", row.id, e);
        }
      }
      if (rows.length < BATCH) break;
    }
  }

  // --- Commandes ---
  {
    let cursor: string | undefined;
    for (;;) {
      const rows = await prisma.purchaseOrderDocument.findMany({
        where: {
          fileUrl: { not: null },
          order: projectFilter ? { projectId: projectFilter } : { projectId: { not: null } },
        },
        orderBy: { id: "asc" },
        take: BATCH,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        select: {
          id: true,
          orderId: true,
          receiptId: true,
          kind: true,
          name: true,
          fileUrl: true,
          createdAt: true,
          order: { select: { requestedById: true } },
        },
      });
      if (rows.length === 0) break;
      cursor = rows[rows.length - 1]!.id;
      for (const row of rows) {
        commandes.analyzed += 1;
        if (!row.fileUrl) {
          commandes.skipped += 1;
          continue;
        }
        try {
          const r = await linkPurchaseOrderDocumentToChantier({
            orderId: row.orderId,
            purchaseOrderDocumentId: row.id,
            fileUrl: row.fileUrl,
            fileName: row.name,
            addedById: row.order.requestedById,
            kind: row.kind,
            receiptId: row.receiptId,
            createdAt: row.createdAt,
            dryRun,
          });
          tally(commandes, r);
        } catch (e) {
          commandes.errors += 1;
          if (commandes.errors <= 5) console.error("  Commande", row.id, e);
        }
      }
      if (rows.length < BATCH) break;
    }
  }

  // --- Commercial : snapshots puis devis / factures / situations ---
  {
    let cursor: string | undefined;
    for (;;) {
      const rows = await prisma.commercialQuoteSnapshot.findMany({
        where: {
          quote: projectFilter
            ? { projectId: projectFilter }
            : { projectId: { not: null } },
        },
        orderBy: { id: "asc" },
        take: BATCH,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        select: {
          id: true,
          quoteId: true,
          storageKey: true,
          quote: { select: { createdById: true } },
        },
      });
      if (rows.length === 0) break;
      cursor = rows[rows.length - 1]!.id;
      for (const row of rows) {
        commercial.analyzed += 1;
        try {
          const r = await ingestCommercialQuoteToGed({
            quoteId: row.quoteId,
            addedById: row.quote.createdById,
            snapshotId: row.id,
            storageKey: row.storageKey,
            dryRun,
          });
          tally(commercial, r);
        } catch (e) {
          commercial.errors += 1;
          if (commercial.errors <= 5) console.error("  Snapshot", row.id, e);
        }
      }
      if (rows.length < BATCH) break;
    }
  }
  {
    let cursor: string | undefined;
    for (;;) {
      const rows = await prisma.commercialQuote.findMany({
        where: {
          status: { notIn: ["DRAFT", "TO_VALIDATE"] },
          projectId: projectFilter ?? { not: null },
        },
        orderBy: { id: "asc" },
        take: BATCH,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        select: { id: true, createdById: true },
      });
      if (rows.length === 0) break;
      cursor = rows[rows.length - 1]!.id;
      for (const row of rows) {
        commercial.analyzed += 1;
        try {
          const r = await ingestCommercialQuoteToGed({
            quoteId: row.id,
            addedById: row.createdById,
            dryRun,
          });
          tally(commercial, r);
        } catch (e) {
          commercial.errors += 1;
          if (commercial.errors <= 5) console.error("  Devis", row.id, e);
        }
      }
      if (rows.length < BATCH) break;
    }
  }
  {
    let cursor: string | undefined;
    for (;;) {
      const rows = await prisma.commercialInvoice.findMany({
        where: {
          status: { not: "DRAFT" },
          OR: projectFilter
            ? [{ projectId: projectFilter }, { quote: { projectId: projectFilter } }]
            : [{ projectId: { not: null } }, { quote: { projectId: { not: null } } }],
        },
        orderBy: { id: "asc" },
        take: BATCH,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        select: { id: true, createdById: true },
      });
      if (rows.length === 0) break;
      cursor = rows[rows.length - 1]!.id;
      for (const row of rows) {
        commercial.analyzed += 1;
        try {
          const r = await ingestCommercialInvoiceToGed({
            invoiceId: row.id,
            addedById: row.createdById,
            dryRun,
          });
          tally(commercial, r);
        } catch (e) {
          commercial.errors += 1;
          if (commercial.errors <= 5) console.error("  Facture", row.id, e);
        }
      }
      if (rows.length < BATCH) break;
    }
  }
  {
    let cursor: string | undefined;
    for (;;) {
      const rows = await prisma.commercialProgressStatement.findMany({
        where: {
          status: { not: "DRAFT" },
          OR: projectFilter
            ? [{ projectId: projectFilter }, { quote: { projectId: projectFilter } }]
            : [{ projectId: { not: null } }, { quote: { projectId: { not: null } } }],
        },
        orderBy: { id: "asc" },
        take: BATCH,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        select: { id: true, createdById: true },
      });
      if (rows.length === 0) break;
      cursor = rows[rows.length - 1]!.id;
      for (const row of rows) {
        commercial.analyzed += 1;
        try {
          const r = await ingestCommercialProgressToGed({
            statementId: row.id,
            addedById: row.createdById,
            dryRun,
          });
          tally(commercial, r);
        } catch (e) {
          commercial.errors += 1;
          if (commercial.errors <= 5) console.error("  Situation", row.id, e);
        }
      }
      if (rows.length < BATCH) break;
    }
  }

  async function paginatePilotage<T extends { id: string }>(
    label: "doe" | "photos" | "marche" | "st" | "legacy",
    fetchPage: (cursor?: string) => Promise<T[]>,
    run: (row: T) => Promise<{ linked: boolean; reason?: string }>,
    stats: Stats,
  ) {
    let cursor: string | undefined;
    for (;;) {
      const rows = await fetchPage(cursor);
      if (rows.length === 0) break;
      cursor = rows[rows.length - 1]!.id;
      for (const row of rows) {
        stats.analyzed += 1;
        try {
          const r = await run(row);
          tally(stats, r);
        } catch (e) {
          stats.errors += 1;
          if (stats.errors <= 5) console.error(`  ${label}`, row.id, e);
        }
      }
      if (rows.length < BATCH) break;
    }
  }

  const pilotageWhere = projectFilter ? { project: { id: projectFilter } } : {};

  await paginatePilotage(
    "doe",
    (cursor) =>
      prisma.doeItem.findMany({
        where: { archivedAt: null, fileUrl: { not: null }, pilotage: pilotageWhere },
        orderBy: { id: "asc" },
        take: BATCH,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        select: { id: true, pilotage: { select: { createdById: true, clientId: true } } },
      }),
    (row) =>
      ingestDoeItemToGed({
        doeItemId: row.id,
        addedById: row.pilotage.createdById || row.pilotage.clientId,
        dryRun,
      }),
    doe,
  );

  await paginatePilotage(
    "photos",
    (cursor) =>
      prisma.pilotagePhoto.findMany({
        where: { archivedAt: null, pilotage: pilotageWhere },
        orderBy: { id: "asc" },
        take: BATCH,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        select: { id: true, pilotage: { select: { createdById: true, clientId: true } } },
      }),
    (row) =>
      ingestPilotagePhotoToGed({
        photoId: row.id,
        addedById: row.pilotage.createdById || row.pilotage.clientId,
        dryRun,
      }),
    photos,
  );

  await paginatePilotage(
    "marche",
    (cursor) =>
      prisma.pilotageMarketDocument.findMany({
        where: { archivedAt: null, fileUrl: { not: null }, chantierFileId: null, pilotage: pilotageWhere },
        orderBy: { id: "asc" },
        take: BATCH,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        select: { id: true, uploadedById: true, pilotage: { select: { createdById: true, clientId: true } } },
      }),
    (row) =>
      ingestMarketDocumentToGed({
        marketDocumentId: row.id,
        addedById: row.uploadedById || row.pilotage.createdById || row.pilotage.clientId,
        dryRun,
      }),
    marche,
  );

  await paginatePilotage(
    "st",
    (cursor) =>
      prisma.pilotageSubcontractorDoc.findMany({
        where: {
          fileUrl: { not: null },
          subcontractor: { pilotage: pilotageWhere },
        },
        orderBy: { id: "asc" },
        take: BATCH,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        select: { id: true, subcontractor: { select: { pilotage: { select: { createdById: true, clientId: true } } } } },
      }),
    (row) =>
      ingestSubcontractorDocToGed({
        docId: row.id,
        addedById: row.subcontractor.pilotage.createdById || row.subcontractor.pilotage.clientId,
        dryRun,
      }),
    stDocs,
  );

  await paginatePilotage(
    "legacy",
    (cursor) =>
      prisma.document.findMany({
        where: {
          fileUrl: { not: "" },
          ...(projectFilter
            ? { OR: [{ projectId: projectFilter }, { task: { projectId: projectFilter } }] }
            : {}),
        },
        orderBy: { id: "asc" },
        take: BATCH,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        select: { id: true, clientId: true },
      }),
    (row) => ingestLegacyDocumentToGed({ documentId: row.id, addedById: row.clientId, dryRun }),
    legacy,
  );

  let reclassified = 0;
  {
    let cursor: string | undefined;
    for (;;) {
      const rows = await prisma.chantierFile.findMany({
        where: {
          deletedAt: null,
          ...(projectFilter ? { projectId: projectFilter } : {}),
        },
        orderBy: { id: "asc" },
        take: BATCH,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        select: {
          id: true,
          name: true,
          documentType: true,
          category: true,
          links: { select: { entityType: true }, take: 8 },
        },
      });
      if (rows.length === 0) break;
      cursor = rows[rows.length - 1]!.id;
      for (const row of rows) {
        const source =
          row.links.find((l) =>
            [
              "commercial_quote",
              "commercial_quote_snapshot",
              "commercial_invoice",
              "commercial_progress",
              "doe_item",
              "pilotage_photo",
              "purchase_order_document",
              "message_attachment",
            ].includes(l.entityType),
          )?.entityType ?? null;
        const next = classifyDocumentType({
          sourceEntityType: source,
          filename: row.name,
          category: row.category,
          currentType: row.documentType,
        });
        if (!next.certain) continue;
        if (next.documentType === row.documentType) continue;
        reclassified += 1;
        if (!dryRun) {
          await prisma.chantierFile.update({
            where: { id: row.id },
            data: {
              documentType: next.documentType,
              classificationStatus: "CLASSE",
            },
          });
        }
      }
      if (rows.length < BATCH) break;
    }
  }

  const all = [messagerie, dmStats, missions, commandes, commercial, doe, photos, marche, stDocs, legacy];
  const total = all.reduce(
    (acc, s) => ({
      analyzed: acc.analyzed + s.analyzed,
      indexed: acc.indexed + s.indexed,
      existing: acc.existing + s.existing,
      skipped: acc.skipped + s.skipped,
      errors: acc.errors + s.errors,
    }),
    emptyStats(),
  );

  console.log(line("Messagerie", messagerie));
  console.log(line("DM (sans chantier)", dmStats));
  console.log(line("Missions", missions));
  console.log(line("Commandes", commandes));
  console.log(line("Commercial", commercial));
  console.log(line("DOE", doe));
  console.log(line("Photos", photos));
  console.log(line("Pièces marché", marche));
  console.log(line("Sous-traitants", stDocs));
  console.log(line("Missions (Document)", legacy));
  console.log(`Classification : ${reclassified} type(s) ${dryRun ? "à corriger" : "corrigés"}`);
  console.log(line("Total", total));

  if (dryRun) {
    console.log("\n⚠️  Relancez avec --apply pour enregistrer.");
  } else {
    console.log("\n✓ Index GED à jour (idempotent).");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
