import {
  extendTrialEndsAt,
  computeTrialWindow,
  effectiveSaasStatus,
} from "@/lib/organization/lifecycle";
import { prisma } from "@/lib/prisma";
import { logPlatformAdminAction } from "@/lib/platform-admin/audit";

export async function adminExtendTrial(input: {
  actorUserId: string;
  organizationId: string;
  days?: number;
  until?: Date;
}) {
  const org = await prisma.organization.findUnique({
    where: { id: input.organizationId },
    select: {
      id: true,
      name: true,
      kind: true,
      saasStatus: true,
      trialStartedAt: true,
      trialEndsAt: true,
    },
  });
  if (!org || org.kind === "DEMO") {
    return { ok: false as const, error: "Organisation non éligible." };
  }

  let trialEndsAt: Date;
  let trialStartedAt = org.trialStartedAt;
  if (input.until) {
    trialEndsAt = input.until;
  } else {
    const days = input.days ?? 7;
    trialEndsAt = extendTrialEndsAt(org.trialEndsAt, days);
  }
  if (!trialStartedAt) {
    trialStartedAt = computeTrialWindow().trialStartedAt;
  }

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      saasStatus: "TRIAL",
      trialStartedAt,
      trialEndsAt,
    },
  });

  await logPlatformAdminAction({
    actorUserId: input.actorUserId,
    organizationId: org.id,
    action: "TRIAL_EXTENDED",
    context: `until=${trialEndsAt.toISOString()} name=${org.name}`,
  });

  return { ok: true as const, trialEndsAt };
}

export async function adminSuspendOrganization(input: {
  actorUserId: string;
  organizationId: string;
}) {
  const org = await prisma.organization.findUnique({
    where: { id: input.organizationId },
    select: { id: true, name: true, kind: true, saasStatus: true },
  });
  if (!org || org.kind === "DEMO") {
    return { ok: false as const, error: "Organisation non éligible." };
  }

  await prisma.organization.update({
    where: { id: org.id },
    data: { saasStatus: "SUSPENDED" },
  });

  await logPlatformAdminAction({
    actorUserId: input.actorUserId,
    organizationId: org.id,
    action: "ORG_SUSPENDED",
    context: `name=${org.name} prev=${org.saasStatus}`,
  });

  return { ok: true as const };
}

export async function adminReactivateOrganization(input: {
  actorUserId: string;
  organizationId: string;
}) {
  const org = await prisma.organization.findUnique({
    where: { id: input.organizationId },
    select: {
      id: true,
      name: true,
      kind: true,
      saasStatus: true,
      trialEndsAt: true,
      trialStartedAt: true,
    },
  });
  if (!org || org.kind === "DEMO") {
    return { ok: false as const, error: "Organisation non éligible." };
  }

  const nextStatus =
    org.trialEndsAt && org.trialEndsAt.getTime() > Date.now()
      ? "TRIAL"
      : org.trialEndsAt && org.trialEndsAt.getTime() <= Date.now()
        ? "TRIAL_EXPIRED"
        : "ACTIVE";

  await prisma.organization.update({
    where: { id: org.id },
    data: { saasStatus: nextStatus },
  });

  await logPlatformAdminAction({
    actorUserId: input.actorUserId,
    organizationId: org.id,
    action: "ORG_REACTIVATED",
    context: `name=${org.name} status=${nextStatus} prev=${org.saasStatus}`,
  });

  return { ok: true as const, saasStatus: nextStatus };
}

export async function adminApproveSaasTrial(input: {
  actorUserId: string;
  organizationId: string;
  baseUrl?: string;
}) {
  const org = await prisma.organization.findUnique({
    where: { id: input.organizationId },
    select: {
      id: true,
      name: true,
      kind: true,
      ownerUserId: true,
      owner: { select: { accountStatus: true, email: true } },
    },
  });
  if (!org || org.kind === "DEMO") {
    return { ok: false as const, error: "Organisation non éligible." };
  }
  if (org.owner.accountStatus === "APPROVED") {
    return { ok: true as const, alreadyApproved: true as const, email: org.owner.email };
  }

  const { approveClientAccount } = await import("@/lib/client-account-approval");
  const result = await approveClientAccount(org.ownerUserId, input.actorUserId, {
    baseUrl: input.baseUrl,
  });
  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  await logPlatformAdminAction({
    actorUserId: input.actorUserId,
    organizationId: org.id,
    action: "SAAS_TRIAL_APPROVED",
    context: `name=${org.name} email=${result.email}`,
  });

  return { ok: true as const, alreadyApproved: false as const, email: result.email };
}

export async function adminResendTrialAccessEmail(input: {
  actorUserId: string;
  organizationId: string;
  baseUrl?: string;
}) {
  const org = await prisma.organization.findUnique({
    where: { id: input.organizationId },
    select: {
      id: true,
      name: true,
      kind: true,
      saasStatus: true,
      owner: {
        select: {
          email: true,
          name: true,
          accountStatus: true,
        },
      },
    },
  });
  if (!org || org.kind === "DEMO") {
    return { ok: false as const, error: "Organisation non éligible." };
  }
  if (org.owner.accountStatus !== "APPROVED") {
    return {
      ok: false as const,
      error: "Validez d’abord l’essai avant de renvoyer l’email d’accès.",
    };
  }

  const { sendClientAccountApprovedEmail } = await import("@/lib/email");
  const sent = await sendClientAccountApprovedEmail(
    { email: org.owner.email, name: org.owner.name },
    {
      baseUrl: input.baseUrl,
      kind: org.saasStatus === "TRIAL" ? "saas-trial" : "client",
    },
  );
  if (!sent.ok) {
    return {
      ok: false as const,
      error:
        sent.reason === "no_mail_provider"
          ? "Envoi email indisponible (clé Brevo manquante)."
          : "Échec d’envoi de l’email.",
    };
  }

  await logPlatformAdminAction({
    actorUserId: input.actorUserId,
    organizationId: org.id,
    action: "SAAS_ACCESS_EMAIL_RESENT",
    context: `name=${org.name} email=${org.owner.email}`,
  });

  return { ok: true as const, email: org.owner.email };
}

export { effectiveSaasStatus };
