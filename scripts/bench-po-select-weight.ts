/** Micro-bench poids select PurchaseOrder (pas de données sensibles). */
process.env.PERF_DEBUG = "1";
import { loadScriptEnv, getScriptDatabaseUrl } from "./load-script-env";
loadScriptEnv();
process.env.DATABASE_URL = getScriptDatabaseUrl();

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { purchaseOrderAttentionSelect } = await import(
    "../src/lib/purchase-orders/attention/select"
  );
  const orgId = "cmbeworkdemo001org";
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

  async function time(label: string, fn: () => Promise<unknown>) {
    const t0 = Date.now();
    const r = await fn();
    const n = Array.isArray(r) ? r.length : 0;
    console.log(`${label.padEnd(22)} ${String(Date.now() - t0).padStart(4)}ms n=${n}`);
  }

  const where = { organizationId: orgId, status: { in: [...ACTIVE] } };

  for (let i = 0; i < 2; i++) {
    console.log(i === 0 ? "warm" : "measure");
    await time("ids-only", () =>
      prisma.purchaseOrder.findMany({
        where,
        select: { id: true },
        orderBy: { updatedAt: "desc" },
        take: 120,
      }),
    );
    await time("scalars+users", () =>
      prisma.purchaseOrder.findMany({
        where,
        select: {
          id: true,
          number: true,
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
    await time("lines-only", () =>
      prisma.purchaseOrder.findMany({
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
    await time("receipts-only", () =>
      prisma.purchaseOrder.findMany({
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
    await time("events-only", () =>
      prisma.purchaseOrder.findMany({
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
    await time("full-attention", () =>
      prisma.purchaseOrder.findMany({
        where,
        select: purchaseOrderAttentionSelect,
        orderBy: { updatedAt: "desc" },
        take: 120,
      }),
    );
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
