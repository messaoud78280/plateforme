/**
 * PERF-V2B — EXPLAIN PurchaseOrder + équivalence attention + profil.
 *
 * Usage:
 *   PERF_DEBUG=1 npx tsx scripts/profile-perf-v2b.ts
 */
process.env.PERF_DEBUG = process.env.PERF_DEBUG ?? "1";
process.env.BEWORK_PERF_LOG = process.env.BEWORK_PERF_LOG ?? "1";

import { loadScriptEnv, getScriptDatabaseUrl } from "./load-script-env";
import { createHash } from "node:crypto";

loadScriptEnv();
const dbUrl = getScriptDatabaseUrl();
if (!dbUrl) {
  console.error("DATABASE_URL manquant");
  process.exit(1);
}
process.env.DATABASE_URL = dbUrl;

function fingerprint(obj: unknown): string {
  return createHash("sha256").update(JSON.stringify(obj)).digest("hex").slice(0, 16);
}

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { Prisma } = await import("@prisma/client");
  const { loadAccueilOps } = await import("../src/lib/accueil/load-accueil-ops");
  const { collectATraiter } = await import("../src/lib/a-traiter/collect");
  const { loadChantierCockpitOps } = await import("../src/lib/chantier/cockpit-ops");
  const { getBillingSnapshot } = await import("../src/lib/facturation/snapshot");
  const { loadPurchaseOrdersListView } = await import("../src/lib/purchase-orders/list-view");
  const { loadPurchaseOrderAttention } = await import(
    "../src/lib/purchase-orders/attention/batch"
  );
  const { loadAttentionForSheets } = await import("../src/lib/follow-up/attention/batch");
  const { runWithPerfContext, getPerfStore } = await import("../src/lib/perf/server-timing");

  const demo = await prisma.demoEnvironment.findFirst({
    where: { loginIdentifier: "bework-demo" },
    select: { rootUserId: true, organizationId: true },
  });
  if (!demo?.rootUserId) {
    console.error("bework-demo absent — SKIP");
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
  if (!denis) process.exit(1);

  const orgId =
    demo.organizationId ?? denis.organizationMemberships[0]?.organizationId ?? null;

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

  console.log("=== PERF-V2B ===");
  console.log(`user=${denis.name} org=${orgId} project=${project?.title ?? "?"}`);

  // —— EXPLAIN PurchaseOrder (attention shape) ——
  if (orgId) {
    console.log("\n--- EXPLAIN PurchaseOrder attention ---");
    try {
      const rows = await prisma.$queryRaw<
        { "QUERY PLAN": string }[]
      >(Prisma.sql`
        EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
        SELECT po.id
        FROM "PurchaseOrder" po
        WHERE po."organizationId" = ${orgId}
          AND po.status IN (
            'A_VALIDER','VALIDEE','ENVOYEE_FOURNISSEUR','A_CONFIRMER',
            'CONFIRMEE','LIVRAISON_PROGRAMMEE','PARTIELLEMENT_RECUE','REFUSEE','RECUE'
          )
        ORDER BY po."updatedAt" DESC
        LIMIT 120
      `);
      for (const r of rows) {
        console.log(r["QUERY PLAN"]);
      }
    } catch (e) {
      console.warn("EXPLAIN failed:", e instanceof Error ? e.message : e);
    }

    console.log("\n--- EXPLAIN PurchaseOrder list (all status) ---");
    try {
      const rows = await prisma.$queryRaw<{ "QUERY PLAN": string }[]>(Prisma.sql`
        EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
        SELECT po.id
        FROM "PurchaseOrder" po
        WHERE po."organizationId" = ${orgId}
        ORDER BY po."updatedAt" DESC
        LIMIT 80
      `);
      for (const r of rows) {
        console.log(r["QUERY PLAN"]);
      }
    } catch (e) {
      console.warn("EXPLAIN list failed:", e instanceof Error ? e.message : e);
    }
  }

  // —— Équivalence attention (2 passes, même now) ——
  const now = new Date();
  if (orgId) {
    const sheets = await prisma.followUpSheet.findMany({
      where: {
        organizationId: orgId,
        status: { notIn: ["TERMINE", "ARCHIVE"] },
      },
      take: 40,
      select: {
        id: true,
        status: true,
        title: true,
        nextActionAt: true,
        nextActionDone: true,
        urgencyOverride: true,
      },
    });
    const pass1 = await loadAttentionForSheets({
      sheets: sheets.map((s) => ({
        id: s.id,
        status: s.status,
        title: s.title,
        nextActionAt: s.nextActionAt?.toISOString() ?? null,
        nextActionDone: s.nextActionDone,
        urgencyOverride: s.urgencyOverride,
      })),
      organizationId: orgId,
      now,
    });
    const pass2 = await loadAttentionForSheets({
      sheets: sheets.map((s) => ({
        id: s.id,
        status: s.status,
        title: s.title,
        nextActionAt: s.nextActionAt?.toISOString() ?? null,
        nextActionDone: s.nextActionDone,
        urgencyOverride: s.urgencyOverride,
      })),
      organizationId: orgId,
      now,
    });
    const snap = (m: typeof pass1) =>
      [...m.byId.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([id, att]) => ({
          id,
          effectiveUrgency: att.effectiveUrgency,
          computedUrgency: att.computedUrgency,
          manualUrgency: att.manualUrgency,
          primaryReason: att.primaryReason,
          codes: att.attentionItems.map((i) => i.code).sort(),
        }));
    const fp1 = fingerprint(snap(pass1));
    const fp2 = fingerprint(snap(pass2));
    console.log(`\néquivalence attention FollowUp: ${fp1 === fp2 ? "OK" : "FAIL"} fp=${fp1}`);

    const po1 = await loadPurchaseOrderAttention({ organizationId: orgId, now, take: 40 });
    const po2 = await loadPurchaseOrderAttention({ organizationId: orgId, now, take: 40 });
    const poSnap = (rows: typeof po1) =>
      rows.map((r) => ({
        id: r.id,
        effectiveUrgency: r.attention.effectiveUrgency,
        codes: r.attention.attentionItems.map((i) => i.code).sort(),
        primaryReason: r.attention.primaryReason,
      }));
    const pfp1 = fingerprint(poSnap(po1));
    const pfp2 = fingerprint(poSnap(po2));
    console.log(`équivalence attention PO: ${pfp1 === pfp2 ? "OK" : "FAIL"} fp=${pfp1}`);
  }

  type RunResult = {
    label: string;
    wallMs: number;
    queryCount: number;
    top: { model: string; action: string; ms: number }[];
    dbMs: number;
  };
  const results: RunResult[] = [];

  async function profile(label: string, fn: () => Promise<unknown>) {
    try {
      await fn();
    } catch (e) {
      console.warn(`[warm] ${label}`, e instanceof Error ? e.message : e);
    }
    const measured = await runWithPerfContext(async () => {
      const t0 = Date.now();
      await fn();
      const wallMs = Date.now() - t0;
      const store = getPerfStore();
      const queries = store?.queries ?? [];
      return {
        label,
        wallMs,
        queryCount: store?.queryCount ?? 0,
        top: [...queries].sort((a, b) => b.ms - a.ms).slice(0, 5),
        dbMs: queries.reduce((a, q) => a + q.ms, 0),
      };
    });
    results.push(measured);
    console.log(
      `[measure] ${label} wall=${measured.wallMs}ms queries=${measured.queryCount} dbSum=${measured.dbMs}ms`,
    );
  }

  console.log("\n--- Mesures parcours ---");
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
      user: { id: denis.id, role: denis.role, personType: denis.personType },
    }),
  );

  console.log("\n=== RÉSUMÉ V2B ===");
  console.log("AVANT V2A.1 (réf.): accueil~2131 q22 | a-traiter~1559 q17 | cockpit~1101 q14 | facturation~1098 q7 | commandes~615 q1");
  for (const r of [...results].sort((a, b) => b.wallMs - a.wallMs)) {
    console.log(
      `${r.label.padEnd(14)} wall=${String(r.wallMs).padStart(5)}ms queries=${String(r.queryCount).padStart(3)} dbSum=${r.dbMs}ms`,
    );
    for (const q of r.top) console.log(`  · ${q.model}.${q.action} ${q.ms}ms`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
