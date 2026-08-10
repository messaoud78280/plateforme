/**
 * Applique le mini-seed facturation V1A-lite sur bework-demo.
 * npx tsx scripts/seed-billing-anti-oubli-demo.ts
 */
import { getScriptDatabaseUrl, loadScriptEnv } from "./load-script-env";

loadScriptEnv();

async function main() {
  const url = getScriptDatabaseUrl();
  if (!url) {
    console.error("DATABASE_URL manquant");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) process.env.DATABASE_URL = url;

  const { prisma } = await import("../src/lib/prisma");
  const demo = await prisma.demoEnvironment.findFirst({
    where: { loginIdentifier: "bework-demo", status: { in: ["ACTIVE", "DISABLED"] } },
    select: { rootUserId: true, organizationId: true, loginIdentifier: true },
  });
  if (!demo?.organizationId) {
    console.error("Démo bework-demo introuvable");
    process.exit(1);
  }

  const { ensureBillingAntiOubliDemo } = await import(
    "../src/lib/demo-environment/billing-anti-oubli-demo"
  );
  const result = await ensureBillingAntiOubliDemo({
    rootUserId: demo.rootUserId,
    organizationId: demo.organizationId,
    loginIdentifier: demo.loginIdentifier,
  });
  console.log("→ mini-seed facturation:", result);

  const sheets = await prisma.followUpSheet.findMany({
    where: {
      organizationId: demo.organizationId,
      status: { in: ["A_FACTURER", "TRAVAUX_TERMINES"] },
    },
    select: { title: true, status: true, clientName: true, assignee: { select: { name: true } } },
  });
  console.log("→ fiches billing:", sheets);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
