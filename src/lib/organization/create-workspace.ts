/**
 * Création atomique d’un espace entreprise SaaS (Phase 2 — inscription publique).
 * Exposé dès Phase 1 pour préparer l’onboarding — ne pas brancher sur une route publique
 * tant que l’isolation multi-tenant n’est pas validée.
 */

import bcrypt from "bcryptjs";
import { UserRole, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeTrialWindow, SAAS_TRIAL_DAYS } from "@/lib/organization/lifecycle";

export type CreateSaasWorkspaceInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  /** Si true : org DEMO (interne) — pas de trial public. */
  asDemo?: boolean;
};

export type CreateSaasWorkspaceResult =
  | {
      ok: true;
      userId: string;
      organizationId: string;
      trialEndsAt: Date | null;
      trialDays: number | null;
    }
  | { ok: false; error: string; code: "EMAIL_TAKEN" | "VALIDATION" | "INTERNAL" };

/**
 * Crée User + Organization + Membership OWNER + trial 14 j.
 * Workspace vide : aucun chantier / client / devis SETRIM.
 */
export async function createSaasWorkspace(
  input: CreateSaasWorkspaceInput,
): Promise<CreateSaasWorkspaceResult> {
  const email = input.email.trim().toLowerCase();
  const companyName = input.companyName.trim();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const password = input.password;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, code: "VALIDATION", error: "Email invalide." };
  }
  if (password.length < 8) {
    return { ok: false, code: "VALIDATION", error: "Mot de passe trop court (8 caractères min.)." };
  }
  if (!companyName || companyName.length < 2) {
    return { ok: false, code: "VALIDATION", error: "Nom d’entreprise requis." };
  }
  if (!firstName || !lastName) {
    return { ok: false, code: "VALIDATION", error: "Prénom et nom requis." };
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { ok: false, code: "EMAIL_TAKEN", error: "Un compte existe déjà avec cet email." };
  }

  const hashed = await bcrypt.hash(password, 12);
  const displayName = `${firstName} ${lastName}`.trim();
  const trial = input.asDemo ? null : computeTrialWindow();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashed,
          name: displayName,
          company: companyName,
          role: UserRole.CLIENT,
          personType: "INTERNAL",
          permissionProfile: "DIRECTION",
          accessStatus: "ACTIVE",
          teamRole: "ADMIN",
          accountStatus: "APPROVED",
        },
        select: { id: true },
      });

      const orgData: Prisma.OrganizationCreateInput = {
        name: companyName,
        kind: input.asDemo ? "DEMO" : "STANDARD",
        saasStatus: input.asDemo ? "ACTIVE" : "TRIAL",
        trialStartedAt: trial?.trialStartedAt ?? null,
        trialEndsAt: trial?.trialEndsAt ?? null,
        onboardingStep: 0,
        owner: { connect: { id: user.id } },
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
            status: "ACTIVE",
          },
        },
      };

      const org = await tx.organization.create({
        data: orgData,
        select: { id: true, trialEndsAt: true },
      });

      return { userId: user.id, organizationId: org.id, trialEndsAt: org.trialEndsAt };
    });

    return {
      ok: true,
      userId: result.userId,
      organizationId: result.organizationId,
      trialEndsAt: result.trialEndsAt,
      trialDays: input.asDemo ? null : SAAS_TRIAL_DAYS,
    };
  } catch (e) {
    console.error("[saas] createSaasWorkspace:", e);
    return { ok: false, code: "INTERNAL", error: "Impossible de créer l’espace BeWork." };
  }
}
