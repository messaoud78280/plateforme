/**
 * W3-C1 — Synchronisation idempotente des notifications internes d’attention.
 * Ne recalcule pas les règles métier : consomme evaluateFollowUpAttention / loadAttentionForSheets.
 *
 * Clé INITIAL (épisode) : ATTENTION:user:sheet:code:level:episode:INITIAL
 * Compat : si une clé legacy W3-C1 existe pour le même épisode → pas de doublon.
 */
import { prisma } from "@/lib/prisma";
import { loadAttentionForSheets } from "@/lib/follow-up/attention/batch";
import {
  buildLegacyAttentionDedupeKey,
  buildStagedAttentionDedupeKey,
  episodeKeyFromStatusTransition,
} from "@/lib/follow-up/attention/escalation-policy";
import {
  notificationTypeForAttentionLevel,
  shouldNotifyAttentionLevel,
} from "@/lib/follow-up/attention/notify-policy";
import { URGENCY_LABELS, type UrgencyLevel } from "@/lib/follow-up/types";
import { getFollowUpSettings } from "@/lib/follow-up/settings";

type SheetNotifyRow = {
  id: string;
  title: string;
  status: string;
  nextAction: string | null;
  nextActionAt: Date | null;
  nextActionDone: boolean;
  urgencyOverride: string | null;
  assigneeId: string | null;
  ownerUserId: string;
  organizationId: string | null;
};

function isInternalPerson(personType: string | null | undefined): boolean {
  if (!personType) return true; // legacy sans personType = traité comme interne
  return personType === "INTERNAL";
}

/**
 * Destinataire principal (W3-C1, pas d’escalade) :
 * 1. responsable fiche (assignee) s’il est interne
 * 2. propriétaire fiche s’il est interne
 * 3. sinon null (pas de spam dirigeant / admin générique)
 */
export async function resolveAttentionRecipient(sheet: {
  assigneeId: string | null;
  ownerUserId: string;
}): Promise<string | null> {
  if (sheet.assigneeId) {
    const assignee = await prisma.user.findUnique({
      where: { id: sheet.assigneeId },
      select: { id: true, personType: true },
    });
    if (assignee && isInternalPerson(assignee.personType)) return assignee.id;
  }

  const owner = await prisma.user.findUnique({
    where: { id: sheet.ownerUserId },
    select: { id: true, personType: true },
  });
  if (owner && isInternalPerson(owner.personType)) return owner.id;

  return null;
}

export type SyncAttentionResult = {
  examined: number;
  created: number;
  skipped: number;
  unchanged: number;
};

/**
 * Pour chaque fiche : diagnostique W3-A → crée au plus une notif INITIAL par épisode.
 * Idempotent : N appels avec le même état = même base.
 */
export async function syncAttentionNotificationsForSheets(
  sheets: SheetNotifyRow[],
  opts?: { thresholdsOwnerUserId?: string | null; now?: Date },
): Promise<SyncAttentionResult> {
  const result: SyncAttentionResult = {
    examined: sheets.length,
    created: 0,
    skipped: 0,
    unchanged: 0,
  };
  if (sheets.length === 0) return result;

  const ownerId = opts?.thresholdsOwnerUserId ?? sheets[0]?.ownerUserId;
  const settings = ownerId ? await getFollowUpSettings(ownerId) : undefined;

  const { byId, statusEnteredAt, statusEpisodeKey } = await loadAttentionForSheets({
    sheets: sheets.map((s) => ({
      id: s.id,
      status: s.status,
      title: s.title,
      nextActionAt: s.nextActionAt?.toISOString() ?? null,
      nextActionDone: s.nextActionDone,
      urgencyOverride: s.urgencyOverride,
    })),
    organizationId: sheets[0]?.organizationId ?? null,
    thresholds: settings?.thresholds,
    now: opts?.now,
  });

  for (const sheet of sheets) {
    const attention = byId.get(sheet.id);
    if (!attention || !shouldNotifyAttentionLevel(attention.effectiveUrgency)) {
      result.skipped += 1;
      continue;
    }

    const primary = attention.attentionItems[0];
    if (!primary?.code || !attention.primaryReason) {
      result.skipped += 1;
      continue;
    }

    const recipientId = await resolveAttentionRecipient(sheet);
    if (!recipientId) {
      result.skipped += 1;
      continue;
    }

    const level = attention.effectiveUrgency as UrgencyLevel;
    const enteredIso = statusEnteredAt.get(sheet.id) ?? null;
    const episode =
      statusEpisodeKey.get(sheet.id) ??
      episodeKeyFromStatusTransition({ occurredAt: enteredIso });
    const dedupeKey = buildStagedAttentionDedupeKey({
      userId: recipientId,
      sheetId: sheet.id,
      code: primary.code,
      level,
      episode,
      stage: "INITIAL",
    });
    const legacyKey = buildLegacyAttentionDedupeKey({
      userId: recipientId,
      sheetId: sheet.id,
      code: primary.code,
      level,
    });

    const type = notificationTypeForAttentionLevel(level);
    const title = `${URGENCY_LABELS[level]} · ${sheet.title}`;
    const message = attention.primaryReason;
    const actionUrl = `/dashboard/fiches-suivi/${sheet.id}`;

    try {
      const existingStaged = await prisma.notification.findUnique({
        where: { dedupeKey },
        select: { id: true },
      });
      if (existingStaged) {
        result.unchanged += 1;
        continue;
      }

      // Compat W3-C1 : legacy = INITIAL de l’épisode courant uniquement
      const legacy = await prisma.notification.findUnique({
        where: { dedupeKey: legacyKey },
        select: { id: true, createdAt: true },
      });
      if (legacy) {
        const enteredMs = enteredIso ? new Date(enteredIso).getTime() : 0;
        if (!enteredIso || legacy.createdAt.getTime() >= enteredMs - 60_000) {
          result.unchanged += 1;
          continue;
        }
      }

      await prisma.notification.create({
        data: {
          userId: recipientId,
          type,
          title,
          message,
          actionUrl,
          dedupeKey,
        },
      });
      result.created += 1;
    } catch (e: unknown) {
      const code =
        e && typeof e === "object" && "code" in e
          ? String((e as { code?: string }).code)
          : "";
      if (code === "P2002") {
        result.unchanged += 1;
      } else {
        console.error("[syncAttentionNotifications]", e);
        result.skipped += 1;
      }
    }
  }

  return result;
}

/** Sync pour une organisation / propriétaire (pages serveur, POST API). */
export async function syncAttentionNotificationsForOwner(opts: {
  ownerUserId: string;
  organizationId?: string | null;
  /** Si true, ne synchronise que les fiches assignées à cet utilisateur (conducteur). */
  assigneeOnlyId?: string | null;
  take?: number;
  now?: Date;
}): Promise<SyncAttentionResult> {
  const sheets = await prisma.followUpSheet.findMany({
    where: {
      ownerUserId: opts.ownerUserId,
      status: { notIn: ["TERMINE", "ARCHIVE"] },
      ...(opts.organizationId ? { organizationId: opts.organizationId } : {}),
      ...(opts.assigneeOnlyId ? { assigneeId: opts.assigneeOnlyId } : {}),
    },
    select: {
      id: true,
      title: true,
      status: true,
      nextAction: true,
      nextActionAt: true,
      nextActionDone: true,
      urgencyOverride: true,
      assigneeId: true,
      ownerUserId: true,
      organizationId: true,
    },
    take: opts.take ?? 120,
    orderBy: { updatedAt: "desc" },
  });

  return syncAttentionNotificationsForSheets(sheets, {
    thresholdsOwnerUserId: opts.ownerUserId,
    now: opts.now,
  });
}

/** Sync ciblée après mutation d’une fiche. */
export async function syncAttentionNotificationsForSheetId(
  sheetId: string,
): Promise<SyncAttentionResult> {
  const sheet = await prisma.followUpSheet.findUnique({
    where: { id: sheetId },
    select: {
      id: true,
      title: true,
      status: true,
      nextAction: true,
      nextActionAt: true,
      nextActionDone: true,
      urgencyOverride: true,
      assigneeId: true,
      ownerUserId: true,
      organizationId: true,
    },
  });
  if (!sheet || sheet.status === "ARCHIVE" || sheet.status === "TERMINE") {
    return { examined: 0, created: 0, skipped: 0, unchanged: 0 };
  }
  return syncAttentionNotificationsForSheets([sheet], {
    thresholdsOwnerUserId: sheet.ownerUserId,
  });
}
