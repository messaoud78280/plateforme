import { prisma } from "@/lib/prisma";

/**
 * Titres / motifs des Alert seed génériques (pré-W3/CDE).
 * Ne pas y mettre de titres produits par FollowUp / PurchaseOrder Attention.
 */
export const LEGACY_DEMO_ALERT_TITLES = [
  "Action urgente",
  "Commandes à valider",
  "Livraison en retard",
  "Documents manquants",
  "Compte rendu",
] as const;

const LEGACY_MESSAGE_FRAGMENTS = [
  "données fictives",
  "BC-2026-029",
  "scénario démo",
  "bons de commande attendent une validation",
  "actions urgentes à traiter aujourd",
] as const;

/** Types Notification issus des moteurs attention (à conserver). */
function isMetierAttentionNotification(type: string, dedupeKey: string | null): boolean {
  const t = (type ?? "").toUpperCase();
  if (
    t.startsWith("FOLLOWUP_") ||
    t.startsWith("PURCHASE_ORDER_") ||
    t.includes("ESCALATION") ||
    t.includes("REMINDER")
  ) {
    return true;
  }
  if (dedupeKey && (dedupeKey.startsWith("ATTENTION:") || dedupeKey.startsWith("PO:"))) {
    return true;
  }
  return false;
}

async function demoUserIds(opts: {
  rootUserId: string;
  organizationId: string | null;
}): Promise<string[]> {
  const ids = new Set<string>([opts.rootUserId]);
  if (opts.organizationId) {
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: opts.organizationId },
      select: { userId: true },
    });
    for (const m of members) ids.add(m.userId);
  }
  return [...ids];
}

export type CleanupLegacyInboxResult = {
  demoId: string;
  companyName: string;
  alertsDeleted: number;
  notificationsDeleted: number;
  userCount: number;
};

/**
 * Purge inbox legacy **uniquement** pour un DemoEnvironment.
 * Conserve les notifications métier W3 / CDE (types FOLLOWUP_* / PURCHASE_ORDER_* / dedupeKey).
 */
export async function purgeDemoLegacyInbox(demoId: string): Promise<CleanupLegacyInboxResult | null> {
  const demo = await prisma.demoEnvironment.findUnique({
    where: { id: demoId },
    select: {
      id: true,
      companyName: true,
      rootUserId: true,
      organizationId: true,
      status: true,
    },
  });
  if (!demo) return null;

  const userIds = await demoUserIds({
    rootUserId: demo.rootUserId,
    organizationId: demo.organizationId,
  });

  const alertWhere = {
    clientId: { in: userIds },
    OR: [
      { title: { in: [...LEGACY_DEMO_ALERT_TITLES] } },
      ...LEGACY_MESSAGE_FRAGMENTS.map((frag) => ({
        message: { contains: frag, mode: "insensitive" as const },
      })),
    ],
  };

  const alertsDeleted = (await prisma.alert.deleteMany({ where: alertWhere })).count;

  // Notifications sans empreinte W3/CDE et titres legacy (rare — seed créait surtout des Alert)
  const candidates = await prisma.notification.findMany({
    where: {
      userId: { in: userIds },
      OR: [
        { title: { in: [...LEGACY_DEMO_ALERT_TITLES] } },
        ...LEGACY_MESSAGE_FRAGMENTS.map((frag) => ({
          message: { contains: frag, mode: "insensitive" as const },
        })),
      ],
    },
    select: { id: true, type: true, dedupeKey: true },
  });

  const toDelete = candidates
    .filter((n) => !isMetierAttentionNotification(n.type, n.dedupeKey))
    .map((n) => n.id);

  let notificationsDeleted = 0;
  if (toDelete.length > 0) {
    notificationsDeleted = (
      await prisma.notification.deleteMany({ where: { id: { in: toDelete } } })
    ).count;
  }

  return {
    demoId: demo.id,
    companyName: demo.companyName,
    alertsDeleted,
    notificationsDeleted,
    userCount: userIds.length,
  };
}

/** Purge legacy sur tous les environnements de démonstration (jamais les tenants hors DemoEnvironment). */
export async function purgeAllDemoLegacyInboxes(): Promise<CleanupLegacyInboxResult[]> {
  const demos = await prisma.demoEnvironment.findMany({
    where: { status: { not: "ARCHIVED" } },
    select: { id: true },
  });
  const results: CleanupLegacyInboxResult[] = [];
  for (const d of demos) {
    const r = await purgeDemoLegacyInbox(d.id);
    if (r) results.push(r);
  }
  return results;
}
