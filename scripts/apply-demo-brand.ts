/**
 * SETRIM-DEMO-V1.1 — applique DEMO_BRAND sur la / les démos live (idempotent).
 *
 * Usage :
 *   npm run demo:apply-brand
 *   npm run demo:apply-brand -- --login=bework-demo
 *
 * Ne reset PAS le scénario métier (chantiers, BC, messages).
 */
import { getScriptDatabaseUrl, loadScriptEnv } from "./load-script-env";

loadScriptEnv();

async function main() {
  const connectionUrl = getScriptDatabaseUrl();
  if (!connectionUrl) {
    console.error("❌ DATABASE_URL manquant (.env ou .env.local)");
    process.exit(1);
  }

  // Prisma lit DATABASE_URL ; on force l’URL script si besoin
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = connectionUrl;
  }

  const argLogin = process.argv.find((a) => a.startsWith("--login="))?.slice("--login=".length);

  const { applyDemoBrand } = await import("../src/lib/demo-environment/apply-brand");
  const { DEMO_BRAND, demoBrandContactFullName } = await import(
    "../src/lib/demo-environment/brand"
  );

  console.log("→ DEMO_BRAND :", DEMO_BRAND.companyName, "/", demoBrandContactFullName());
  if (argLogin) console.log("→ Cible loginIdentifier :", argLogin);

  const result = await applyDemoBrand({ loginIdentifier: argLogin ?? null });

  console.log(`→ Demos examinées / touchées : ${result.demosTouched}`);
  for (const d of result.demos) {
    console.log(
      `  · ${d.loginIdentifier}: ${d.companyNameBefore} → ${d.companyNameAfter} | ${d.rootNameBefore} → ${d.rootNameAfter}`,
    );
  }
  console.log("→ Changements :");
  for (const c of result.changes) {
    console.log("  -", c);
  }
  console.log("\n✓ demo:apply-brand terminé (idempotent — 2e run = no-op)");
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
