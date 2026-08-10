/**
 * PERF-V2A.1 — profiling runtime réel (loaders serveur, pas de contenu sensible).
 *
 * Usage:
 *   PERF_DEBUG=1 npx tsx scripts/profile-perf-v2a1.ts
 *
 * Prérequis: DATABASE_URL (démo bework-demo / Denis).
 */
process.env.PERF_DEBUG = process.env.PERF_DEBUG ?? "1";
process.env.BEWORK_PERF_LOG = process.env.BEWORK_PERF_LOG ?? "1";

import { loadScriptEnv, getScriptDatabaseUrl } from "./load-script-env";

loadScriptEnv();
const dbUrl = getScriptDatabaseUrl();
if (!dbUrl) {
  console.error("DATABASE_URL manquant — profiling impossible.");
  process.exit(1);
}
process.env.DATABASE_URL = dbUrl;

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { loadAccueilOps } = await import("../src/lib/accueil/load-accueil-ops");
  const { collectATraiter } = await import("../src/lib/a-traiter/collect");
  const { loadChantierCockpitOps } = await import("../src/lib/chantier/cockpit-ops");
  const { getBillingSnapshot } = await import("../src/lib/facturation/snapshot");
  const { loadPurchaseOrdersListView } = await import("../src/lib/purchase-orders/list-view");
  const { listInboxProjectChannelsForUser } = await import(
    "../src/lib/messagerie/project-channels"
  );
  const {
    runWithPerfContext,
    getPerfStore,
  } = await import("../src/lib/perf/server-timing");

  const demo = await prisma.demoEnvironment.findFirst({
    where: { loginIdentifier: "bework-demo" },
    select: {
      rootUserId: true,
      companyName: true,
      organizationId: true,
    },
  });
  if (!demo?.rootUserId) {
    console.error("Démo bework-demo absente — SKIP.");
    await prisma.$disconnect();
    process.exit(0);
  }

  const denis = await prisma.user.findUnique({
    where: { id: demo.rootUserId },
    select: {
      id: true,
      name: true,
      role: true,
      personType: true,
      permissionProfile: true,
      organizationMemberships: { select: { organizationId: true }, take: 1 },
    },
  });
  if (!denis) {
    console.error("Utilisateur root démo introuvable.");
    await prisma.$disconnect();
    process.exit(1);
  }

  const orgId =
    demo.organizationId ??
    denis.organizationMemberships[0]?.organizationId ??
    null;

  const project =
    (await prisma.project.findFirst({
      where: {
        organizationId: orgId ?? undefined,
        title: { contains: "Victor Hugo", mode: "insensitive" },
      },
      select: { id: true, title: true },
    })) ??
    (await prisma.project.findFirst({
      where: { organizationId: orgId ?? undefined },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    }));

  console.log("=== PERF-V2A.1 runtime ===");
  console.log(`user=${denis.name} org=${orgId ?? "?"} project=${project?.title ?? "none"}`);
  console.log("");

  type RunResult = {
    label: string;
    wallMs: number;
    queryCount: number;
    top: { model: string; action: string; ms: number }[];
    dbMs: number;
  };
  const results: RunResult[] = [];

  async function profile(label: string, fn: () => Promise<unknown>) {
    // Warm-up hors mesure.
    try {
      await fn();
    } catch (e) {
      console.warn(`[warm-up] ${label}:`, e instanceof Error ? e.message : e);
    }

    const measured = await runWithPerfContext(async () => {
      const t0 = Date.now();
      await fn();
      const wallMs = Date.now() - t0;
      const store = getPerfStore();
      const queries = store?.queries ?? [];
      const top = [...queries].sort((a, b) => b.ms - a.ms).slice(0, 5);
      const dbMs = queries.reduce((a, q) => a + q.ms, 0);
      return {
        label,
        wallMs,
        queryCount: store?.queryCount ?? 0,
        top,
        dbMs,
      };
    });
    results.push(measured);
    console.log(
      `[measure] ${label} wall=${measured.wallMs}ms queries=${measured.queryCount} dbSum=${measured.dbMs}ms`,
    );
  }

  await profile("accueil", () =>
    loadAccueilOps({
      userId: denis.id,
      role: denis.role,
      personType: denis.personType,
      permissionProfile: denis.permissionProfile,
      scope: "team",
    }),
  );

  await profile("a-traiter", () =>
    collectATraiter({
      id: denis.id,
      role: denis.role,
      personType: denis.personType,
    }),
  );

  if (project) {
    await profile("cockpit", () =>
      loadChantierCockpitOps({
        projectId: project.id,
        projectTitle: project.title,
      }),
    );
  }

  if (orgId) {
    await profile("commandes", () =>
      loadPurchaseOrdersListView({ organizationId: orgId }),
    );
  }

  await profile("facturation", () =>
    getBillingSnapshot({
      user: {
        id: denis.id,
        role: denis.role,
        personType: denis.personType,
      },
    }),
  );

  await profile("messagerie.inboxChannels", () =>
    listInboxProjectChannelsForUser(denis.id),
  );

  await profile("messagerie.recipients", async () => {
    if (!orgId) return;
    await Promise.all([
      prisma.organizationMember.findMany({
        where: { organizationId: orgId },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              personType: true,
              permissionProfile: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        where: {
          personType: { in: ["CLIENT_EXT", "SUPPLIER", "SUBCONTRACTOR"] },
          OR: [
            { externalOrganization: { hostOrganizationId: orgId } },
            {
              projectAccesses: {
                some: { project: { organizationId: orgId } },
              },
            },
          ],
        },
        select: { id: true },
        take: 80,
      }),
    ]);
  });

  console.log("\n=== RÉSUMÉ ===");
  const sorted = [...results].sort((a, b) => b.wallMs - a.wallMs);
  for (const r of sorted) {
    console.log(
      `${r.label.padEnd(28)} wall=${String(r.wallMs).padStart(5)}ms  queries=${String(r.queryCount).padStart(3)}  dbSum=${String(r.dbMs).padStart(5)}ms`,
    );
    for (const q of r.top) {
      console.log(`  · ${q.model}.${q.action} ${q.ms}ms`);
    }
  }

  console.log("\n=== TOP 3 GOULOTS (wall) ===");
  for (let i = 0; i < Math.min(3, sorted.length); i++) {
    const r = sorted[i]!;
    console.log(
      `${i + 1}. ${r.label} — ${r.wallMs}ms (queries=${r.queryCount}, dbSum=${r.dbMs}ms)`,
    );
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
