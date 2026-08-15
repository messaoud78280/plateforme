/**
 * RELEASE-1 — diagnostic storage privé (pas de secrets affichés).
 * npx tsx scripts/probe-storage-release1.ts
 */
import { loadScriptEnv } from "./load-script-env";

loadScriptEnv();
process.env.NODE_TLS_REJECT_UNAUTHORIZED ??= "0";

async function main() {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasService = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const hasAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  console.log(`env url=${hasUrl} service=${hasService} anon=${hasAnon}`);

  const { createServiceRoleClient } = await import("../src/lib/supabase");
  const { DOCUMENTS_BUCKET } = await import("../src/lib/storage/supabase-object");
  const supabase = createServiceRoleClient();
  if (!supabase) {
    console.log("FAIL: client service_role introuvable");
    process.exit(1);
  }

  const listed = await supabase.storage.listBuckets();
  if (listed.error) {
    console.log("FAIL listBuckets:", listed.error.message);
    process.exit(1);
  }
  const names = (listed.data ?? []).map((b) => `${b.name}:${b.public ? "public" : "private"}`);
  console.log("buckets:", names.join(", ") || "(aucun)");
  const docs = (listed.data ?? []).find((b) => b.name === DOCUMENTS_BUCKET);
  if (!docs) {
    console.log(`bucket ${DOCUMENTS_BUCKET} absent — création privée`);
    const created = await supabase.storage.createBucket(DOCUMENTS_BUCKET, {
      public: false,
      fileSizeLimit: 50 * 1024 * 1024,
    });
    if (created.error) {
      console.log("FAIL createBucket:", created.error.message);
      process.exit(1);
    }
    console.log("OK bucket documents créé (privé)");
  } else {
    console.log(`OK bucket ${DOCUMENTS_BUCKET} ${docs.public ? "PUBLIC" : "privé"}`);
    if (docs.public) {
      console.log("WARN: bucket documents est public — à durcir après livraison si possible");
    }
  }

  const probePath = `release1-probe/${Date.now()}.txt`;
  const payload = Buffer.from("bework-release1-storage-ok", "utf8");
  const up = await supabase.storage.from(DOCUMENTS_BUCKET).upload(probePath, payload, {
    contentType: "text/plain",
    upsert: false,
  });
  if (up.error) {
    console.log("FAIL upload:", up.error.message);
    process.exit(1);
  }
  const down = await supabase.storage.from(DOCUMENTS_BUCKET).download(probePath);
  if (down.error || !down.data) {
    console.log("FAIL download:", down.error?.message ?? "vide");
    process.exit(1);
  }
  const text = await down.data.text();
  if (text !== "bework-release1-storage-ok") {
    console.log("FAIL contenu différent");
    process.exit(1);
  }
  await supabase.storage.from(DOCUMENTS_BUCKET).remove([probePath]);
  console.log("OK upload → download → delete");

  const { prisma } = await import("../src/lib/prisma");
  const { ECO0_QUOTE_NUMBER, ECO0_MARK } = await import(
    "../src/lib/demo-environment/economic-scenario-guard"
  );
  const quote = await prisma.commercialQuote.findFirst({
    where: {
      OR: [{ number: ECO0_QUOTE_NUMBER }, { subject: { contains: ECO0_MARK } }],
      status: "ACCEPTED",
    },
    select: { id: true, organizationId: true, number: true, acceptedVersionId: true },
  });
  if (!quote?.acceptedVersionId) {
    console.log("SKIP snapshot : devis ECO-0 accepté introuvable");
    await prisma.$disconnect();
    return;
  }
  const existing = await prisma.commercialQuoteSnapshot.findFirst({
    where: { quoteId: quote.id, kind: "ACCEPTED_PDF" },
    select: { id: true },
  });
  if (existing) {
    console.log(`OK snapshot déjà présent (${quote.number})`);
    await prisma.$disconnect();
    return;
  }
  const { ensureAcceptedQuoteSnapshot } = await import("../src/lib/commercial/accepted-snapshot");
  try {
    const result = await ensureAcceptedQuoteSnapshot(quote.organizationId, quote.id);
    console.log(
      `OK snapshot ECO-0 créé=${result.created} size=${result.snapshot.fileSize} ms=${result.generationMs}`,
    );
  } catch (e) {
    console.log("FAIL snapshot ECO-0:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
