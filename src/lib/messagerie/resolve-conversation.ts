/**
 * Résolution d’URL Messagerie sans créer de doublon.
 * V2C.6 : privilégier channelId ; legacy channel=INTERNE|CLIENT|FOURNISSEUR conservé.
 */

export type MessageChannel = "INTERNE" | "CLIENT" | "FOURNISSEUR" | "SOUS_TRAITANT";

export type ConversationContext =
  | {
      kind: "project_channel";
      projectId: string;
      channel: MessageChannel;
      channelId?: string;
      externalOrganizationId?: string | null;
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
