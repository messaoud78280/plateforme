/**
 * Résolution d’URL Messagerie sans créer de doublon.
 * V2C.6 : privilégier channelId ; legacy channel=INTERNE|CLIENT|FOURNISSEUR conservé.
 * NOTIF-DEEPLINK-V1 : une notification ouvre exactement la conversation source.
 */

export type MessageChannel = "INTERNE" | "CLIENT" | "FOURNISSEUR" | "SOUS_TRAITANT";

export type ConversationContext =
  | {
      kind: "project_channel";
      projectId: string;
      channel: MessageChannel;
      channelId?: string;
      externalOrganizationId?: string | null;
      messageId?: string;
    }
  | {
      kind: "purchase_order";
      projectId: string | null | undefined;
      supplierName?: string | null;
      externalOrganizationId?: string | null;
    }
  | {
      kind: "follow_up";
      projectId: string | null | undefined;
      sheetId?: string;
    }
  | {
      kind: "task";
      taskId: string;
      messageId?: string;
    }
  | {
      kind: "direct";
      userId: string;
      messageId?: string;
    }
  | {
      kind: "inbox";
    };

/** Peer d’un DirectMessage pour l’utilisateur courant (jamais soi-même). */
export function resolveDirectPeerUserId(opts: {
  senderId: string;
  receiverId: string;
  currentUserId: string;
}): string | null {
  const { senderId, receiverId, currentUserId } = opts;
  if (!senderId || !receiverId || !currentUserId) return null;
  if (senderId === currentUserId && receiverId === currentUserId) return null;
  if (senderId === currentUserId) return receiverId === currentUserId ? null : receiverId;
  if (receiverId === currentUserId) return senderId === currentUserId ? null : senderId;
  return null;
}

export type MessageNotificationSource =
  | {
      sourceType: "DIRECT";
      senderId: string;
      receiverId: string;
      /** Destinataire de la notification (= utilisateur qui clique « Voir »). */
      notifyUserId: string;
      messageId?: string;
    }
  | {
      sourceType: "TASK";
      taskId: string;
      messageId?: string;
    }
  | {
      sourceType: "PROJECT_CHANNEL";
      projectId: string;
      channelId: string;
      channel?: MessageChannel;
      messageId?: string;
    };

/**
 * Href unique pour une notification / toast message.
 * Fallback inbox si la source est incomplète (pas d’autre conversation arbitraire).
 */
export function resolveMessageNotificationHref(
  source: MessageNotificationSource,
): string {
  switch (source.sourceType) {
    case "DIRECT": {
      const peer = resolveDirectPeerUserId({
        senderId: source.senderId,
        receiverId: source.receiverId,
        currentUserId: source.notifyUserId,
      });
      if (!peer) return resolveConversationHref({ kind: "inbox" });
      return resolveConversationHref({
        kind: "direct",
        userId: peer,
        messageId: source.messageId,
      });
    }
    case "TASK": {
      if (!source.taskId) return resolveConversationHref({ kind: "inbox" });
      return resolveConversationHref({
        kind: "task",
        taskId: source.taskId,
        messageId: source.messageId,
      });
    }
    case "PROJECT_CHANNEL": {
      if (!source.projectId || !source.channelId) {
        return resolveConversationHref({ kind: "inbox" });
      }
      return resolveConversationHref({
        kind: "project_channel",
        projectId: source.projectId,
        channelId: source.channelId,
        channel: source.channel ?? "CLIENT",
        messageId: source.messageId,
      });
    }
    default:
      return resolveConversationHref({ kind: "inbox" });
  }
}

/** Construit l’href unique pour ouvrir la conversation pertinente. */
export function resolveConversationHref(ctx: ConversationContext): string {
  switch (ctx.kind) {
    case "project_channel": {
      const q = new URLSearchParams({
        view: "chantiers",
        project: ctx.projectId,
      });
      if (ctx.channelId) {
        q.set("channelId", ctx.channelId);
      } else {
        q.set("channel", ctx.channel);
        if (ctx.externalOrganizationId) {
          q.set("externalOrganizationId", ctx.externalOrganizationId);
        }
      }
      if (ctx.messageId) q.set("messageId", ctx.messageId);
      return `/dashboard/messagerie?${q.toString()}`;
    }
    case "purchase_order": {
      if (ctx.projectId) {
        const q = new URLSearchParams({
          view: "chantiers",
          project: ctx.projectId,
          channel: "FOURNISSEUR",
        });
        if (ctx.externalOrganizationId) {
          q.set("externalOrganizationId", ctx.externalOrganizationId);
        }
        return `/dashboard/messagerie?${q.toString()}`;
      }
      return `/dashboard/messagerie?view=chantiers&channel=FOURNISSEUR`;
    }
    case "follow_up":
      if (ctx.projectId) {
        return `/dashboard/messagerie?view=chantiers&project=${encodeURIComponent(ctx.projectId)}&channel=INTERNE`;
      }
      return `/dashboard/messagerie`;
    case "task": {
      const q = new URLSearchParams({ task: ctx.taskId });
      if (ctx.messageId) q.set("messageId", ctx.messageId);
      return `/dashboard/messagerie?${q.toString()}`;
    }
    case "direct": {
      const q = new URLSearchParams({
        with: ctx.userId,
      });
      if (ctx.messageId) q.set("messageId", ctx.messageId);
      return `/dashboard/messagerie?${q.toString()}`;
    }
    case "inbox":
    default:
      return "/dashboard/messagerie";
  }
}

/** Alias métier — même résolution d’URL, sans création de doublon. */
export function resolveConversationForContext(ctx: ConversationContext): string {
  return resolveConversationHref(ctx);
}

export function projectTeamHref(projectId: string) {
  return resolveConversationHref({ kind: "project_channel", projectId, channel: "INTERNE" });
}

export function projectClientHref(projectId: string) {
  return resolveConversationHref({ kind: "project_channel", projectId, channel: "CLIENT" });
}

export function projectSupplierHref(
  projectId: string,
  externalOrganizationId?: string | null,
) {
  return resolveConversationHref({
    kind: "project_channel",
    projectId,
    channel: "FOURNISSEUR",
    externalOrganizationId: externalOrganizationId ?? null,
  });
}
