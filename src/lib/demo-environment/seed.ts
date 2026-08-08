import {
  AlertLevel,
  ChantierStatus,
  DocumentCategory,
  DocumentStatus,
  ProjectStatus,
  ProjectUrgency,
  TaskStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

export type SeedDemoOptions = {
  clientId: string;
  organizationId: string;
  companyName: string;
  sector?: string | null;
  includeMarches?: boolean;
};

/**
 * Injecte un jeu de données fictives réaliste et léger pour une démo commerciale.
 * Ne touche que le clientId / organizationId fournis.
 */
export async function seedDemoEnvironmentData(opts: SeedDemoOptions) {
  const { clientId, organizationId, companyName, sector, includeMarches } = opts;
  const métier = sector?.trim() || "BTP";

  const projectVictor = await prisma.project.create({
    data: {
      title: "Résidence Victor Hugo",
      description: `Chantier ${métier} — rénovation étanchéité toiture-terrasse et points singuliers. Données fictives de démonstration.`,
      status: ProjectStatus.EN_COURS,
      chantierStatus: ChantierStatus.EN_COURS,
      clientId,
      organizationId,
      siteAddress: "12 avenue Victor Hugo",
      siteCity: "Lyon",
      internalManager: "Sophie Martin",
      urgency: ProjectUrgency.HAUTE,
      plannedStartDate: daysFromNow(-20),
      plannedEndDate: daysFromNow(45),
      deadline: daysFromNow(45),
    },
  });

  const projectRepublique = await prisma.project.create({
    data: {
      title: "Chantier République",
      description: "Réfection façade et accès nacelle — données fictives.",
      status: ProjectStatus.EN_COURS,
      chantierStatus: ChantierStatus.EN_ATTENTE,
      clientId,
      organizationId,
      siteAddress: "8 place de la République",
      siteCity: "Villeurbanne",
      internalManager: "Karim Benali",
      urgency: ProjectUrgency.MOYENNE,
      plannedStartDate: daysFromNow(-5),
      plannedEndDate: daysFromNow(60),
      deadline: daysFromNow(60),
    },
  });

  const projectAlpha = await prisma.project.create({
    data: {
      title: "Immeuble Alpha — Lot couverture",
      description: "Maintenance annuelle couverture — données fictives.",
      status: ProjectStatus.EN_COURS,
      chantierStatus: ChantierStatus.ETUDE,
      clientId,
      organizationId,
      siteCity: "Saint-Priest",
      internalManager: "Thomas Leroy",
      urgency: ProjectUrgency.BASSE,
      plannedStartDate: daysFromNow(10),
      plannedEndDate: daysFromNow(90),
    },
  });

  // Tâches / « post-its » digitalisés + bons de commande (catégorie métier)
  await prisma.task.createMany({
    data: [
      {
        title: "Relancer le fournisseur pour les plans terrasse",
        description: "Responsable fictif : Sophie Martin — priorité haute. Ancien post-it bureau.",
        status: TaskStatus.EN_COURS,
        priority: "URGENT",
        clientId,
        organizationId,
        projectId: projectVictor.id,
        category: "Tâche chantier",
        desiredDate: daysFromNow(-2),
      },
      {
        title: "BC-2026-043 — 40 rouleaux membrane d'étanchéité",
        description:
          "Fournisseur fictif Étanchéité Plus. Chantier Résidence Victor Hugo. Montant indicatif 4 260 € HT. Statut : à valider.",
        status: TaskStatus.A_VALIDER,
        priority: "PRIORITAIRE",
        clientId,
        organizationId,
        projectId: projectVictor.id,
        category: "Bon de commande",
        desiredDate: daysFromNow(5),
        suppliersJson: [{ name: "Étanchéité Plus (fictif)", contact: "commandes@etancheite-plus.demo" }],
      },
      {
        title: "BC-2026-038 — Isolant thermique",
        description: "Commandé — livraison prévue. Fournisseur fictif Isolant Rhône.",
        status: TaskStatus.EN_COURS,
        priority: "STANDARD",
        clientId,
        organizationId,
        projectId: projectVictor.id,
        category: "Bon de commande",
        desiredDate: daysFromNow(2),
        suppliersJson: [{ name: "Isolant Rhône (fictif)", contact: "livraisons@isolant-rhone.demo" }],
      },
      {
        title: "BC-2026-029 — Accessoires relevés",
        description: "Livraison en retard (scénario démo).",
        status: TaskStatus.EN_ATTENTE_INFO,
        priority: "URGENT",
        clientId,
        organizationId,
        projectId: projectVictor.id,
        category: "Bon de commande",
        desiredDate: daysFromNow(-1),
      },
      {
        title: "BC-2026-041 — Bandes de solin",
        description: "Validé — commande envoyée au fournisseur fictif. Montant 890 € HT.",
        status: TaskStatus.ASSIGNEE,
        priority: "STANDARD",
        clientId,
        organizationId,
        projectId: projectVictor.id,
        category: "Bon de commande",
        desiredDate: daysFromNow(8),
        suppliersJson: [{ name: "Étanchéité Plus (fictif)", contact: "commandes@etancheite-plus.demo" }],
      },
      {
        title: "Location d'une nacelle pour le chantier République",
        description: "Demande administrative interne — workflow Demande → À valider.",
        status: TaskStatus.A_VALIDER,
        priority: "PRIORITAIRE",
        clientId,
        organizationId,
        projectId: projectRepublique.id,
        category: "Demande administrative",
        desiredDate: daysFromNow(3),
      },
      {
        title: "Rédiger le compte rendu de visite Victor Hugo",
        description: "Aucun CR récent — alerte tableau de bord.",
        status: TaskStatus.EN_ATTENTE,
        priority: "PRIORITAIRE",
        clientId,
        organizationId,
        projectId: projectVictor.id,
        category: "Compte rendu",
        desiredDate: daysFromNow(0),
      },
      {
        title: "Transmettre les fiches techniques avant le 22",
        description: "Extrait document : transmission avant échéance fictive.",
        status: TaskStatus.EN_COURS,
        priority: "STANDARD",
        clientId,
        organizationId,
        projectId: projectRepublique.id,
        category: "Document manquant",
        desiredDate: daysFromNow(7),
      },
      {
        title: "Planifier l'intervention du 30",
        description: "Action extraite d’un document fictif — à valider avant création définitive.",
        status: TaskStatus.NOUVEAU,
        priority: "STANDARD",
        clientId,
        organizationId,
        projectId: projectRepublique.id,
        category: "Planning",
        desiredDate: daysFromNow(14),
      },
      {
        title: "Contrôle réception partielle Alpha",
        description: "Échéance planning démo.",
        status: TaskStatus.EN_ATTENTE,
        priority: "STANDARD",
        clientId,
        organizationId,
        projectId: projectAlpha.id,
        category: "Planning",
        desiredDate: daysFromNow(4),
      },
    ],
  });

  if (includeMarches) {
    await prisma.task.create({
      data: {
        title: "Analyse DCE — Lycée fictif Nord",
        description: "Module Marchés activé : RC, CCTP, CCAP, DPGF fictifs à analyser.",
        status: TaskStatus.EN_ANALYSE,
        priority: "PRIORITAIRE",
        clientId,
        organizationId,
        category: "Marché",
        desiredDate: daysFromNow(6),
      },
    });
  }

  await prisma.alert.createMany({
    data: [
      {
        title: "Action urgente",
        message: "3 actions urgentes à traiter aujourd’hui (données fictives).",
        level: AlertLevel.URGENT,
        clientId,
        actionUrl: "/dashboard/taches",
        read: false,
      },
      {
        title: "Commandes à valider",
        message: "2 bons de commande attendent une validation.",
        level: AlertLevel.WARNING,
        clientId,
        actionUrl: "/dashboard/taches",
        read: false,
      },
      {
        title: "Livraison en retard",
        message: "BC-2026-029 — livraison non confirmée (scénario démo).",
        level: AlertLevel.URGENT,
        clientId,
        actionUrl: "/dashboard/taches",
        read: false,
      },
      {
        title: "Documents manquants",
        message: "2 documents manquants sur Chantier République.",
        level: AlertLevel.WARNING,
        clientId,
        actionUrl: "/dashboard/documents",
        read: false,
      },
      {
        title: "Compte rendu",
        message: "1 chantier sans compte rendu récent (Victor Hugo).",
        level: AlertLevel.INFO,
        clientId,
        actionUrl: `/dashboard/projets/${projectVictor.id}`,
        read: false,
      },
    ],
  });

  // Documents métadonnées (URL placeholder locale — pas de fichier réel)
  await prisma.document.createMany({
    data: [
      {
        name: "Devis étanchéité Victor Hugo (fictif).pdf",
        category: DocumentCategory.CONTRAT,
        fileUrl: "/demo-assets/placeholder-document.pdf",
        fileSize: 120_000,
        mimeType: "application/pdf",
        status: DocumentStatus.TRAITE,
        clientId,
        projectId: projectVictor.id,
      },
      {
        name: "Fiche technique membrane (manquante)",
        category: DocumentCategory.AUTRE,
        fileUrl: "/demo-assets/placeholder-document.pdf",
        fileSize: 1_024,
        mimeType: "application/pdf",
        status: DocumentStatus.EN_ATTENTE,
        clientId,
        projectId: projectRepublique.id,
      },
      {
        name: "Facture fournisseur BC-2026-038 (fictif).pdf",
        category: DocumentCategory.FACTURE,
        fileUrl: "/demo-assets/placeholder-document.pdf",
        fileSize: 80_000,
        mimeType: "application/pdf",
        status: DocumentStatus.EN_TRAITEMENT,
        clientId,
        projectId: projectVictor.id,
      },
    ],
  });

  await prisma.appointment.createMany({
    data: [
      {
        title: "Réunion de chantier — Victor Hugo",
        startAt: daysFromNow(1),
        endAt: new Date(daysFromNow(1).getTime() + 60 * 60 * 1000),
        organizerId: clientId,
        clientId,
        projectId: projectVictor.id,
        notes: "Données fictives de démonstration",
      },
      {
        title: "Livraison isolant — Victor Hugo",
        startAt: daysFromNow(2),
        endAt: new Date(daysFromNow(2).getTime() + 2 * 60 * 60 * 1000),
        organizerId: clientId,
        clientId,
        projectId: projectVictor.id,
      },
      {
        title: "Visite contrôle République",
        startAt: daysFromNow(5),
        endAt: new Date(daysFromNow(5).getTime() + 90 * 60 * 1000),
        organizerId: clientId,
        clientId,
        projectId: projectRepublique.id,
      },
    ],
  });

  const atHour = (base: Date, h: number, m = 0) => {
    const d = new Date(base);
    d.setHours(h, m, 0, 0);
    return d;
  };
  const today = new Date();
  const tomorrow = daysFromNow(1);
  const inTwo = daysFromNow(2);
  const inThree = daysFromNow(3);

  const org = await prisma.organization.findFirst({
    where: { ownerUserId: clientId },
    select: { id: true },
  });

  await prisma.agendaEvent.createMany({
    data: [
      {
        title: "Livraison membrane EPDM",
        type: "LIVRAISON",
        startAt: atHour(today, 8),
        endAt: atHour(today, 9),
        ownerUserId: clientId,
        createdById: clientId,
        organizationId: org?.id ?? null,
        projectId: projectVictor.id,
        location: "Résidence Victor Hugo — aire livraison",
        description: "Données fictives de démonstration BeWork",
      },
      {
        title: "Réunion de chantier",
        type: "REUNION_CHANTIER",
        startAt: atHour(today, 9, 30),
        endAt: atHour(today, 10, 30),
        ownerUserId: clientId,
        createdById: clientId,
        organizationId: org?.id ?? null,
        projectId: projectVictor.id,
        location: "Base vie Victor Hugo",
      },
      {
        title: "Rendez-vous fournisseur Point.P",
        type: "RDV_FOURNISSEUR",
        startAt: atHour(today, 11),
        endAt: atHour(today, 12),
        ownerUserId: clientId,
        createdById: clientId,
        organizationId: org?.id ?? null,
        location: "Point.P",
      },
      {
        title: "Visite chantier République",
        type: "VISITE_CHANTIER",
        startAt: atHour(today, 14),
        endAt: atHour(today, 15, 30),
        ownerUserId: clientId,
        createdById: clientId,
        organizationId: org?.id ?? null,
        projectId: projectRepublique.id,
      },
      {
        title: "Validation situation n°4",
        type: "SITUATION",
        startAt: atHour(today, 16, 30),
        endAt: atHour(today, 17, 30),
        ownerUserId: clientId,
        createdById: clientId,
        organizationId: org?.id ?? null,
        projectId: projectAlpha.id,
        description: "Revue situation Immeuble Alpha — fictif démo",
      },
      {
        title: "Livraison isolant",
        type: "LIVRAISON",
        startAt: atHour(tomorrow, 8),
        endAt: atHour(tomorrow, 10),
        ownerUserId: clientId,
        createdById: clientId,
        organizationId: org?.id ?? null,
        projectId: projectVictor.id,
      },
      {
        title: "Réunion de chantier — Victor Hugo",
        type: "REUNION_CHANTIER",
        startAt: atHour(tomorrow, 9),
        endAt: atHour(tomorrow, 10),
        ownerUserId: clientId,
        createdById: clientId,
        organizationId: org?.id ?? null,
        projectId: projectVictor.id,
        recurrence: "WEEKLY",
      },
      {
        title: "Contrôle étanchéité République",
        type: "CONTROLE",
        startAt: atHour(inTwo, 10),
        endAt: atHour(inTwo, 12),
        ownerUserId: clientId,
        createdById: clientId,
        organizationId: org?.id ?? null,
        projectId: projectRepublique.id,
      },
      {
        title: "Échéance DOE — Alpha",
        type: "ECHEANCE",
        startAt: atHour(inThree, 9),
        endAt: atHour(inThree, 9, 30),
        allDay: false,
        ownerUserId: clientId,
        createdById: clientId,
        organizationId: org?.id ?? null,
        projectId: projectAlpha.id,
      },
    ],
  });

  // Fiches de suivi (post-it numériques) — 1 OS / 1 commande = 1 fiche
  const ficheVictor = await prisma.followUpSheet.create({
    data: {
      ownerUserId: clientId,
      createdById: clientId,
      assigneeId: clientId,
      organizationId,
      projectId: projectVictor.id,
      title: "Résidence Victor Hugo",
      clientName: "Résidence Victor Hugo",
      siteAddress: "12 avenue Victor Hugo, Lyon",
      workObject: "Réfection étanchéité terrasse",
      osNumber: "4587",
      receivedAt: daysFromNow(-4),
      status: "COMMANDE_FOURNISSEUR",
      colorKey: "orange",
      nextAction: "Commander la membrane EPDM",
      nextActionAt: daysFromNow(-1),
      nextActionDone: false,
      reminderOffsets: [168, 72, 24, 2],
      notes: "Ancien post-it bureau — scénario démo.",
    },
  });
  await prisma.followUpTimelineEvent.createMany({
    data: [
      {
        sheetId: ficheVictor.id,
        authorId: clientId,
        kind: "creation",
        label: "OS reçu",
        detail: "OS n°4587",
        occurredAt: daysFromNow(-4),
      },
      {
        sheetId: ficheVictor.id,
        authorId: clientId,
        kind: "action",
        label: "Prochaine action : Commander la membrane EPDM",
        occurredAt: daysFromNow(-3),
      },
      {
        sheetId: ficheVictor.id,
        kind: "alerte",
        label: "Échéance dépassée",
        detail: "Action non réalisée à l’heure prévue",
        occurredAt: daysFromNow(-1),
      },
    ],
  });

  const ficheRepublique = await prisma.followUpSheet.create({
    data: {
      ownerUserId: clientId,
      createdById: clientId,
      assigneeId: clientId,
      organizationId,
      projectId: projectRepublique.id,
      title: "Chantier République",
      clientName: "Chantier République",
      workObject: "Avenant n°2 — validation client",
      orderNumber: "AV-2026-02",
      receivedAt: daysFromNow(-12),
      status: "AVENANT",
      colorKey: "violet",
      nextAction: "Relancer validation client avenant n°2",
      nextActionAt: daysFromNow(1),
      nextActionDone: false,
      reminderOffsets: [72, 24],
    },
  });
  await prisma.followUpTimelineEvent.create({
    data: {
      sheetId: ficheRepublique.id,
      authorId: clientId,
      kind: "creation",
      label: "Avenant envoyé",
      detail: "En attente de réponse client",
      occurredAt: daysFromNow(-9),
    },
  });

  const ficheAlpha = await prisma.followUpSheet.create({
    data: {
      ownerUserId: clientId,
      createdById: clientId,
      assigneeId: clientId,
      organizationId,
      projectId: projectAlpha.id,
      title: "Immeuble Alpha",
      clientName: "Immeuble Alpha",
      workObject: "Travaux terminés — facturation",
      status: "A_FACTURER",
      colorKey: "vert",
      nextAction: "Préparer la facturation",
      nextActionAt: daysFromNow(0),
      nextActionDone: false,
      receivedAt: daysFromNow(-30),
    },
  });

  // Lier un événement agenda à la fiche Victor Hugo
  await prisma.agendaEvent.create({
    data: {
      title: "Intervention étanchéité — Victor Hugo",
      type: "INTERVENTION",
      startAt: (() => {
        const d = daysFromNow(2);
        d.setHours(8, 0, 0, 0);
        return d;
      })(),
      endAt: (() => {
        const d = daysFromNow(2);
        d.setHours(12, 0, 0, 0);
        return d;
      })(),
      ownerUserId: clientId,
      createdById: clientId,
      organizationId,
      projectId: projectVictor.id,
      followUpSheetId: ficheVictor.id,
      responsibleId: clientId,
    },
  });

  void ficheAlpha;

  // —— Scénario messagerie Action BeWork (Point.P / Victor Hugo) ——
  const agentUser = await prisma.user.findFirst({
    where: { role: { in: ["AGENT", "AGENCE", "MANAGER"] }, id: { not: clientId } },
    select: { id: true },
  });
  const staffId = agentUser?.id ?? clientId;

  const taskBc043 = await prisma.task.findFirst({
    where: {
      clientId,
      title: { contains: "BC-2026-043" },
    },
    select: { id: true },
  });
  const taskRelance = await prisma.task.findFirst({
    where: {
      clientId,
      title: { contains: "Relancer le fournisseur" },
    },
    select: { id: true },
  });
  const taskCr = await prisma.task.findFirst({
    where: {
      clientId,
      title: { contains: "compte rendu de visite Victor Hugo" },
    },
    select: { id: true },
  });

  if (taskBc043) {
    await prisma.task.update({
      where: { id: taskBc043.id },
      data: {
        assignedToId: staffId,
        title: "POINT.P — Résidence Victor Hugo (BC-2026-043)",
        suppliersJson: [{ name: "Point.P (fictif)", contact: "livraisons@pointp.demo" }],
      },
    });
    await prisma.taskMessage.createMany({
      data: [
        {
          taskId: taskBc043.id,
          senderId: staffId,
          receiverId: clientId,
          content:
            "Bonjour, votre commande de 40 rouleaux est prête.\nLivraison possible mardi 11 août à 7h30.",
          kind: "USER",
          createdAt: daysFromNow(-1),
        },
        {
          taskId: taskBc043.id,
          senderId: clientId,
          receiverId: staffId,
          content: "Merci. On valide mardi 7h30 sur Victor Hugo — aire livraison.",
          kind: "USER",
          createdAt: daysFromNow(-1),
        },
      ],
    });
  }

  // Messages sur les autres BC pour que la messagerie ne soit pas vide
  const otherBcs = await prisma.task.findMany({
    where: {
      clientId,
      OR: [
        { title: { contains: "BC-2026-038" } },
        { title: { contains: "BC-2026-029" } },
        { title: { contains: "BC-2026-041" } },
      ],
    },
    select: { id: true, title: true },
  });
  for (const t of otherBcs) {
    await prisma.task.update({
      where: { id: t.id },
      data: { assignedToId: staffId },
    });
    const existing = await prisma.taskMessage.count({ where: { taskId: t.id } });
    if (existing === 0) {
      await prisma.taskMessage.create({
        data: {
          taskId: t.id,
          senderId: staffId,
          receiverId: clientId,
          content: `Bonjour, suite sur « ${t.title} » — n’hésitez pas à m’écrire ici (texte, photo ou PDF).`,
          kind: "USER",
          createdAt: daysFromNow(-3),
        },
      });
    }
  }

  if (taskRelance) {
    await prisma.task.update({
      where: { id: taskRelance.id },
      data: { assignedToId: staffId },
    });
    await prisma.taskMessage.create({
      data: {
        taskId: taskRelance.id,
        senderId: clientId,
        receiverId: staffId,
        content:
          "Pendant que vous êtes sur place, pouvez-vous également reprendre les 20 m² de terrasse côté cour ?",
        kind: "USER",
        createdAt: daysFromNow(-2),
      },
    });
  }

  if (taskCr) {
    await prisma.task.update({
      where: { id: taskCr.id },
      data: { assignedToId: staffId },
    });
    await prisma.taskMessage.create({
      data: {
        taskId: taskCr.id,
        senderId: staffId,
        receiverId: clientId,
        content: "Victor Hugo terminé, tout est OK.",
        kind: "USER",
        createdAt: daysFromNow(0),
      },
    });
  }

  return {
    projectIds: [projectVictor.id, projectRepublique.id, projectAlpha.id],
    companyLabel: companyName,
  };
}

/** Supprime uniquement les données métier du tenant démo (pas le User / Organization / DemoEnvironment). */
export async function clearDemoEnvironmentData(clientId: string) {
  await prisma.$transaction([
    prisma.messageAction.deleteMany({ where: { createdById: clientId } }),
    prisma.agendaEventAttendee.deleteMany({
      where: { event: { ownerUserId: clientId } },
    }),
    prisma.agendaEvent.deleteMany({ where: { ownerUserId: clientId } }),
    prisma.followUpTimelineEvent.deleteMany({
      where: { sheet: { ownerUserId: clientId } },
    }),
    prisma.followUpSheet.deleteMany({ where: { ownerUserId: clientId } }),
    prisma.appointment.deleteMany({ where: { clientId } }),
    prisma.alert.deleteMany({ where: { clientId } }),
    prisma.document.deleteMany({ where: { clientId } }),
    prisma.task.deleteMany({ where: { clientId } }),
    prisma.project.deleteMany({ where: { clientId } }),
  ]);
}
