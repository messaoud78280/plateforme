/**
 * ECO-0 — Seed scénario économique SETRIM uniquement.
 *
 *   npm run db:seed-setrim-eco
 *
 * Refuse toute organisation non SETRIM. Idempotent (2ᵉ exécution = 0 doublon).
 * N’invente aucune connexion métier manquante.
 */
import { PrismaClient } from "@prisma/client";
import {
  getScriptDatabaseUrlCandidatesForLongJobs,
  loadScriptEnv,
} from "./load-script-env";

loadScriptEnv();
process.env.NODE_TLS_REJECT_UNAUTHORIZED ??= "0";

function maskUrl(url: string) {
  return url.replace(/:[^:@]+@/, ":***@");
}

async function pickWorkingDatabaseUrl(): Promise<string> {
  const candidates = getScriptDatabaseUrlCandidatesForLongJobs();
  if (candidates.length === 0) {
    throw new Error("DATABASE_URL manquant — seed refusé.");
  }
  const errors: string[] = [];
  for (const url of candidates) {
    const client = new PrismaClient({ datasourceUrl: url });
    try {
      await client.$queryRaw`SELECT 1`;
      await client.$disconnect();
      console.log(`Connexion OK : ${maskUrl(url)}`);
      return url;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${maskUrl(url)} → ${msg.split("\n")[0]}`);
      await client.$disconnect().catch(() => {});
    }
  }
  throw new Error(
    `Aucune URL base joignable.\n${errors.map((l) => `  • ${l}`).join("\n")}`,
  );
}

async function countEcoEntities(orgId: string, projectId: string, quoteId: string) {
  const { prisma } = await import("../src/lib/prisma");
  const { ECO0_MARK, ECO0_QUOTE_NUMBER, ECO0_PAY_REFS } = await import(
    "../src/lib/demo-environment/economic-scenario"
  );
  const [quotes, pos, receipts, sis, progress, invoices, payments] = await Promise.all([
    prisma.commercialQuote.count({
      where: {
        organizationId: orgId,
        OR: [{ number: ECO0_QUOTE_NUMBER }, { subject: { contains: ECO0_MARK } }],
      },
    }),
    prisma.purchaseOrder.count({
      where: {
        organizationId: orgId,
        projectId,
        OR: [{ number: { startsWith: "BC-ECO-" } }, { subject: { contains: ECO0_MARK } }],
      },
    }),
    prisma.purchaseOrderReceipt.count({
      where: {
        organizationId: orgId,
        cancelledAt: null,
        purchaseOrder: {
          organizationId: orgId,
          OR: [{ number: { startsWith: "BC-ECO-" } }, { subject: { contains: ECO0_MARK } }],
        },
      },
    }),
    prisma.supplierInvoice.count({
      where: {
        organizationId: orgId,
        supplierNumber: { startsWith: "FAC-ECO-" },
      },
    }),
    prisma.commercialProgressStatement.count({
      where: { organizationId: orgId, quoteId },
    }),
    prisma.commercialInvoice.count({
      where: { organizationId: orgId, quoteId },
    }),
    prisma.commercialPayment.count({
      where: {
        organizationId: orgId,
        cancelledAt: null,
        reference: { in: [ECO0_PAY_REFS.s1, ECO0_PAY_REFS.s2] },
      },
    }),
  ]);
  return { quotes, pos, receipts, sis, progress, invoices, payments };
}

async function main() {
  process.env.DATABASE_URL = await pickWorkingDatabaseUrl();

  const {
    EcoEnvironmentError,
    formatEco0MarkdownReport,
    runSetrimEconomicScenario,
  } = await import("../src/lib/demo-environment/economic-scenario");

  console.log("ECO-0 — seed scénario économique SETRIM\n");

  let first;
  try {
    first = await runSetrimEconomicScenario();
  } catch (e) {
    if (e instanceof EcoEnvironmentError) {
      console.error(`REFUS ENVIRONNEMENT : ${e.message}`);
      process.exit(1);
    }
    throw e;
  }

  console.log("\n→ Seconde exécution (idempotence)…\n");
  const second = await runSetrimEconomicScenario();
  const counts = await countEcoEntities(
    second.context.organizationId,
    second.projectId,
    second.quoteId,
  );

  const expected = {
    quotes: 1,
    pos: 3,
    receipts: 2,
    sis: 3,
    progress: 2,
    invoices: 2,
    payments: 2,
  };
  const dup =
    counts.quotes !== expected.quotes ||
    counts.pos !== expected.pos ||
    counts.receipts !== expected.receipts ||
    counts.sis !== expected.sis ||
    counts.progress !== expected.progress ||
    counts.invoices !== expected.invoices ||
    counts.payments !== expected.payments;

  console.log("\n── Idempotence x2 ──");
  console.log(
    `  devis=${counts.quotes} BC=${counts.pos} réceptions=${counts.receipts} FACf=${counts.sis} sit=${counts.progress} FACc=${counts.invoices} paiements=${counts.payments}`,
  );
  if (dup) {
    console.error("  ÉCHEC : comptes différents des attendus (doublon ou manque).");
    process.exit(1);
  }
  console.log("  OK — aucun doublon.");
  console.log(`  1ʳᵉ passe budget=${first.budgetMode} · 2ᵉ=${second.budgetMode}`);

  console.log("\n" + formatEco0MarkdownReport(second));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect();
  });
