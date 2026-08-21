import { prisma } from "@/lib/prisma";
import {
  daysRemainingInTrial,
  effectiveSaasStatus,
} from "@/lib/organization/lifecycle";
import { resolveActiveOrganizationId } from "@/lib/organization/tenant";
import { getOrganizationActivationSnapshot } from "@/lib/organization/activation";

export type SaasBannerState =
  | { kind: "none" }
  | {
      kind: "trial";
      daysRemaining: number;
      companyName: string;
      activationPercent: number;
    }
  | { kind: "trial_expired"; companyName: string };

export async function getSaasBannerState(user: {
  id: string;
  role?: string | null;
  isDemo?: boolean;
  demoRootUserId?: string | null;
  personType?: string | null;
  permissionProfile?: string | null;
}): Promise<SaasBannerState> {
  if (user.isDemo) return { kind: "none" };

  const organizationId = await resolveActiveOrganizationId(user);
  if (!organizationId) return { kind: "none" };

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      name: true,
      kind: true,
      saasStatus: true,
      trialStartedAt: true,
      trialEndsAt: true,
    },
  });
  if (!org || org.kind === "DEMO") return { kind: "none" };

  const status = effectiveSaasStatus(org);
  if (status === "TRIAL") {
    const days = daysRemainingInTrial(org) ?? 0;
    const snap = await getOrganizationActivationSnapshot(organizationId);
    return {
      kind: "trial",
      daysRemaining: days,
      companyName: org.name,
      activationPercent: snap.percent,
    };
  }
  if (status === "TRIAL_EXPIRED") {
    return { kind: "trial_expired", companyName: org.name };
  }
  return { kind: "none" };
}
