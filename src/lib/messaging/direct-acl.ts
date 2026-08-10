/**
 * ACL messagerie directe 1:1 — source unique UI + API.
 * Ne pas affaiblir le multi-tenant : INTERNAL↔INTERNAL uniquement même org.
 */

import { prisma } from "@/lib/prisma";
import { isDemoEmail } from "@/lib/demo-environment/constants";
import { isDemoStaffVisibleInMessaging } from "@/lib/demo-environment/demo-staff-names";
import { isManagerRole, isStaffAgent } from "@/lib/messaging/access";

export type DirectAclUser = {
  id: string;
  role: string;
  personType: string | null;
  permissionProfile: string | null;
  accessStatus: string | null;
  email: string | null;
  organizationIds: string[];
  externalHostOrganizationId: string | null;
};

export type DirectAclResult = { ok: true } | { ok: false; error: string; status: 400 | 403 };

const MESSAGEABLE_ROLES = new Set(["AGENCE", "AGENT", "MANAGER", "CLIENT"]);

export function isInternalMessagingPerson(u: {
  personType?: string | null;
  permissionProfile?: string | null;
}): boolean {
  if (u.personType === "INTERNAL") return true;
  return ["DIRECTION", "CONDUCTEUR", "ADMINISTRATIF", "CHEF_CHANTIER"].includes(
    u.permissionProfile ?? "",
  );
}

export function isMessagingAccessActive(accessStatus?: string | null): boolean {
  if (!accessStatus) return true;
  return accessStatus === "ACTIVE";
}

function shareOrganization(a: DirectAclUser, b: DirectAclUser): boolean {
  if (a.organizationIds.length === 0 || b.organizationIds.length === 0) return false;
  const set = new Set(a.organizationIds);
  return b.organizationIds.some((id) => set.has(id));
}

/** Évalue l’ACL à partir de profils déjà chargés (batch UI / tests). */
export function evaluateDirectMessageAcl(
  sender: DirectAclUser,
  recipient: DirectAclUser,
  opts?: { taskLinked?: boolean },
): DirectAclResult {
  if (sender.id === recipient.id) {
    return { ok: false, error: "Destinataire invalide.", status: 400 };
  }
  if (!MESSAGEABLE_ROLES.has(recipient.role)) {
    return { ok: false, error: "Destinataire invalide.", status: 400 };
  }
  if (!isMessagingAccessActive(recipient.accessStatus)) {
    return {
      ok: false,
      error: "Impossible d’envoyer ce message. Ce destinataire n’est plus disponible.",
      status: 403,
    };
  }

  const sInternal = isInternalMessagingPerson(sender);
  const rInternal = isInternalMessagingPerson(recipient);
  const sameTenant = shareOrganization(sender, recipient);

  // Pair internes même organisation (Denis → Julie / Karim Benali)
  if (sInternal && rInternal && sameTenant) {
    return { ok: true };
  }

  // Interne → externe rattaché au host org (Sophie client / Thomas fournisseur)
  if (sInternal && recipient.externalHostOrganizationId) {
    if (sender.organizationIds.includes(recipient.externalHostOrganizationId)) {
      if (
        recipient.personType === "CLIENT_EXT" ||
        recipient.personType === "SUPPLIER" ||
        recipient.personType === "SUBCONTRACTOR"
      ) {
        return { ok: true };
      }
    }
  }

  // Démo : staff BeWork visible (Lefèvre / Adjaili) joignable par persona DEMO interne
  if (
    sInternal &&
    isDemoEmail(sender.email) &&
    isDemoStaffVisibleInMessaging(recipient.email)
  ) {
    return { ok: true };
  }

  // Staff BeWork (MANAGER / AGENT / AGENCE) : peut écrire aux rôles messageables
  if (isManagerRole(sender.role) || isStaffAgent(sender.role)) {
    return { ok: true };
  }

  // Client portail (non interne) → staff lié aux missions / manager
  if (sender.role === "CLIENT" && !sInternal) {
    if (!["AGENCE", "AGENT", "MANAGER"].includes(recipient.role)) {
      return { ok: false, error: "Destinataire non autorisé.", status: 403 };
    }
    if (recipient.role === "MANAGER" || opts?.taskLinked) {
      return { ok: true };
    }
    return {
      ok: false,
      error: "Ce contact n’est pas lié à vos missions.",
      status: 403,
    };
  }

  // Client role mais interne sans même org (cas limite) → staff lié
  if (sender.role === "CLIENT" && sInternal) {
    if (["AGENCE", "AGENT", "MANAGER"].includes(recipient.role)) {
      if (recipient.role === "MANAGER" || opts?.taskLinked) return { ok: true };
      if (isDemoStaffVisibleInMessaging(recipient.email)) return { ok: true };
    }
  }

  return { ok: false, error: "Destinataire non autorisé.", status: 403 };
}

async function loadDirectAclUser(userId: string): Promise<DirectAclUser | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      personType: true,
      permissionProfile: true,
      accessStatus: true,
      email: true,
      organizationMemberships: { select: { organizationId: true } },
      externalOrganization: { select: { hostOrganizationId: true } },
    },
  });
  if (!u) return null;
  return {
    id: u.id,
    role: u.role,
    personType: u.personType,
    permissionProfile: u.permissionProfile,
    accessStatus: u.accessStatus,
    email: u.email,
    organizationIds: u.organizationMemberships.map((m) => m.organizationId),
    externalHostOrganizationId: u.externalOrganization?.hostOrganizationId ?? null,
  };
}

/** Autorité serveur pour POST /api/messages/direct. */
export async function canDirectMessageUser(
  senderId: string,
  recipientId: string,
): Promise<DirectAclResult> {
  if (senderId === recipientId) {
    return { ok: false, error: "Destinataire invalide.", status: 400 };
  }

  const [sender, recipient] = await Promise.all([
    loadDirectAclUser(senderId),
    loadDirectAclUser(recipientId),
  ]);
  if (!sender || !recipient) {
    return { ok: false, error: "Destinataire invalide.", status: 400 };
  }

  let taskLinked = false;
  const needsTaskCheck =
    sender.role === "CLIENT" &&
    !isInternalMessagingPerson(sender) &&
    ["AGENCE", "AGENT"].includes(recipient.role);

  const needsTaskCheckInternalEdge =
    sender.role === "CLIENT" &&
    isInternalMessagingPerson(sender) &&
    ["AGENCE", "AGENT"].includes(recipient.role) &&
    !shareOrganization(sender, recipient) &&
    !isDemoStaffVisibleInMessaging(recipient.email);

  if (needsTaskCheck || needsTaskCheckInternalEdge) {
    const linked = await prisma.task.findFirst({
      where: {
        clientId: senderId,
        OR: [{ assignedToId: recipientId }, { createdById: recipientId }],
      },
      select: { id: true },
    });
    taskLinked = Boolean(linked);
  }

  return evaluateDirectMessageAcl(sender, recipient, { taskLinked });
}

/** Filtre batch pour le sélecteur Nouveau message (même règle que le POST). */
export function filterMessageableRecipients<T extends { id: string }>(
  sender: DirectAclUser,
  candidates: Array<T & Omit<DirectAclUser, "id">>,
): T[] {
  return candidates.filter((c) => {
    const recipient: DirectAclUser = {
      id: c.id,
      role: c.role,
      personType: c.personType,
      permissionProfile: c.permissionProfile,
      accessStatus: c.accessStatus,
      email: c.email,
      organizationIds: c.organizationIds,
      externalHostOrganizationId: c.externalHostOrganizationId,
    };
    // UI : pas de requête task N+1 — taskLinked=false ; le POST revalidera.
    return evaluateDirectMessageAcl(sender, recipient, { taskLinked: false }).ok;
  });
}
