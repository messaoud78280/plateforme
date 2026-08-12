/**
 * DF-1B — smoke serveur SETRIM (sans navigateur).
 * Crée un devis test, échéancier 30/40/30, lignes, PDF, V2, vérifie immutabilité V1.
 * Nettoie le devis à la fin sauf SMOKE_KEEP=1.
 *
 * Run: node --import tsx scripts/smoke-commercial-df1b-setrim.ts
 */
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import {
  addLine,
  addSection,
  createQuote,
  getQuoteDetail,
  newVersion,
  transitionQuoteStatus,
  updateQuoteMeta,
} from "../src/lib/commercial/quotes";
import { PAYMENT_SCHEDULE_PRESETS } from "../src/lib/commercial/payment-schedule";
import { generatePdfForQuoteVersion } from "../src/lib/commercial/accepted-snapshot";
import { ensureCommercialOrgSettings } from "../src/lib/commercial/settings";

const ORG_ID = "cmbeworkdemo001org";
const USER_ID = "cmbeworkdemo001user";
const CLIENT_ID = "cmskoz35o000bib1pu96gdd86";
const PROJECT_ID = "cmsllyzjh002ncrgew75hk0gm";

async function main() {
  console.log("DF-1B smoke SETRIM (serveur)…");

  await ensureCommercialOrgSettings(ORG_ID);

  const quote = await createQuote({
    orgId: ORG_ID,
    userId: USER_ID,
    subject: "DF1B-SMOKE — Réfection étanchéité toiture-terrasse",
    clientExternalOrgId: CLIENT_ID,
    projectId: PROJECT_ID,
    paymentTerms: "Règlement par virement bancaire à réception de facture.",
    paymentScheduleJson: PAYMENT_SCHEDULE_PRESETS["30_40_30"],
    validityDate: new Date(Date.now() + 30 * 86400000),
  });
  console.log("✓ création devis", quote.number, quote.id);

  const detail0 = await getQuoteDetail(ORG_ID, quote.id);
  assert.ok(detail0?.currentVersion);
  assert.equal(detail0!.paymentScheduleJson?.lines.length, 3);
  assert.equal(detail0!.paymentScheduleJson?.basis, "TTC");
  assert.equal(detail0!.currentVersion!.paymentScheduleJson?.lines[1].type, "PROGRESS");
  assert.ok(detail0!.paymentTerms?.includes("virement"));
  console.log("✓ échéancier + paymentTerms sur quote/version");

  // Sections
  await addSection(ORG_ID, quote.id, "1. Installation");
  await addSection(ORG_ID, quote.id, "2. Préparation");
  await addSection(ORG_ID, quote.id, "3. Étanchéité");
  await addSection(ORG_ID, quote.id, "4. Finitions");
  const afterSections = await getQuoteDetail(ORG_ID, quote.id);
  const secs = afterSections!.currentVersion!.sections;
  assert.ok(secs.length >= 4);
  const etancheite = secs.find((s) => s.title.includes("Étanchéité"))!;
  console.log("✓ sections");

  // Lignes
  await addLine(ORG_ID, quote.id, {
    sectionId: etancheite.id,
    kind: "WORK",
    reference: "ET-01",
    designation: "Étanchéité bicouche élastomère",
    description: "Fourniture et mise en œuvre comprenant préparation du support.",
    quantity: 120,
    unit: "m²",
    unitSellHt: 85,
    vatRate: 20,
  });
  await addLine(ORG_ID, quote.id, {
    sectionId: etancheite.id,
    kind: "COMMENT",
    designation: "Accès chantier à confirmer avec le syndic.",
  });
  await addLine(ORG_ID, quote.id, {
    sectionId: etancheite.id,
    kind: "OPTION",
    designation: "Relevé d’acrotères optionnel",
    quantity: 1,
    unit: "U",
    unitSellHt: 1500,
    vatRate: 20,
    isOptional: true,
  });
  await addLine(ORG_ID, quote.id, {
    sectionId: etancheite.id,
    kind: "SUBTOTAL",
    designation: "Sous-total étanchéité",
  });
  console.log("✓ lignes WORK / COMMENT / OPTION / SUBTOTAL");

  const detail1 = await getQuoteDetail(ORG_ID, quote.id);
  assert.ok(detail1!.totalSellHt > 0);
  assert.ok(detail1!.totalTtc > detail1!.totalSellHt);
  const ttc = detail1!.totalTtc;
  console.log("✓ totaux HT/TVA/TTC", {
    ht: detail1!.totalSellHt,
    tva: detail1!.totalVat,
    ttc,
  });

  // Warning < 100
  await updateQuoteMeta(ORG_ID, quote.id, {
    paymentScheduleJson: {
      basis: "TTC",
      lines: [
        { type: "DEPOSIT", percent: 30, label: "Acompte", sortOrder: 0 },
        { type: "FINAL", percent: 30, label: "Solde", sortOrder: 1 },
      ],
    },
  });
  // > 100 doit échouer à la finalisation — d’abord remettre 30/40/30
  await updateQuoteMeta(ORG_ID, quote.id, {
    paymentScheduleJson: PAYMENT_SCHEDULE_PRESETS["30_40_30"],
  });

  // PDF preview
  const versionId = detail1!.currentVersion!.id;
  const ctxQuote = await prisma.commercialQuote.findFirstOrThrow({
    where: { id: quote.id, organizationId: ORG_ID },
    include: { project: { select: { title: true } } },
  });
  const version = await prisma.commercialQuoteVersion.findFirstOrThrow({
    where: { id: versionId },
    include: {
      sections: { orderBy: { sortOrder: "asc" } },
      lines: { orderBy: { sortOrder: "asc" } },
    },
  });
  const settings = await ensureCommercialOrgSettings(ORG_ID);
  const pdf = generatePdfForQuoteVersion({
    quote: {
      ...ctxQuote,
      projectTitle: ctxQuote.project?.title ?? null,
    },
    version,
    quoteMentions: settings.quoteMentions,
    legalMentions: settings.legalMentions,
  });
  const latin = pdf.toString("latin1");
  assert.ok(pdf.length > 800);
  assert.ok(latin.includes("Bon pour accord"));
  assert.ok(latin.includes("Conditions de paiement") || latin.includes("Acompte"));
  assert.ok(latin.includes("Étanchéité") || latin.includes("Etancheite") || latin.includes("bicouche"));
  console.log("✓ PDF preview", pdf.length, "bytes");

  // Logo path in issuer snapshot
  const issuer = ctxQuote.issuerSnapshotJson as { logoPath?: string | null } | null;
  console.log("  issuer.logoPath =", issuer?.logoPath ?? "(null)");

  // Versionnage
  const v1Schedule = version.paymentScheduleJson;
  const v2 = await newVersion(ORG_ID, quote.id, USER_ID);
  assert.equal(v2.versionNumber, 2);
  const afterV2 = await getQuoteDetail(ORG_ID, quote.id);
  assert.equal(afterV2!.currentVersion!.versionNumber, 2);
  assert.equal(afterV2!.currentVersion!.paymentScheduleJson?.lines.length, 3);

  // Modifier V2 échéancier → V1 inchangée
  await updateQuoteMeta(ORG_ID, quote.id, {
    paymentScheduleJson: PAYMENT_SCHEDULE_PRESETS["50_50"],
    subject: "DF1B-SMOKE — Objet modifié V2",
  });
  const v1again = await prisma.commercialQuoteVersion.findFirstOrThrow({
    where: { quoteId: quote.id, versionNumber: 1 },
  });
  assert.deepEqual(v1again.paymentScheduleJson, v1Schedule);
  console.log("✓ V2 créée · V1 échéancier intact");

  // Finalisation avec échéancier > 100 doit échouer
  await updateQuoteMeta(ORG_ID, quote.id, {
    paymentScheduleJson: {
      basis: "TTC",
      lines: [
        { type: "DEPOSIT", percent: 60, label: "A", sortOrder: 0 },
        { type: "FINAL", percent: 50, label: "B", sortOrder: 1 },
      ],
    },
  });
  let blocked = false;
  try {
    await transitionQuoteStatus(ORG_ID, quote.id, "VALIDATED", USER_ID);
  } catch (e) {
    blocked = e instanceof Error && e.message.includes("100");
  }
  assert.ok(blocked, "finalisation avec >100% doit échouer");
  console.log("✓ blocage finalisation échéancier > 100 %");

  // Remettre 30/40/30 et finaliser
  await updateQuoteMeta(ORG_ID, quote.id, {
    paymentScheduleJson: PAYMENT_SCHEDULE_PRESETS["30_40_30"],
  });
  await transitionQuoteStatus(ORG_ID, quote.id, "VALIDATED", USER_ID);
  const validated = await getQuoteDetail(ORG_ID, quote.id);
  assert.equal(validated!.status, "VALIDATED");
  console.log("✓ finalisation VALIDATED OK");

  // Devis sans schedule (compat)
  const legacy = await createQuote({
    orgId: ORG_ID,
    userId: USER_ID,
    subject: "DF1B-SMOKE — sans échéancier",
    clientExternalOrgId: CLIENT_ID,
    depositPercent: 30,
  });
  const legacyDetail = await getQuoteDetail(ORG_ID, legacy.id);
  assert.equal(legacyDetail!.paymentScheduleJson, null);
  assert.equal(legacyDetail!.depositPercent, 30);
  console.log("✓ devis legacy depositPercent sans schedule");

  if (process.env.SMOKE_KEEP === "1") {
    console.log("SMOKE_KEEP=1 — devis conservés:", quote.id, legacy.id);
  } else {
    // Nettoyage (cascade versions/lignes)
    await prisma.commercialQuote.deleteMany({
      where: {
        organizationId: ORG_ID,
        id: { in: [quote.id, legacy.id] },
      },
    });
    console.log("✓ nettoyage devis smoke");
  }

  console.log("\n✅ smoke-commercial-df1b-setrim OK");
}

main()
  .catch((e) => {
    console.error("FAIL", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
