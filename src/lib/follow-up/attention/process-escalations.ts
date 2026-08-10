/**
 * W3-C2A — Exécution des rappels / escalades (manuel ou via scheduler W3-C2B).
 * Aucune logique métier de diagnostic ici : consomme W3-A + evaluateAttentionEscalation.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { loadAttentionForSheets } from "@/lib/follow-up/attention/batch";
import { shouldNotifyAttentionLevel } from "@/lib/follow-up/attention/notify-policy";
import { evaluateAttentionEscalation } from "@/lib/follow-up/attention/evaluate-escalation";
import {
  resolveAttentionRecipient,
  syncAttentionNotificationsForSheets,
} from "@/lib/follow-up/attention/sync-notifications";
import { getFollowUpSettings } from "@/lib/follow-up/settings";
import { ensureDefaultWorkflow } from "@/lib/workflow/service";
import type { UrgencyLevel } from "@/lib/follow-up/types";

function isInternalPerson(personType: string | null | undefined): boolean {
  if (!personType) return true;
  return personType === "INTERNAL";
}

function isExternalPerson(personType: string | null | undefined): boolean {
  return personType === "CLIENT_EXT" || personType === "SUPPLIER";
}

/**
 * Destinataire d’escalade dans le même tenant :
 * DIRECTION → SUPERVISEUR/ADMIN équipe → ADMIN/OWNER org → owner interne.
 * Jamais externe, jamais hors organisation.
 */
export async function resolveEscalationRecipient(opts: {
  organizationId: string | null;
  ownerUserId: string;
  responsibleId: string;
}): Promise<string | null> {
  if (!opts.organizationId) {
    if (opts.ownerUserId !== opts.responsibleId) {
      const owner = await prisma.user.findUnique({
        where: { id: opts.ownerUserId },
        select: { id: true, personType: true, permissionProfile: true },
      });
      if (
        owner &&
        isInternalPerson(owner.personType) &&
        !isExternalPerson(owner.personType) &&
        (owner.permissionProfile === "DIRECTION" || !owner.permissionProfile)
      ) {
        return owner.id;
      }
    }
    return null;
  }

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: opts.organizationId },
    select: {
      userId: true,
      role: true,
      user: {
        select: {
          id: true,
          personType: true,
          permissionProfile: true,
          teamRole: true,
        },
      },
    },
  });

  type Cand = {
    id: string;
    personType: string | null;
    permissionProfile: string | null;
    teamRole: string | null;
    orgRole: string;
  };

  const candidates: Cand[] = members
    .filter((m) => m.user.id !== opts.responsibleId)
    .filter((m) => isInternalPerson(m.user.personType))
    .filter((m) => !isExternalPerson(m.user.personType))
    .map((m) => ({
      id: m.user.id,
      personType: m.user.personType,
      permissionProfile: m.user.permissionProfile,
      teamRole: m.user.teamRole,
      orgRole: m.role,
    }));

  const score = (u: Cand) => {
    if (u.permissionProfile === "DIRECTION") return 100;
    if (u.teamRole === "SUPERVISEUR") return 90;
    if (u.teamRole === "ADMIN" || u.orgRole === "ADMIN" || u.orgRole === "OWNER") return 80;
    if (u.id === opts.ownerUserId && isInternalPerson(u.personType)) return 50;
    return 0;
  };

  const ranked = candidates
    .map((u) => ({ u, s: score(u) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);

  return ranked[0]?.u.id ?? null;
}

export type ProcessEscalationsResult = {
  examined: number;
  reminded: number;
  escalated: number;
  skipped: number;
  unchanged: number;
  initialCreated: number;
  errors: string[];
};

function emptyResult(): ProcessEscalationsResult {
  return {
    examined: 0,
    reminded: 0,
    escalated: 0,
    skipped: 0,
    unchanged: 0,
    initialCreated: 0,
    errors: [],
  };
}

/**
 * Traite un périmètre (org et/ou owner).
 * 1) sync W3-C1 (INITIAL)
 * 2) evaluateAttentionEscalation → REMIND / ESCALATE
 */
export async function processAttentionEscalations(opts?: {
  now?: Date;
  ownerUserId?: string;
  organizationId?: string | null;
  take?: number;
}): Promise<ProcessEscalationsResult> {
  const now = opts?.now ?? new Date();
  const result = emptyResult();

  const where: Prisma.FollowUpSheetWhereInput = {
    status: { notIn: ["TERMINE", "ARCHIVE"] },
  };
  if (opts?.ownerUserId) where.ownerUserId = opts.ownerUserId;
  if (opts && "organizationId" in opts) {
    where.organizationId = opts.organizationId ?? null;
  }

  const sheets = await prisma.followUpSheet.findMany({
    where,
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
      assignee: { select: { id: true, name: true, personType: true } },
    },
    take: opts?.take ?? 400,
    orderBy: { updatedAt: "desc" },
  });

  if (sheets.length === 0) return result;

  try {
    const sync = await syncAttentionNotificationsForSheets(
      sheets.map((s) => ({
        id: s.id,
        title: s.title,
        status: s.status,
        nextAction: s.nextAction,
        nextActionAt: s.nextActionAt,
        nextActionDone: s.nextActionDone,
        urgencyOverride: s.urgencyOverride,
        assigneeId: s.assigneeId,
        ownerUserId: s.ownerUserId,
        organizationId: s.organizationId,
      })),
      { now },
    );
    result.initialCreated += sync.created;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    result.errors.push(`sync: ${msg}`);
    console.error("[processAttentionEscalations] sync", e);
  }

  const byOwner = new Map<string, typeof sheets>();
  for (const s of sheets) {
    const list = byOwner.get(s.ownerUserId) ?? [];
    list.push(s);
    byOwner.set(s.ownerUserId, list);
  }

  for (const [ownerUserId, ownerSheets] of byOwner) {
    try {
      const settings = await getFollowUpSettings(ownerUserId);

      const byOrg = new Map<string | null, typeof ownerSheets>();
      for (const s of ownerSheets) {
        const key = s.organizationId ?? null;
        const list = byOrg.get(key) ?? [];
        list.push(s);
        byOrg.set(key, list);
      }

      for (const [orgId, orgSheets] of byOrg) {
        let steps: {
          statusKey: string;
          reminderHours: number | null;
          escalateHours: number | null;
          delayHours: number | null;
        }[] = [];
        if (orgId) {
          try {
            const wf = await ensureDefaultWorkflow(orgId);
            steps = wf.steps.map((s) => ({
              statusKey: s.statusKey,
              reminderHours: s.reminderHours,
              escalateHours: s.escalateHours,
              delayHours: s.delayHours,
            }));
          } catch {
            steps = [];
          }
        }
        const stepByKey = new Map(steps.map((s) => [s.statusKey, s]));

        const { byId: attentionMap, statusEnteredAt, statusEpisodeKey } =
          await loadAttentionForSheets({
            sheets: orgSheets.map((s) => ({
              id: s.id,
              status: s.status,
              title: s.title,
              nextActionAt: s.nextActionAt?.toISOString() ?? null,
              nextActionDone: s.nextActionDone,
              urgencyOverride: s.urgencyOverride,
            })),
            organizationId: orgId,
            thresholds: settings.thresholds,
            now,
          });

        for (const sheet of orgSheets) {
          result.examined += 1;
          try {
            const attention = attentionMap.get(sheet.id);
            if (!attention || !shouldNotifyAttentionLevel(attention.effectiveUrgency)) {
              result.skipped += 1;
              continue;
            }
            const primary = attention.attentionItems[0];
            if (!primary?.code || !attention.primaryReason) {
              result.skipped += 1;
              continue;
            }

            const responsibleId = await resolveAttentionRecipient(sheet);
            if (!responsibleId) {
              result.skipped += 1;
              continue;
            }

            const escalateToId = await resolveEscalationRecipient({
              organizationId: sheet.organizationId,
              ownerUserId: sheet.ownerUserId,
              responsibleId,
            });

            const level = attention.effectiveUrgency as UrgencyLevel;
            const userIds = [responsibleId, escalateToId].filter(Boolean) as string[];
            const existing = await prisma.notification.findMany({
              where: {
                userId: { in: userIds },
                dedupeKey: { contains: `:${sheet.id}:` },
              },
              select: { dedupeKey: true, userId: true, type: true, createdAt: true },
            });

            const scoped = existing.filter((n) => {
              const k = n.dedupeKey ?? "";
              return k.includes(`:${sheet.id}:`);
            });

            const step = stepByKey.get(sheet.status) ?? null;
            const enteredIso = statusEnteredAt.get(sheet.id) ?? null;
            const episode = statusEpisodeKey.get(sheet.id) ?? null;
            const plan = evaluateAttentionEscalation({
              sheetId: sheet.id,
              sheetTitle: sheet.title,
              code: primary.code,
              level,
              primaryReason: attention.primaryReason,
              statusEnteredAt: enteredIso,
              statusEpisodeKey: episode,
              responsibleId,
              escalateToId,
              responsibleName: sheet.assignee?.name ?? null,
              workflowStep: step,
              existingNotifications: scoped,
              now,
            });

            if (
              plan.action === "NONE" ||
              !plan.recipientId ||
              !plan.dedupeKey ||
              !plan.notificationType
            ) {
              result.unchanged += 1;
              continue;
            }

            const recipient = await prisma.user.findUnique({
              where: { id: plan.recipientId },
              select: { id: true, personType: true },
            });
            if (
              !recipient ||
              isExternalPerson(recipient.personType) ||
              !isInternalPerson(recipient.personType)
            ) {
              result.skipped += 1;
              continue;
            }
            if (sheet.organizationId) {
              const membership = await prisma.organizationMember.findFirst({
                where: {
                  organizationId: sheet.organizationId,
                  userId: plan.recipientId,
                },
                select: { id: true },
              });
              if (!membership && plan.recipientId !== sheet.ownerUserId) {
                result.skipped += 1;
                continue;
              }
            }

            const exists = await prisma.notification.findUnique({
              where: { dedupeKey: plan.dedupeKey },
              select: { id: true },
            });
            if (exists) {
              result.unchanged += 1;
              continue;
            }
            await prisma.notification.create({
              data: {
                userId: plan.recipientId,
                type: plan.notificationType,
                title: plan.title ?? "Attention BeWork",
                message: plan.message ?? plan.problemReason,
                actionUrl: `/dashboard/fiches-suivi/${sheet.id}`,
                dedupeKey: plan.dedupeKey,
              },
            });
            if (plan.action === "REMIND") result.reminded += 1;
            else result.escalated += 1;
          } catch (e: unknown) {
            const code =
              e && typeof e === "object" && "code" in e
                ? String((e as { code?: string }).code)
                : "";
            if (code === "P2002") {
              result.unchanged += 1;
            } else {
              const msg = e instanceof Error ? e.message : String(e);
              result.errors.push(`sheet:${sheet.id}`);
              console.error(`[processAttentionEscalations] sheet ${sheet.id}`, msg);
              result.skipped += 1;
            }
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      result.errors.push(`owner:${ownerUserId}`);
      console.error(`[processAttentionEscalations] owner ${ownerUserId}`, msg);
    }
  }

  return result;
}
