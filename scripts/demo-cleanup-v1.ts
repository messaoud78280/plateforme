/**
 * DEMO-CLEANUP-V1 — purge inbox legacy + assure personas (dont Julie).
 * Ne touche que les DemoEnvironment (jamais un tenant réel hors démo).
 *
 * Usage: npx tsx scripts/demo-cleanup-v1.ts
 */
import { prisma } from "../src/lib/prisma";
import { purgeAllDemoLegacyInboxes } from "../src/lib/demo-environment/cleanup-legacy-inbox";
import { seedDemoPersonaUsers, listDemoPersonaUsers } from "../src/lib/demo-environment/seed-personas";
import { DEMO_PERSONA_KEYS } from "../src/lib/demo-environment/personas";

async function main() {
  const demos = await prisma.demoEnvironment.findMany({
    where: { status: { not: "ARCHIVED" } },
    select: {
      id: true,
      companyName: true,
      loginIdentifier: true,
      rootUserId: true,
      organizationId: true,
      seedVersion: true,
    },
  });

  console.log(`[demo-cleanup] ${demos.length} environnement(s) démo`);

  for (const demo of demos) {
    if (!demo.organizationId) {
      console.log(`- skip ${demo.companyName} (pas d’org)`);
      continue;
    }
    console.log(`- enrich personas: ${demo.companyName} (${demo.loginIdentifier})`);
    await seedDemoPersonaUsers({
      rootUserId: demo.rootUserId,
      organizationId: demo.organizationId,
      loginIdentifier: demo.loginIdentifier,
      companyName: demo.companyName,
    });
    const personas = await listDemoPersonaUsers({
      rootUserId: demo.rootUserId,
      loginIdentifier: demo.loginIdentifier,
    });
    console.log(
      `  personas: ${personas.map((p) => p.key).join(", ")} (${personas.length}/${DEMO_PERSONA_KEYS.length})`,
    );
    await prisma.demoEnvironment.update({
      where: { id: demo.id },
      data: { seedVersion: "v4-demo-cleanup" },
    });
  }

  const cleaned = await purgeAllDemoLegacyInboxes();
  for (const r of cleaned) {
    console.log(
      `- inbox ${r.companyName}: alerts=${r.alertsDeleted} notifs=${r.notificationsDeleted} users=${r.userCount}`,
    );
  }

  console.log("[demo-cleanup] OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
