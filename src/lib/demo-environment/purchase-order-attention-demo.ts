/**
 * CDE-3B1 — Situations démo pour le moteur d’attention commandes.
 * Pas de doublon BC-2026-043 / Victor Hugo : on enrichit 043 + crée des BC compagnons.
 */
import { prisma } from "@/lib/prisma";
import { demoPersonaEmail } from "./personas";

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 3600_000);
}

function hoursFromNow(h: number): Date {
  return new Date(Date.now() + h * 3600_000);
}

export async function ensurePurchaseOrderAttentionDemoScenarios(opts: {
  rootUserId: string;
  organizationId: string;
  loginIdentifier: string;
}): Promise<{ configured: string[] }> {
  const configured: string[] = [];
  const karimEmail = demoPersonaEmail(opts.loginIdentifier, "karim");
  const karim = await prisma.user.findUnique({
    where: { email: karimEmail },
    select: { id: true },
  });
  const responsibleId = karim?.id ?? opts.rootUserId;

  const project = await prisma.project.findFirst({
    where: {
      organizationId: opts.organizationId,
      title: { contains: "Victor Hugo" },
    },
    select: { id: true, title: true },
  });

  const pointP = await prisma.externalOrganization.findFirst({
    where: {
      hostOrganizationId: opts.organizationId,
      OR: [
        { tradeName: { contains: "POINT.P", mode: "insensitive" } },
        { name: { contains: "POINT.P", mode: "insensitive" } },
        { tradeName: { contains: "Point.P", mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, tradeName: true },
  });
  if (!pointP) return { configured };

  // A — BC-2026-043 : 30/40 reçus depuis > 48 h (si pas déjà réceptionné en live)
  const vh = await prisma.purchaseOrder.findFirst({
    where: { organizationId: opts.organizationId, number: "BC-2026-043" },
    select: {
      id: true,
      status: true,
      confirmedDeliveryAt: true,
      receipts: {
        where: { cancelledAt: null },
        select: { id: true },
        take: 1,
      },
      lines: { select: { id: true, quantity: true }, take: 1 },
    },
  });

  if (vh?.lines[0] && vh.receipts.length === 0 && vh.confirmedDeliveryAt) {
    const receivedAt = hoursAgo(60);
    await prisma.purchaseOrderReceipt.create({
      data: {
        organizationId: opts.organizationId,
        purchaseOrderId: vh.id,
        receivedAt,
        receivedById: responsibleId,
        status: "PARTIAL",
        deliveryNoteNumber: "PP-845721",
        commentShared: "Livraison partielle démo",
        lines: {
          create: [
            {
              orderLineId: vh.lines[0].id,
              receivedQty: 30,
              damagedQty: 0,
              refusedQty: 0,
            },
          ],
        },
      },
    });
    await prisma.purchaseOrderLine.update({
      where: { id: vh.lines[0].id },
      data: { receivedQty: 30 },
    });
    await prisma.purchaseOrder.update({
      where: { id: vh.id },
      data: { status: "PARTIELLEMENT_RECUE" },
    });
    await prisma.purchaseOrderEvent.create({
      data: {
        orderId: vh.id,
        kind: "receipt",
        label: "Réception partielle",
        detail: "Démo attention — 30 / 40 reçus · 10 restant à livrer",
        actorUserId: responsibleId,
      },
    });
    configured.push("BC-2026-043 PARTIAL_RECEIPT_PENDING");
  } else if (vh?.receipts.length) {
    configured.push("BC-2026-043 (réceptions existantes conservées)");
  }

  // B — BC-2026-051 : demain non confirmée
  await upsertDemoOrder({
    organizationId: opts.organizationId,
    number: "BC-2026-051",
    subject: "Bande d’étanchéité — confirmation attendue",
    projectId: project?.id ?? null,
    supplierId: pointP.id,
    requestedById: opts.rootUserId,
    responsibleId,
    status: "A_CONFIRMER",
    sharedWithSupplier: true,
    sharedAt: hoursAgo(20),
    requestedDeliveryAt: hoursFromNow(30),
    confirmedDeliveryAt: null,
    proposedDeliveryStatus: "NONE",
    line: { designation: "Bande d’étanchéité", quantity: 12, unit: "U" },
  });
  configured.push("BC-2026-051 DELIVERY_UNCONFIRMED");

  // C — BC-2026-052 : réception avec 3 endommagés
  const c = await upsertDemoOrder({
    organizationId: opts.organizationId,
    number: "BC-2026-052",
    subject: "Plots PVC — réception avec réserve",
    projectId: project?.id ?? null,
    supplierId: pointP.id,
    requestedById: opts.rootUserId,
    responsibleId,
    status: "PARTIELLEMENT_RECUE",
    sharedWithSupplier: true,
    sharedAt: hoursAgo(120),
    requestedDeliveryAt: hoursAgo(5),
    confirmedDeliveryAt: hoursAgo(4),
    proposedDeliveryStatus: "ACCEPTED",
    line: { designation: "Plot PVC réglable", quantity: 20, unit: "U" },
  });
  if (c.lineId && c.createdFresh) {
    await prisma.purchaseOrderReceipt.create({
      data: {
        organizationId: opts.organizationId,
        purchaseOrderId: c.id,
        receivedAt: hoursAgo(3),
        receivedById: responsibleId,
        status: "WITH_ISSUES",
        deliveryNoteNumber: "PP-DEMO-052",
        commentShared: "3 plots endommagés",
        lines: {
          create: [
            {
              orderLineId: c.lineId,
              receivedQty: 20,
              damagedQty: 3,
              refusedQty: 0,
              refuseReason: null,
              comment: "Coins cassés",
            },
          ],
        },
      },
    });
    await prisma.purchaseOrderLine.update({
      where: { id: c.lineId },
      data: { receivedQty: 17 },
    });
  }
  configured.push("BC-2026-052 RECEIPT_ISSUE");

  // D — BC-2026-053 : saine → NORMAL (absente de À traiter)
  await upsertDemoOrder({
    organizationId: opts.organizationId,
    number: "BC-2026-053",
    subject: "Colle EPDM — livraison planifiée",
    projectId: project?.id ?? null,
    supplierId: pointP.id,
    requestedById: opts.rootUserId,
    responsibleId,
    status: "CONFIRMEE",
    sharedWithSupplier: true,
    sharedAt: hoursAgo(72),
    requestedDeliveryAt: hoursFromNow(120),
    confirmedDeliveryAt: hoursFromNow(120),
    proposedDeliveryStatus: "ACCEPTED",
    line: { designation: "Colle EPDM", quantity: 8, unit: "U" },
  });
  configured.push("BC-2026-053 NORMAL");

  // Companion : fournisseur sans réponse > 48 h
  await upsertDemoOrder({
    organizationId: opts.organizationId,
    number: "BC-2026-054",
    subject: "Vis inox — en attente réponse fournisseur",
    projectId: project?.id ?? null,
    supplierId: pointP.id,
    requestedById: opts.rootUserId,
    responsibleId,
    status: "A_CONFIRMER",
    sharedWithSupplier: true,
    sharedAt: hoursAgo(60),
    requestedDeliveryAt: hoursFromNow(200),
    confirmedDeliveryAt: null,
    proposedDeliveryStatus: "NONE",
    line: { designation: "Vis inox 6×40", quantity: 200, unit: "U" },
  });
  configured.push("BC-2026-054 SUPPLIER_NO_RESPONSE");

  return { configured };
}

async function upsertDemoOrder(opts: {
  organizationId: string;
  number: string;
  subject: string;
  projectId: string | null;
  supplierId: string;
  requestedById: string;
  responsibleId: string;
  status: "A_CONFIRMER" | "CONFIRMEE" | "PARTIELLEMENT_RECUE";
  sharedWithSupplier: boolean;
  sharedAt: Date;
  requestedDeliveryAt: Date | null;
  confirmedDeliveryAt: Date | null;
  proposedDeliveryStatus: string;
  line: { designation: string; quantity: number; unit: string };
}): Promise<{ id: string; lineId: string | null; createdFresh: boolean }> {
  const existing = await prisma.purchaseOrder.findFirst({
    where: { organizationId: opts.organizationId, number: opts.number },
    select: {
      id: true,
      lines: { select: { id: true }, take: 1 },
      receipts: { select: { id: true }, take: 1 },
    },
  });

  if (existing) {
    await prisma.purchaseOrder.update({
      where: { id: existing.id },
      data: {
        subject: opts.subject,
        status: opts.status,
        projectId: opts.projectId,
        sharedWithSupplier: opts.sharedWithSupplier,
        requestedDeliveryAt: opts.requestedDeliveryAt,
        confirmedDeliveryAt: opts.confirmedDeliveryAt,
        proposedDeliveryStatus: opts.proposedDeliveryStatus,
        responsibleId: opts.responsibleId,
      },
    });
    const shared = await prisma.purchaseOrderEvent.findFirst({
      where: { orderId: existing.id, kind: "shared" },
      select: { id: true },
    });
    if (!shared) {
      await prisma.purchaseOrderEvent.create({
        data: {
          orderId: existing.id,
          kind: "shared",
          label: "Commande partagée fournisseur",
          detail: "Partage démo attention",
          actorUserId: opts.requestedById,
          createdAt: opts.sharedAt,
        },
      });
    } else {
      await prisma.purchaseOrderEvent.update({
        where: { id: shared.id },
        data: { createdAt: opts.sharedAt },
      });
    }
    return {
      id: existing.id,
      lineId: existing.lines[0]?.id ?? null,
      createdFresh: existing.receipts.length === 0,
    };
  }

  const created = await prisma.purchaseOrder.create({
    data: {
      organizationId: opts.organizationId,
      number: opts.number,
      status: opts.status,
      subject: opts.subject,
      projectId: opts.projectId,
      externalOrganizationId: opts.supplierId,
      requestedById: opts.requestedById,
      responsibleId: opts.responsibleId,
      sharedWithSupplier: opts.sharedWithSupplier,
      requestedDeliveryAt: opts.requestedDeliveryAt,
      confirmedDeliveryAt: opts.confirmedDeliveryAt,
      proposedDeliveryStatus: opts.proposedDeliveryStatus,
      deliveryPlaceType: "CHANTIER",
      lines: {
        create: [
          {
            designation: opts.line.designation,
            quantity: opts.line.quantity,
            unit: opts.line.unit,
            sortOrder: 0,
          },
        ],
      },
      events: {
        create: [
          {
            kind: "created",
            label: "Commande créée",
            detail: `${opts.number} — démo attention`,
            actorUserId: opts.requestedById,
            createdAt: opts.sharedAt,
          },
          {
            kind: "shared",
            label: "Commande partagée fournisseur",
            detail: "Partage démo attention",
            actorUserId: opts.requestedById,
            createdAt: opts.sharedAt,
          },
        ],
      },
    },
    select: { id: true, lines: { select: { id: true }, take: 1 } },
  });

  return {
    id: created.id,
    lineId: created.lines[0]?.id ?? null,
    createdFresh: true,
  };
}
