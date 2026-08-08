/**
 * Enrichit la messagerie de la démo commerciale (contacts + conversations).
 * Usage: npx tsx scripts/enrich-demo-messaging.ts
 */
import { prisma } from "../src/lib/prisma";
import { enrichExistingDemoMessaging } from "../src/lib/demo-environment/seed";

async function main() {
  const demo =
    (await prisma.demoEnvironment.findFirst({
      where: { loginIdentifier: "bework-demo", status: "ACTIVE" },
      select: { id: true, rootUserId: true, companyName: true, loginIdentifier: true },
    })) ??
    (await prisma.demoEnvironment.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: { id: true, rootUserId: true, companyName: true, loginIdentifier: true },
    }));

  if (!demo) {
    console.error("Aucune démo ACTIVE trouvée.");
    process.exit(1);
  }

  console.log("Démo:", demo.companyName, `(${demo.loginIdentifier})`);
  const result = await enrichExistingDemoMessaging(demo.rootUserId);
  console.log("Contacts staff:", result.staff.map((s) => s.name).join(", "));
  console.log("Messages directs:", result.directCount);
  console.log("Messages missions:", result.taskMessageCount);
  console.log("OK — rechargez /dashboard/messagerie (Contacts + Discussions).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
