import { prisma } from "@/lib/prisma";
import {
  isBeworkCrossOrgStaff,
  isBeworkOperationalStaff,
} from "@/lib/authz";

type SessionUser = {
  id: string;
  role?: string | null;
  personType?: string | null;
  permissionProfile?: string | null;
  accessStatus?: string | null;
};

async function staffIdentity(user: SessionUser): Promise<SessionUser> {
  if (
    user.personType !== undefined &&
    user.permissionProfile !== undefined &&
    user.accessStatus !== undefined
  ) {
    return user;
  }
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      role: true,
      personType: true,
      permissionProfile: true,
      accessStatus: true,
    },
  });
  if (!row) return user;
  return {
    id: user.id,
    role: row.role,
    personType: row.personType,
    permissionProfile: row.permissionProfile,
    accessStatus: row.accessStatus,
  };
}

export function isChantierStaff(role?: string | null) {
  return role === "AGENCE" || role === "MANAGER" || role === "AGENT";
}

/** Vérifie l'accès en lecture au chantier (projet). */
export async function canAccessChantierProject(
  user: SessionUser,
  projectId: string | null | undefined,
) {
  if (!projectId) return { ok: false as const, project: null };
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, clientId: true, assignedToId: true, organizationId: true },
  });
  if (!project) return { ok: false as const, project: null };

  const identity = await staffIdentity(user);
  if (isBeworkCrossOrgStaff(identity)) {
    return { ok: true as const, project };
  }
  if (
    isBeworkOperationalStaff(identity) &&
    identity.role === "AGENT" &&
    project.assignedToId === user.id
  ) {
    return { ok: true as const, project };
  }
  if (user.role === "CLIENT" || identity.role === "CLIENT" || !isBeworkOperationalStaff(identity)) {
    const { canClientAccessProject } = await import("@/lib/organization/access");
    if (await canClientAccessProject(user.id, project)) {
      return { ok: true as const, project };
    }
  }
  return { ok: false as const, project: null };
}

const EXTERNAL_PERSON_TYPES = new Set([
  "CLIENT_EXT",
  "SUPPLIER",
  "SUBCONTRACTOR",
  "MOE",
  "CONTROL_OFFICE",
  "PARTNER",
]);

const EXTERNAL_PERMISSION_PROFILES = new Set([
  "CLIENT",
  "FOURNISSEUR",
  "SOUS_TRAITANT",
  "PARTENAIRE",
]);

export function canOrganizationMemberModifyChantier(
  identity: Pick<SessionUser, "personType" | "permissionProfile" | "accessStatus">,
  membership: { role: string; status: string } | null,
): boolean {
  if (!membership || membership.status !== "ACTIVE" || membership.role === "VIEWER") {
    return false;
  }
  if (identity.accessStatus === "SUSPENDED" || identity.accessStatus === "DISABLED") {
    return false;
  }
  if (identity.personType && EXTERNAL_PERSON_TYPES.has(identity.personType)) {
    return false;
  }
  if (
    identity.permissionProfile &&
    EXTERNAL_PERMISSION_PROFILES.has(identity.permissionProfile)
  ) {
    return false;
  }
  return true;
}

/**
 * Droit de préparer / modifier le dossier chantier
 * (métré, planning, suivi, CR, notice, lots…).
 * Les accès externes ProjectAccess restent des droits de collaboration
 * (messages, documents, agenda, livraisons), jamais un droit d'écriture
 * sur le socle technique du chantier.
 */
export async function canModifyChantierProject(
  user: SessionUser,
  projectId: string | null | undefined,
) {
  const access = await canAccessChantierProject(user, projectId);
  if (!access.ok || !access.project) return access;

  const identity = await staffIdentity(user);
  if (isBeworkCrossOrgStaff(identity)) return access;
  if (
    isBeworkOperationalStaff(identity) &&
    identity.role === "AGENT" &&
    access.project.assignedToId === user.id
  ) {
    return access;
  }
  if (access.project.clientId === user.id) return access;
  if (!access.project.organizationId) {
    return { ok: false as const, project: access.project };
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: access.project.organizationId,
        userId: user.id,
      },
    },
    select: { role: true, status: true },
  });

  if (canOrganizationMemberModifyChantier(identity, membership)) {
    return access;
  }
  return { ok: false as const, project: access.project };
}

/** Suppression du chantier : client propriétaire ou direction BeWork (pas les agents seuls). */
export function canDeleteChantierProject(
  user: SessionUser,
  project: { clientId: string }
): boolean {
  if (isBeworkCrossOrgStaff(user)) return true;
  if (project.clientId === user.id) return true;
  return false;
}

/**
 * Suppression d’une pièce du classeur : réservée au staff BeWork.
 * Le client peut déposer, pas effacer une preuve / livrable BeWork.
 */
export function canDeleteChantierFile(user: SessionUser): boolean {
  return isChantierStaff(user.role);
}

/** Changement de statut documentaire (VALIDE, A_RELANCER…) : staff uniquement. */
export function canUpdateChantierFileStatus(user: SessionUser): boolean {
  return isChantierStaff(user.role);
}
