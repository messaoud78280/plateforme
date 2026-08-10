/** Mesures médiane post Accueil parallel — PERF-V2B.1 */
process.env.PERF_DEBUG = "1";
import { loadScriptEnv, getScriptDatabaseUrl } from "./load-script-env";
loadScriptEnv();
process.env.DATABASE_URL = getScriptDatabaseUrl();

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : Math.round((s[m - 1]! + s[m]!) / 2);
}
function stats(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  return { min: s[0]!, median: median(s), max: s[s.length - 1]! };
}

async function main() {
  const { loadAccueilOps } = await import("../src/lib/accueil/load-accueil-ops");
  const { collectATraiter } = await import("../src/lib/a-traiter/collect");
  const { loadChantierCockpitOps } = await import("../src/lib/chantier/cockpit-ops");
  const { getBillingSnapshot } = await import("../src/lib/facturation/snapshot");
  const { loadPurchaseOrdersListView } = await import(
    "../src/lib/purchase-orders/list-view"
  );
  const { prisma } = await import("../src/lib/prisma");

  const demo = await prisma.demoEnvironment.findFirst({
    where: { loginIdentifier: "bework-demo" },
    select: { rootUserId: true, organizationId: true },
  });
  if (!demo) process.exit(0);
  const denis = await prisma.user.findUnique({
    where: { id: demo.rootUserId },
    select: {
      id: true,
      role: true,
      personType: true,
      permissionProfile: true,
      organizationMemberships: { select: { organizationId: true }, take: 1 },
    },
  });
  if (!denis) process.exit(1);
  const orgId =
    demo.organizationId ?? denis.organizationMemberships[0]?.organizationId;
  const project = await prisma.project.findFirst({
    where: {
      organizationId: orgId ?? undefined,
      title: { contains: "Victor Hugo", mode: "insensitive" },
    },
    select: { id: true, title: true },
  });

  async function med(label: string, fn: () => Promise<unknown>) {
    await fn();
    const walls: number[] = [];
    for (let i = 0; i < 5; i++) {
      const t0 = Date.now();
      await fn();
      walls.push(Date.now() - t0);
    }
    const s = stats(walls);
    console.log(`${label.padEnd(16)} min/med/max=${s.min}/${s.median}/${s.max}ms`);
  }

  await med("accueil", () =>
    loadAccueilOps({
      userId: denis.id,
      role: denis.role,
      personType: denis.personType,
      permissionProfile: denis.permissionProfile,
      scope: "team",
    }),
  );
  await med("a-traiter", () =>
    collectATraiter({
      id: denis.id,
      role: denis.role,
      personType: denis.personType,
    }),
  );
  if (project) {
    await med("cockpit", () =>
      loadChantierCockpitOps({
        projectId: project.id,
        projectTitle: project.title,
      }),
    );
  }
  if (orgId) {
    await med("commandes", () =>
      loadPurchaseOrdersListView({ organizationId: orgId }),
    );
  }
  await med("facturation", () =>
    getBillingSnapshot({
      user: {
        id: denis.id,
        role: denis.role,
        personType: denis.personType,
      },
    }),
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
