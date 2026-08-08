import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SCOPES_BY_PROFILE, type PermissionProfileKey, type ProjectAccessScopes } from "./types";

export type ProjectScopeKey = keyof ProjectAccessScopes;

export function scopesForProfile(profile: string | null | undefined): ProjectAccessScopes {
  const key = (profile ?? "PARTENAIRE") as PermissionProfileKey;
  return DEFAULT_SCOPES_BY_PROFILE[key] ?? DEFAULT_SCOPES_BY_PROFILE.PARTENAIRE;
}

export function parseScopesJson(raw: unknown): ProjectAccessScopes {
  if (!raw || typeof raw !== "object") {
    return { messages: true, documents: true, agenda: true, deliveries: false };
  }
  const o = raw as Record<string, unknown>;
  return {
    messages: o.messages !== false,
    documents: o.documents !== false,
    agenda: o.agenda !== false,
    deliveries: o.deliveries === true,
  };
}

/** Visibilités GED considérées comme « partagées » (externes). */
const PARTAGE_VISIBILITIES = new Set([
  "BeWork et entreprise cliente",
  "Intervenants autorisés",
  "Partage temporaire",
  "PARTAGE",
  "PARTAGÉ",
]);

const INTERNE_VISIBILITIES = new Set([
  "Interne BeWork",
  "Interne entreprise cliente",
  "INTERNE",
]);

export function isSharedVisibility(visibility: string | null | undefined): boolean {
  if (!visibility) return false;
  return PARTAGE_VISIBILITIES.has(visibility);
}

export function isInternalVisibility(visibility: string | null | undefined): boolean {
  if (!visibility) return true;
  if (isSharedVisibility(visibility)) return false;
  return INTERNE_VISIBILITIES.has(visibility) || !PARTAGE_VISIBILITIES.has(visibility);
}

/**
 * Accès scope pour un utilisateur sur un chantier.
 * Owner / interne org : tous les scopes. Externe : ProjectAccess.scopesJson.
 */
export async function userHasProjectScope(
  userId: string,
  project: { id: string; clientId: string; organizationId?: string | null },
  scope: ProjectScopeKey
): Promise<boolean> {
  if (project.clientId === userId) return true;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { personType: true, accessStatus: true },
  });
  if (!user || user.accessStatus === "SUSPENDED" || user.accessStatus === "DISABLED") {
    return false;
  }

  const access = await prisma.projectAccess.findUnique({
    where: { projectId_userId: { projectId: project.id, userId } },
    select: { scopesJson: true },
  });

  if (isExternalPersonType(user.personType)) {
    if (!access) return false;
    const scopes = parseScopesJson(access.scopesJson);
    return Boolean(scopes[scope]);
  }

  // Interne : accès org = tous scopes ; sinon ProjectAccess avec scope
  if (project.organizationId) {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: project.organizationId,
          userId,
        },
      },
      select: { id: true },
    });
    if (membership) return true;
  }

  if (access) {
    const scopes = parseScopesJson(access.scopesJson);
    return Boolean(scopes[scope]);
  }
  return false;
}

/** Accorde / met à jour l’accès à UN chantier (sans toucher aux autres). */
export async function upsertSingleProjectAccess(input: {
  projectId: string;
  userId: string;
  grantedById: string;
  scopes?: ProjectAccessScopes;
  permissionProfile?: string | null;
}): Promise<void> {
  const scopes = input.scopes ?? scopesForProfile(input.permissionProfile);
  await prisma.projectAccess.upsert({
    where: {
      projectId_userId: { projectId: input.projectId, userId: input.userId },
    },
    create: {
      projectId: input.projectId,
      userId: input.userId,
      grantedById: input.grantedById,
      scopesJson: scopes,
    },
    update: {
      grantedById: input.grantedById,
      scopesJson: scopes,
    },
  });
}

export async function revokeProjectAccess(projectId: string, userId: string): Promise<void> {
  await prisma.projectAccess.deleteMany({
    where: { projectId, userId },
  });
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
