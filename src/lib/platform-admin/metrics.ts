/**
 * Métriques d’activation SaaS pour l’admin plateforme (comptages uniquement).
 */

import { prisma } from "@/lib/prisma";
import {
  daysRemainingInTrial,
  effectiveSaasStatus,
} from "@/lib/organization/lifecycle";

export type ActivationBand =
  | "faible"
  | "en_cours"
  | "bien_engage"
  | "tres_engage";

export function activationBand(percent: number): ActivationBand {
  if (percent <= 25) return "faible";
  if (percent <= 60) return "en_cours";
  if (percent <= 80) return "bien_engage";
  return "tres_engage";
}

export function activationBandLabel(band: ActivationBand): string {
  switch (band) {
    case "faible":
      return "Faible activation";
    case "en_cours":
      return "En cours";
    case "bien_engage":
      return "Bien engagé";
    case "tres_engage":
      return "Très engagé";
  }
}

const WEIGHTS = {
  company: 15,
  client: 10,
  project: 20,
  quote: 20,
  member: 15,
  document: 10,
  multiDay: 10,
} as const;

export type OrgActivationScore = {
  percent: number;
  band: ActivationBand;
  bandLabel: string;
  points: number;
  maxPoints: number;
  flags: {
    company: boolean;
    client: boolean;
    project: boolean;
    quote: boolean;
    member: boolean;
    document: boolean;
    multiDay: boolean;
  };
  counts: {
    members: number;
    clients: number;
    projects: number;
    quotes: number;
    documents: number;
    purchaseOrders: number;
  };
};

export async function scoreOrganizationActivation(
  organizationId: string,
): Promise<OrgActivationScore> {
  const [
    org,
    clientExtCount,
    projectCount,
    quoteCount,
    documentCount,
    memberCount,
    poCount,
    distinctLoginDays,
  ] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        name: true,
        siret: true,
        onboardingCompletedAt: true,
        commercialOrgSettings: { select: { id: true } },
        owner: { select: { lastLoginAt: true, createdAt: true } },
      },
    }),
    prisma.externalOrganization.count({
      where: { hostOrganizationId: organizationId, type: "CLIENT_EXT" },
    }),
    prisma.project.count({ where: { organizationId } }),
    prisma.commercialQuote.count({ where: { organizationId } }),
    prisma.chantierFile.count({
      where: {
        deletedAt: null,
        OR: [{ organizationId }, { project: { organizationId } }],
      },
    }),
    prisma.organizationMember.count({
      where: { organizationId, status: "ACTIVE" },
    }),
    prisma.purchaseOrder.count({ where: { organizationId } }),
    // Approximation « plusieurs jours » via lastLogin owner vs createdAt (léger)
    Promise.resolve(0),
  ]);

  const company = Boolean(
    org?.onboardingCompletedAt ||
      org?.siret ||
      org?.commercialOrgSettings?.id ||
      (org?.name && org.name.trim().length > 2),
  );
  const client = clientExtCount > 0 || projectCount > 0;
  const project = projectCount > 0;
  const quote = quoteCount > 0;
  const member = memberCount > 1;
  const document = documentCount > 0;

  const ownerCreated = org?.owner?.createdAt?.getTime() ?? 0;
  const ownerLogin = org?.owner?.lastLoginAt?.getTime() ?? 0;
  const multiDay =
    ownerLogin > 0 &&
    ownerCreated > 0 &&
    ownerLogin - ownerCreated > 20 * 60 * 60 * 1000;

  void distinctLoginDays;

  const flags = { company, client, project, quote, member, document, multiDay };
  let points = 0;
  if (company) points += WEIGHTS.company;
  if (client) points += WEIGHTS.client;
  if (project) points += WEIGHTS.project;
  if (quote) points += WEIGHTS.quote;
  if (member) points += WEIGHTS.member;
  if (document) points += WEIGHTS.document;
  if (multiDay) points += WEIGHTS.multiDay;
  const maxPoints = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  const percent = Math.round((points / maxPoints) * 100);
  const band = activationBand(percent);

  return {
    percent,
    band,
    bandLabel: activationBandLabel(band),
    points,
    maxPoints,
    flags,
    counts: {
      members: memberCount,
      clients: clientExtCount,
      projects: projectCount,
      quotes: quoteCount,
      documents: documentCount,
      purchaseOrders: poCount,
    },
  };
}

export function formatRelativeActivity(date: Date | null | undefined): string {
  if (!date) return "Jamais";
  const ms = Date.now() - date.getTime();
  if (ms < 0) return "À l’instant";
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "À l’instant";
  if (min < 60) return `Il y a ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) {
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    if (date >= startToday) return "Aujourd’hui";
    return `Il y a ${hours} h`;
  }
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hier";
  if (days < 14) return `Il y a ${days} jours`;
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function getPlatformOverviewKpis() {
  const orgs = await prisma.organization.findMany({
    where: { kind: "STANDARD" },
    select: {
      id: true,
      saasStatus: true,
      trialStartedAt: true,
      trialEndsAt: true,
      createdAt: true,
      name: true,
    },
  });

  let trials = 0;
  let active = 0;
  let expired = 0;
  let suspended = 0;

  for (const o of orgs) {
    const st = effectiveSaasStatus(o);
    if (st === "TRIAL") trials += 1;
    else if (st === "ACTIVE") active += 1;
    else if (st === "TRIAL_EXPIRED") expired += 1;
    else if (st === "SUSPENDED") suspended += 1;
  }

  const userCount = await prisma.user.count({
    where: {
      OR: [
        { organizationMemberships: { some: { organization: { kind: "STANDARD" } } } },
        { organizationsOwned: { some: { kind: "STANDARD" } } },
      ],
    },
  });

  return {
    organizations: orgs.length,
    trials,
    active,
    expired,
    suspended,
    users: userCount,
  };
}

export type OrgListRow = {
  id: string;
  name: string;
  kind: string;
  saasStatus: string;
  effectiveStatus: string;
  trialEndsAt: Date | null;
  trialDaysRemaining: number | null;
  createdAt: Date;
  ownerName: string | null;
  ownerEmail: string | null;
  memberCount: number;
  activationPercent: number;
  activationBand: ActivationBand;
  lastActivityAt: Date | null;
  lastActivityLabel: string;
};

export async function listStandardOrganizations(opts?: {
  q?: string;
  status?: string;
  trialOnly?: boolean;
  take?: number;
  skip?: number;
}): Promise<{ rows: OrgListRow[]; total: number }> {
  const take = Math.min(opts?.take ?? 50, 100);
  const skip = opts?.skip ?? 0;
  const q = opts?.q?.trim();

  const where = {
    kind: "STANDARD" as const,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { owner: { email: { contains: q, mode: "insensitive" as const } } },
            { owner: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [total, orgs] = await Promise.all([
    prisma.organization.count({ where }),
    prisma.organization.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true,
        name: true,
        kind: true,
        saasStatus: true,
        trialStartedAt: true,
        trialEndsAt: true,
        createdAt: true,
        owner: { select: { name: true, email: true, lastLoginAt: true } },
        _count: { select: { members: true } },
      },
    }),
  ]);

  const rows: OrgListRow[] = [];
  for (const o of orgs) {
    const effectiveStatus = effectiveSaasStatus(o);
    if (opts?.status && effectiveStatus !== opts.status) continue;
    if (opts?.trialOnly && effectiveStatus !== "TRIAL") continue;

    const activation = await scoreOrganizationActivation(o.id);
    const lastActivityAt = o.owner.lastLoginAt;
    rows.push({
      id: o.id,
      name: o.name,
      kind: o.kind,
      saasStatus: o.saasStatus,
      effectiveStatus,
      trialEndsAt: o.trialEndsAt,
      trialDaysRemaining: daysRemainingInTrial(o),
      createdAt: o.createdAt,
      ownerName: o.owner.name,
      ownerEmail: o.owner.email,
      memberCount: o._count.members,
      activationPercent: activation.percent,
      activationBand: activation.band,
      lastActivityAt,
      lastActivityLabel: formatRelativeActivity(lastActivityAt),
    });
  }

  // Filtre status/trial après coup peut réduire rows — OK pour V1 volumes modestes
  return { rows, total: opts?.status || opts?.trialOnly ? rows.length : total };
}
