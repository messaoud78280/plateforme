import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { AgendaEventType, FollowUpSheetStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveAgendaOwnerUserId } from "@/lib/agenda/access";
import { createNotification } from "@/lib/notifications";
import { appendFollowUpTimeline } from "@/lib/follow-up/timeline";
import { colorKeyForStatus } from "@/lib/follow-up/types";
import {
  messagerieDeepLink,
  parseMessageSchedule,
  suggestBeworkActions,
  type BeworkActionId,
} from "@/lib/messagerie/bework-actions";

type Body = {
  action: BeworkActionId;
  sourceMessageKind: "TASK" | "DIRECT" | "PROJECT";
  sourceMessageId: string;
  title?: string;
  startAt?: string;
  endAt?: string;
  allDay?: boolean;
  assigneeId?: string;
  dueAt?: string;
  priority?: string;
  confirm?: boolean;
};

async function loadSource(kind: string, id: string) {
  if (kind === "TASK") {
    const m = await prisma.taskMessage.findUnique({
      where: { id },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            clientId: true,
            projectId: true,
            organizationId: true,
            project: { select: { id: true, title: true, siteAddress: true } },
          },
        },
        sender: { select: { id: true, name: true } },
      },
    });
    if (!m) return null;
    return {
      content: m.content,
      taskId: m.taskId,
      projectId: m.task.projectId,
      projectTitle: m.task.project?.title ?? m.task.title,
      clientId: m.task.clientId,
      organizationId: m.task.organizationId,
      senderName: m.sender.name,
    };
  }
  if (kind === "DIRECT") {
    const m = await prisma.directMessage.findUnique({
      where: { id },
      include: { sender: { select: { id: true, name: true } } },
    });
    if (!m) return null;
    return {
      content: m.content,
      taskId: null as string | null,
      projectId: null as string | null,
      projectTitle: null as string | null,
      clientId: null as string | null,
      organizationId: null as string | null,
      senderName: m.sender.name,
    };
  }
  if (kind === "PROJECT") {
    const m = await prisma.message.findUnique({
      where: { id },
      include: {
        sender: { select: { id: true, name: true } },
        project: {
          select: {
            id: true,
            title: true,
            clientId: true,
            organizationId: true,
          },
        },
      },
    });
    if (!m) return null;
    return {
      content: m.content,
      taskId: null as string | null,
      projectId: m.projectId,
      projectTitle: m.project.title,
      clientId: m.project.clientId,
      organizationId: m.project.organizationId ?? null,
      senderName: m.sender.name,
    };
  }
  return null;
}

async function postSystemTaskMessage(params: {
  taskId: string;
  actorId: string;
  content: string;
  payload?: Record<string, unknown>;
}) {
  const task = await prisma.task.findUnique({
    where: { id: params.taskId },
    select: { clientId: true, assignedToId: true },
  });
  if (!task) return;
  const receiverId = task.assignedToId ?? task.clientId;
  await prisma.taskMessage.create({
    data: {
      taskId: params.taskId,
      senderId: params.actorId,
      receiverId,
      content: params.content,
      isInternal: false,
      kind: "SYSTEM",
      payloadJson: (params.payload ?? undefined) as object | undefined,
    },
  });
}

/** GET ?content= — suggestions contextuelles */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const url = new URL(request.url);
  const content = url.searchParams.get("content") ?? "";
  const suggestions = suggestBeworkActions(content, {
    media: url.searchParams.get("media") === "1",
  });
  const schedule = parseMessageSchedule(content);
  return NextResponse.json({ suggestions, schedule });
}

/** POST — créer UNE entité métier liée au message (pas de copie multiple). */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = (await request.json()) as Body;
  if (!body.action || !body.sourceMessageKind || !body.sourceMessageId) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const source = await loadSource(body.sourceMessageKind, body.sourceMessageId);
  if (!source) {
    return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
  }

  const ownerUserId = await resolveAgendaOwnerUserId(session.user.id);
  const schedule = parseMessageSchedule(source.content);
  const startAt = body.startAt ? new Date(body.startAt) : schedule.startAt;
  const endAt = body.endAt
    ? new Date(body.endAt)
    : new Date(startAt.getTime() + 60 * 60 * 1000);
  const title =
    body.title?.trim() ||
    source.content.trim().slice(0, 100) ||
    "Action depuis message";
  const allDay = body.allDay ?? schedule.allDay;
  const deepLink = messagerieDeepLink(body.sourceMessageKind, body.sourceMessageId, {
    taskId: source.taskId,
    projectId: source.projectId,
  });

  try {
    // Prévisualisation / confirmation
    if (!body.confirm && ["agenda", "livraison", "intervention"].includes(body.action)) {
      return NextResponse.json({
        preview: true,
        title,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        allDay,
        projectId: source.projectId,
        projectTitle: source.projectTitle,
        sourceExcerpt: source.content.slice(0, 200),
      });
    }

    if (body.action === "agenda" || body.action === "livraison" || body.action === "intervention") {
      const typeMap: Record<string, AgendaEventType> = {
        agenda: "AUTRE",
        livraison: "LIVRAISON",
        intervention: "INTERVENTION",
      };
      const type = typeMap[body.action] ?? "AUTRE";

      let followUpSheetId: string | null = null;
      if (source.projectId && (body.action === "livraison" || body.action === "intervention")) {
        const existing = await prisma.followUpSheet.findFirst({
          where: {
            projectId: source.projectId,
            status: { notIn: ["TERMINE", "ARCHIVE"] },
          },
          orderBy: { updatedAt: "desc" },
          select: { id: true },
        });
        followUpSheetId = existing?.id ?? null;
      }

      const event = await prisma.agendaEvent.create({
        data: {
          ownerUserId,
          createdById: session.user.id,
          title,
          type,
          startAt,
          endAt,
          allDay,
          projectId: source.projectId,
          followUpSheetId,
          organizationId: source.organizationId,
          description: `Source message : ${source.content.slice(0, 500)}`,
          sourceMessageKind: body.sourceMessageKind,
          sourceMessageId: body.sourceMessageId,
          reminderMinutes: 60,
        },
      });

      if (followUpSheetId) {
        await appendFollowUpTimeline({
          sheetId: followUpSheetId,
          authorId: session.user.id,
          kind: "agenda",
          label: title,
          detail: `Créé depuis la messagerie (${type})`,
          occurredAt: startAt,
        });
        if (body.action === "livraison") {
          await prisma.followUpSheet.update({
            where: { id: followUpSheetId },
            data: {
              nextAction: `Réception livraison : ${title}`,
              nextActionAt: startAt,
              nextActionDone: false,
              status: "ATTENTE_FOURNISSEUR",
              colorKey: colorKeyForStatus("ATTENTE_FOURNISSEUR"),
            },
          });
        }
      }

      await prisma.messageAction.create({
        data: {
          sourceMessageKind: body.sourceMessageKind,
          sourceMessageId: body.sourceMessageId,
          type: "LINK",
          status: "DONE",
          title: `${type} créé`,
          createdById: session.user.id,
          agendaEventId: event.id,
          followUpSheetId,
          completedAt: new Date(),
          completedById: session.user.id,
          metaJson: { badge: type === "LIVRAISON" ? "Livraison" : type === "INTERVENTION" ? "Intervention" : "Agenda" },
        },
      });

      if (source.taskId) {
        await postSystemTaskMessage({
          taskId: source.taskId,
          actorId: session.user.id,
          content: `✓ ${type === "LIVRAISON" ? "Livraison" : type === "INTERVENTION" ? "Intervention" : "Événement"} créé dans l’agenda — ${title}`,
          payload: { agendaEventId: event.id, action: body.action },
        });
      }

      return NextResponse.json({
        ok: true,
        agendaEventId: event.id,
        followUpSheetId,
        href: `/dashboard/agenda?event=${event.id}`,
        messageHref: deepLink,
        badge: type === "LIVRAISON" ? "Livraison" : "Agenda",
      });
    }

    if (body.action === "tache" || body.action === "commande" || body.action === "reserve") {
      const clientId = source.clientId ?? ownerUserId;
      const task = await prisma.task.create({
        data: {
          title:
            body.action === "commande"
              ? `Commande — ${title.slice(0, 80)}`
              : body.action === "reserve"
                ? `Réserve — ${title.slice(0, 80)}`
                : title.slice(0, 120),
          description: `Créé depuis message messagerie.\n\n« ${source.content.slice(0, 800)} »`,
          clientId,
          organizationId: source.organizationId ?? undefined,
          projectId: source.projectId ?? undefined,
          category:
            body.action === "commande"
              ? "Bon de commande"
              : body.action === "reserve"
                ? "Réserve chantier"
                : "Tâche chantier",
          priority: body.priority === "URGENT" ? "URGENT" : "PRIORITAIRE",
          desiredDate: body.dueAt ? new Date(body.dueAt) : startAt,
          assignedToId: body.assigneeId || session.user.id,
          createdById: session.user.id,
          sourceMessageKind: body.sourceMessageKind,
          sourceMessageId: body.sourceMessageId,
          status: "EN_COURS",
        },
      });

      await prisma.messageAction.create({
        data: {
          sourceMessageKind: body.sourceMessageKind,
          sourceMessageId: body.sourceMessageId,
          type: "LINK",
          status: "DONE",
          title: body.action === "reserve" ? "Réserve créée" : "Tâche créée",
          createdById: session.user.id,
          taskId: task.id,
          completedAt: new Date(),
          completedById: session.user.id,
          metaJson: {
            badge:
              body.action === "commande"
                ? "Commande"
                : body.action === "reserve"
                  ? "Réserve"
                  : "Tâche",
          },
        },
      });

      if (source.taskId) {
        await postSystemTaskMessage({
          taskId: source.taskId,
          actorId: session.user.id,
          content: `✓ ${
            body.action === "commande"
              ? "Commande"
              : body.action === "reserve"
                ? "Réserve"
                : "Tâche"
          } créée — ${task.title}`,
          payload: { taskId: task.id },
        });
      }

      return NextResponse.json({
        ok: true,
        taskId: task.id,
        href: `/dashboard/taches/${task.id}`,
        badge:
          body.action === "commande"
            ? "Commande"
            : body.action === "reserve"
              ? "Réserve"
              : "Tâche",
      });
    }

    if (
      body.action === "avenant" ||
      body.action === "fiche" ||
      body.action === "travaux_termines" ||
      body.action === "facturer"
    ) {
      const statusMap: Record<string, FollowUpSheetStatus> = {
        avenant: "AVENANT",
        travaux_termines: "TRAVAUX_TERMINES",
        facturer: "A_FACTURER",
        fiche: "A_PLANIFIER",
      };
      const status = statusMap[body.action] ?? "A_PLANIFIER";
      const sheetTitle = source.projectTitle || title.slice(0, 80);

      let sheet = source.projectId
        ? await prisma.followUpSheet.findFirst({
            where: {
              projectId: source.projectId,
              status: { notIn: ["TERMINE", "ARCHIVE"] },
            },
            orderBy: { updatedAt: "desc" },
          })
        : null;

      if (!sheet) {
        sheet = await prisma.followUpSheet.create({
          data: {
            ownerUserId,
            createdById: session.user.id,
            assigneeId: body.assigneeId || session.user.id,
            organizationId: source.organizationId,
            projectId: source.projectId,
            title: sheetTitle,
            clientName: sheetTitle,
            workObject: source.content.slice(0, 200),
            status,
            colorKey: colorKeyForStatus(status),
            nextAction:
              body.action === "avenant"
                ? "Chiffrer l’avenant"
                : body.action === "facturer" || body.action === "travaux_termines"
                  ? "Préparer la facturation"
                  : "Analyser le dossier",
            nextActionAt: body.dueAt ? new Date(body.dueAt) : startAt,
            sourceMessageKind: body.sourceMessageKind,
            sourceMessageId: body.sourceMessageId,
            notes: `Source message : ${source.content.slice(0, 500)}`,
          },
        });
      } else {
        sheet = await prisma.followUpSheet.update({
          where: { id: sheet.id },
          data: {
            status,
            colorKey: colorKeyForStatus(status),
            nextAction:
              body.action === "avenant"
                ? "Chiffrer / relancer avenant"
                : body.action === "facturer" || body.action === "travaux_termines"
                  ? "Préparer la facturation"
                  : sheet.nextAction,
            nextActionAt: body.dueAt ? new Date(body.dueAt) : sheet.nextActionAt ?? startAt,
            nextActionDone: false,
            sourceMessageKind: sheet.sourceMessageKind ?? body.sourceMessageKind,
            sourceMessageId: sheet.sourceMessageId ?? body.sourceMessageId,
          },
        });
      }

      await appendFollowUpTimeline({
        sheetId: sheet.id,
        authorId: session.user.id,
        kind: "messagerie",
        label:
          body.action === "avenant"
            ? "Avenant créé depuis message"
            : body.action === "travaux_termines"
              ? "Travaux marqués terminés depuis message"
              : body.action === "facturer"
                ? "Facturation préparée depuis message"
                : "Fiche mise à jour depuis message",
        detail: source.content.slice(0, 300),
      });

      await prisma.messageAction.create({
        data: {
          sourceMessageKind: body.sourceMessageKind,
          sourceMessageId: body.sourceMessageId,
          type: "LINK",
          status: "DONE",
          title: "Fiche mise à jour",
          createdById: session.user.id,
          followUpSheetId: sheet.id,
          completedAt: new Date(),
          completedById: session.user.id,
          metaJson: {
            badge:
              body.action === "avenant"
                ? "Avenant"
                : body.action === "facturer"
                  ? "Facturation"
                  : "Fiche",
          },
        },
      });

      if (source.taskId) {
        await postSystemTaskMessage({
          taskId: source.taskId,
          actorId: session.user.id,
          content: `✓ Fiche de suivi mise à jour — ${sheet.title} (${status})`,
          payload: { followUpSheetId: sheet.id },
        });
      }

      return NextResponse.json({
        ok: true,
        followUpSheetId: sheet.id,
        href: `/dashboard/fiches-suivi/${sheet.id}`,
        badge:
          body.action === "avenant"
            ? "Avenant"
            : body.action === "facturer"
              ? "Facturation"
              : "Fiche",
      });
    }

    if (body.action === "rappel" || body.action === "assigner") {
      const dueAt = body.dueAt
        ? new Date(body.dueAt)
        : new Date(Date.now() + 24 * 60 * 60 * 1000);
      const assigneeId =
        body.action === "assigner"
          ? body.assigneeId || session.user.id
          : session.user.id;

      const action = await prisma.messageAction.create({
        data: {
          sourceMessageKind: body.sourceMessageKind,
          sourceMessageId: body.sourceMessageId,
          type: body.action === "rappel" ? "REMINDER" : "ASSIGN",
          status: "OPEN",
          title:
            body.action === "rappel"
              ? `Rappel message — ${title.slice(0, 80)}`
              : `À traiter — ${title.slice(0, 80)}`,
          assigneeId,
          dueAt,
          priority: body.priority || "IMPORTANT",
          createdById: session.user.id,
          metaJson: {
            deepLink,
            excerpt: source.content.slice(0, 200),
            projectTitle: source.projectTitle,
          },
        },
      });

      if (assigneeId !== session.user.id) {
        await createNotification({
          userId: assigneeId,
          type: "MESSAGE_ACTION_ASSIGNED",
          title: "Message assigné",
          message: action.title,
          actionUrl: deepLink,
        });
      }

      if (source.taskId && body.action === "assigner") {
        await postSystemTaskMessage({
          taskId: source.taskId,
          actorId: session.user.id,
          content: `→ Message assigné — échéance ${dueAt.toLocaleString("fr-FR")}`,
          payload: { messageActionId: action.id },
        });
      }

      return NextResponse.json({
        ok: true,
        messageActionId: action.id,
        href: "/dashboard/a-traiter",
        badge: body.action === "rappel" ? "Rappel" : "Assigné",
      });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e) {
    console.error("POST /api/messages/actions", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
