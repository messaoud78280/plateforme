import { prisma } from "@/lib/prisma";
import {
  canAccessProjectMessaging,
  canAccessTaskThread,
  directMessageParticipantWhere,
} from "@/lib/messaging/access";
import { type MessageChannel } from "@/lib/equipe-acces/nav-by-persona";
import {
  isMessagerieMediaPath,
  parseMessagerieStorageRef,
} from "@/lib/messagerie/media-storage";
import type { MsgAttachment } from "@/lib/messagerie/media-preview";

export type MessagerieMessageKind = "TASK" | "DIRECT" | "PROJECT";

type UserCtx = { id: string; role?: string | null };

function attachmentMatches(atts: unknown, fileUrl: string): boolean {
  if (!Array.isArray(atts)) return false;
  const target = parseMessagerieStorageRef(fileUrl);
  return (atts as MsgAttachment[]).some((a) => {
    if (!a?.fileUrl) return false;
    if (a.fileUrl === fileUrl) return true;
    if (a.storagePath && target?.path === a.storagePath) return true;
    const other = parseMessagerieStorageRef(a.fileUrl);
    return Boolean(target && other && target.bucket === other.bucket && target.path === other.path);
  });
}

/**
 * Vérifie qu’un utilisateur peut lire le média d’un message donné.
 * Même barrière qu’un message texte + appartenance de la PJ au message.
 */
export async function canAccessMessagerieMedia(
  user: UserCtx,
  params: {
    messageKind: MessagerieMessageKind;
    messageId: string;
    fileUrl: string;
  },
): Promise<{ ok: true; bucket: string; path: string } | { ok: false; status: number; error: string }> {
  const parsed = parseMessagerieStorageRef(params.fileUrl);
  if (!parsed || !isMessagerieMediaPath(parsed.bucket, parsed.path)) {
    return { ok: false, status: 400, error: "Référence média invalide." };
  }

  if (params.messageKind === "TASK") {
    const m = await prisma.taskMessage.findUnique({
      where: { id: params.messageId },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        isInternal: true,
        attachmentsJson: true,
        task: {
          select: { id: true, clientId: true, assignedToId: true },
        },
      },
    });
    if (!m) return { ok: false, status: 404, error: "Message introuvable." };
    if (!attachmentMatches(m.attachmentsJson, params.fileUrl)) {
      return { ok: false, status: 403, error: "Pièce jointe non liée à ce message." };
    }
    const threadOk = await canAccessTaskThread(user, m.task);
    if (!threadOk) {
      return { ok: false, status: 403, error: "Non autorisé." };
    }
    if (m.isInternal && user.role === "CLIENT") {
      return { ok: false, status: 403, error: "Note interne — accès refusé." };
    }
    // Client : uniquement fil non interne (déjà filtré) ; staff OK
    if (user.role === "CLIENT") {
      // doit être participant métier du fil public
      return { ok: true, bucket: parsed.bucket, path: parsed.path };
    }
    return { ok: true, bucket: parsed.bucket, path: parsed.path };
  }

  if (params.messageKind === "DIRECT") {
    const m = await prisma.directMessage.findFirst({
      where: {
        id: params.messageId,
        ...directMessageParticipantWhere(user.id),
      },
      select: { id: true, attachmentsJson: true, senderId: true, receiverId: true },
    });
    if (!m) return { ok: false, status: 403, error: "Non autorisé." };
    if (!attachmentMatches(m.attachmentsJson, params.fileUrl)) {
      return { ok: false, status: 403, error: "Pièce jointe non liée à ce message." };
    }
    return { ok: true, bucket: parsed.bucket, path: parsed.path };
  }

  if (params.messageKind === "PROJECT") {
    const m = await prisma.message.findUnique({
      where: { id: params.messageId },
      select: {
        id: true,
        channel: true,
        attachmentsJson: true,
        senderId: true,
        receiverId: true,
        project: {
          select: {
            id: true,
            clientId: true,
            assignedToId: true,
            organizationId: true,
          },
        },
      },
    });
    if (!m) return { ok: false, status: 404, error: "Message introuvable." };
    if (!attachmentMatches(m.attachmentsJson, params.fileUrl)) {
      return { ok: false, status: 403, error: "Pièce jointe non liée à ce message." };
    }

    const projectOk = await canAccessProjectMessaging(user, m.project);
    if (!projectOk) {
      return { ok: false, status: 403, error: "Non autorisé." };
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { personType: true },
    });
    const channel = (m.channel || "CLIENT") as MessageChannel;
    const { visibleMessageChannels } = await import("@/lib/equipe-acces/nav-by-persona");
    const visible = visibleMessageChannels(dbUser?.personType ?? null, user.role);
    if (!visible.includes(channel)) {
      return { ok: false, status: 403, error: "Canal non autorisé." };
    }

    // Interne : jamais un profil externe
    if (channel === "INTERNE") {
      const pt = dbUser?.personType;
      if (
        user.role === "CLIENT" &&
        (pt === "CLIENT" || pt === "FOURNISSEUR" || pt === "SOUS_TRAITANT" || pt === "PARTENAIRE")
      ) {
        return { ok: false, status: 403, error: "Fil interne — accès refusé." };
      }
    }

    return { ok: true, bucket: parsed.bucket, path: parsed.path };
  }

  return { ok: false, status: 400, error: "Type de message invalide." };
}
