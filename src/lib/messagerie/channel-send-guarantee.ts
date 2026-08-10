/**
 * MESSAGERIE-RECETTE-V1 — Garantie serveur :
 * message canal ⇒ auteur participant (pas de fantôme, pas de message sans membership).
 *
 * Join + create message dans une même transaction Prisma.
 */
import { prisma } from "@/lib/prisma";
import type { MessageChannel } from "@/lib/equipe-acces/nav-by-persona";
import type { MsgAttachment } from "@/lib/messagerie/media-preview";

export class ChannelSendMembershipError extends Error {
  readonly code = "CHANNEL_MEMBERSHIP_REQUIRED" as const;
  constructor(
    message = "Impossible de rejoindre la conversation. Le message n’a pas été envoyé.",
  ) {
    super(message);
    this.name = "ChannelSendMembershipError";
  }
}

/** Invariant testable sans DB. */
export function assertChannelSendMembershipInvariant(opts: {
  messageCreated: boolean;
  senderIsParticipant: boolean;
}): { ok: true } | { ok: false; reason: string } {
  if (opts.messageCreated && !opts.senderIsParticipant) {
    return { ok: false, reason: "message créé sans membership auteur" };
  }
  return { ok: true };
}

type CreateParams = {
  channelId: string;
  projectId: string;
  senderId: string;
  receiverId: string;
  content: string;
  legacyChannel: MessageChannel;
  attachments?: MsgAttachment[];
  /** Destinataires notif (hors auteur) — calculés après join dans la tx. */
};

/**
 * Upsert membership auteur (+ destinataire technique) puis crée le message
 * et les receipts dans la même transaction.
 * Si le join auteur échoue → aucune création de message.
 */
export async function createChannelMessageWithSenderMembership(params: CreateParams) {
  return prisma.$transaction(async (tx) => {
    await tx.projectChannelParticipant.upsert({
      where: {
        channelId_userId: {
          channelId: params.channelId,
          userId: params.senderId,
        },
      },
      create: {
        channelId: params.channelId,
        userId: params.senderId,
      },
      update: {},
    });

    const membership = await tx.projectChannelParticipant.findUnique({
      where: {
        channelId_userId: {
          channelId: params.channelId,
          userId: params.senderId,
        },
      },
      select: { id: true },
    });
    if (!membership) {
      throw new ChannelSendMembershipError();
    }

    if (params.receiverId !== params.senderId) {
      await tx.projectChannelParticipant.upsert({
        where: {
          channelId_userId: {
            channelId: params.channelId,
            userId: params.receiverId,
          },
        },
        create: {
          channelId: params.channelId,
          userId: params.receiverId,
        },
        update: {},
      });
    }

    const message = await tx.message.create({
      data: {
        content: params.content,
        projectId: params.projectId,
        senderId: params.senderId,
        receiverId: params.receiverId,
        channel: params.legacyChannel,
        channelId: params.channelId,
        ...(params.attachments && params.attachments.length > 0
          ? { attachmentsJson: params.attachments }
          : {}),
      },
      include: {
        project: { select: { id: true, title: true } },
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
        projectChannel: {
          select: {
            id: true,
            type: true,
            externalOrganizationId: true,
          },
        },
      },
    });

    const notifyRows = await tx.projectChannelParticipant.findMany({
      where: {
        channelId: params.channelId,
        userId: { not: params.senderId },
        user: { accessStatus: { in: ["ACTIVE", "INVITED"] } },
      },
      select: { userId: true },
    });
    const notifyUserIds = notifyRows.map((r) => r.userId);

    if (notifyUserIds.length > 0) {
      await tx.messageChannelReceipt.createMany({
        data: notifyUserIds.map((userId) => ({
          messageId: message.id,
          userId,
          read: false,
        })),
        skipDuplicates: true,
      });
    }

    const invariant = assertChannelSendMembershipInvariant({
      messageCreated: true,
      senderIsParticipant: true,
    });
    if (!invariant.ok) {
      throw new ChannelSendMembershipError(invariant.reason);
    }

    return { message, notifyUserIds };
  });
}
