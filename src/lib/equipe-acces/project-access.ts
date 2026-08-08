import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SCOPES_BY_PROFILE, type PermissionProfileKey, type ProjectAccessScopes } from "./types";

export function scopesForProfile(profile: string | null | undefined): ProjectAccessScopes {
  const key = (profile ?? "PARTENAIRE") as PermissionProfileKey;
  return DEFAULT_SCOPES_BY_PROFILE[key] ?? DEFAULT_SCOPES_BY_PROFILE.PARTENAIRE;
}

export async function setUserProjectAccesses(input: {
  userId: string;
  projectIds: string[];
  grantedById: string;
  permissionProfile?: string | null;
  organizationId: string;
}): Promise<void> {
  const unique = [...new Set(input.projectIds.filter(Boolean))];
  if (unique.length === 0) {
    await prisma.projectAccess.deleteMany({ where: { userId: input.userId } });
    return;
  }

  const projects = await prisma.project.findMany({
    where: {
      id: { in: unique },
      OR: [
        { organizationId: input.organizationId },
        { clientId: input.grantedById },
      ],
    },
    select: { id: true },
  });
  const allowed = new Set(projects.map((p) => p.id));
  const validIds = unique.filter((id) => allowed.has(id));
  const scopes = scopesForProfile(input.permissionProfile);

  await prisma.$transaction([
    prisma.projectAccess.deleteMany({
      where: {
        userId: input.userId,
        projectId: { notIn: validIds.length ? validIds : ["__none__"] },
      },
    }),
    ...validIds.map((projectId) =>
      prisma.projectAccess.upsert({
        where: {
          projectId_userId: { projectId, userId: input.userId },
        },
        create: {
          projectId,
          userId: input.userId,
          grantedById: input.grantedById,
          scopesJson: scopes,
        },
        update: {
          grantedById: input.grantedById,
          scopesJson: scopes,
        },
      })
    ),
  ]);
}

/** Utilisateur externe (hors personnel interne / owner). */
export function isExternalPersonType(personType: string | null | undefined): boolean {
  return Boolean(personType && personType !== "INTERNAL");
}

/**
 * Accès chantier pour un compte CLIENT (portail entreprise).
 * Interne / owner : org + clientId ; externe : ProjectAccess uniquement (+ clientId si owner).
 */
export async function canAccessProjectForPortalUser(
  userId: string,
  project: { id?: string; clientId: string; organizationId?: string | null }
): Promise<boolean> {
  if (project.clientId === userId) return true;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      accessStatus: true,
      personType: true,
      invitedById: true,
    },
  });
  if (!user) return false;
  if (user.accessStatus === "SUSPENDED" || user.accessStatus === "DISABLED") {
    return false;
  }

  if (project.id) {
    const explicit = await prisma.projectAccess.findUnique({
      where: {
        projectId_userId: { projectId: project.id, userId },
      },
      select: { id: true },
    });
    if (explicit) return true;
  }

  if (isExternalPersonType(user.personType)) {
    return false;
  }

  if (!project.organizationId) return false;
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: project.organizationId,
        userId,
      },
    },
    select: { id: true },
  });
  return Boolean(membership);
}

/** Filtre projets pour CLIENT : org (internes) + accès explicites. */
export async function projectWhereWithScopedAccess(
  userId: string,
  baseOrgWhere: Prisma.ProjectWhereInput
): Promise<Prisma.ProjectWhereInput> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { personType: true, accessStatus: true },
  });
  if (!user || user.accessStatus === "SUSPENDED" || user.accessStatus === "DISABLED") {
    return { id: "__none__" };
  }

  if (isExternalPersonType(user.personType)) {
    return {
      OR: [
        { clientId: userId },
        { projectAccesses: { some: { userId } } },
      ],
    };
  }

  return {
    OR: [baseOrgWhere, { projectAccesses: { some: { userId } } }],
  };
}
