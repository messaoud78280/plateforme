/**
 * W2-C — Distribue les fiches ABC existantes pour un tableau Kanban lisible.
 * Pas de doublon Victor Hugo. Pas d’alertes automatiques.
 */
import type { FollowUpSheetStatus, FollowUpUrgency } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { appendFollowUpTimeline } from "@/lib/follow-up/timeline";
import { colorKeyForStatus } from "@/lib/follow-up/types";

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
    select: { id: true },
  });
  if (existing) return;
  await appendFollowUpTimeline({
    sheetId: opts.sheetId,
    authorId: opts.authorId,
    kind: "statut",
    label: `${opts.fromLabel} → ${opts.toLabel}`,
    detail: "Répartition démo tableau de suivi",
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

export async function ensureKanbanReadabilityDemo(opts: {
  rootUserId: string;
  organizationId: string;
  karimUserId?: string | null;
}): Promise<void> {
  const karimId = opts.karimUserId ?? opts.rootUserId;

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
    sheets.find((s) => (s.orderNumber ?? "").includes("AV-") && s.title.includes("Victor")) ??
    sheets.find((s) => s.status === "AVENANT" && s.title.includes("Victor Hugo")) ??
    sheets.find((s) => s.status === "AVENANT");

  const victorOs = sheets.find(
    (s) =>
      s.id !== avenant?.id &&
      (s.osNumber === "4587" || s.title.includes("Victor Hugo")) &&
      !s.title.toLowerCase().includes("avenant"),
  );
  const alpha = sheets.find((s) => s.title.includes("Alpha"));
  const republique = sheets.find(
    (s) => s.title.includes("République") && s.id !== avenant?.id,
  );

  if (victorOs) {
    await patchSheet({
      sheetId: victorOs.id,
      authorId: opts.rootUserId,
      status: "INTERVENTION_PREVUE",
      nextAction: "Préparer l’intervention",
      nextActionAt: new Date(2026, 7, 17, 8, 0, 0),
      assigneeId: karimId,
      urgencyOverride: null,
      title: "Résidence Victor Hugo",
      workObject: "OS-4587 — Réfection étanchéité terrasse",
      clientName: "ABC Promotion",
      daysInStep: 2,
      fromLabel: "Fournisseur",
      toLabel: "Intervention",
    });
  }

  if (avenant) {
    await patchSheet({
      sheetId: avenant.id,
      authorId: opts.rootUserId,
      status: "AVENANT",
      nextAction: "En attente client",
      nextActionAt: new Date(2026, 7, 20, 12, 0, 0),
      urgencyOverride: "IMPORTANT",
      assigneeId: opts.rootUserId,
      title: "Avenant n°02 — Victor Hugo",
      workObject: "20 m² terrasse côté cour",
      clientName: "ABC Promotion",
      daysInStep: 5,
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
      nextActionAt: daysAgo(0),
      urgencyOverride: null,
      assigneeId: karimId,
      title: "Chantier République",
      workObject: "Travaux terminés récemment",
      clientName: "ABC Promotion",
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
      nextAction: "Préparer facture",
      nextActionAt: daysAgo(0),
      urgencyOverride: "URGENT",
      assigneeId: opts.rootUserId,
      title: "Immeuble Alpha",
      workObject: "Travaux terminés — facturation",
      clientName: "ABC Promotion",
      daysInStep: 3,
      fromLabel: "Travaux terminés",
      toLabel: "À facturer",
    });
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
        clientName: "ABC Promotion",
        siteAddress: "4 allée des Jardins, Villeurbanne",
        workObject: "OS reçu — étanchéité toiture-terrasse",
        osNumber: "4612",
        receivedAt: daysAgo(1),
        status: "A_PLANIFIER",
        colorKey: colorKeyForStatus("A_PLANIFIER"),
        nextAction: "Programmer l’intervention",
        nextActionAt: daysAgo(-2),
        nextActionDone: false,
        notes: "Fiche démo — colonne À planifier (W2-C).",
      },
    });
    await appendFollowUpTimeline({
      sheetId: ficheJardins.id,
      authorId: opts.rootUserId,
      kind: "creation",
      label: "OS reçu",
      detail: "Résidence Les Jardins — à planifier",
      occurredAt: daysAgo(1),
    });
    await ensureStatutEntry({
      sheetId: ficheJardins.id,
      authorId: opts.rootUserId,
      fromLabel: "OS reçu",
      toLabel: "À planifier",
      occurredAt: daysAgo(1),
    });
  } else {
    await patchSheet({
      sheetId: ficheJardins.id,
      authorId: opts.rootUserId,
      status: "A_PLANIFIER",
      nextAction: "Programmer l’intervention",
      nextActionAt: daysAgo(-2),
      assigneeId: karimId,
      urgencyOverride: null,
      title: "Résidence Les Jardins",
      workObject: "OS reçu — étanchéité toiture-terrasse",
      clientName: "ABC Promotion",
      daysInStep: 1,
      fromLabel: "OS reçu",
      toLabel: "À planifier",
    });
  }
}
