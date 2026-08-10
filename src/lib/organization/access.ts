/**
 * Accès multi-utilisateurs par Organisation.
 * Dual-read : clientId legacy OU organizationId (si flag on).
 */

import type { OrganizationMemberRole, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isFeatureEnabled } from "@/lib/feature-flags";

function mapTeamRoleToOrgRole(teamRole: string | null | undefined): OrganizationMemberRole {
  const r = (teamRole ?? "USER").toUpperCase();
  if (r === "ADMIN") return "ADMIN";
  if (r === "SUPERVISEUR") return "ADMIN";
  if (r === "VIEWER") return "VIEWER";
  return "MEMBER";
}

/** Crée l’organisation du propriétaire CLIENT si absente (idempotent). */
export async function ensureOrganizationForOwner(ownerUserId: string): Promise<string | null> {
  const owner = await prisma.user.findUnique({
    where: { id: ownerUserId },
    select: { id: true, name: true, company: true, role: true, invitedById: true },
  });
  if (!owner || owner.role !== "CLIENT") return null;
  // Les collaborateurs invités n’ont pas leur propre org — ils rejoignent celle du propriétaire.
  if (owner.invitedById) return null;

  const existing = await prisma.organization.findUnique({
    where: { ownerUserId },
    select: { id: true },
  });
  if (existing) {
    // Lecture seule si déjà membre — évite upsert write à chaque Accueil / À traiter.
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: existing.id,
          userId: ownerUserId,
        },
      },
      select: { id: true },
    });
    if (!membership) {
      await prisma.organizationMember.create({
        data: {
          organizationId: existing.id,
          userId: ownerUserId,
          role: "OWNER",
        },
      });
    }
    return existing.id;
  }

  const org = await prisma.organization.create({
    data: {
      name: owner.company?.trim() || owner.name || "Entreprise",
      ownerUserId,
      members: {
        create: { userId: ownerUserId, role: "OWNER" },
      },
    },
    select: { id: true },
  });
  return org.id;
}

/** Organisations dont l’utilisateur est membre. */
export async function getUserOrganizationIds(userId: string): Promise<string[]> {
  if (!isFeatureEnabled("organizationMultiUser")) return [];
  const rows = await prisma.organizationMember.findMany({
    where: { userId },
    select: { organizationId: true },
  });
  return rows.map((r) => r.organizationId);
}

/**
 * Filtre Prisma Project pour un utilisateur CLIENT (lui + orgs).
 * Externes (personType ≠ INTERNAL) : uniquement ProjectAccess + clientId.
 */
export async function projectWhereForClientUser(
  userId: string
): Promise<Prisma.ProjectWhereInput> {
  const { projectWhereWithScopedAccess } = await import("@/lib/equipe-acces/project-access");

  if (!isFeatureEnabled("organizationMultiUser")) {
    return projectWhereWithScopedAccess(userId, { clientId: userId });
  }
  const orgIds = await getUserOrganizationIds(userId);
  if (orgIds.length === 0) {
    return projectWhereWithScopedAccess(userId, { clientId: userId });
  }
  return projectWhereWithScopedAccess(userId, {
    OR: [{ clientId: userId }, { organizationId: { in: orgIds } }],
  });
}

/**
 * Filtre Prisma Task pour un utilisateur CLIENT.
 */
export async function taskWhereForClientUser(userId: string): Promise<Prisma.TaskWhereInput> {
  if (!isFeatureEnabled("organizationMultiUser")) {
    return { clientId: userId };
  }
  const orgIds = await getUserOrganizationIds(userId);
  if (orgIds.length === 0) {
    return { clientId: userId };
  }
  return {
    OR: [{ clientId: userId }, { organizationId: { in: orgIds } }],
  };
}

/** Vérifie qu’un projet est accessible au client (owner, membre interne org, ou ProjectAccess). */
export async function canClientAccessProject(
  userId: string,
  project: { id?: string; clientId: string; organizationId?: string | null }
): Promise<boolean> {
  const { canAccessProjectForPortalUser } = await import("@/lib/equipe-acces/project-access");
  if (!isFeatureEnabled("organizationMultiUser")) {
    if (project.clientId === userId) return true;
    if (!project.id) return false;
    return canAccessProjectForPortalUser(userId, project);
  }
  return canAccessProjectForPortalUser(userId, project);
}

/** Ajoute un membre à l’organisation du propriétaire (après invitation). */
export async function addMemberToOwnerOrganization(
  ownerUserId: string,
  memberUserId: string,
  teamRole?: string | null
): Promise<void> {
  if (!isFeatureEnabled("organizationMultiUser")) return;
  const orgId = await ensureOrganizationForOwner(ownerUserId);
  if (!orgId) return;
  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: { organizationId: orgId, userId: memberUserId },
    },
    create: {
      organizationId: orgId,
      userId: memberUserId,
      role: mapTeamRoleToOrgRole(teamRole),
    },
    update: {
      role: mapTeamRoleToOrgRole(teamRole),
    },
  });
}

/** Tenant effectif pour un CLIENT (owner facturation + org). */
export async function resolveClientTenant(userId: string): Promise<{
  clientId: string;
  organizationId: string | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, invitedById: true, role: true, teamRole: true },
  });
  if (!user || user.role !== "CLIENT") {
    return { clientId: userId, organizationId: null };
  }

  if (user.invitedById) {
    const organizationId = await ensureOrganizationForOwner(user.invitedById);
    if (organizationId) {
      await addMemberToOwnerOrganization(user.invitedById, userId, user.teamRole);
    }
    return { clientId: user.invitedById, organizationId };
  }

  const organizationId = await ensureOrganizationForOwner(userId);
  return { clientId: userId, organizationId };
}
export async function backfillOrganizations(): Promise<{
  orgs: number;
  invitedMembers: number;
  projects: number;
  tasks: number;
}> {
  const owners = await prisma.user.findMany({
    where: { role: "CLIENT", invitedById: null },
    select: { id: true },
  });
  let orgs = 0;
  for (const o of owners) {
    const id = await ensureOrganizationForOwner(o.id);
    if (id) orgs += 1;
  }

  const invited = await prisma.user.findMany({
    where: { role: "CLIENT", invitedById: { not: null } },
    select: { id: true, invitedById: true, teamRole: true },
  });
  let invitedMembers = 0;
  for (const u of invited) {
    if (!u.invitedById) continue;
    await addMemberToOwnerOrganization(u.invitedById, u.id, u.teamRole);
    invitedMembers += 1;
  }

  // Rattacher projets / tâches au org du propriétaire (clientId)
  const orgByOwner = await prisma.organization.findMany({
    select: { id: true, ownerUserId: true },
  });
  let projects = 0;
  let tasks = 0;
  for (const org of orgByOwner) {
    const p = await prisma.project.updateMany({
      where: { clientId: org.ownerUserId, organizationId: null },
      data: { organizationId: org.id },
    });
    projects += p.count;
    const t = await prisma.task.updateMany({
      where: { clientId: org.ownerUserId, organizationId: null },
      data: { organizationId: org.id },
    });
    tasks += t.count;
  }

  return { orgs, invitedMembers, projects, tasks };
}
