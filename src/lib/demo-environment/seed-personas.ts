import bcrypt from "bcryptjs";
import { OrganizationMemberRole, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findOrCreateExternalOrganization } from "@/lib/equipe-acces/external-org";
import { upsertSingleProjectAccess, scopesForProfile } from "@/lib/equipe-acces/project-access";
import { DEMO_PERSONAS, demoPersonaEmail, type DemoPersonaKey } from "./personas";

export type SeedPersonasResult = {
  users: Record<DemoPersonaKey, { id: string; email: string; name: string }>;
};

/**
 * Crée / met à jour les 4 personas démo dans l’org (vrais Users + ProjectAccess).
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

  // Direction = root
  await prisma.user.update({
    where: { id: root.id },
    data: {
      name: DEMO_PERSONAS.direction.name,
      company: opts.companyName,
      jobTitle: DEMO_PERSONAS.direction.jobTitle,
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
  const victor = projects.find((p) => p.title.includes("Victor Hugo"));
  const republique = projects.find((p) => p.title.includes("République"));
  const alpha = projects.find((p) => p.title.includes("Alpha"));

  const users = {} as SeedPersonasResult["users"];
  users.direction = { id: root.id, email: root.email, name: DEMO_PERSONAS.direction.name };

  for (const key of ["conducteur", "client", "fournisseur"] as const) {
    const def = DEMO_PERSONAS[key];
    const email = demoPersonaEmail(opts.loginIdentifier, def.emailSuffix);
    let externalOrganizationId: string | null = null;
    if (def.externalOrgType) {
      externalOrganizationId = await findOrCreateExternalOrganization({
        hostOrganizationId: opts.organizationId,
        name: def.company,
        personType: def.externalOrgType,
      });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: def.name,
            company: def.company,
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
            company: def.company,
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
        role:
          key === "conducteur" ? OrganizationMemberRole.MEMBER : OrganizationMemberRole.VIEWER,
      },
      update: {
        role:
          key === "conducteur" ? OrganizationMemberRole.MEMBER : OrganizationMemberRole.VIEWER,
      },
    });

    users[key] = user;

    const scopes = scopesForProfile(def.permissionProfile);
    if (key === "conducteur") {
      for (const p of [victor, republique, alpha].filter(Boolean)) {
        await upsertSingleProjectAccess({
          projectId: p!.id,
          userId: user.id,
          grantedById: opts.rootUserId,
          scopes: { messages: true, documents: true, agenda: true, deliveries: true },
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

  // Aligner BC-2026-043 sur Point.P
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
    await prisma.task.update({
      where: { id: bc.id },
      data: {
        title: "POINT.P — Résidence Victor Hugo (BC-2026-043)",
        description:
          "Fournisseur Point.P — 40 rouleaux membrane EPDM. Livraison demandée 11 août 07:30. Montant indicatif 4 260 € HT. Contact : Thomas Bernard.",
        suppliersJson: [
          {
            name: "Point.P",
            contact: users.fournisseur.email,
            contactUserId: users.fournisseur.id,
          },
        ],
        status: "EN_ATTENTE_INFO",
        category: "Bon de commande",
      },
    });
  }

  // Documents partagés Victor Hugo pour client / fournisseur
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

  return { users };
}

export async function listDemoPersonaUsers(opts: {
  rootUserId: string;
  loginIdentifier: string;
}): Promise<{ key: DemoPersonaKey; id: string; name: string; email: string }[]> {
  const out: { key: DemoPersonaKey; id: string; name: string; email: string }[] = [];
  for (const key of Object.keys(DEMO_PERSONAS) as DemoPersonaKey[]) {
    const def = DEMO_PERSONAS[key];
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
      out.push({ key, id: row.id, name: row.name, email: row.email });
    }
  }
  return out;
}
