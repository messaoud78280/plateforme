/**
 * Mini-seed DEMO SETRIM — max 2 scénarios anti-oubli facturation.
 * Aucun montant €, aucune Invoice fictive.
 */
import { prisma } from "@/lib/prisma";
import { appendFollowUpTimeline } from "@/lib/follow-up/timeline";
import { colorKeyForStatus } from "@/lib/follow-up/types";
import { DEMO_SCENARIO } from "@/lib/demo-environment/scenario";
import { demoPersonaEmail, DEMO_PERSONAS } from "@/lib/demo-environment/personas";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10, 0, 0, 0);
  return d;
}

async function resolveJulieId(opts: {
  rootUserId: string;
  loginIdentifier: string;
}): Promise<string | null> {
  const email = demoPersonaEmail(opts.loginIdentifier, DEMO_PERSONAS.administratif.emailSuffix);
  const julie = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  return julie?.id ?? null;
}

async function ensureSheetStatus(opts: {
  sheetId: string;
  authorId: string;
  status: "A_FACTURER" | "TRAVAUX_TERMINES";
  nextAction: string;
  assigneeId: string | null;
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
      nextActionAt: daysAgo(-2),
      nextActionDone: false,
      urgencyOverride: null,
      ...(opts.assigneeId ? { assigneeId: opts.assigneeId } : {}),
    },
  });

  const existing = await prisma.followUpTimelineEvent.findFirst({
    where: {
      sheetId: opts.sheetId,
      kind: "statut",
      label: { contains: opts.toLabel },
    },
    select: { id: true },
  });
  if (existing) {
    await prisma.followUpTimelineEvent.update({
      where: { id: existing.id },
      data: { occurredAt: daysAgo(opts.daysInStep) },
    });
    return;
  }
  await appendFollowUpTimeline({
    sheetId: opts.sheetId,
    authorId: opts.authorId,
    kind: "statut",
    label: `${opts.fromLabel} → ${opts.toLabel}`,
    detail: "Scénario démo facturation — anti-oubli (V1A-lite)",
    occurredAt: daysAgo(opts.daysInStep),
  });
}

/**
 * Idempotent : crée / aligne au plus 2 fiches (Alpha → A_FACTURER, République → TRAVAUX_TERMINES).
 */
export async function ensureBillingAntiOubliDemo(opts: {
  rootUserId: string;
  organizationId: string;
  loginIdentifier?: string | null;
}): Promise<{ created: string[]; updated: string[] }> {
  const created: string[] = [];
  const updated: string[] = [];
  const login = opts.loginIdentifier?.trim() || "bework-demo";
  const julieId = await resolveJulieId({
    rootUserId: opts.rootUserId,
    loginIdentifier: login,
  });
  const assigneeId = julieId ?? opts.rootUserId;
  const clientName = DEMO_SCENARIO.client.name;

  // 1 — Immeuble Alpha → À facturer
  let alphaProject = await prisma.project.findFirst({
    where: {
      organizationId: opts.organizationId,
      OR: [
        { title: { contains: "Alpha" } },
        { title: { contains: "couverture" } },
      ],
    },
    select: { id: true, title: true },
  });
  if (!alphaProject) {
    alphaProject = await prisma.project.create({
      data: {
        title: "Immeuble Alpha — Lot couverture",
        clientId: opts.rootUserId,
        organizationId: opts.organizationId,
        status: "EN_COURS",
        siteCity: "Lyon",
        siteAddress: "12 rue Alpha",
      },
      select: { id: true, title: true },
    });
    created.push(`project:${alphaProject.id}`);
  }

  let alphaSheet = await prisma.followUpSheet.findFirst({
    where: {
      organizationId: opts.organizationId,
      OR: [
        { projectId: alphaProject.id },
        { title: { contains: "Alpha" } },
      ],
      status: { not: "ARCHIVE" },
    },
    select: { id: true, status: true },
  });
  if (!alphaSheet) {
    alphaSheet = await prisma.followUpSheet.create({
      data: {
        ownerUserId: opts.rootUserId,
        createdById: opts.rootUserId,
        assigneeId,
        organizationId: opts.organizationId,
        projectId: alphaProject.id,
        title: "Immeuble Alpha",
        clientName,
        siteAddress: "12 rue Alpha, Lyon",
        workObject: "Travaux terminés — facturation à préparer",
        osNumber: "4601",
        receivedAt: daysAgo(20),
        status: "A_FACTURER",
        colorKey: colorKeyForStatus("A_FACTURER"),
        nextAction: "Préparer la facture de solde",
        nextActionAt: daysAgo(-2),
        nextActionDone: false,
        notes: "Mini-seed facturation V1A-lite — aucun montant.",
      },
      select: { id: true, status: true },
    });
    created.push(`sheet:${alphaSheet.id}`);
    await appendFollowUpTimeline({
      sheetId: alphaSheet.id,
      authorId: opts.rootUserId,
      kind: "statut",
      label: "Travaux terminés → À facturer",
      detail: "Scénario démo facturation — anti-oubli (V1A-lite)",
      occurredAt: daysAgo(5),
    });
  } else if (alphaSheet.status !== "A_FACTURER") {
    await ensureSheetStatus({
      sheetId: alphaSheet.id,
      authorId: opts.rootUserId,
      status: "A_FACTURER",
      nextAction: "Préparer la facture de solde",
      assigneeId,
      daysInStep: 5,
      fromLabel: "Travaux terminés",
      toLabel: "À facturer",
    });
    updated.push(`sheet:${alphaSheet.id}:A_FACTURER`);
  } else {
    await ensureSheetStatus({
      sheetId: alphaSheet.id,
      authorId: opts.rootUserId,
      status: "A_FACTURER",
      nextAction: "Préparer la facture de solde",
      assigneeId,
      daysInStep: 5,
      fromLabel: "Travaux terminés",
      toLabel: "À facturer",
    });
    updated.push(`sheet:${alphaSheet.id}:refresh`);
  }

  // 2 — République → Travaux terminés
  const repProject = await prisma.project.findFirst({
    where: {
      organizationId: opts.organizationId,
      title: { contains: "République" },
    },
    select: { id: true, title: true },
  });
  if (repProject) {
    let repSheet = await prisma.followUpSheet.findFirst({
      where: {
        organizationId: opts.organizationId,
        projectId: repProject.id,
        status: { not: "ARCHIVE" },
      },
      select: { id: true, status: true },
    });
    if (!repSheet) {
      repSheet = await prisma.followUpSheet.create({
        data: {
          ownerUserId: opts.rootUserId,
          createdById: opts.rootUserId,
          assigneeId,
          organizationId: opts.organizationId,
          projectId: repProject.id,
          title: "Chantier République",
          clientName,
          siteAddress: "Place de la République",
          workObject: "Travaux terminés récemment",
          osNumber: "4590",
          receivedAt: daysAgo(30),
          status: "TRAVAUX_TERMINES",
          colorKey: colorKeyForStatus("TRAVAUX_TERMINES"),
          nextAction: "Préparer la facturation",
          nextActionAt: daysAgo(-3),
          nextActionDone: false,
          notes: "Mini-seed facturation V1A-lite — aucun montant.",
        },
        select: { id: true, status: true },
      });
      created.push(`sheet:${repSheet.id}`);
      await appendFollowUpTimeline({
        sheetId: repSheet.id,
        authorId: opts.rootUserId,
        kind: "statut",
        label: "Intervention → Travaux terminés",
        detail: "Scénario démo facturation — anti-oubli (V1A-lite)",
        occurredAt: daysAgo(4),
      });
    } else {
      await ensureSheetStatus({
        sheetId: repSheet.id,
        authorId: opts.rootUserId,
        status: "TRAVAUX_TERMINES",
        nextAction: "Préparer la facturation",
        assigneeId,
        daysInStep: 4,
        fromLabel: "Intervention",
        toLabel: "Travaux terminés",
      });
      updated.push(`sheet:${repSheet.id}:TRAVAUX_TERMINES`);
    }
  }

  return { created, updated };
}
