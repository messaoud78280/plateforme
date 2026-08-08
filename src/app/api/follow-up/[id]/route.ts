import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { FollowUpSheetStatus, FollowUpUrgency } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessFollowUpSheet, followUpSheetInclude } from "@/lib/follow-up/access";
import { colorKeyForStatus } from "@/lib/follow-up/types";
import { serializeFollowUpSheet } from "@/lib/follow-up/serialize";
import { appendFollowUpTimeline } from "@/lib/follow-up/timeline";
import { getFollowUpSettings } from "@/lib/follow-up/settings";
import {
  getWorkflowForSheet,
  resolveStatusLabel,
  transitionDefaultsFromWorkflow,
} from "@/lib/workflow/service";

type Ctx = { params: Promise<{ id: string }> };

const VALID_STATUS = new Set([
  "NOUVEAU",
  "A_ANALYSER",
  "A_PLANIFIER",
  "PLANIFIE",
  "COMMANDE_FOURNISSEUR",
  "COMMANDE_PASSEE",
  "ATTENTE_FOURNISSEUR",
  "INTERVENTION_PREVUE",
  "EN_COURS",
  "TRAVAUX_TERMINES",
  "CR_A_RECUPERER",
  "AVENANT",
  "A_FACTURER",
  "FACTURE",
  "ATTENTE_REGLEMENT",
  "TERMINE",
  "ARCHIVE",
]);

const VALID_URGENCY = new Set(["NORMAL", "A_SURVEILLER", "IMPORTANT", "URGENT", "CRITIQUE"]);

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!(await canAccessFollowUpSheet(session.user, id))) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const sheet = await prisma.followUpSheet.findUnique({
    where: { id },
    include: followUpSheetInclude,
  });
  if (!sheet) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const settings = await getFollowUpSettings(sheet.ownerUserId);
  return NextResponse.json(serializeFollowUpSheet(sheet, settings.thresholds));
}

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!(await canAccessFollowUpSheet(session.user, id))) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const existing = await prisma.followUpSheet.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const data: Record<string, unknown> = {};
  const fields = [
    "title",
    "clientName",
    "marketLabel",
    "siteAddress",
    "workObject",
    "orderNumber",
    "osNumber",
    "reference",
    "notes",
    "nextAction",
    "projectId",
    "assigneeId",
    "colorKey",
  ] as const;

  for (const f of fields) {
    if (body[f] !== undefined) {
      data[f] = body[f] === null || body[f] === "" ? null : String(body[f]);
    }
  }
  if (body.nextActionAt !== undefined) {
    data.nextActionAt = body.nextActionAt ? new Date(String(body.nextActionAt)) : null;
  }
  if (body.receivedAt !== undefined) {
    data.receivedAt = body.receivedAt ? new Date(String(body.receivedAt)) : null;
  }
  if (body.nextActionDone !== undefined) {
    data.nextActionDone = Boolean(body.nextActionDone);
  }
  if (body.status && VALID_STATUS.has(String(body.status))) {
    const nextStatus = String(body.status) as FollowUpSheetStatus;
    data.status = nextStatus;
    if (String(body.status) !== existing.status) {
      const workflow = await getWorkflowForSheet({
        workflowId: existing.workflowId,
        organizationId: existing.organizationId,
        ownerUserId: existing.ownerUserId,
      });
      const defaults = transitionDefaultsFromWorkflow(nextStatus, workflow, {
        keepNextAction: body.nextAction !== undefined,
        keepColor: body.colorKey !== undefined,
      });
      if (defaults.colorKey !== undefined) data.colorKey = defaults.colorKey;
      if (defaults.nextAction !== undefined) data.nextAction = defaults.nextAction;
      if (defaults.nextActionAt !== undefined) data.nextActionAt = defaults.nextActionAt;
      if (defaults.nextActionDone !== undefined) data.nextActionDone = defaults.nextActionDone;
    } else if (body.colorKey === undefined) {
      data.colorKey = colorKeyForStatus(nextStatus);
    }
  }
  if (body.urgencyOverride !== undefined) {
    const u = body.urgencyOverride;
    data.urgencyOverride =
      u && VALID_URGENCY.has(String(u)) ? (String(u) as FollowUpUrgency) : null;
  }
  if (body.reminderOffsets !== undefined) {
    data.reminderOffsets = Array.isArray(body.reminderOffsets)
      ? body.reminderOffsets.map(Number)
      : body.reminderOffsets;
  }
  if (body.amountHt !== undefined) {
    data.amountHt = body.amountHt === null || body.amountHt === "" ? null : Number(body.amountHt);
  }

  const sheet = await prisma.followUpSheet.update({
    where: { id },
    data,
    include: followUpSheetInclude,
  });

  if (body.status && String(body.status) !== existing.status) {
    const workflow = await getWorkflowForSheet({
      workflowId: sheet.workflowId,
      organizationId: sheet.organizationId,
      ownerUserId: sheet.ownerUserId,
    });
    const label = resolveStatusLabel(String(body.status), workflow);
    await appendFollowUpTimeline({
      sheetId: id,
      authorId: session.user.id,
      kind: "statut",
      label: `Statut → ${label}`,
      detail: String(body.status),
    });
  }
  if (body.nextAction && String(body.nextAction) !== (existing.nextAction ?? "")) {
    await appendFollowUpTimeline({
      sheetId: id,
      authorId: session.user.id,
      kind: "action",
      label: `Prochaine action : ${String(body.nextAction)}`,
      occurredAt: sheet.nextActionAt ?? undefined,
    });
  }

  const settings = await getFollowUpSettings(sheet.ownerUserId);
  return NextResponse.json(serializeFollowUpSheet(sheet, settings.thresholds));
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!(await canAccessFollowUpSheet(session.user, id))) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  await prisma.followUpSheet.update({
    where: { id },
    data: { status: "ARCHIVE" },
  });
  await appendFollowUpTimeline({
    sheetId: id,
    authorId: session.user.id,
    kind: "statut",
    label: "Fiche archivée",
  });
  return NextResponse.json({ ok: true });
}
