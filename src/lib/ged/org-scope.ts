/**
 * GED V2.0.3 — périmètre organisation pour les documents sans chantier.
 * Jamais de faux Project. organizationId = frontière multi-tenant.
 */
import { prisma } from "@/lib/prisma";
import { canAccessChantierProject, isChantierStaff } from "@/lib/chantier-dossier/access";
import { getUserOrganizationIds } from "@/lib/organization/access";

export async function resolveOrganizationIdForUser(userId: string): Promise<string | null> {
  const owned = await prisma.organization.findUnique({
    where: { ownerUserId: userId },
    select: { id: true },
  });
  if (owned) return owned.id;
  const member = await prisma.organizationMember.findFirst({
    where: { userId },
    select: { organizationId: true },
    orderBy: { createdAt: "asc" },
  });
  return member?.organizationId ?? null;
}

/** Org commune à plusieurs participants (DM). Pas d’invention. */
export async function resolveSharedOrganizationId(userIds: string[]): Promise<string | null> {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) return null;
  if (ids.length === 1) return resolveOrganizationIdForUser(ids[0]!);

  const owned = await prisma.organization.findMany({
    where: { ownerUserId: { in: ids } },
    select: { id: true, ownerUserId: true },
  });
  const members = await prisma.organizationMember.findMany({
    where: { userId: { in: ids } },
    select: { organizationId: true, userId: true },
  });
  const usersByOrg = new Map<string, Set<string>>();
  for (const m of members) {
    const set = usersByOrg.get(m.organizationId) ?? new Set();
    set.add(m.userId);
    usersByOrg.set(m.organizationId, set);
  }
  for (const o of owned) {
    const set = usersByOrg.get(o.id) ?? new Set();
    set.add(o.ownerUserId);
    usersByOrg.set(o.id, set);
  }
  for (const [orgId, users] of usersByOrg) {
    if (ids.every((id) => users.has(id))) return orgId;
  }
  if (owned.length === 1) return owned[0]!.id;
  return null;
}

export async function resolveOrganizationIdForProject(
  projectId: string,
): Promise<string | null> {
  const p = await prisma.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true, clientId: true },
  });
  if (!p) return null;
  if (p.organizationId) return p.organizationId;
  return resolveOrganizationIdForUser(p.clientId);
}

export async function canAccessGedOrganization(
  user: { id: string; role?: string | null },
  organizationId: string | null | undefined,
  clientId?: string | null,
): Promise<{ ok: boolean }> {
  if (!organizationId && !clientId) return { ok: false };
  if (isChantierStaff(user.role)) return { ok: true };
  if (clientId && clientId === user.id) return { ok: true };
  if (organizationId) {
    const orgIds = await getUserOrganizationIds(user.id);
    if (orgIds.includes(organizationId)) return { ok: true };
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { ownerUserId: true },
    });
    if (org?.ownerUserId === user.id) return { ok: true };
  }
  if (user.role === "AGENT" && organizationId) {
    const assigned = await prisma.project.findFirst({
      where: { organizationId, assignedToId: user.id },
      select: { id: true },
    });
    if (assigned) return { ok: true };
  }
  return { ok: false };
}

export async function canAccessGedFile(
  user: { id: string; role?: string | null },
  file: {
    projectId?: string | null;
    organizationId?: string | null;
    clientId?: string | null;
  },
): Promise<{ ok: boolean }> {
  if (file.projectId) {
    const access = await canAccessChantierProject(user, file.projectId);
    return { ok: access.ok };
  }
  return canAccessGedOrganization(user, file.organizationId, file.clientId);
}
