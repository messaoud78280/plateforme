import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { AgendaEventType } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessFollowUpSheet, followUpSheetInclude } from "@/lib/follow-up/access";
import { serializeFollowUpSheet } from "@/lib/follow-up/serialize";
import { appendFollowUpTimeline } from "@/lib/follow-up/timeline";
import { getFollowUpSettings } from "@/lib/follow-up/settings";
import { colorKeyForStatus } from "@/lib/follow-up/types";
import { resolveAgendaOwnerUserId } from "@/lib/agenda/access";

type Ctx = { params: Promise<{ id: string }> };

type ActionBody = {
  action:
    | "done"
    | "postpone"
    | "set_next"
    | "quick_event"
    | "quick_status";
  postpone?: "tomorrow" | "2days" | "1week" | "custom";
  customDate?: string;
  nextAction?: string;
  nextActionAt?: string;
  eventType?: string;
  eventTitle?: string;
  eventStartAt?: string;
  status?: string;
};

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** POST /api/follow-up/[id]/actions — marquer fait, reporter, actions rapides */
export async function POST(request: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!(await canAccessFollowUpSheet(session.user, id))) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const body = (await request.json()) as ActionBody;
  const sheet = await prisma.followUpSheet.findUnique({ where: { id } });
  if (!sheet) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  try {
    if (body.action === "done") {
      await prisma.followUpSheet.update({
        where: { id },
        data: { nextActionDone: true },
      });
      await appendFollowUpTimeline({
        sheetId: id,
        authorId: session.user.id,
        kind: "termine",
        label: "Action terminée",
        detail: sheet.nextAction ?? undefined,
      });
    } else if (body.action === "postpone") {
      const from = sheet.nextActionAt ?? new Date();
      let next = new Date();
      if (body.postpone === "tomorrow") next = addDays(new Date(), 1);
      else if (body.postpone === "2days") next = addDays(new Date(), 2);
      else if (body.postpone === "1week") next = addDays(new Date(), 7);
      else if (body.customDate) next = new Date(body.customDate);
      else next = addDays(new Date(), 1);

      if (sheet.nextActionAt) {
        next.setHours(sheet.nextActionAt.getHours(), sheet.nextActionAt.getMinutes(), 0, 0);
      } else {
        next.setHours(9, 0, 0, 0);
      }

      await prisma.followUpSheet.update({
        where: { id },
        data: {
          postponedFromAt: from,
          nextActionAt: next,
          nextActionDone: false,
          postponeCount: { increment: 1 },
        },
      });
      await appendFollowUpTimeline({
        sheetId: id,
        authorId: session.user.id,
        kind: "report",
        label: "Action reportée",
        detail: `De ${from.toLocaleString("fr-FR")} → ${next.toLocaleString("fr-FR")}`,
      });
    } else if (body.action === "set_next") {
      const at = body.nextActionAt ? new Date(body.nextActionAt) : null;
      await prisma.followUpSheet.update({
        where: { id },
        data: {
          nextAction: body.nextAction?.trim() || sheet.nextAction,
          nextActionAt: at && !Number.isNaN(at.getTime()) ? at : sheet.nextActionAt,
          nextActionDone: false,
        },
      });
      await appendFollowUpTimeline({
        sheetId: id,
        authorId: session.user.id,
        kind: "action",
        label: `Prochaine action : ${body.nextAction ?? sheet.nextAction}`,
        occurredAt: at ?? undefined,
      });
    } else if (body.action === "quick_status" && body.status) {
      const status = body.status as typeof sheet.status;
      await prisma.followUpSheet.update({
        where: { id },
        data: {
          status,
          colorKey: colorKeyForStatus(status),
        },
      });
      await appendFollowUpTimeline({
        sheetId: id,
        authorId: session.user.id,
        kind: "statut",
        label: `Statut → ${body.status}`,
      });
    } else if (body.action === "quick_event") {
      const startAt = body.eventStartAt ? new Date(body.eventStartAt) : new Date();
      const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
      const type = (body.eventType || "INTERVENTION") as AgendaEventType;
      const title = body.eventTitle?.trim() || `${type} — ${sheet.title}`;
      const ownerUserId = await resolveAgendaOwnerUserId(session.user.id);

      const event = await prisma.agendaEvent.create({
        data: {
          ownerUserId,
          createdById: session.user.id,
          title,
          type,
          startAt,
          endAt,
          projectId: sheet.projectId,
          followUpSheetId: sheet.id,
          responsibleId: sheet.assigneeId,
          organizationId: sheet.organizationId,
        },
      });

      const statusHints: Partial<Record<string, typeof sheet.status>> = {
        INTERVENTION: "INTERVENTION_PREVUE",
        COMMANDE: "COMMANDE_FOURNISSEUR",
        LIVRAISON: "ATTENTE_FOURNISSEUR",
        FACTURATION: "A_FACTURER",
      };
      const nextStatus = statusHints[type];
      if (nextStatus) {
        await prisma.followUpSheet.update({
          where: { id },
          data: {
            status: nextStatus,
            colorKey: colorKeyForStatus(nextStatus),
            nextAction:
              type === "INTERVENTION"
                ? "Préparer l’intervention"
                : type === "COMMANDE"
                  ? "Suivre la commande fournisseur"
                  : sheet.nextAction,
            nextActionAt: startAt,
            nextActionDone: false,
          },
        });
      }

      await appendFollowUpTimeline({
        sheetId: id,
        authorId: session.user.id,
        kind: "agenda",
        label: title,
        detail: `Événement agenda créé (${type})`,
        occurredAt: startAt,
      });

      const refreshed = await prisma.followUpSheet.findUnique({
        where: { id },
        include: followUpSheetInclude,
      });
      const settings = await getFollowUpSettings(sheet.ownerUserId);
      return NextResponse.json({
        sheet: serializeFollowUpSheet(refreshed!, settings.thresholds),
        eventId: event.id,
      });
    } else {
      return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
    }

    const refreshed = await prisma.followUpSheet.findUnique({
      where: { id },
      include: followUpSheetInclude,
    });
    const settings = await getFollowUpSettings(sheet.ownerUserId);
    return NextResponse.json(serializeFollowUpSheet(refreshed!, settings.thresholds));
  } catch (e) {
    console.error("POST follow-up actions", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
