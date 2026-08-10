/**
 * Phase 0 — Cohérence métier Les Lilas (SETRIM démo).
 * Une affaire (FollowUpSheet OS-4587) relie BC, livraison unique, intervention.
 * Idempotent : peut être rappelé sur démos déjà seedées.
 */
import { prisma } from "@/lib/prisma";
import { appendFollowUpTimeline } from "@/lib/follow-up/timeline";
import { syncPurchaseOrderDeliveryEvent } from "@/lib/purchase-orders/sync-delivery";
import { demoPersonaEmail } from "./personas";
import {
  DEMO_SCENARIO,
  demoPrimarySheetTitle,
  demoProjectTitleWhere,
  isDemoPrimaryOrderTitle,
} from "./scenario";

/** Heures Europe/Paris explicites — évite 07:30 UTC → 09:30 affiché sur serveur UTC. */
const DELIVERY_AT = new Date("2026-08-11T07:30:00+02:00");
const DELIVERY_END = new Date("2026-08-11T08:30:00+02:00");
const INTERVENTION_AT = new Date("2026-08-17T08:00:00+02:00");
const INTERVENTION_END = new Date("2026-08-17T12:00:00+02:00");

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
  return isDemoPrimaryOrderTitle(title);
}

export async function ensureVictorHugoCoherence(opts: {
  rootUserId: string;
  organizationId: string;
  loginIdentifier: string;
}): Promise<CoherenceResult | null> {
  const project = await prisma.project.findFirst({
    where: {
      organizationId: opts.organizationId,
      ...demoProjectTitleWhere("primary"),
    },
    select: { id: true, title: true, siteAddress: true, siteCity: true },
  });
  if (!project) return null;

  const karimEmail = demoPersonaEmail(opts.loginIdentifier, "karim");
  const sophieEmail = demoPersonaEmail(opts.loginIdentifier, "sophie");
  const thomasEmail = demoPersonaEmail(opts.loginIdentifier, "thomas");
  const [karim, sophie, thomas] = await Promise.all([
    prisma.user.findUnique({
      where: { email: karimEmail },
      select: { id: true, name: true, personType: true },
    }),
    prisma.user.findUnique({ where: { email: sophieEmail }, select: { id: true, name: true } }),
    prisma.user.findUnique({
      where: { email: thomasEmail },
      select: { id: true, name: true, externalOrganizationId: true },
    }),
  ]);

  // CHANTIERS-V2B — responsable = Karim (INTERNAL), jamais Sophie CLIENT_EXT
  if (karim && (karim.personType === "INTERNAL" || !karim.personType)) {
    await prisma.project.update({
      where: { id: project.id },
      data: {
        assignedToId: karim.id,
        internalManager: karim.name ?? "Karim Benali",
      },
    });
  } else {
    // Si assignedTo pointe encore vers un CLIENT_EXT → retirer
    const current = await prisma.project.findUnique({
      where: { id: project.id },
      select: {
        assignedTo: { select: { id: true, personType: true, name: true } },
      },
    });
    if (current?.assignedTo?.personType === "CLIENT_EXT") {
      await prisma.project.update({
        where: { id: project.id },
        data: {
          assignedToId: null,
          internalManager: karim?.name ?? "Karim Benali",
        },
      });
    }
  }

  const assigneeId = karim?.id ?? opts.rootUserId;

  // —— 1. Fiche principale OS-4587 ——
  let sheet = await prisma.followUpSheet.findFirst({
    where: {
      projectId: project.id,
      OR: [
        { osNumber: DEMO_SCENARIO.osNumber },
        { title: { contains: DEMO_SCENARIO.projects.primary.matchToken } },
        { title: { contains: "Victor Hugo" } },
      ],
      NOT: { status: "AVENANT" },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!sheet) {
    const siteFull = `${DEMO_SCENARIO.projects.primary.siteAddress}, ${DEMO_SCENARIO.projects.primary.siteCity}`;
    sheet = await prisma.followUpSheet.create({
      data: {
        ownerUserId: opts.rootUserId,
        createdById: opts.rootUserId,
        assigneeId,
        organizationId: opts.organizationId,
        projectId: project.id,
        title: demoPrimarySheetTitle(),
        clientName: DEMO_SCENARIO.client.name,
        siteAddress: siteFull,
        workObject: DEMO_SCENARIO.projects.primary.workObject,
        osNumber: DEMO_SCENARIO.osNumber,
        orderNumber: DEMO_SCENARIO.orderNumber,
        receivedAt: new Date(2026, 7, 1),
        status: "ATTENTE_FOURNISSEUR",
        colorKey: "orange",
        nextAction: `Attendre confirmation livraison ${DEMO_SCENARIO.supplierName}`,
        nextActionAt: DELIVERY_AT,
        nextActionDone: false,
        notes: "Affaire centrale démo — une seule chaîne métier.",
      },
    });
    await appendFollowUpTimeline({
      sheetId: sheet.id,
      authorId: opts.rootUserId,
      kind: "creation",
      label: `OS-${DEMO_SCENARIO.osNumber} reçu`,
      detail: `${DEMO_SCENARIO.client.name} — ${DEMO_SCENARIO.projects.primary.workObject}`,
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
        title: demoPrimarySheetTitle(),
        clientName: DEMO_SCENARIO.client.name,
        workObject: sheet.workObject || DEMO_SCENARIO.projects.primary.workObject,
        osNumber: DEMO_SCENARIO.osNumber,
        orderNumber: DEMO_SCENARIO.orderNumber,
        assigneeId,
        ...(statusLocked.has(sheet.status)
          ? {}
          : {
              status: "ATTENTE_FOURNISSEUR" as const,
              nextAction: `Attendre confirmation livraison ${DEMO_SCENARIO.supplierName}`,
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
      detail: "OS-4587 — Syndic Horizon Copro",
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
      detail: "BC-2026-043 — Point.P · 40 rouleaux membrane bitume autoprotégée",
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
        title: "POINT.P — Résidence Les Lilas (BC-2026-043)",
        description:
          "Fournisseur Point.P — 40 rouleaux membrane bitume autoprotégée. Livraison demandée 11 août 2026 07:30. Montant indicatif 4 260 € HT. Contact : Thomas Bernard.",
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
        title: "POINT.P — Résidence Les Lilas (BC-2026-043)",
        followUpSheetId: sheet.id,
        projectId: project.id,
        category: "Bon de commande",
        desiredDate: DELIVERY_AT,
        suppliersJson: [{ name: "Point.P", contact: "Thomas Bernard" }],
        description:
          bc.description?.includes("40 rouleaux")
            ? bc.description
            : "Fournisseur Point.P — 40 rouleaux membrane bitume autoprotégée. Livraison demandée 11 août 2026 07:30. Montant indicatif 4 260 € HT. Contact : Thomas Bernard.",
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
    "18 rue des Lilas, Aubervilliers";

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
        subject: "40 rouleaux membrane bitume autoprotégée — Résidence Les Lilas",
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
              designation: "Membrane bitume autoprotégée",
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
              detail: "BC-2026-043 — démo Les Lilas",
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
        subject: "40 rouleaux membrane bitume autoprotégée — Résidence Les Lilas",
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
          designation: "Membrane bitume autoprotégée",
          quantity: 40,
          unit: "U",
          unitPriceHt: 106.5,
          sortOrder: 0,
        },
      });
    }
  }
  purchaseOrderId = po.id;

  // —— 3. UNE livraison agenda = sync idempotent CDE-2B (source = PurchaseOrder) ——
  const sync = await syncPurchaseOrderDeliveryEvent({
    orderId: po.id,
    actorUserId: opts.rootUserId,
  });
  let delivery = sync.eventId
    ? await prisma.agendaEvent.findUnique({ where: { id: sync.eventId } })
    : null;

  // Annuler les orphelins membrane / Point.P du même chantier (hors événement syncé)
  const otherDeliveries = await prisma.agendaEvent.findMany({
    where: {
      projectId: project.id,
      type: "LIVRAISON",
      status: { not: "ANNULE" },
      ...(delivery ? { id: { not: delivery.id } } : {}),
      OR: [
        { title: { contains: "membrane" } },
        { title: { contains: "Point.P" } },
        { title: { contains: "BC-2026-043" } },
        { taskId: bc.id },
        { followUpSheetId: sheet.id },
        { purchaseOrderId: po.id },
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
  if (!delivery) {
    // Garde-fou : événement minimal si sync noop (ne devrait pas arriver avec DELIVERY_AT)
    delivery = await prisma.agendaEvent.create({
      data: {
        title: "Livraison POINT.P (BC-2026-043)",
        type: "LIVRAISON",
        status: "PLANIFIE",
        startAt: DELIVERY_AT,
        endAt: DELIVERY_END,
        location: "Résidence Les Lilas — aire livraison",
        ownerUserId: opts.rootUserId,
        createdById: opts.rootUserId,
        organizationId: opts.organizationId,
        projectId: project.id,
        followUpSheetId: sheet.id,
        taskId: bc.id,
        purchaseOrderId: po.id,
        responsibleId: assigneeId,
      },
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
        title: "Intervention étanchéité — Les Lilas",
        type: "INTERVENTION",
        status: "PLANIFIE",
        startAt: INTERVENTION_AT,
        endAt: INTERVENTION_END,
        location: "Résidence Les Lilas — terrasse",
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
        title: "Intervention étanchéité — Les Lilas",
      },
    });
  }

  // —— 4b. AGENDA-V2A — journée métier cohérente (livraison + réunion + échéance) ——
  const REUNION_AT = new Date(2026, 7, 11, 10, 30, 0, 0);
  const REUNION_END = new Date(2026, 7, 11, 11, 30, 0, 0);
  const ECHEANCE_AT = new Date(2026, 7, 11, 17, 0, 0, 0);
  const ECHEANCE_END = new Date(2026, 7, 11, 17, 30, 0, 0);

  let reunion = await prisma.agendaEvent.findFirst({
    where: {
      projectId: project.id,
      type: "REUNION_CHANTIER",
      status: { not: "ANNULE" },
      title: { contains: "Réunion chantier" },
    },
    select: { id: true },
  });
  if (!reunion) {
    reunion = await prisma.agendaEvent.create({
      data: {
        title: "Réunion chantier — Les Lilas",
        type: "REUNION_CHANTIER",
        status: "CONFIRME",
        startAt: REUNION_AT,
        endAt: REUNION_END,
        location: "Résidence Les Lilas — baraque de chantier",
        ownerUserId: opts.rootUserId,
        createdById: opts.rootUserId,
        organizationId: opts.organizationId,
        projectId: project.id,
        followUpSheetId: sheet.id,
        responsibleId: assigneeId,
        description: "Point livraison membrane bitume + préparation intervention.",
      },
      select: { id: true },
    });
  } else {
    await prisma.agendaEvent.update({
      where: { id: reunion.id },
      data: {
        startAt: REUNION_AT,
        endAt: REUNION_END,
        followUpSheetId: sheet.id,
        responsibleId: assigneeId,
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
        title: "Avenant n°02 — Les Lilas",
        clientName: "Syndic Horizon Copro",
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

  // Échéance avenant le jour de la livraison (17:00)
  if (avenant) {
    const echeance = await prisma.agendaEvent.findFirst({
      where: {
        projectId: project.id,
        type: "ECHEANCE",
        followUpSheetId: avenant.id,
        status: { not: "ANNULE" },
      },
      select: { id: true },
    });
    if (!echeance) {
      await prisma.agendaEvent.create({
        data: {
          title: "Échéance avenant n°02",
          type: "ECHEANCE",
          status: "PLANIFIE",
          startAt: ECHEANCE_AT,
          endAt: ECHEANCE_END,
          ownerUserId: opts.rootUserId,
          createdById: opts.rootUserId,
          organizationId: opts.organizationId,
          projectId: project.id,
          followUpSheetId: avenant.id,
          responsibleId: opts.rootUserId,
          description: "Chiffrer l’avenant — 20 m² terrasse côté cour.",
        },
      });
    } else {
      await prisma.agendaEvent.update({
        where: { id: echeance.id },
        data: { startAt: ECHEANCE_AT, endAt: ECHEANCE_END },
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

  // V2C.6 — canaux chantier (Équipe / Client / Point.P) + seed messages
  try {
    const { bootstrapDefaultChannelsForProject, ensureProjectChannel, addChannelParticipant } =
      await import("@/lib/messagerie/project-channels");
    await bootstrapDefaultChannelsForProject(project.id);

    const internalCh = await ensureProjectChannel({
      projectId: project.id,
      type: "INTERNAL",
    });
    // Direction visible sur canal interne (pas auto partout)
    await addChannelParticipant({
      channelId: internalCh.id,
      userId: opts.rootUserId,
    });

    const hasInternalMsg = await prisma.message.findFirst({
      where: { projectId: project.id, channel: "INTERNE" },
      select: { id: true },
    });
    if (!hasInternalMsg) {
      const karim = await prisma.user.findFirst({
        where: { name: "Karim Benali" },
        select: { id: true },
      });
      const julie = await prisma.user.findFirst({
        where: { name: "Julie Martin" },
        select: { id: true },
      });
      if (karim && julie) {
        await addChannelParticipant({ channelId: internalCh.id, userId: karim.id });
        await addChannelParticipant({ channelId: internalCh.id, userId: julie.id });
        await prisma.message.create({
          data: {
            projectId: project.id,
            senderId: karim.id,
            receiverId: julie.id,
            channel: "INTERNE",
            channelId: internalCh.id,
            content:
              "Point interne — membrane Point.P : on valide les détails avant de répondre au syndic.",
          },
        });
      }
    }

    if (purchaseOrderId) {
      const po = await prisma.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
        select: { externalOrganizationId: true },
      });
      if (po?.externalOrganizationId) {
        const supplierCh = await ensureProjectChannel({
          projectId: project.id,
          type: "SUPPLIER",
          externalOrganizationId: po.externalOrganizationId,
        });
        const thomas = await prisma.user.findFirst({
          where: {
            OR: [{ name: "Thomas Bernard" }, { externalOrganizationId: po.externalOrganizationId }],
            personType: "SUPPLIER",
          },
          select: { id: true },
        });
        const karim = await prisma.user.findFirst({
          where: { name: "Karim Benali" },
          select: { id: true },
        });
        if (thomas) await addChannelParticipant({ channelId: supplierCh.id, userId: thomas.id });
        if (karim) await addChannelParticipant({ channelId: supplierCh.id, userId: karim.id });
        const hasSupplierMsg = await prisma.message.findFirst({
          where: { channelId: supplierCh.id },
          select: { id: true },
        });
        if (!hasSupplierMsg && thomas && karim) {
          await prisma.message.create({
            data: {
              projectId: project.id,
              senderId: thomas.id,
              receiverId: karim.id,
              channel: "FOURNISSEUR",
              channelId: supplierCh.id,
              content: "Livraison membrane confirmée — créneau à valider sur chantier.",
            },
          });
        }
      }
    }
  } catch (e) {
    console.warn("[v2c6] bootstrap canaux Victor Hugo:", e);
  }

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

  // Aligner PurchaseOrder + Agenda via sync CDE-2B (une seule livraison)
  const linkedPo = await prisma.purchaseOrder.findFirst({
    where: {
      OR: [{ legacyTaskId: task.id }, { number: "BC-2026-043", organizationId: task.organizationId ?? undefined }],
    },
    select: { id: true },
  });
  let delivery: { id: string } | null = null;
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
        legacyTaskId: task.id,
        followUpSheetId: sheetId,
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
    const synced = await syncPurchaseOrderDeliveryEvent({
      orderId: linkedPo.id,
      actorUserId: opts.actorUserId,
      postSystemMessage: true,
      systemMessage: `✓ Livraison confirmée — 11 août 07:30\nBC-2026-043 · Point.P\n[Voir la commande](/dashboard/commandes/${linkedPo.id})`,
    });
    delivery = synced.eventId ? { id: synced.eventId } : null;
  }

  if (!delivery) {
    delivery = await prisma.agendaEvent.findFirst({
      where: {
        projectId: task.projectId,
        type: "LIVRAISON",
        status: { not: "ANNULE" },
        OR: [{ taskId: task.id }, ...(sheetId ? [{ followUpSheetId: sheetId }] : [])],
      },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
  }

  if (delivery) {
    await prisma.agendaEvent.updateMany({
      where: {
        projectId: task.projectId!,
        type: "LIVRAISON",
        id: { not: delivery.id },
        status: { not: "ANNULE" },
        OR: [{ taskId: task.id }, ...(sheetId ? [{ followUpSheetId: sheetId }] : [])],
      },
      data: { status: "ANNULE", description: "Doublon annulé après confirmation fournisseur." },
    });
  }

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

  // Évite doublon si sync a déjà posté un SYSTEM
  const alreadySystem = await prisma.taskMessage.findFirst({
    where: {
      taskId: task.id,
      kind: "SYSTEM",
      content: { contains: "Livraison confirmée" },
      createdAt: { gte: new Date(Date.now() - 60_000) },
    },
    select: { id: true },
  });
  if (!alreadySystem) {
    await prisma.taskMessage.create({
      data: {
        taskId: task.id,
        senderId: opts.actorUserId,
        receiverId: opts.rootUserId,
        content: `✅ Livraison confirmée pour le 11/08/2026 à 07:30 — ${opts.actorName} (Point.P).`,
        kind: "SYSTEM",
      },
    });
  }

  return { deliveryId: delivery?.id ?? null, sheetId };
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
      OR: [{ osNumber: "4587" }, { title: { contains: "Les Lilas" } }],
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
