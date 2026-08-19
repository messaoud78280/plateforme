import bcrypt from "bcryptjs";
import { OrganizationMemberRole, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findOrCreateExternalOrganization } from "@/lib/equipe-acces/external-org";
import { upsertSingleProjectAccess, scopesForProfile } from "@/lib/equipe-acces/project-access";
import {
  DEMO_PERSONA_KEYS,
  DEMO_PERSONAS,
  demoPersonaEmail,
  getDemoPersonasForPlatform,
  type DemoPersonaKey,
} from "./personas";
import { DEMO_SCENARIO, matchesDemoProjectTitle } from "./scenario";
import { getPlatformConfigForOrganization } from "@/lib/platform/config";

export type SeedPersonasResult = {
  users: Record<DemoPersonaKey, { id: string; email: string; name: string }>;
};

const NON_ROOT_KEYS = DEMO_PERSONA_KEYS.filter((k) => k !== "direction");

/**
 * Crée / met à jour les personas démo dans l’org (vrais Users + ProjectAccess).
 * Idempotent. Mot de passe partagé avec le root pour les bascules démo.
 */
export async function seedDemoPersonaUsers(opts: {
  rootUserId: string;
  organizationId: string;
  loginIdentifier: string;
  companyName: string;
  /** Mot de passe hashé déjà utilisé par le root — on le réutilise pour les personas. */
  sharedPasswordHash?: string;
  plainPasswordFallback?: string;
}): Promise<SeedPersonasResult> {
  const root = await prisma.user.findUnique({
    where: { id: opts.rootUserId },
    select: { id: true, email: true, password: true, name: true },
  });
  if (!root) throw new Error("Root démo introuvable");

  const passwordHash =
    opts.sharedPasswordHash ||
    root.password ||
    (await bcrypt.hash(opts.plainPasswordFallback || "BeWorkDemo2026!", 12));

  const platform = getPlatformConfigForOrganization({
    organizationId: opts.organizationId,
    isDemo: true,
    loginIdentifier: opts.loginIdentifier,
    companyName: opts.companyName,
  });
  const personas = getDemoPersonasForPlatform(platform.key, opts.companyName) ?? DEMO_PERSONAS;

  // Direction = root
  await prisma.user.update({
    where: { id: root.id },
    data: {
      name: personas.direction.name,
      company: opts.companyName,
      jobTitle: personas.direction.jobTitle,
      personType: "INTERNAL",
      permissionProfile: "DIRECTION",
      accessStatus: "ACTIVE",
      teamRole: "ADMIN",
    },
  });

  const projects = await prisma.project.findMany({
    where: { organizationId: opts.organizationId },
    select: { id: true, title: true },
  });
  const victor = projects.find((p) => matchesDemoProjectTitle(p.title, "primary"));
  const republique = projects.find((p) => matchesDemoProjectTitle(p.title, "waiting"));
  const alpha = projects.find((p) => matchesDemoProjectTitle(p.title, "study"));
  const jardins = projects.find((p) => matchesDemoProjectTitle(p.title, "calm"));

  const users = {} as SeedPersonasResult["users"];
  users.direction = { id: root.id, email: root.email, name: personas.direction.name };

  for (const key of NON_ROOT_KEYS) {
    const def = personas[key];
    const email = demoPersonaEmail(opts.loginIdentifier, def.emailSuffix);
    let externalOrganizationId: string | null = null;
    if (def.externalOrgType) {
      externalOrganizationId = await findOrCreateExternalOrganization({
        hostOrganizationId: opts.organizationId,
        name: def.company,
        personType: def.externalOrgType,
      });
    }

    const memberRole =
      key === "conducteur" || key === "administratif"
        ? OrganizationMemberRole.MEMBER
        : OrganizationMemberRole.VIEWER;

    const existing = await prisma.user.findUnique({ where: { email } });
    const companyForUser =
      def.personType === "INTERNAL" ? opts.companyName : def.company;

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: def.name,
            company: companyForUser,
            jobTitle: def.jobTitle,
            personType: def.personType,
            permissionProfile: def.permissionProfile,
            accessStatus: "ACTIVE",
            invitedById: opts.rootUserId,
            teamRole: key === "conducteur" ? "SUPERVISEUR" : "USER",
            externalOrganizationId,
            password: passwordHash,
            subscriptionPlan: null,
            monthlyActionsTotal: 0,
            monthlyActionsUsed: 0,
          },
          select: { id: true, email: true, name: true },
        })
      : await prisma.user.create({
          data: {
            email,
            password: passwordHash,
            name: def.name,
            role: UserRole.CLIENT,
            company: companyForUser,
            jobTitle: def.jobTitle,
            personType: def.personType,
            permissionProfile: def.permissionProfile,
            accessStatus: "ACTIVE",
            invitedById: opts.rootUserId,
            teamRole: key === "conducteur" ? "SUPERVISEUR" : "USER",
            externalOrganizationId,
            accountStatus: "APPROVED",
            contractStatus: "SIGNED",
            subscriptionPlan: null,
            monthlyActionsTotal: 0,
            monthlyActionsUsed: 0,
          },
          select: { id: true, email: true, name: true },
        });

    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: { organizationId: opts.organizationId, userId: user.id },
      },
      create: {
        organizationId: opts.organizationId,
        userId: user.id,
        role: memberRole,
      },
      update: { role: memberRole },
    });

    users[key] = user;

    const scopes = scopesForProfile(def.permissionProfile);
    if (key === "conducteur" || key === "administratif") {
      const targets = [victor, republique, alpha, jardins].filter(Boolean);
      for (const p of targets) {
        await upsertSingleProjectAccess({
          projectId: p!.id,
          userId: user.id,
          grantedById: opts.rootUserId,
          scopes: {
            messages: true,
            documents: true,
            agenda: true,
            deliveries: true,
          },
        });
      }
    } else if (key === "client" && victor) {
      await upsertSingleProjectAccess({
        projectId: victor.id,
        userId: user.id,
        grantedById: opts.rootUserId,
        scopes: { ...scopes, messages: true, documents: true, agenda: true, deliveries: false },
      });
      if (republique) {
        await upsertSingleProjectAccess({
          projectId: republique.id,
          userId: user.id,
          grantedById: opts.rootUserId,
          scopes: { messages: true, documents: true, agenda: true, deliveries: false },
        });
      }
    } else if (key === "fournisseur" && victor) {
      await upsertSingleProjectAccess({
        projectId: victor.id,
        userId: user.id,
        grantedById: opts.rootUserId,
        scopes: { messages: true, documents: true, agenda: false, deliveries: true },
      });
    }
  }

  // Aligner BC-2026-043 sur Point.P (le lien fiche est finalisé par coherence-victor-hugo)
  const bc = await prisma.task.findFirst({
    where: {
      clientId: opts.rootUserId,
      OR: [
        { title: { contains: "BC-2026-043" } },
        { title: { contains: "POINT.P" } },
      ],
    },
    select: { id: true },
  });
  if (bc) {
    const sheet = await prisma.followUpSheet.findFirst({
      where: {
        organizationId: opts.organizationId,
        osNumber: "4587",
        NOT: { status: "AVENANT" },
      },
      select: { id: true },
    });
    await prisma.task.update({
      where: { id: bc.id },
      data: {
        title: `${DEMO_SCENARIO.supplierName} — ${DEMO_SCENARIO.projects.primary.title} (${DEMO_SCENARIO.orderNumber})`,
        description:
          `Fournisseur ${DEMO_SCENARIO.supplierName} — ${DEMO_SCENARIO.materials.subject}. Livraison demandée 11 août 2026 07:30. Montant indicatif 4 260 € HT. Contact : service logistique.`,
        suppliersJson: [
          {
            name: DEMO_SCENARIO.supplierName,
            contact: users.fournisseur.email,
            contactUserId: users.fournisseur.id,
          },
        ],
        status: "EN_ATTENTE_INFO",
        category: "Bon de commande",
        ...(sheet ? { followUpSheetId: sheet.id } : {}),
      },
    });
  }

  // Documents partagés Les Lilas pour client / fournisseur
  if (victor) {
    const sharedFiles = await prisma.chantierFile.findMany({
      where: { projectId: victor.id, deletedAt: null },
      take: 3,
      select: { id: true },
    });
    for (const f of sharedFiles) {
      await prisma.chantierFile.update({
        where: { id: f.id },
        data: { visibility: "Intervenants autorisés" },
      });
    }
  }

  // CHANTIERS-V2B — responsable interne = assignedTo (jamais CLIENT_EXT / Sophie)
  if (users.conducteur) {
    for (const p of [victor, republique, jardins].filter(Boolean)) {
      await prisma.project.update({
        where: { id: p!.id },
        data: {
          assignedToId: users.conducteur.id,
          internalManager: users.conducteur.name,
        },
      });
    }
  }
  if (users.administratif && alpha) {
    await prisma.project.update({
      where: { id: alpha.id },
      data: {
        assignedToId: users.administratif.id,
        internalManager: users.administratif.name,
      },
    });
  }

  return { users };
}

export async function listDemoPersonaUsers(opts: {
  rootUserId: string;
  loginIdentifier: string;
  companyName?: string | null;
  organizationId?: string | null;
}): Promise<{ key: DemoPersonaKey; id: string; name: string; email: string }[]> {
  const platform = getPlatformConfigForOrganization({
    organizationId: opts.organizationId ?? null,
    isDemo: true,
    loginIdentifier: opts.loginIdentifier,
    companyName: opts.companyName ?? null,
  });
  const personas = getDemoPersonasForPlatform(platform.key, opts.companyName) ?? DEMO_PERSONAS;
  const out: { key: DemoPersonaKey; id: string; name: string; email: string }[] = [];
  for (const key of DEMO_PERSONA_KEYS) {
    const def = personas[key];
    const row =
      key === "direction"
        ? await prisma.user.findUnique({
            where: { id: opts.rootUserId },
            select: { email: true, id: true, name: true },
          })
        : await prisma.user.findUnique({
            where: { email: demoPersonaEmail(opts.loginIdentifier, def.emailSuffix) },
            select: { email: true, id: true, name: true },
          });
    if (row) {
      out.push({ key, id: row.id, name: row.name ?? def.name, email: row.email });
    }
  }
  return out;
}
