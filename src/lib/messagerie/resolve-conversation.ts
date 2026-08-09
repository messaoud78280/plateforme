/**
 * Résolution d’URL Messagerie sans créer de doublon.
 * Les fils chantier existent déjà via Message.channel (INTERNE|CLIENT|FOURNISSEUR).
 * Les directs / missions via query params existants.
 */

export type MessageChannel = "INTERNE" | "CLIENT" | "FOURNISSEUR";

export type ConversationContext =
  | {
      kind: "project_channel";
      projectId: string;
      channel: MessageChannel;
    }
  | {
      kind: "purchase_order";
      projectId: string | null | undefined;
      supplierName?: string | null;
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
    case "project_channel":
      return `/dashboard/messagerie?view=chantiers&project=${encodeURIComponent(ctx.projectId)}&channel=${ctx.channel}`;
    case "purchase_order":
      if (ctx.projectId) {
        return `/dashboard/messagerie?view=chantiers&project=${encodeURIComponent(ctx.projectId)}&channel=FOURNISSEUR`;
      }
      return `/dashboard/messagerie?view=chantiers&channel=FOURNISSEUR`;
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
        tab: "messages-directs",
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

export function projectSupplierHref(projectId: string) {
  return resolveConversationHref({ kind: "project_channel", projectId, channel: "FOURNISSEUR" });
}
