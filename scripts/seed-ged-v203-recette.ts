/**
 * Seed recette GED V2.0.3 — SETRIM démo uniquement.
 * Idempotent. Fichiers fictifs (placeholder, pas de re-upload).
 *
 * Usage :
 *   npx tsx scripts/seed-ged-v203-recette.ts
 */
import { loadScriptEnv } from "./load-script-env";

loadScriptEnv();
process.env.NODE_TLS_REJECT_UNAUTHORIZED ??= "0";

const PLACEHOLDER = "/demo-assets/placeholder-document.pdf";
const IDS = {
  msg: "gedv203_msg_soprema",
  dm: "gedv203_dm_martin",
  bl: "gedv203_pod_bl4582",
  pilotage: "gedv203_pilotage_vh",
  st: "gedv203_st_pointp",
  stDoc: "gedv203_st_doc_isolant",
  doe: "gedv203_doe_etancheite",
  quote: "gedv203_quote_014",
  invoice: "gedv203_inv_014",
  situation: "gedv203_sit_014",
} as const;

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { ingestDurableMessageAttachments } = await import("../src/lib/ged/ingest-message-durable");
  const { linkPurchaseOrderDocumentToChantier } = await import("../src/lib/ged/link-po-bl-to-chantier");
  const { ingestSubcontractorDocToGed, ingestDoeItemToGed } = await import(
    "../src/lib/ged/ingest-pilotage-document"
  );
  const {
    ingestCommercialQuoteToGed,
    ingestCommercialInvoiceToGed,
    ingestCommercialProgressToGed,
  } = await import("../src/lib/ged/ingest-commercial-document");

  const demo = await prisma.demoEnvironment.findFirst({
    where: { status: "ACTIVE", organizationId: { not: null } },
    orderBy: { createdAt: "asc" },
    select: {
      companyName: true,
      organizationId: true,
      rootUserId: true,
      loginIdentifier: true,
    },
  });
  if (!demo?.organizationId) {
    console.error("Aucune DemoEnvironment active — seed refusé (pas de pollution hors démo).");
    process.exit(1);
  }
  const orgId = demo.organizationId;
  const ownerId = demo.rootUserId;
  console.log(`→ Seed GED V2.0.3 pour ${demo.companyName} (${demo.loginIdentifier})`);

  const victor = await prisma.project.findFirst({
    where: {
      organizationId: orgId,
      OR: [{ title: { contains: "Victor Hugo" } }, { title: { contains: "Les Lilas" } }],
    },
    select: { id: true, title: true, clientId: true },
  });
  const jardins = await prisma.project.findFirst({
    where: {
      organizationId: orgId,
      OR: [{ title: { contains: "Jardins" } }],
    },
    select: { id: true, title: true, clientId: true },
  });
  if (!victor) {
    console.error("Chantier Victor Hugo / Les Lilas introuvable dans l’org démo.");
    process.exit(1);
  }

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    select: { userId: true },
  });
  const otherUserId =
    members.map((m) => m.userId).find((id) => id !== ownerId) ??
    (
      await prisma.user.findFirst({
        where: { id: { not: ownerId }, role: { in: ["CLIENT", "AGENT", "AGENCE"] } },
        select: { id: true },
      })
    )?.id;
  if (!otherUserId) {
    console.error("Deuxième utilisateur manquant pour le DM de recette.");
    process.exit(1);
  }

  const pointP = await prisma.externalOrganization.findFirst({
    where: {
      hostOrganizationId: orgId,
      OR: [{ name: { contains: "Point.P" } }, { tradeName: { contains: "Point.P" } }],
    },
    select: { id: true, name: true, tradeName: true },
  });
  const pointPName = pointP?.tradeName || pointP?.name || "Point.P";

  const po = await prisma.purchaseOrder.findFirst({
    where: { organizationId: orgId, number: "BC-2026-043" },
    select: { id: true, number: true },
  });

  // Messagerie chantier — Fiche technique Soprema
  await prisma.message.upsert({
    where: { id: IDS.msg },
    create: {
      id: IDS.msg,
      content: "[FICTIF recette GED] Fiche technique membrane Soprema — Point.P",
      projectId: victor.id,
      senderId: ownerId,
      receiverId: otherUserId,
      channel: "FOURNISSEUR",
      attachmentsJson: [
        {
          name: "Fiche-technique-membrane-Soprema.pdf",
          fileUrl: PLACEHOLDER,
          fileSize: 12000,
          mimeType: "application/pdf",
        },
      ],
    },
    update: {
      attachmentsJson: [
        {
          name: "Fiche-technique-membrane-Soprema.pdf",
          fileUrl: PLACEHOLDER,
          fileSize: 12000,
          mimeType: "application/pdf",
        },
      ],
    },
  });
  await ingestDurableMessageAttachments({
    projectId: victor.id,
    clientId: victor.clientId,
    addedById: ownerId,
    messageKind: "PROJECT",
    messageId: IDS.msg,
    attachments: [
      {
        name: "Fiche-technique-membrane-Soprema.pdf",
        fileUrl: PLACEHOLDER,
        fileSize: 12000,
        mimeType: "application/pdf",
      },
    ],
    conversationLabel: `${pointPName} — ${victor.title}`,
    companyName: pointPName,
  });

  // DM sans chantier
  await prisma.directMessage.upsert({
    where: { id: IDS.dm },
    create: {
      id: IDS.dm,
      senderId: otherUserId,
      receiverId: ownerId,
      content: "[FICTIF recette GED] Attestation assurance Martin Étanchéité",
      attachmentsJson: [
        {
          name: "Attestation-assurance-Martin.pdf",
          fileUrl: PLACEHOLDER,
          fileSize: 8000,
          mimeType: "application/pdf",
        },
      ],
    },
    update: {
      attachmentsJson: [
        {
          name: "Attestation-assurance-Martin.pdf",
          fileUrl: PLACEHOLDER,
          fileSize: 8000,
          mimeType: "application/pdf",
        },
      ],
    },
  });
  await ingestDurableMessageAttachments({
    projectId: null,
    organizationId: orgId,
    clientId: ownerId,
    addedById: otherUserId,
    messageKind: "DIRECT",
    messageId: IDS.dm,
    attachments: [
      {
        name: "Attestation-assurance-Martin.pdf",
        fileUrl: PLACEHOLDER,
        fileSize: 8000,
        mimeType: "application/pdf",
      },
    ],
    conversationLabel: "Martin Étanchéité",
    companyName: "Martin Étanchéité",
  });

  // BL commande
  if (po) {
    await prisma.purchaseOrderDocument.upsert({
      where: { id: IDS.bl },
      create: {
        id: IDS.bl,
        orderId: po.id,
        kind: "BL",
        name: "BL-4582.pdf",
        fileUrl: PLACEHOLDER,
      },
      update: { name: "BL-4582.pdf", kind: "BL", fileUrl: PLACEHOLDER },
    });
    await linkPurchaseOrderDocumentToChantier({
      orderId: po.id,
      purchaseOrderDocumentId: IDS.bl,
      fileUrl: PLACEHOLDER,
      fileName: "BL-4582.pdf",
      addedById: ownerId,
      kind: "BL",
    });
  } else {
    console.warn("  BC-2026-043 introuvable — BL non semé");
  }

  // Pilotage + fournisseur + DOE
  const existingPilotage = await prisma.worksitePilotage.findFirst({
    where: { projectId: victor.id },
    select: { id: true },
  });
  const pilotageId = existingPilotage?.id ?? IDS.pilotage;
  if (!existingPilotage) {
    await prisma.worksitePilotage.create({
      data: {
        id: IDS.pilotage,
        projectId: victor.id,
        clientId: victor.clientId,
        createdById: ownerId,
        status: "EN_COURS",
        description: "[FICTIF recette GED]",
      },
    });
  }
  await prisma.pilotageSubcontractor.upsert({
    where: { id: IDS.st },
    create: {
      id: IDS.st,
      pilotageId,
      companyName: pointPName,
      prestation: "Fourniture membrane / isolant — fictif recette GED",
    },
    update: { companyName: pointPName },
  });
  await prisma.pilotageSubcontractorDoc.upsert({
    where: { id: IDS.stDoc },
    create: {
      id: IDS.stDoc,
      subcontractorId: IDS.st,
      docType: "Fiche-technique-isolant.pdf",
      status: "Reçu",
      fileUrl: PLACEHOLDER,
    },
    update: { fileUrl: PLACEHOLDER, docType: "Fiche-technique-isolant.pdf" },
  });
  await ingestSubcontractorDocToGed({ docId: IDS.stDoc, addedById: ownerId });

  await prisma.doeItem.upsert({
    where: { id: IDS.doe },
    create: {
      id: IDS.doe,
      pilotageId,
      title: "DOE-Fiche-technique-etancheite.pdf",
      category: "Fiches techniques",
      status: "Reçu",
      fileUrl: PLACEHOLDER,
    },
    update: { fileUrl: PLACEHOLDER, title: "DOE-Fiche-technique-etancheite.pdf" },
  });
  await ingestDoeItemToGed({ doeItemId: IDS.doe, addedById: ownerId });

  // Commercial — Les Jardins si possible
  const commercialProject = jardins ?? victor;
  const issueDate = new Date("2026-08-12T00:00:00.000Z");
  await prisma.commercialQuote.upsert({
    where: { id: IDS.quote },
    create: {
      id: IDS.quote,
      organizationId: orgId,
      number: "DEV-2026-014",
      subject: "[FICTIF] Étanchéité Les Jardins — recette GED",
      status: "SENT",
      projectId: commercialProject.id,
      createdById: ownerId,
      issueDate,
      sentAt: issueDate,
      totalSellHt: 10000,
      totalVat: 2000,
      totalTtc: 12000,
    },
    update: { status: "SENT", projectId: commercialProject.id, sentAt: issueDate },
  });
  await ingestCommercialQuoteToGed({ quoteId: IDS.quote, addedById: ownerId });

  await prisma.commercialInvoice.upsert({
    where: { id: IDS.invoice },
    create: {
      id: IDS.invoice,
      organizationId: orgId,
      number: "FAC-2026-014",
      type: "STANDARD",
      status: "ISSUED",
      quoteId: IDS.quote,
      projectId: commercialProject.id,
      createdById: ownerId,
      issueDate,
      issuedAt: issueDate,
      subject: "[FICTIF] Facture Les Jardins — recette GED",
      totalSellHt: 5000,
      totalVat: 1000,
      totalTtc: 6000,
      amountDue: 6000,
    },
    update: { status: "ISSUED", projectId: commercialProject.id },
  });
  await ingestCommercialInvoiceToGed({ invoiceId: IDS.invoice, addedById: ownerId });

  await prisma.commercialProgressStatement.upsert({
    where: { id: IDS.situation },
    create: {
      id: IDS.situation,
      organizationId: orgId,
      quoteId: IDS.quote,
      projectId: commercialProject.id,
      number: 1,
      label: "Situation 1 — [FICTIF recette GED]",
      status: "VALIDATED",
      contractSnapshotJson: [],
      createdById: ownerId,
      validatedAt: issueDate,
    },
    update: { status: "VALIDATED", projectId: commercialProject.id },
  });
  await ingestCommercialProgressToGed({ statementId: IDS.situation, addedById: ownerId });

  console.log("✓ Seed GED V2.0.3 idempotent terminé.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
