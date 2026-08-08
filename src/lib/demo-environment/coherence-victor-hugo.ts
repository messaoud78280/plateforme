/**
 * Phase 0 — Cohérence métier Victor Hugo.
 * Une affaire (FollowUpSheet OS-4587) relie BC, livraison unique, intervention.
 * Idempotent : peut être rappelé sur démos déjà seedées.
 */
import { prisma } from "@/lib/prisma";
import { appendFollowUpTimeline } from "@/lib/follow-up/timeline";
import { demoPersonaEmail } from "./personas";

const DELIVERY_AT = new Date(2026, 7, 11, 7, 30, 0, 0); // 11 août 2026 07:30
const DELIVERY_END = new Date(2026, 7, 11, 8, 30, 0, 0);
const INTERVENTION_AT = new Date(2026, 7, 17, 8, 0, 0, 0); // 17 août 2026 08:00
const INTERVENTION_END = new Date(2026, 7, 17, 12, 0, 0, 0);

export type CoherenceResult = {
  projectId: string;
  sheetId: string;
  bcTaskId: string;
  purchaseOrderId: string | null;
  deliveryEventId: string;
  interventionEventId: string;
  avenantSheetId: string | null;
};

function isBc043(title: string) {
  return title.includes("BC-2026-043") || (title.includes("POINT.P") && title.includes("Victor Hugo"));
}

export async function ensureVictorHugoCoherence(opts: {
  rootUserId: string;
  organizationId: string;
  loginIdentifier: string;
}): Promise<CoherenceResult | null> {
  const project = await prisma.project.findFirst({
    where: {
      organizationId: opts.organizationId,
      title: { contains: "Victor Hugo" },
    },
    select: { id: true, title: true, siteAddress: true, siteCity: true },
  });
  if (!project) return null;

  const karimEmail = demoPersonaEmail(opts.loginIdentifier, "karim");
  const sophieEmail = demoPersonaEmail(opts.loginIdentifier, "sophie");
  const thomasEmail = demoPersonaEmail(opts.loginIdentifier, "thomas");
  const [karim, sophie, thomas] = await Promise.all([
    prisma.user.findUnique({ where: { email: karimEmail }, select: { id: true, name: true } }),
    prisma.user.findUnique({ where: { email: sophieEmail }, select: { id: true, name: true } }),
    prisma.user.findUnique({
      where: { email: thomasEmail },
      select: { id: true, name: true, externalOrganizationId: true },
    }),
  ]);
  const assigneeId = karim?.id ?? opts.rootUserId;

  // —— 1. Fiche principale OS-4587 ——
  let sheet = await prisma.followUpSheet.findFirst({
    where: {
      projectId: project.id,
      OR: [{ osNumber: "4587" }, { title: { contains: "Victor Hugo" } }],
      NOT: { status: "AVENANT" },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!sheet) {
    sheet = await prisma.followUpSheet.create({
      data: {
        ownerUserId: opts.rootUserId,
        createdById: opts.rootUserId,
        assigneeId,
        organizationId: opts.organizationId,
        projectId: project.id,
        title: "Résidence Victor Hugo — OS-4587",
        clientName: "ABC Promotion",
        siteAddress: "12 avenue Victor Hugo, Lyon",
        workObject: "Réfection étanchéité terrasse",
        osNumber: "4587",
        orderNumber: "BC-2026-043",
        receivedAt: new Date(2026, 7, 1),
        status: "ATTENTE_FOURNISSEUR",
        colorKey: "orange",
        nextAction: "Attendre confirmation livraison Point.P",
        nextActionAt: DELIVERY_AT,
        nextActionDone: false,
        notes: "Affaire centrale démo — une seule chaîne métier.",
      },
    });
    await appendFollowUpTimeline({
      sheetId: sheet.id,
      authorId: opts.rootUserId,
      kind: "creation",
      label: "OS-4587 reçu",
      detail: "ABC Promotion — Réfection étanchéité terrasse",
    });
  } else {
    // Ne pas écraser un statut déjà avancé (évite le conflit avec le Kanban / terrain)
    const statusLocked = new Set([
      "INTERVENTION_PREVUE",
      "EN_COURS",
      "TRAVAUX_TERMINES",
      "A_FACTURER",
      "FACTURE",
      "TERMINE",
      "AVENANT",
      "ARCHIVE",
    ]);
    sheet = await prisma.followUpSheet.update({
      where: { id: sheet.id },
      data: {
        title: "Résidence Victor Hugo — OS-4587",
        clientName: "ABC Promotion",
        workObject: sheet.workObject || "Réfection étanchéité terrasse",
        osNumber: "4587",
        orderNumber: "BC-2026-043",
        assigneeId,
        ...(statusLocked.has(sheet.status)
          ? {}
          : {
              status: "ATTENTE_FOURNISSEUR" as const,
              nextAction: "Attendre confirmation livraison Point.P",
              nextActionAt: DELIVERY_AT,
              nextActionDone: false,
              colorKey: "orange",
            }),
      },
    });
  }

  // Chronologie storytelling (idempotente) — une histoire lisible pour la démo
  const vhStory: { label: string; detail: string; at: Date; kind: string }[] = [
    {
      label: "OS reçu",
      detail: "OS-4587 — ABC Promotion",
      at: new Date(2026, 7, 8, 9, 0, 0),
      kind: "creation",
    },
    {
      label: "Intervention planifiée",
      detail: "Karim — 17 août",
      at: new Date(2026, 7, 9, 11, 0, 0),
      kind: "statut",
    },
    {
      label: "Commande fournisseur créée",
      detail: "BC-2026-043 — Point.P · 40 rouleaux membrane EPDM",
      at: new Date(2026, 7, 10, 10, 0, 0),
      kind: "commande",
    },
  ];
  for (const ev of vhStory) {
    const exists = await prisma.followUpTimelineEvent.findFirst({
      where: { sheetId: sheet.id, label: ev.label },
      select: { id: true },
    });
    if (!exists) {
      await appendFollowUpTimeline({
        sheetId: sheet.id,
        authorId: opts.rootUserId,
        kind: ev.kind,
        label: ev.label,
        detail: ev.detail,
        occurredAt: ev.at,
      });
    }
  }

  // —— 2. BC-2026-043 (Task unique liée à la fiche) ——
  let bc = await prisma.task.findFirst({
    where: {
      clientId: opts.rootUserId,
      projectId: project.id,
      OR: [{ title: { contains: "BC-2026-043" } }, { title: { contains: "POINT.P" } }],
    },
    orderBy: { createdAt: "asc" },
  });

  if (!bc) {
    bc = await prisma.task.create({
      data: {
        title: "POINT.P — Résidence Victor Hugo (BC-2026-043)",
        description:
          "Fournisseur Point.P — 40 rouleaux membrane EPDM. Livraison demandée 11 août 2026 07:30. Montant indicatif 4 260 € HT. Contact : Thomas Bernard.",
        status: "EN_ATTENTE_INFO",
        priority: "PRIORITAIRE",
        clientId: opts.rootUserId,
        organizationId: opts.organizationId,
        projectId: project.id,
        followUpSheetId: sheet.id,
        category: "Bon de commande",
        desiredDate: DELIVERY_AT,
        suppliersJson: [{ name: "Point.P", contact: "Thomas Bernard" }],
      },
    });
  } else {
    bc = await prisma.task.update({
      where: { id: bc.id },
      data: {
        title: "POINT.P — Résidence Victor Hugo (BC-2026-043)",
        followUpSheetId: sheet.id,
        projectId: project.id,
        category: "Bon de commande",
        desiredDate: DELIVERY_AT,
        suppliersJson: [{ name: "Point.P", contact: "Thomas Bernard" }],
        description:
          bc.description?.includes("40 rouleaux")
            ? bc.description
            : "Fournisseur Point.P — 40 rouleaux membrane EPDM. Livraison demandée 11 août 2026 07:30. Montant indicatif 4 260 € HT. Contact : Thomas Bernard.",
      },
    });
  }

  // Dédupliquer d’éventuels doublons BC-043 (garder le plus ancien lié)
  const bcDupes = await prisma.task.findMany({
    where: {
      clientId: opts.rootUserId,
      projectId: project.id,
      id: { not: bc.id },
      OR: [{ title: { contains: "BC-2026-043" } }, { title: { contains: "POINT.P — Résidence" } }],
    },
    select: { id: true },
  });
  // Ne pas supprimer — marquer hors scénario pour éviter perte de données
  for (const d of bcDupes) {
    await prisma.task.update({
      where: { id: d.id },
      data: {
        title: `[Doublon archivé] ${d.id.slice(0, 6)}`,
        category: "Archive démo",
        followUpSheetId: null,
      },
    });
  }

  // —— 2b. PurchaseOrder métier BC-2026-043 (CDE-1) — même vérité que la Task legacy ——
  let purchaseOrderId: string | null = null;
  let pointPId = thomas?.externalOrganizationId ?? null;
  if (!pointPId) {
    const found = await prisma.externalOrganization.findFirst({
      where: {
        hostOrganizationId: opts.organizationId,
        type: "SUPPLIER",
        OR: [
          { name: { contains: "Point.P", mode: "insensitive" } },
          { tradeName: { contains: "Point.P", mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });
    pointPId = found?.id ?? null;
  }
  if (!pointPId) {
    const created = await prisma.externalOrganization.create({
      data: {
        hostOrganizationId: opts.organizationId,
        name: "POINT.P",
        tradeName: "POINT.P",
        type: "SUPPLIER",
        activity: "Fournitures bâtiment",
        status: "ACTIVE",
      },
      select: { id: true },
    });
    pointPId = created.id;
  } else {
    await prisma.externalOrganization.update({
      where: { id: pointPId },
      data: {
        tradeName: "POINT.P",
        activity: "Fournitures bâtiment",
        status: "ACTIVE",
      },
    });
  }

  let thomasContact = await prisma.externalOrgContact.findFirst({
    where: {
      externalOrganizationId: pointPId,
      OR: [
        { lastName: { contains: "Bernard", mode: "insensitive" } },
        ...(thomas?.id ? [{ userId: thomas.id }] : []),
      ],
    },
    select: { id: true },
  });
  if (!thomasContact) {
    thomasContact = await prisma.externalOrgContact.create({
      data: {
        externalOrganizationId: pointPId,
        firstName: "Thomas",
        lastName: "Bernard",
        jobTitle: "Commercial",
        userId: thomas?.id ?? undefined,
        isPrimary: true,
      },
      select: { id: true },
    });
  }

  const deliveryAddress =
    [project.siteAddress, project.siteCity].filter(Boolean).join(", ") ||
    "12 avenue Victor Hugo, Lyon";

  let po = await prisma.purchaseOrder.findFirst({
    where: {
      organizationId: opts.organizationId,
      OR: [{ number: "BC-2026-043" }, { legacyTaskId: bc.id }],
    },
    select: { id: true },
  });

  if (!po) {
    po = await prisma.purchaseOrder.create({
      data: {
        organizationId: opts.organizationId,
        number: "BC-2026-043",
        status: "A_CONFIRMER",
        subject: "40 rouleaux membrane EPDM — Résidence Victor Hugo",
        projectId: project.id,
        followUpSheetId: sheet.id,
        externalOrganizationId: pointPId,
        contactId: thomasContact.id,
        requestedById: opts.rootUserId,
        responsibleId: karim?.id ?? opts.rootUserId,
        legacyTaskId: bc.id,
        requestedDeliveryAt: DELIVERY_AT,
        deliveryPlaceType: "CHANTIER",
        deliveryAddress,
        amountHt: 4260,
        sharedWithSupplier: true,
        proposedDeliveryStatus: "NONE",
        proposedDeliveryAt: null,
        proposedDeliveryComment: null,
        confirmedDeliveryAt: null,
        supplierRefuseReason: null,
        urgency: "IMPORTANT",
        lines: {
          create: [
            {
              designation: "Membrane EPDM",
              quantity: 40,
              unit: "U",
              unitPriceHt: 106.5,
              sortOrder: 0,
            },
          ],
        },
        events: {
          create: [
            {
              kind: "created",
              label: "Commande créée",
              detail: "BC-2026-043 — démo Victor Hugo",
              actorUserId: opts.rootUserId,
            },
            {
              kind: "shared",
              label: "Commande partagée fournisseur",
              detail: "POINT.P — Thomas Bernard",
              actorUserId: opts.rootUserId,
            },
          ],
        },
      },
      select: { id: true },
    });
  } else {
    const existingPo = await prisma.purchaseOrder.findUnique({
      where: { id: po.id },
      select: {
        status: true,
        proposedDeliveryStatus: true,
        confirmedDeliveryAt: true,
      },
    });
    // Ne pas écraser une confirmation / proposition déjà jouée en démo live
    const preserveSupplierProgress =
      existingPo?.status === "CONFIRMEE" ||
      existingPo?.status === "REFUSEE" ||
      existingPo?.proposedDeliveryStatus === "PENDING" ||
      existingPo?.proposedDeliveryStatus === "ACCEPTED" ||
      Boolean(existingPo?.confirmedDeliveryAt);

    await prisma.purchaseOrder.update({
      where: { id: po.id },
      data: {
        number: "BC-2026-043",
        ...(preserveSupplierProgress ? {} : { status: "A_CONFIRMER" as const }),
        subject: "40 rouleaux membrane EPDM — Résidence Victor Hugo",
        projectId: project.id,
        followUpSheetId: sheet.id,
        externalOrganizationId: pointPId,
        contactId: thomasContact.id,
        responsibleId: karim?.id ?? opts.rootUserId,
        legacyTaskId: bc.id,
        requestedDeliveryAt: DELIVERY_AT,
        deliveryAddress,
        sharedWithSupplier: true,
        amountHt: 4260,
        ...(preserveSupplierProgress
          ? {}
          : {
              proposedDeliveryStatus: "NONE",
              proposedDeliveryAt: null,
              proposedDeliveryComment: null,
              confirmedDeliveryAt: null,
              supplierRefuseReason: null,
            }),
      },
    });
    const lineCount = await prisma.purchaseOrderLine.count({ where: { orderId: po.id } });
    if (lineCount === 0) {
      await prisma.purchaseOrderLine.create({
        data: {
          orderId: po.id,
          designation: "Membrane EPDM",
          quantity: 40,
          unit: "U",
          unitPriceHt: 106.5,
          sortOrder: 0,
        },
      });
    }
  }
  purchaseOrderId = po.id;

  // —— 3. UNE livraison agenda liée fiche + BC ——
  let delivery = await prisma.agendaEvent.findFirst({
    where: {
      projectId: project.id,
      type: "LIVRAISON",
      OR: [{ taskId: bc.id }, { followUpSheetId: sheet.id }, { title: { contains: "membrane" } }, { title: { contains: "Point.P" } }],
      status: { not: "ANNULE" },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!delivery) {
    delivery = await prisma.agendaEvent.create({
      data: {
        title: "Livraison Point.P — membrane EPDM (BC-2026-043)",
        type: "LIVRAISON",
        status: "PLANIFIE",
        startAt: DELIVERY_AT,
        endAt: DELIVERY_END,
        location: "Résidence Victor Hugo — aire livraison",
        description: "40 rouleaux membrane EPDM — créneau demandé 07:30",
        ownerUserId: opts.rootUserId,
        createdById: opts.rootUserId,
        organizationId: opts.organizationId,
        projectId: project.id,
        followUpSheetId: sheet.id,
        taskId: bc.id,
        purchaseOrderId: purchaseOrderId ?? undefined,
      },
    });
  } else {
    delivery = await prisma.agendaEvent.update({
      where: { id: delivery.id },
      data: {
        title: "Livraison Point.P — membrane EPDM (BC-2026-043)",
        type: "LIVRAISON",
        startAt: delivery.status === "TERMINE" || delivery.status === "CONFIRME" ? delivery.startAt : DELIVERY_AT,
        endAt: delivery.status === "TERMINE" || delivery.status === "CONFIRME" ? delivery.endAt : DELIVERY_END,
        followUpSheetId: sheet.id,
        taskId: bc.id,
        projectId: project.id,
        purchaseOrderId: purchaseOrderId ?? undefined,
        location: "Résidence Victor Hugo — aire livraison",
      },
    });
  }

  // Annuler les autres livraisons membrane / Point.P du même chantier (une seule vérité)
  const otherDeliveries = await prisma.agendaEvent.findMany({
    where: {
      projectId: project.id,
      type: "LIVRAISON",
      id: { not: delivery.id },
      status: { not: "ANNULE" },
      OR: [
        { title: { contains: "membrane" } },
        { title: { contains: "Point.P" } },
        { title: { contains: "BC-2026-043" } },
        { taskId: bc.id },
        { followUpSheetId: sheet.id },
      ],
    },
    select: { id: true },
  });
  for (const o of otherDeliveries) {
    await prisma.agendaEvent.update({
      where: { id: o.id },
      data: { status: "ANNULE", description: "Doublon annulé — une seule livraison BC-2026-043." },
    });
  }

  // —— 4. UNE intervention 17 août, responsable Karim ——
  let intervention = await prisma.agendaEvent.findFirst({
    where: {
      projectId: project.id,
      type: "INTERVENTION",
      OR: [{ followUpSheetId: sheet.id }, { title: { contains: "étanchéité" } }],
      status: { not: "ANNULE" },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!intervention) {
    intervention = await prisma.agendaEvent.create({
      data: {
        title: "Intervention étanchéité — Victor Hugo",
        type: "INTERVENTION",
        status: "PLANIFIE",
        startAt: INTERVENTION_AT,
        endAt: INTERVENTION_END,
        location: "Résidence Victor Hugo — terrasse",
        ownerUserId: opts.rootUserId,
        createdById: opts.rootUserId,
        organizationId: opts.organizationId,
        projectId: project.id,
        followUpSheetId: sheet.id,
        responsibleId: assigneeId,
        description: "Responsable : Karim Benali",
      },
    });
  } else if (intervention.status !== "TERMINE") {
    intervention = await prisma.agendaEvent.update({
      where: { id: intervention.id },
      data: {
        startAt: INTERVENTION_AT,
        endAt: INTERVENTION_END,
        followUpSheetId: sheet.id,
        responsibleId: assigneeId,
        title: "Intervention étanchéité — Victor Hugo",
      },
    });
  }

  // —— 5. Avenant n°02 sur le MÊME chantier (pas République) ——
  let avenant = await prisma.followUpSheet.findFirst({
    where: {
      projectId: project.id,
      OR: [{ status: "AVENANT" }, { orderNumber: { contains: "AV-" } }, { workObject: { contains: "20 m" } }],
    },
  });
  if (!avenant) {
    avenant = await prisma.followUpSheet.create({
      data: {
        ownerUserId: opts.rootUserId,
        createdById: opts.rootUserId,
        assigneeId: opts.rootUserId,
        organizationId: opts.organizationId,
        projectId: project.id,
        title: "Avenant n°02 — Victor Hugo",
        clientName: "ABC Promotion",
        workObject: "20 m² terrasse côté cour",
        orderNumber: "AV-2026-02",
        osNumber: "4587",
        status: "AVENANT",
        colorKey: "violet",
        nextAction: "Chiffrer l’avenant n°02",
        nextActionAt: new Date(2026, 7, 20),
        nextActionDone: false,
        notes: "Source : message client Sophie Martin — à chiffrer.",
        sourceMessageKind: sophie ? "PROJECT" : null,
        sourceMessageId: null,
      },
    });
    await appendFollowUpTimeline({
      sheetId: avenant.id,
      authorId: opts.rootUserId,
      kind: "creation",
      label: "Avenant n°02 créé",
      detail: "20 m² terrasse côté cour — à chiffrer (demande client).",
    });

    // Message client sur le fil chantier si possible
    if (sophie) {
      const msg = await prisma.message.create({
        data: {
          projectId: project.id,
          senderId: sophie.id,
          receiverId: opts.rootUserId,
          content: "Pouvez-vous également reprendre les 20 m² côté cour ?",
          channel: "CLIENT",
        },
      });
      await prisma.followUpSheet.update({
        where: { id: avenant.id },
        data: { sourceMessageKind: "PROJECT", sourceMessageId: msg.id },
      });
    }
  }

  // Message système sur le fil BC (lien conversation ↔ commande)
  const hasSystem = await prisma.taskMessage.findFirst({
    where: {
      taskId: bc.id,
      kind: "SYSTEM",
      content: { contains: "Chaîne métier BeWork" },
    },
    select: { id: true },
  });
  if (!hasSystem) {
    await prisma.taskMessage.create({
      data: {
        taskId: bc.id,
        senderId: opts.rootUserId,
        receiverId: opts.rootUserId,
        content: `Chaîne métier BeWork — affaire OS-4587 · fiche ${sheet.id.slice(0, 8)} · livraison unique agenda.`,
        kind: "SYSTEM",
        isInternal: true,
      },
    });
  }

  void isBc043;

  return {
    projectId: project.id,
    sheetId: sheet.id,
    bcTaskId: bc.id,
    purchaseOrderId,
    deliveryEventId: delivery.id,
    interventionEventId: intervention.id,
    avenantSheetId: avenant?.id ?? null,
  };
}

/** Après confirmation fournisseur : upsert la livraison unique + MAJ fiche. */
export async function applySupplierDeliveryConfirm(opts: {
  rootUserId: string;
  taskId: string;
  actorUserId: string;
  actorName: string;
}) {
  const task = await prisma.task.findUnique({
    where: { id: opts.taskId },
    select: {
      id: true,
      title: true,
      description: true,
      projectId: true,
      followUpSheetId: true,
      organizationId: true,
    },
  });
  if (!task?.projectId) return null;

  let sheetId = task.followUpSheetId;
  if (!sheetId) {
    const sheet = await prisma.followUpSheet.findFirst({
      where: { projectId: task.projectId, osNumber: "4587" },
      select: { id: true },
    });
    sheetId = sheet?.id ?? null;
    if (sheetId) {
      await prisma.task.update({
        where: { id: task.id },
        data: { followUpSheetId: sheetId },
      });
    }
  }

  await prisma.task.update({
    where: { id: task.id },
    data: {
      status: "EN_ATTENTE_INFO",
      description: `${task.description ?? ""}\n\n[Démo] ${opts.actorName} a confirmé la livraison — créneau 11/08 07:30 maintenu.`.trim(),
    },
  });

  // Aligner PurchaseOrder métier (CDE-2A) — sans écraser requestedDeliveryAt
  const linkedPo = await prisma.purchaseOrder.findFirst({
    where: {
      OR: [{ legacyTaskId: task.id }, { number: "BC-2026-043", organizationId: task.organizationId ?? undefined }],
    },
    select: { id: true },
  });
  if (linkedPo) {
    await prisma.purchaseOrder.update({
      where: { id: linkedPo.id },
      data: {
        status: "CONFIRMEE",
        confirmedDeliveryAt: DELIVERY_AT,
        proposedDeliveryStatus: "NONE",
        proposedDeliveryAt: null,
        proposedDeliveryComment: null,
        sharedWithSupplier: true,
      },
    });
    await prisma.purchaseOrderEvent.create({
      data: {
        orderId: linkedPo.id,
        kind: "supplier_confirm",
        label: "Commande confirmée",
        detail: `${opts.actorName} — livraison confirmée : 11 août 07:30 (chemin démo legacy)`,
        actorUserId: opts.actorUserId,
      },
    });
  }

  let delivery = await prisma.agendaEvent.findFirst({
    where: {
      projectId: task.projectId,
      type: "LIVRAISON",
      status: { not: "ANNULE" },
      OR: [{ taskId: task.id }, ...(sheetId ? [{ followUpSheetId: sheetId }] : [])],
    },
    orderBy: { createdAt: "asc" },
  });

  if (delivery) {
    delivery = await prisma.agendaEvent.update({
      where: { id: delivery.id },
      data: {
        status: "CONFIRME",
        startAt: DELIVERY_AT,
        endAt: DELIVERY_END,
        taskId: task.id,
        followUpSheetId: sheetId,
        title: "Livraison Point.P — membrane EPDM (BC-2026-043)",
        description: `Confirmée par ${opts.actorName}`,
      },
    });
  } else {
    delivery = await prisma.agendaEvent.create({
      data: {
        title: "Livraison Point.P — membrane EPDM (BC-2026-043)",
        type: "LIVRAISON",
        status: "CONFIRME",
        startAt: DELIVERY_AT,
        endAt: DELIVERY_END,
        location: "Résidence Victor Hugo — aire livraison",
        description: `Confirmée par ${opts.actorName}`,
        ownerUserId: opts.rootUserId,
        createdById: opts.actorUserId,
        organizationId: task.organizationId,
        projectId: task.projectId,
        followUpSheetId: sheetId,
        taskId: task.id,
      },
    });
  }

  // Annuler doublons
  await prisma.agendaEvent.updateMany({
    where: {
      projectId: task.projectId,
      type: "LIVRAISON",
      id: { not: delivery.id },
      status: { not: "ANNULE" },
      OR: [{ taskId: task.id }, ...(sheetId ? [{ followUpSheetId: sheetId }] : [])],
    },
    data: { status: "ANNULE", description: "Doublon annulé après confirmation fournisseur." },
  });

  if (sheetId) {
    await prisma.followUpSheet.update({
      where: { id: sheetId },
      data: {
        status: "INTERVENTION_PREVUE",
        nextAction: "Préparer l’intervention du 17 août",
        nextActionAt: INTERVENTION_AT,
        nextActionDone: false,
        colorKey: "bleu",
      },
    });
    await appendFollowUpTimeline({
      sheetId,
      authorId: opts.actorUserId,
      kind: "fournisseur",
      label: "Livraison Point.P confirmée",
      detail: "BC-2026-043 — créneau 11/08 07:30 — une seule livraison en agenda.",
    });
  }

  await prisma.taskMessage.create({
    data: {
      taskId: task.id,
      senderId: opts.actorUserId,
      receiverId: opts.rootUserId,
      content: `✅ Livraison confirmée pour le 11/08/2026 à 07:30 — ${opts.actorName} (Point.P).`,
      kind: "SYSTEM",
    },
  });

  return { deliveryId: delivery.id, sheetId };
}

/** Travaux terminés terrain → fiche À FACTURER + intervention TERMINE. */
export async function applyTerrainTravauxTermines(opts: {
  rootUserId: string;
  projectId: string;
  actorUserId: string;
  actorName: string;
  note: string | null;
}) {
  const sheet = await prisma.followUpSheet.findFirst({
    where: {
      projectId: opts.projectId,
      OR: [{ osNumber: "4587" }, { title: { contains: "Victor Hugo" } }],
      NOT: { status: "AVENANT" },
    },
    orderBy: { createdAt: "asc" },
  });

  await prisma.agendaEvent.updateMany({
    where: {
      projectId: opts.projectId,
      type: "INTERVENTION",
      status: { not: "ANNULE" },
      ...(sheet ? { followUpSheetId: sheet.id } : {}),
    },
    data: { status: "TERMINE" },
  });

  if (sheet) {
    await prisma.followUpSheet.update({
      where: { id: sheet.id },
      data: {
        status: "A_FACTURER",
        nextAction: "Préparer la facturation",
        nextActionAt: new Date(2026, 7, 19),
        nextActionDone: false,
        colorKey: "vert",
      },
    });
    await appendFollowUpTimeline({
      sheetId: sheet.id,
      authorId: opts.actorUserId,
      kind: "terrain",
      label: "Travaux terminés",
      detail: opts.note || `${opts.actorName} — Terrasse terminée.`,
    });
    await appendFollowUpTimeline({
      sheetId: sheet.id,
      authorId: opts.actorUserId,
      kind: "action",
      label: "Prochaine action : Préparer la facturation",
      detail: "Échéance indicative 19 août — Julie / administratif.",
    });
  }

  // Message chantier CLIENT (constat partagé)
  await prisma.message
    .create({
      data: {
        projectId: opts.projectId,
        senderId: opts.actorUserId,
        receiverId: opts.rootUserId,
        content: opts.note || "Terrasse terminée. RAS.",
        channel: "CLIENT",
      },
    })
    .catch(() => null);

  return { sheetId: sheet?.id ?? null };
}
