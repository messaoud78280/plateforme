/**
 * Création atomique d’un espace entreprise SaaS (demande d’essai).
 * Compte en PENDING_APPROVAL — accès uniquement après validation BeWork.
 * Le trial 14 j démarre à l’approbation (pas à la demande).
 */

import bcrypt from "bcryptjs";
import { UserRole, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SAAS_TRIAL_DAYS } from "@/lib/organization/lifecycle";
import {
  isValidBtpCorpsMetier,
  isValidCompanySize,
  isValidSiret,
  normalizeSiret,
} from "@/lib/btp-corps-metier";

export type CreateSaasWorkspaceInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  siret: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  city: string;
  companySize: string;
  corpsMetier: string;
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
      pendingApproval: boolean;
    }
  | { ok: false; error: string; code: "EMAIL_TAKEN" | "VALIDATION" | "INTERNAL" };

/**
 * Crée User (PENDING) + Organization TRIAL (dates null) + Membership OWNER.
 * Workspace vide : aucun chantier / client / devis de démo.
 */
export async function createSaasWorkspace(
  input: CreateSaasWorkspaceInput,
): Promise<CreateSaasWorkspaceResult> {
  const email = input.email.trim().toLowerCase();
  const companyName = input.companyName.trim();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const password = input.password;
  const phone = input.phone.trim();
  const addressLine1 = input.addressLine1.trim();
  const addressLine2 = input.addressLine2?.trim() || null;
  const postalCode = input.postalCode.trim();
  const city = input.city.trim();
  const companySize = input.companySize.trim();
  const corpsMetier = input.corpsMetier.trim();
  const siret = normalizeSiret(input.siret);

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
  if (!isValidSiret(siret)) {
    return { ok: false, code: "VALIDATION", error: "SIRET invalide (14 chiffres requis)." };
  }
  if (!phone || phone.replace(/\D/g, "").length < 8) {
    return { ok: false, code: "VALIDATION", error: "Téléphone entreprise requis." };
  }
  if (!addressLine1 || !postalCode || !city) {
    return {
      ok: false,
      code: "VALIDATION",
      error: "Adresse, code postal et ville de l’entreprise sont requis.",
    };
  }
  if (!isValidCompanySize(companySize)) {
    return { ok: false, code: "VALIDATION", error: "Taille d’entreprise invalide." };
  }
  if (!isValidBtpCorpsMetier(corpsMetier)) {
    return { ok: false, code: "VALIDATION", error: "Corps de métier invalide." };
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { ok: false, code: "EMAIL_TAKEN", error: "Un compte existe déjà avec cet email." };
  }

  const hashed = await bcrypt.hash(password, 12);
  const displayName = `${firstName} ${lastName}`.trim();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashed,
          name: displayName,
          company: companyName,
          phone,
          billingAddressLine1: addressLine1,
          billingAddressLine2: addressLine2,
          billingPostalCode: postalCode,
          billingCity: city,
          billingCountry: "France",
          secteurActivite: corpsMetier,
          service: companySize,
          role: UserRole.CLIENT,
          personType: "INTERNAL",
          permissionProfile: "DIRECTION",
          accessStatus: "ACTIVE",
          teamRole: "ADMIN",
          // Accès plateforme uniquement après validation BeWork
          accountStatus: input.asDemo ? "APPROVED" : "PENDING_APPROVAL",
          contractStatus: "PENDING",
        },
        select: { id: true },
      });

      const orgData: Prisma.OrganizationCreateInput = {
        name: companyName,
        siret,
        kind: input.asDemo ? "DEMO" : "STANDARD",
        // Trial prêt, mais horloge démarrée à l’approbation
        saasStatus: input.asDemo ? "ACTIVE" : "TRIAL",
        trialStartedAt: null,
        trialEndsAt: null,
        onboardingStep: 0,
        onboardingStateJson: {
          companySize,
          corpsMetier,
          pendingSaasTrial: !input.asDemo,
          requestedAt: new Date().toISOString(),
        },
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
      pendingApproval: !input.asDemo,
    };
  } catch (e) {
    console.error("[saas] createSaasWorkspace:", e);
    return { ok: false, code: "INTERNAL", error: "Impossible de créer l’espace BeWork." };
  }
}
