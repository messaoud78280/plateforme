import crypto from "crypto";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";
import { addMemberToOwnerOrganization } from "@/lib/organization/access";
import { logAccessAction } from "./audit";
import type { EquipeAdminContext } from "./admin";
import { mapProfileToLegacyTeamRole, mapProfileToOrgRole } from "./admin";
import { findOrCreateExternalOrganization } from "./external-org";
import { setUserProjectAccesses } from "./project-access";
import {
  PERSON_TYPES,
  PERMISSION_PROFILES,
  defaultProfileForPersonType,
  type PersonType,
  type PermissionProfileKey,
} from "./types";

export type AddMemberInput = {
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  companyName?: string;
  phone?: string;
  jobTitle?: string;
  personType: PersonType;
  permissionProfile?: PermissionProfileKey;
  projectIds?: string[];
  /** invite = lien ; create = compte + MDP temporaire (retourné une fois). */
  mode: "invite" | "create";
};

function resolveDisplayName(input: AddMemberInput): string {
  if (input.name?.trim()) return input.name.trim();
  const parts = [input.firstName?.trim(), input.lastName?.trim()].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return input.email.split("@")[0] || "Utilisateur";
}

function generateTempPassword(): string {
  return crypto.randomBytes(12).toString("base64url").slice(0, 16);
}

export async function addEquipeMember(
  ctx: EquipeAdminContext,
  raw: AddMemberInput
): Promise<
  | {
      ok: true;
      kind: "invite";
      invitationId: string;
      email: string;
      acceptUrl: string;
      expiresAt: Date;
      emailSent?: boolean;
    }
  | {
      ok: true;
      kind: "create";
      userId: string;
      email: string;
      temporaryPassword: string;
    }
  | { ok: false; status: number; error: string }
> {
  const email = raw.email.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, status: 400, error: "Email invalide" };
  }
  if (!PERSON_TYPES.includes(raw.personType)) {
    return { ok: false, status: 400, error: "Type d’utilisateur invalide" };
  }
  const profile =
    raw.permissionProfile && PERMISSION_PROFILES.includes(raw.permissionProfile)
      ? raw.permissionProfile
      : defaultProfileForPersonType(raw.personType);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, status: 400, error: "Un compte existe déjà avec cet email." };
  }

  const pending = await prisma.invitation.findFirst({
    where: { email, invitedById: ctx.ownerUserId, status: "PENDING" },
  });
  if (pending && pending.expiresAt > new Date()) {
    return {
      ok: false,
      status: 400,
      error: "Une invitation en attente existe déjà pour cet email.",
    };
  }

  let externalOrganizationId: string | null = null;
  if (raw.personType !== "INTERNAL" && raw.companyName?.trim()) {
    externalOrganizationId = await findOrCreateExternalOrganization({
      hostOrganizationId: ctx.organizationId,
      name: raw.companyName,
      personType: raw.personType,
    });
  }

  const projectIds = Array.isArray(raw.projectIds) ? raw.projectIds : [];
  const legacyRole = mapProfileToLegacyTeamRole(profile);
  const displayName = resolveDisplayName(raw);

  if (raw.mode === "invite") {
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const inv = await prisma.invitation.create({
      data: {
        email,
        role: legacyRole,
        invitedById: ctx.ownerUserId,
        organizationId: ctx.organizationId,
        token,
        status: "PENDING",
        expiresAt,
        personType: raw.personType,
        permissionProfile: profile,
        firstName: raw.firstName?.trim() || null,
        lastName: raw.lastName?.trim() || null,
        companyName: raw.companyName?.trim() || null,
        phone: raw.phone?.trim() || null,
        jobTitle: raw.jobTitle?.trim() || null,
        projectIdsJson: projectIds.length ? projectIds : undefined,
        externalOrganizationId,
      },
    });
    const baseUrl = (process.env.NEXTAUTH_URL?.trim() || SITE_URL).replace(/\/$/, "");
    const acceptUrl = `${baseUrl}/invitation/accept?token=${token}`;
    await logAccessAction({
      organizationId: ctx.organizationId,
      actorUserId: ctx.actorId,
      action: "INVITE_SENT",
      detail: JSON.stringify({ email, personType: raw.personType, profile }),
    });

    let emailSent = false;
    try {
      const { sendEquipeInvitationEmail } = await import("./invite-email");
      const mail = await sendEquipeInvitationEmail({
        to: email,
        inviteeName: displayName,
        companyName: raw.companyName,
        permissionProfile: profile,
        acceptUrl,
        expiresAt,
      });
      emailSent = mail.sent;
    } catch (e) {
      console.error("[equipe] invite email:", e);
    }

    return {
      ok: true,
      kind: "invite",
      invitationId: inv.id,
      email,
      acceptUrl,
      expiresAt,
      emailSent,
    };
  }

  const temporaryPassword = generateTempPassword();
  const hashedPassword = await bcrypt.hash(temporaryPassword, 12);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: displayName,
      role: UserRole.CLIENT,
      company: raw.companyName?.trim() || null,
      phone: raw.phone?.trim() || null,
      jobTitle: raw.jobTitle?.trim() || null,
      invitedById: ctx.ownerUserId,
      teamRole: legacyRole,
      personType: raw.personType,
      permissionProfile: profile,
      accessStatus: "ACTIVE",
      mustChangePassword: true,
      externalOrganizationId,
      // Pas de crédits / abonnement propre pour les membres écosystème
      subscriptionPlan: null,
      monthlyActionsTotal: 0,
      monthlyActionsUsed: 0,
    },
  });

  try {
    await addMemberToOwnerOrganization(ctx.ownerUserId, user.id, legacyRole);
    const orgRole = mapProfileToOrgRole(profile, raw.personType);
    await prisma.organizationMember.update({
      where: {
        organizationId_userId: {
          organizationId: ctx.organizationId,
          userId: user.id,
        },
      },
      data: { role: orgRole },
    });
  } catch (e) {
    console.error("Organization member after create:", e);
  }

  if (raw.personType !== "INTERNAL" || projectIds.length > 0) {
    await setUserProjectAccesses({
      userId: user.id,
      projectIds,
      grantedById: ctx.actorId,
      permissionProfile: profile,
      organizationId: ctx.organizationId,
    });
  }

  await logAccessAction({
    organizationId: ctx.organizationId,
    actorUserId: ctx.actorId,
    targetUserId: user.id,
    action: "USER_CREATED",
    detail: JSON.stringify({ email, personType: raw.personType, profile }),
  });

  return {
    ok: true,
    kind: "create",
    userId: user.id,
    email,
    temporaryPassword,
  };
}
