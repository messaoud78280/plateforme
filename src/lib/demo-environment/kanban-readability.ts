/**
 * W2-C / W3 — Distribue les fiches SETRIM pour un Kanban lisible + destinataires notifs.
 * Pas de doublon Les Lilas. Pas d’urgence forcée.
 */
import type { FollowUpSheetStatus, FollowUpUrgency } from "@prisma/client";
import { OrganizationMemberRole, TaskStatus, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { appendFollowUpTimeline } from "@/lib/follow-up/timeline";
import { colorKeyForStatus } from "@/lib/follow-up/types";
import { syncAttentionNotificationsForOwner } from "@/lib/follow-up/attention/sync-notifications";
import { demoPersonaEmail, DEMO_PERSONAS } from "@/lib/demo-environment/personas";
import { DEMO_SCENARIO } from "@/lib/demo-environment/scenario";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10, 0, 0, 0);
  return d;
}

async function ensureStatutEntry(opts: {
  sheetId: string;
  authorId: string;
  fromLabel: string;
  toLabel: string;
  occurredAt: Date;
}) {
  const existing = await prisma.followUpTimelineEvent.findFirst({
    where: { sheetId: opts.sheetId, kind: "statut" },
    orderBy: { occurredAt: "desc" },
    select: { id: true },
  });
  if (existing) {
    // Recaler la date pour que le moteur W3-A calcule à partir de dates réelles
    await prisma.followUpTimelineEvent.update({
      where: { id: existing.id },
      data: {
        occurredAt: opts.occurredAt,
        label: `${opts.fromLabel} → ${opts.toLabel}`,
        detail: "Répartition démo — attention calculée (W3-A)",
      },
    });
    return;
  }
  await appendFollowUpTimeline({
    sheetId: opts.sheetId,
    authorId: opts.authorId,
    kind: "statut",
    label: `${opts.fromLabel} → ${opts.toLabel}`,
    detail: "Répartition démo — attention calculée (W3-A)",
    occurredAt: opts.occurredAt,
  });
}

async function patchSheet(opts: {
  sheetId: string;
  authorId: string;
  status: FollowUpSheetStatus;
  nextAction: string;
  nextActionAt: Date | null;
  urgencyOverride?: FollowUpUrgency | null;
  assigneeId?: string | null;
  title?: string;
  workObject?: string | null;
  clientName?: string | null;
  daysInStep: number;
  fromLabel: string;
  toLabel: string;
}) {
  await prisma.followUpSheet.update({
    where: { id: opts.sheetId },
    data: {
      status: opts.status,
      colorKey: colorKeyForStatus(opts.status),
      nextAction: opts.nextAction,
      nextActionAt: opts.nextActionAt,
      nextActionDone: false,
      ...(opts.urgencyOverride !== undefined ? { urgencyOverride: opts.urgencyOverride } : {}),
      ...(opts.assigneeId !== undefined ? { assigneeId: opts.assigneeId } : {}),
      ...(opts.title ? { title: opts.title } : {}),
      ...(opts.workObject !== undefined ? { workObject: opts.workObject } : {}),
      ...(opts.clientName !== undefined ? { clientName: opts.clientName } : {}),
    },
  });
  await ensureStatutEntry({
    sheetId: opts.sheetId,
    authorId: opts.authorId,
    fromLabel: opts.fromLabel,
    toLabel: opts.toLabel,
    occurredAt: daysAgo(opts.daysInStep),
  });
}

/** Julie Martin — administratif interne (reçoit les notifs facturation, pas Direction). */
async function ensureJulieAdministratif(opts: {
  rootUserId: string;
  organizationId: string;
  loginIdentifier?: string | null;
}): Promise<string> {
  const login = opts.loginIdentifier?.trim() || "bework-demo";
  const def = DEMO_PERSONAS.administratif;
  const email = demoPersonaEmail(login, def.emailSuffix);
  const root = await prisma.user.findUnique({
    where: { id: opts.rootUserId },
    select: { password: true },
  });
  const passwordHash = root?.password || (await bcrypt.hash("BeWorkDemo2026!", 12));

  const existing = await prisma.user.findUnique({ where: { email } });
  const julie = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: def.name,
          company: def.company,
          personType: def.personType,
          permissionProfile: def.permissionProfile,
          accessStatus: "ACTIVE",
          jobTitle: def.jobTitle,
          teamRole: "USER",
          invitedById: opts.rootUserId,
          password: passwordHash,
        },
        select: { id: true },
      })
    : await prisma.user.create({
        data: {
          email,
          password: passwordHash,
          name: def.name,
          role: UserRole.CLIENT,
          company: def.company,
          personType: def.personType,
          permissionProfile: def.permissionProfile,
          accessStatus: "ACTIVE",
          jobTitle: def.jobTitle,
          teamRole: "USER",
          invitedById: opts.rootUserId,
          accountStatus: "APPROVED",
          contractStatus: "SIGNED",
        },
        select: { id: true },
      });

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: opts.organizationId,
        userId: julie.id,
      },
    },
    create: {
      organizationId: opts.organizationId,
      userId: julie.id,
      role: OrganizationMemberRole.MEMBER,
    },
    update: { role: OrganizationMemberRole.MEMBER },
  });

  return julie.id;
}

/** 2–3 tâches chantier Les Jardins — idempotent (aucune création si déjà présentes). */
async function ensureJardinsDemoTasks(opts: {
  projectId: string;
  clientId: string;
  organizationId: string;
  karimId: string;
  julieId: string;
}): Promise<void> {
  const existing = await prisma.task.count({
    where: { projectId: opts.projectId },
  });
  if (existing > 0) return;

  const desiredSoon = daysAgo(-3); // échéance relative (helpers démo)
  const desiredLater = daysAgo(-7);

  await prisma.task.createMany({
    data: [
      {
        title: "Préparer le dossier de démarrage",
        description:
          "Réunir OS, plans et accès chantier avant démarrage — Responsable : administratif.",
        status: TaskStatus.EN_ATTENTE,
        priority: "PRIORITAIRE",
        clientId: opts.clientId,
        organizationId: opts.organizationId,
        projectId: opts.projectId,
        assignedToId: opts.julieId,
        category: "Tâche chantier",
        desiredDate: desiredLater,
      },
      {
        title: "Vérifier les plans avant intervention",
        description:
          "Contrôle plans toiture-terrasse / relevés — Responsable : conducteur travaux.",
        status: TaskStatus.EN_COURS,
        priority: "STANDARD",
        clientId: opts.clientId,
        organizationId: opts.organizationId,
        projectId: opts.projectId,
        assignedToId: opts.karimId,
        category: "Tâche chantier",
        desiredDate: desiredSoon,
      },
      {
        title: "Confirmer la date d’intervention",
        description:
          "Valider créneau avec le client avant pose — Responsable : conducteur travaux.",
        status: TaskStatus.EN_ATTENTE,
        priority: "STANDARD",
        clientId: opts.clientId,
        organizationId: opts.organizationId,
        projectId: opts.projectId,
        assignedToId: opts.karimId,
        category: "Tâche chantier",
        desiredDate: daysAgo(-10),
      },
    ],
  });
}

export async function ensureKanbanReadabilityDemo(opts: {
  rootUserId: string;
  organizationId: string;
  karimUserId?: string | null;
  loginIdentifier?: string | null;
}): Promise<void> {
  const karimId = opts.karimUserId ?? opts.rootUserId;
  const julieId = await ensureJulieAdministratif(opts);

  const sheets = await prisma.followUpSheet.findMany({
    where: {
      organizationId: opts.organizationId,
      status: { not: "ARCHIVE" },
    },
    select: {
      id: true,
      title: true,
      status: true,
      osNumber: true,
      orderNumber: true,
      projectId: true,
    },
  });

  const avenant =
    sheets.find((s) => s.title.toLowerCase().includes("avenant")) ??
    sheets.find(
      (s) =>
        (s.orderNumber ?? "").includes("AV-") &&
        (s.title.includes("Lilas") || s.title.includes("Victor")),
    ) ??
    sheets.find((s) => s.status === "AVENANT" && s.title.includes("Les Lilas")) ??
    sheets.find((s) => s.status === "AVENANT");

  const victorOs = sheets.find(
    (s) =>
      s.id !== avenant?.id &&
      (s.osNumber === "4587" || s.title.includes("Les Lilas")) &&
      !s.title.toLowerCase().includes("avenant"),
  );
  const alpha = sheets.find((s) => s.title.includes("Alpha"));
  const republique = sheets.find(
    (s) => s.title.includes("République") && s.id !== avenant?.id,
  );

  if (victorOs) {
    // Démo : reste en attente Point.P pour montrer confirmation fournisseur → agenda.
    // Ne pas forcer INTERVENTION_PREVUE (conflit avec le parcours fournisseur).
    const current = await prisma.followUpSheet.findUnique({
      where: { id: victorOs.id },
      select: { status: true },
    });
    const keepAdvanced =
      current &&
      ["INTERVENTION_PREVUE", "EN_COURS", "TRAVAUX_TERMINES", "A_FACTURER", "FACTURE", "TERMINE"].includes(
        current.status,
      );
    if (!keepAdvanced) {
      await patchSheet({
        sheetId: victorOs.id,
        authorId: opts.rootUserId,
        status: "ATTENTE_FOURNISSEUR",
        nextAction: `Attendre confirmation livraison ${DEMO_SCENARIO.supplierName}`,
        nextActionAt: new Date(2026, 7, 11, 7, 30, 0),
        assigneeId: karimId,
        urgencyOverride: null,
        title: `${DEMO_SCENARIO.projects.primary.title} — OS-${DEMO_SCENARIO.osNumber}`,
        workObject: "OS-4587 — Réfection étanchéité terrasse inaccessible",
        clientName: DEMO_SCENARIO.client.name,
        daysInStep: 2,
        fromLabel: "Commande",
        toLabel: "Attente fournisseur",
      });
    } else {
      await prisma.followUpSheet.update({
        where: { id: victorOs.id },
        data: {
          title: `${DEMO_SCENARIO.projects.primary.title} — OS-${DEMO_SCENARIO.osNumber}`,
          workObject: "OS-4587 — Réfection étanchéité terrasse inaccessible",
          clientName: DEMO_SCENARIO.client.name,
          osNumber: "4587",
          orderNumber: "BC-2026-043",
          assigneeId: karimId,
        },
      });
    }
  }

  if (avenant) {
    await patchSheet({
      sheetId: avenant.id,
      authorId: opts.rootUserId,
      status: "AVENANT",
      nextAction: "En attente client",
      nextActionAt: new Date(2026, 7, 25, 12, 0, 0),
      urgencyOverride: null,
      assigneeId: opts.rootUserId,
      title: `Avenant n°02 — ${DEMO_SCENARIO.projects.primary.title}`,
      workObject: "20 m² terrasse côté cour",
      clientName: DEMO_SCENARIO.client.name,
      // ~6 j > delayHours 120 → attention calculée (pas d’urgence forcée)
      daysInStep: 6,
      fromLabel: "Intervention",
      toLabel: "Avenant",
    });
  }

  if (republique) {
    await patchSheet({
      sheetId: republique.id,
      authorId: opts.rootUserId,
      status: "TRAVAUX_TERMINES",
      nextAction: "Préparer le dossier de facturation",
      nextActionAt: daysAgo(-5),
      urgencyOverride: null,
      assigneeId: karimId,
      title: DEMO_SCENARIO.projects.waiting.title,
      workObject: "Travaux terminés récemment",
      clientName: DEMO_SCENARIO.client.name,
      daysInStep: 1,
      fromLabel: "Intervention",
      toLabel: "Travaux terminés",
    });
  }

  if (alpha) {
    await patchSheet({
      sheetId: alpha.id,
      authorId: opts.rootUserId,
      status: "A_FACTURER",
      nextAction: "Préparer facturation",
      // Échéance passée : l’urgence vient du délai d’étape / facturation (W3-A), pas d’un override
      nextActionAt: daysAgo(3),
      urgencyOverride: null,
      // W3-C1 : Julie (admin) reçoit la notif — pas Direction
      assigneeId: julieId,
      title: "Immeuble Alpha",
      workObject: "Travaux terminés — facturation à préparer",
      clientName: DEMO_SCENARIO.client.name,
      daysInStep: 5,
      fromLabel: "Travaux terminés",
      toLabel: "À facturer",
    });

    // Chronologie lisible pour la démo anti-oubli (idempotente via labels)
    const alphaStory = [
      { label: "Travaux terminés", detail: "Karim — intervention clôturée", days: 5, kind: "statut" },
      { label: "Dossier passé à facturer", detail: "Responsable : administratif", days: 5, kind: "statut" },
      { label: "Rappel facturation", detail: "Toujours non facturé — rappel à Julie", days: 2, kind: "alerte" },
    ];
    for (const ev of alphaStory) {
      const exists = await prisma.followUpTimelineEvent.findFirst({
        where: { sheetId: alpha.id, label: ev.label },
        select: { id: true },
      });
      if (!exists) {
        await appendFollowUpTimeline({
          sheetId: alpha.id,
          authorId: opts.rootUserId,
          kind: ev.kind,
          label: ev.label,
          detail: ev.detail,
          occurredAt: daysAgo(ev.days),
        });
      }
    }
  }

  // À planifier — entité distincte (pas un doublon Victor Hugo)
  let jardins = await prisma.project.findFirst({
    where: {
      clientId: opts.rootUserId,
      title: { contains: "Les Jardins" },
    },
  });
  if (!jardins) {
    jardins = await prisma.project.create({
      data: {
        title: "Résidence Les Jardins",
        clientId: opts.rootUserId,
        organizationId: opts.organizationId,
        status: "EN_COURS",
        siteCity: "Villeurbanne",
        siteAddress: "4 allée des Jardins",
      },
    });
  }

  let ficheJardins = await prisma.followUpSheet.findFirst({
    where: {
      organizationId: opts.organizationId,
      projectId: jardins.id,
    },
  });
  if (!ficheJardins) {
    ficheJardins = await prisma.followUpSheet.create({
      data: {
        ownerUserId: opts.rootUserId,
        createdById: opts.rootUserId,
        assigneeId: karimId,
        organizationId: opts.organizationId,
        projectId: jardins.id,
        title: "Résidence Les Jardins",
        clientName: DEMO_SCENARIO.client.name,
        siteAddress: "4 allée des Jardins, Villeurbanne",
        workObject: "OS reçu — étanchéité toiture-terrasse",
        osNumber: "4612",
        receivedAt: daysAgo(4),
        status: "A_PLANIFIER",
        colorKey: colorKeyForStatus("A_PLANIFIER"),
        nextAction: "Programmer l’intervention",
        nextActionAt: daysAgo(-5),
        nextActionDone: false,
        urgencyOverride: null,
        notes: "Fiche démo — À planifier (attention calculée W3-A).",
      },
    });
    await appendFollowUpTimeline({
      sheetId: ficheJardins.id,
      authorId: opts.rootUserId,
      kind: "creation",
      label: "OS reçu",
      detail: "Résidence Les Jardins — à planifier",
      occurredAt: daysAgo(4),
    });
    await ensureStatutEntry({
      sheetId: ficheJardins.id,
      authorId: opts.rootUserId,
      fromLabel: "OS reçu",
      toLabel: "À planifier",
      occurredAt: daysAgo(2),
    });
  } else {
    await patchSheet({
      sheetId: ficheJardins.id,
      authorId: opts.rootUserId,
      status: "A_PLANIFIER",
      nextAction: "Programmer l’intervention",
      nextActionAt: daysAgo(-5),
      assigneeId: karimId,
      urgencyOverride: null,
      title: "Résidence Les Jardins",
      workObject: "OS reçu — étanchéité toiture-terrasse",
      clientName: DEMO_SCENARIO.client.name,
      // 2 j ≈ delayHours 48 → IMPORTANT (calculé, non forcé)
      daysInStep: 2,
      fromLabel: "OS reçu",
      toLabel: "À planifier",
    });
  }

  await ensureJardinsDemoTasks({
    projectId: jardins.id,
    clientId: opts.rootUserId,
    organizationId: opts.organizationId,
    karimId,
    julieId,
  });

  // W3-C1 : créer les notifications internes (idempotent)
  try {
    await syncAttentionNotificationsForOwner({
      ownerUserId: opts.rootUserId,
      organizationId: opts.organizationId,
    });
  } catch (e) {
    console.error("[demo] syncAttentionNotifications:", e);
  }
}
