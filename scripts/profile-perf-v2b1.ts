/**
 * PERF-V2B.1 — benches PurchaseOrder (nested vs split) + chemin critique Accueil.
 *
 * Usage: PERF_DEBUG=1 npx tsx scripts/profile-perf-v2b1.ts
 *
 * Aucune écriture métier. Pas de migration.
 */
process.env.PERF_DEBUG = process.env.PERF_DEBUG ?? "1";
process.env.BEWORK_PERF_LOG = process.env.BEWORK_PERF_LOG ?? "1";

import { loadScriptEnv, getScriptDatabaseUrl } from "./load-script-env";
import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";

loadScriptEnv();
const dbUrl = getScriptDatabaseUrl();
if (!dbUrl) {
  console.error("DATABASE_URL manquant");
  process.exit(1);
}
process.env.DATABASE_URL = dbUrl;

const ACTIVE = [
  "A_VALIDER",
  "VALIDEE",
  "ENVOYEE_FOURNISSEUR",
  "A_CONFIRMER",
  "CONFIRMEE",
  "LIVRAISON_PROGRAMMEE",
  "PARTIELLEMENT_RECUE",
  "REFUSEE",
  "RECUE",
] as const;

const RUNS = 5;

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : Math.round((s[mid - 1]! + s[mid]!) / 2);
}

function stats(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  return { min: s[0]!, median: median(s), max: s[s.length - 1]!, n: s.length };
}

function fingerprint(obj: unknown): string {
  return createHash("sha256").update(JSON.stringify(obj)).digest("hex").slice(0, 16);
}

async function main() {
  /** Client dédié bench : compte chaque SQL via $on('query'). */
  const db = new PrismaClient({
    datasourceUrl: dbUrl,
    log: [{ emit: "event", level: "query" }, { emit: "stdout", level: "error" }],
  });

  let sqlCount = 0;
  let sqlMsSum = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db as any).$on("query", (e: { duration: number }) => {
    sqlCount += 1;
    sqlMsSum += typeof e.duration === "number" ? e.duration : 0;
  });

  function resetSql() {
    sqlCount = 0;
    sqlMsSum = 0;
  }

  const orgId = "cmbeworkdemo001org";
  const where = {
    organizationId: orgId,
    status: { in: [...ACTIVE] },
  };

  const { purchaseOrderAttentionSelect } = await import(
    "../src/lib/purchase-orders/attention/select"
  );
  const {
    evaluatePurchaseOrderAttention,
    computeReceivingSnapshot,
  } = await import("../src/lib/purchase-orders/attention/evaluate");
  const { serializeAttentionResult } = await import(
    "../src/lib/follow-up/attention/evaluate"
  );

  const prismaPkg = await import("@prisma/client/package.json", {
    with: { type: "json" },
  }).catch(() => null);
  console.log("=== PERF-V2B.1 PurchaseOrder benches ===");
  console.log(`Prisma ${(prismaPkg as { default?: { version?: string } } | null)?.default?.version ?? "5.x"}`);
  console.log(`org=${orgId} runs=${RUNS} take=120`);

  // —— SQL count for ONE nested findMany ——
  resetSql();
  const nestedOnce = await db.purchaseOrder.findMany({
    where,
    select: purchaseOrderAttentionSelect,
    orderBy: { updatedAt: "desc" },
    take: 120,
  });
  console.log(
    `\n[SQL nested full] clientOps=1 sqlStatements=${sqlCount} sqlEngineMs=${sqlMsSum} rows=${nestedOnce.length}`,
  );

  type BenchFn = () => Promise<unknown>;
  async function bench(label: string, fn: BenchFn) {
    // warm
    await fn();
    const walls: number[] = [];
    const sqls: number[] = [];
    for (let i = 0; i < RUNS; i++) {
      resetSql();
      const t0 = Date.now();
      await fn();
      walls.push(Date.now() - t0);
      sqls.push(sqlCount);
    }
    const w = stats(walls);
    const q = stats(sqls);
    console.log(
      `${label.padEnd(28)} wall min/med/max=${w.min}/${w.median}/${w.max}ms  sql/run med=${q.median}`,
    );
    return { label, walls, sqls, w, q };
  }

  console.log("\n--- Projections ---");
  await bench("A full-nested", () =>
    db.purchaseOrder.findMany({
      where,
      select: purchaseOrderAttentionSelect,
      orderBy: { updatedAt: "desc" },
      take: 120,
    }),
  );
  await bench("B scalars-only", () =>
    db.purchaseOrder.findMany({
      where,
      select: {
        id: true,
        number: true,
        subject: true,
        status: true,
        sharedWithSupplier: true,
        requestedDeliveryAt: true,
        confirmedDeliveryAt: true,
        proposedDeliveryAt: true,
        proposedDeliveryStatus: true,
        supplierRefuseReason: true,
        responsibleId: true,
        requestedById: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 120,
    }),
  );
  await bench("C identity", () =>
    db.purchaseOrder.findMany({
      where,
      select: {
        id: true,
        number: true,
        subject: true,
        status: true,
        sharedWithSupplier: true,
        requestedDeliveryAt: true,
        confirmedDeliveryAt: true,
        proposedDeliveryAt: true,
        proposedDeliveryStatus: true,
        supplierRefuseReason: true,
        responsibleId: true,
        requestedById: true,
        project: { select: { id: true, title: true } },
        externalOrganization: { select: { name: true, tradeName: true } },
        responsible: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 120,
    }),
  );
  await bench("D +lines", () =>
    db.purchaseOrder.findMany({
      where,
      select: {
        id: true,
        lines: {
          select: { id: true, designation: true, unit: true, quantity: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 120,
    }),
  );
  await bench("E +receipts", () =>
    db.purchaseOrder.findMany({
      where,
      select: {
        id: true,
        receipts: {
          where: { cancelledAt: null },
          select: {
            id: true,
            receivedAt: true,
            cancelledAt: true,
            status: true,
            deliveryNoteNumber: true,
            documents: { where: { kind: "BL" }, select: { id: true }, take: 1 },
            lines: {
              select: {
                orderLineId: true,
                receivedQty: true,
                damagedQty: true,
                refusedQty: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 120,
    }),
  );
  await bench("F +events", () =>
    db.purchaseOrder.findMany({
      where,
      select: {
        id: true,
        events: {
          where: {
            kind: { in: ["shared", "supplier_propose", "supplier_refuse"] },
          },
          orderBy: { createdAt: "desc" },
          take: 6,
          select: { id: true, kind: true, createdAt: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 120,
    }),
  );
  await bench("G +agenda", () =>
    db.purchaseOrder.findMany({
      where,
      select: {
        id: true,
        agendaEvents: {
          where: { type: "LIVRAISON", status: { not: "ANNULE" } },
          take: 1,
          select: { id: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 120,
    }),
  );

  // —— Split: parent light + parallel batch relations ——
  async function loadSplit() {
    const parents = await db.purchaseOrder.findMany({
      where,
      select: {
        id: true,
        number: true,
        subject: true,
        status: true,
        sharedWithSupplier: true,
        requestedDeliveryAt: true,
        confirmedDeliveryAt: true,
        proposedDeliveryAt: true,
        proposedDeliveryStatus: true,
        supplierRefuseReason: true,
        responsibleId: true,
        requestedById: true,
        project: { select: { id: true, title: true } },
        externalOrganization: { select: { name: true, tradeName: true } },
        responsible: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 120,
    });
    const ids = parents.map((p) => p.id);
    if (ids.length === 0) return { parents, lines: [], receipts: [], events: [], agenda: [] };

    const [lines, receipts, events, agenda] = await Promise.all([
      db.purchaseOrderLine.findMany({
        where: { orderId: { in: ids } },
        select: {
          id: true,
          orderId: true,
          designation: true,
          unit: true,
          quantity: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      }),
      db.purchaseOrderReceipt.findMany({
        where: { purchaseOrderId: { in: ids }, cancelledAt: null },
        select: {
          id: true,
          purchaseOrderId: true,
          receivedAt: true,
          cancelledAt: true,
          status: true,
          deliveryNoteNumber: true,
          documents: { where: { kind: "BL" }, select: { id: true }, take: 1 },
          lines: {
            select: {
              orderLineId: true,
              receivedQty: true,
              damagedQty: true,
              refusedQty: true,
            },
          },
        },
      }),
      db.purchaseOrderEvent.findMany({
        where: {
          orderId: { in: ids },
          kind: { in: ["shared", "supplier_propose", "supplier_refuse"] },
        },
        orderBy: { createdAt: "desc" },
        select: { id: true, orderId: true, kind: true, createdAt: true },
      }),
      db.agendaEvent.findMany({
        where: {
          purchaseOrderId: { in: ids },
          type: "LIVRAISON",
          status: { not: "ANNULE" },
        },
        select: { id: true, purchaseOrderId: true },
      }),
    ]);
    return { parents, lines, receipts, events, agenda };
  }

  console.log("\n--- Nested vs Split ---");
  const nestedStats = await bench("NESTED full", () =>
    db.purchaseOrder.findMany({
      where,
      select: purchaseOrderAttentionSelect,
      orderBy: { updatedAt: "desc" },
      take: 120,
    }),
  );
  const splitStats = await bench("SPLIT parent+batch", () => loadSplit());

  // —— Équivalence attention nested vs split (même now) ——
  const now = new Date();
  const nestedRows = await db.purchaseOrder.findMany({
    where,
    select: purchaseOrderAttentionSelect,
    orderBy: { updatedAt: "desc" },
    take: 120,
  });
  const split = await loadSplit();

  function nestedAttentionFp() {
    return fingerprint(
      nestedRows.map((o) => {
        const receiptLines = o.receipts.flatMap((r) =>
          r.lines.map((l) => ({
            orderLineId: l.orderLineId,
            receivedQty: Number(l.receivedQty),
            damagedQty: Number(l.damagedQty),
            refusedQty: Number(l.refusedQty),
            receiptId: r.id,
          })),
        );
        const sharedEv = o.events.find((e) => e.kind === "shared");
        const proposeEv = o.events.find((e) => e.kind === "supplier_propose");
        const refuseEv = o.events.find((e) => e.kind === "supplier_refuse");
        const input = {
          id: o.id,
          number: o.number,
          status: o.status,
          subject: o.subject,
          sharedWithSupplier: o.sharedWithSupplier,
          sharedWithSupplierAt: sharedEv?.createdAt ?? null,
          sharedEventId: sharedEv?.id ?? null,
          proposeEventId: proposeEv?.id ?? null,
          refuseEventId: refuseEv?.id ?? null,
          requestedDeliveryAt: o.requestedDeliveryAt,
          confirmedDeliveryAt: o.confirmedDeliveryAt,
          proposedDeliveryAt: o.proposedDeliveryAt,
          proposedDeliveryStatus: o.proposedDeliveryStatus,
          supplierRefuseReason: o.supplierRefuseReason,
          supplierName:
            o.externalOrganization.tradeName || o.externalOrganization.name,
          projectTitle: o.project?.title ?? null,
          responsibleId: o.responsibleId,
          responsibleName: o.responsible?.name ?? null,
          requestedById: o.requestedById,
          requestedByName: o.requestedBy?.name ?? null,
          lines: o.lines.map((l) => ({
            id: l.id,
            designation: l.designation,
            unit: l.unit,
            quantity: Number(l.quantity),
          })),
          receipts: o.receipts.map((r) => ({
            id: r.id,
            receivedAt: r.receivedAt,
            cancelledAt: r.cancelledAt,
            status: r.status,
            deliveryNoteNumber: r.deliveryNoteNumber,
            hasBlDocument: r.documents.length > 0,
          })),
          receiptLines,
          agendaEventId: o.agendaEvents[0]?.id ?? null,
        };
        const att = serializeAttentionResult(
          evaluatePurchaseOrderAttention(input, { now }),
        );
        const snap = computeReceivingSnapshot(input);
        return {
          id: o.id,
          urgency: att.effectiveUrgency,
          codes: att.attentionItems.map((i) => i.code).sort(),
          reason: att.primaryReason,
          recv: {
            ordered: snap.totalOrdered,
            received: snap.totalReceivedConforming,
            issues: snap.hasIssues,
            fully: snap.fullyReceived,
          },
        };
      }),
    );
  }

  function splitAttentionFp() {
    const linesBy = new Map<string, typeof split.lines>();
    for (const l of split.lines) {
      const arr = linesBy.get(l.orderId) ?? [];
      arr.push(l);
      linesBy.set(l.orderId, arr);
    }
    const receiptsBy = new Map<string, typeof split.receipts>();
    for (const r of split.receipts) {
      const arr = receiptsBy.get(r.purchaseOrderId) ?? [];
      arr.push(r);
      receiptsBy.set(r.purchaseOrderId, arr);
    }
    const eventsBy = new Map<string, typeof split.events>();
    for (const e of split.events) {
      const arr = eventsBy.get(e.orderId) ?? [];
      arr.push(e);
      eventsBy.set(e.orderId, arr);
    }
    const agendaBy = new Map<string, string>();
    for (const a of split.agenda) {
      if (a.purchaseOrderId && !agendaBy.has(a.purchaseOrderId)) {
        agendaBy.set(a.purchaseOrderId, a.id);
      }
    }

    return fingerprint(
      split.parents.map((o) => {
        const lines = (linesBy.get(o.id) ?? []).sort(
          (a, b) => a.sortOrder - b.sortOrder,
        );
        const receipts = receiptsBy.get(o.id) ?? [];
        const events = (eventsBy.get(o.id) ?? []).sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );
        const receiptLines = receipts.flatMap((r) =>
          r.lines.map((l) => ({
            orderLineId: l.orderLineId,
            receivedQty: Number(l.receivedQty),
            damagedQty: Number(l.damagedQty),
            refusedQty: Number(l.refusedQty),
            receiptId: r.id,
          })),
        );
        const sharedEv = events.find((e) => e.kind === "shared");
        const proposeEv = events.find((e) => e.kind === "supplier_propose");
        const refuseEv = events.find((e) => e.kind === "supplier_refuse");
        const input = {
          id: o.id,
          number: o.number,
          status: o.status,
          subject: o.subject,
          sharedWithSupplier: o.sharedWithSupplier,
          sharedWithSupplierAt: sharedEv?.createdAt ?? null,
          sharedEventId: sharedEv?.id ?? null,
          proposeEventId: proposeEv?.id ?? null,
          refuseEventId: refuseEv?.id ?? null,
          requestedDeliveryAt: o.requestedDeliveryAt,
          confirmedDeliveryAt: o.confirmedDeliveryAt,
          proposedDeliveryAt: o.proposedDeliveryAt,
          proposedDeliveryStatus: o.proposedDeliveryStatus,
          supplierRefuseReason: o.supplierRefuseReason,
          supplierName:
            o.externalOrganization.tradeName || o.externalOrganization.name,
          projectTitle: o.project?.title ?? null,
          responsibleId: o.responsibleId,
          responsibleName: o.responsible?.name ?? null,
          requestedById: o.requestedById,
          requestedByName: o.requestedBy?.name ?? null,
          lines: lines.map((l) => ({
            id: l.id,
            designation: l.designation,
            unit: l.unit,
            quantity: Number(l.quantity),
          })),
          receipts: receipts.map((r) => ({
            id: r.id,
            receivedAt: r.receivedAt,
            cancelledAt: r.cancelledAt,
            status: r.status,
            deliveryNoteNumber: r.deliveryNoteNumber,
            hasBlDocument: r.documents.length > 0,
          })),
          receiptLines,
          agendaEventId: agendaBy.get(o.id) ?? null,
        };
        const att = serializeAttentionResult(
          evaluatePurchaseOrderAttention(input, { now }),
        );
        const snap = computeReceivingSnapshot(input);
        return {
          id: o.id,
          urgency: att.effectiveUrgency,
          codes: att.attentionItems.map((i) => i.code).sort(),
          reason: att.primaryReason,
          recv: {
            ordered: snap.totalOrdered,
            received: snap.totalReceivedConforming,
            issues: snap.hasIssues,
            fully: snap.fullyReceived,
          },
        };
      }),
    );
  }

  const fpN = nestedAttentionFp();
  const fpS = splitAttentionFp();
  console.log(
    `\néquivalence nested↔split: ${fpN === fpS ? "OK" : "FAIL"} nested=${fpN} split=${fpS}`,
  );

  const nestedMed = nestedStats.w.median;
  const splitMed = splitStats.w.median;
  const splitWins = splitMed < nestedMed * 0.85; // gain clair ≥15%
  console.log(
    `\nDÉCISION: nested med=${nestedMed}ms split med=${splitMed}ms → ${
      splitWins ? "ADOPTER SPLIT" : "CONSERVER NESTED"
    }`,
  );

  // —— RTT baseline ——
  console.log("\n--- RTT / query légère ---");
  const rtt: number[] = [];
  for (let i = 0; i < 8; i++) {
    const t0 = Date.now();
    await db.$queryRaw`SELECT 1`;
    rtt.push(Date.now() - t0);
  }
  const rttS = stats(rtt.slice(1)); // drop cold
  console.log(`SELECT 1 wall min/med/max=${rttS.min}/${rttS.median}/${rttS.max}ms`);

  // —— Connexion ——
  const url = dbUrl;
  const host = (() => {
    try {
      return new URL(url.replace(/^postgresql:/, "http:")).hostname;
    } catch {
      return "?";
    }
  })();
  const isPooler = /pooler\.supabase|pgbouncer=true|:6543/.test(url);
  console.log(`\nDB host=${host} pooler=${isPooler}`);

  await db.$disconnect();

  // —— Accueil critical path (app prisma + spans) ——
  console.log("\n=== Chemin critique Accueil / À traiter ===");
  const { prisma } = await import("../src/lib/prisma");
  const { loadAccueilOps } = await import("../src/lib/accueil/load-accueil-ops");
  const { collectATraiter } = await import("../src/lib/a-traiter/collect");
  const { projectWhereForClientUser } = await import(
    "../src/lib/organization/access"
  );
  const { previewATraiterForHome } = await import("../src/lib/a-traiter/collect");
  const { runWithPerfContext, getPerfStore } = await import(
    "../src/lib/perf/server-timing"
  );

  const demo = await prisma.demoEnvironment.findFirst({
    where: { loginIdentifier: "bework-demo" },
    select: { rootUserId: true },
  });
  const denis = demo
    ? await prisma.user.findUnique({
        where: { id: demo.rootUserId },
        select: {
          id: true,
          name: true,
          role: true,
          personType: true,
          permissionProfile: true,
        },
      })
    : null;

  if (!denis) {
    console.log("Denis absent — skip parcours");
    await prisma.$disconnect();
    return;
  }

  // Timeline manuelle Accueil (branches marquées)
  type Mark = { t: number; label: string };
  async function timelineAccueil() {
    const marks: Mark[] = [];
    const t0 = Date.now();
    const mark = (label: string) => marks.push({ t: Date.now() - t0, label });

    mark("start");
    const pwP = projectWhereForClientUser(denis.id).then((w) => {
      mark("projectWhere.done");
      return w;
    });
    // Expérimental : démarrer attention SANS attendre projectWhere
    const attP = previewATraiterForHome(
      { id: denis.id, role: denis.role, personType: denis.personType },
      { mineOnly: false },
    ).then((r) => {
      mark("attention.done");
      return r;
    });

    const projectWhere = await pwP;
    mark("after.projectWhere.await");

    const day0 = new Date();
    day0.setHours(0, 0, 0, 0);
    const day1 = new Date();
    day1.setHours(23, 59, 59, 999);

    const rest = Promise.all([
      prisma.project
        .findMany({
          where: projectWhere,
          select: { id: true },
          take: 20,
          orderBy: { updatedAt: "desc" },
        })
        .then(() => mark("projects.done")),
      prisma.agendaEvent
        .findMany({
          where: {
            project: projectWhere,
            status: { not: "ANNULE" },
            startAt: { gte: day0, lte: day1 },
          },
          take: 6,
          select: { id: true },
        })
        .then(() => mark("agendaToday.done")),
      prisma.purchaseOrder
        .findMany({
          where: { project: projectWhere, status: { in: [...ACTIVE] } },
          take: 12,
          orderBy: { updatedAt: "desc" },
          select: { id: true, number: true, status: true },
        })
        .then(() => mark("ordersUi.done")),
      prisma.task
        .findMany({
          where: { project: projectWhere, status: { not: "COMPLETE" } },
          take: 12,
          select: { id: true },
        })
        .then(() => mark("tasks.done")),
    ]);

    await Promise.all([attP, rest]);
    mark("page.ready");
    return marks;
  }

  // Warm + 5 runs timeline
  await timelineAccueil();
  const readyTimes: number[] = [];
  let lastMarks: Mark[] = [];
  for (let i = 0; i < RUNS; i++) {
    lastMarks = await timelineAccueil();
    readyTimes.push(lastMarks[lastMarks.length - 1]!.t);
  }
  console.log("\nTimeline Accueil (dernier run):");
  for (const m of lastMarks) {
    console.log(`  ${String(m.t).padStart(5)}ms  ${m.label}`);
  }
  const readyS = stats(readyTimes);
  console.log(
    `accueil.experimental.ready min/med/max=${readyS.min}/${readyS.median}/${readyS.max}ms`,
  );

  // Baseline loadAccueilOps vs experimental overlap (médiane 5)
  async function medProfile(label: string, fn: () => Promise<unknown>) {
    await fn();
    const walls: number[] = [];
    for (let i = 0; i < RUNS; i++) {
      const measured = await runWithPerfContext(async () => {
        const t0 = Date.now();
        await fn();
        return Date.now() - t0;
      });
      walls.push(measured);
    }
    const s = stats(walls);
    console.log(
      `${label.padEnd(28)} wall min/med/max=${s.min}/${s.median}/${s.max}ms`,
    );
    return s;
  }

  console.log("\n--- Parcours (médiane 5) ---");
  await medProfile("accueil.current", () =>
    loadAccueilOps({
      userId: denis.id,
      role: denis.role,
      personType: denis.personType,
      permissionProfile: denis.permissionProfile,
      scope: "team",
    }),
  );
  await medProfile("a-traiter.current", () =>
    collectATraiter({
      id: denis.id,
      role: denis.role,
      personType: denis.personType,
    }),
  );

  // Coût projectWhere seul
  await medProfile("projectWhere.only", () =>
    projectWhereForClientUser(denis.id),
  );

  console.log("\n=== VERDICT V2B.1 (bench) ===");
  console.log(
    `PO nested med=${nestedMed}ms | split med=${splitMed}ms | adoptSplit=${splitWins}`,
  );
  console.log(
    `RTT SELECT1 med=${rttS.median}ms | pooler=${isPooler} | host=${host}`,
  );
  console.log(
    `Accueil: démarrer attention en parallèle de projectWhere = gain potentiel ~projectWhere`,
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
