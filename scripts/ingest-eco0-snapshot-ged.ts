/**
 * RELEASE-1 — indexe le PDF accepté ECO-0 dans la GED existante (idempotent).
 */
import { loadScriptEnv } from "./load-script-env";

loadScriptEnv();
process.env.NODE_TLS_REJECT_UNAUTHORIZED ??= "0";

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { ECO0_QUOTE_NUMBER, ECO0_MARK } = await import(
    "../src/lib/demo-environment/economic-scenario-guard"
  );
  const quote = await prisma.commercialQuote.findFirst({
    where: {
      OR: [{ number: ECO0_QUOTE_NUMBER }, { subject: { contains: ECO0_MARK } }],
    },
    select: { id: true, organizationId: true, createdById: true, number: true },
  });
  if (!quote) {
    console.log("SKIP: devis ECO-0 introuvable");
    return;
  }
  const snap = await prisma.commercialQuoteSnapshot.findFirst({
    where: { quoteId: quote.id, kind: "ACCEPTED_PDF" },
    select: { id: true, storageKey: true },
  });
  if (!snap) {
    console.log("SKIP: snapshot absent");
    return;
  }
  const { ingestAcceptedQuoteSnapshot } = await import(
    "../src/lib/ged/ingest-commercial-document"
  );
  const r = await ingestAcceptedQuoteSnapshot({
    organizationId: quote.organizationId,
    quoteId: quote.id,
    snapshotId: snap.id,
    storageKey: snap.storageKey,
    addedById: quote.createdById,
  });
  console.log(`GED ${quote.number}: linked=${r.linked} reason=${r.reason ?? "ok"}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
