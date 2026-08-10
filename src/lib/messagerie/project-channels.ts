/**
 * MESSAGERIE-V2C.6 — Canaux chantier (périmètres de confidentialité).
 * Chantier = conteneur · Canal = qui peut lire.
 * Pas de groupe « tous les acteurs ».
 */

import { prisma } from "@/lib/prisma";
import { DEMO_BRAND } from "@/lib/demo-environment/brand";

export type ProjectChannelType =
  | "INTERNAL"
  | "CLIENT"
  | "SUPPLIER"
  | "SUBCONTRACTOR"
  | "PARTNER"
  | "MOE"
  | "CONTROL_OFFICE";

/** Valeurs legacy Message.channel (compat). */
export type LegacyMessageChannel =
  | "INTERNE"
  | "CLIENT"
  | "FOURNISSEUR"
  | "SOUS_TRAITANT";

export function projectChannelDedupeKey(
  projectId: string,
  type: ProjectChannelType,
  externalOrganizationId: string | null | undefined,
): string {
  const org = externalOrganizationId?.trim() || "internal";
  return `${projectId}:${type}:${org}`;
}

export function legacyChannelFromType(type: ProjectChannelType): LegacyMessageChannel {
  switch (type) {
    case "INTERNAL":
      return "INTERNE";
    case "CLIENT":
      return "CLIENT";
    case "SUPPLIER":
      return "FOURNISSEUR";
    case "SUBCONTRACTOR":
      return "SOUS_TRAITANT";
    default:
      return "CLIENT";
  }
}

export function typeFromLegacyChannel(
  channel: string | null | undefined,
): ProjectChannelType {
  switch (channel) {
    case "INTERNE":
      return "INTERNAL";
    case "FOURNISSEUR":
      return "SUPPLIER";
    case "SOUS_TRAITANT":
      return "SUBCONTRACTOR";
    case "CLIENT":
    default:
      return "CLIENT";
  }
}

export type ProjectChannelDisplay = {
  title: string;
  metaLabel: string;
  type: ProjectChannelType;
  external: boolean;
  composerHint: string;
};

export function getProjectChannelDisplay(params: {
  type: ProjectChannelType;
  orgName?: string | null;
  orgTradeName?: string | null;
  hostCompanyName?: string | null;
}): ProjectChannelDisplay {
  const host = (params.hostCompanyName?.trim() || DEMO_BRAND.companyName).trim();
  const orgLabel =
    (params.orgTradeName?.trim() || params.orgName?.trim() || "").trim() || "Organisation";

  switch (params.type) {
    case "INTERNAL":
      return {
        title: `Équipe ${host}`,
        metaLabel: "Interne",
        type: "INTERNAL",
        external: false,
        composerHint: `Visible uniquement par l’équipe ${host} autorisée.`,
      };
    case "CLIENT":
      return {
        title: orgLabel,
        metaLabel: "Client · Externe",
        type: "CLIENT",
        external: true,
        composerHint: `Visible par les participants de ce canal (${orgLabel}).`,
      };
    case "SUPPLIER":
      return {
        title: orgLabel,
        metaLabel: "Fournisseur · Externe",
        type: "SUPPLIER",
        external: true,
        composerHint: `Visible par les participants de ce canal (${orgLabel}).`,
      };
    case "SUBCONTRACTOR":
      return {
        title: orgLabel,
        metaLabel: "Sous-traitant · Externe",
        type: "SUBCONTRACTOR",
        external: true,
        composerHint: `Visible par les participants de ce canal (${orgLabel}).`,
      };
    case "MOE":
      return {
        title: orgLabel,
        metaLabel: "MOE · Externe",
        type: "MOE",
        external: true,
        composerHint: `Visible par les participants de ce canal (${orgLabel}).`,
      };
    case "CONTROL_OFFICE":
      return {
        title: orgLabel,
        metaLabel: "Bureau de contrôle · Externe",
        type: "CONTROL_OFFICE",
        external: true,
        composerHint: `Visible par les participants de ce canal (${orgLabel}).`,
      };
    case "PARTNER":
    default:
      return {
        title: orgLabel,
        metaLabel: "Partenaire · Externe",
        type: "PARTNER",
        external: true,
        composerHint: `Visible par les participants de ce canal (${orgLabel}).`,
      };
  }
}

function isActiveAccess(status: string | null | undefined): boolean {
  return !status || status === "ACTIVE" || status === "INVITED";
}

function isInternalPerson(personType: string | null | undefined): boolean {
  return !personType || personType === "INTERNAL";
}

export async function canManageProjectChannelParticipants(
  userId: string,
  projectId: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      personType: true,
      permissionProfile: true,
      accessStatus: true,
    },
  });
  if (!user || !isActiveAccess(user.accessStatus)) return false;
  if (!isInternalPerson(user.personType) && user.role === "CLIENT") return false;
  if (!isInternalPerson(user.personType)) return false;

  const profile = user.permissionProfile;
  if (profile === "DIRECTION" || profile === "ADMINISTRATIF") return true;
  if (user.role === "MANAGER" || user.role === "AGENCE") return true;

  if (profile === "CONDUCTEUR" || user.role === "AGENT") {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { assignedToId: true },
    });
    return project?.assignedToId === userId;
  }
  return false;
}

/** Résout ou crée un canal (anti-doublon via dedupeKey). */
export async function ensureProjectChannel(params: {
  projectId: string;
  type: ProjectChannelType;
  externalOrganizationId?: string | null;
}): Promise<{ id: string; type: string; externalOrganizationId: string | null; dedupeKey: string }> {
  const externalOrganizationId =
    params.type === "INTERNAL" ? null : params.externalOrganizationId ?? null;

  if (params.type !== "INTERNAL" && !externalOrganizationId) {
    throw new Error("externalOrganizationId requis pour un canal externe.");
  }

  const dedupeKey = projectChannelDedupeKey(
    params.projectId,
    params.type,
    externalOrganizationId,
  );

  const existing = await prisma.projectChannel.findUnique({
    where: { dedupeKey },
    select: { id: true, type: true, externalOrganizationId: true, dedupeKey: true },
  });
  if (existing) return existing;

  try {
    return await prisma.projectChannel.create({
      data: {
        projectId: params.projectId,
        type: params.type,
        externalOrganizationId,
        dedupeKey,
      },
      select: { id: true, type: true, externalOrganizationId: true, dedupeKey: true },
    });
  } catch {
    const again = await prisma.projectChannel.findUnique({
      where: { dedupeKey },
      select: { id: true, type: true, externalOrganizationId: true, dedupeKey: true },
    });
    if (again) return again;
    throw new Error("Impossible de créer le canal chantier.");
  }
}

export async function addChannelParticipant(params: {
  channelId: string;
  userId: string;
  addedById?: string | null;
}): Promise<void> {
  await prisma.projectChannelParticipant.upsert({
    where: {
      channelId_userId: { channelId: params.channelId, userId: params.userId },
    },
    create: {
      channelId: params.channelId,
      userId: params.userId,
      addedById: params.addedById ?? null,
    },
    update: {},
  });
}

export async function removeChannelParticipant(params: {
  channelId: string;
  userId: string;
}): Promise<void> {
  await prisma.projectChannelParticipant.deleteMany({
    where: { channelId: params.channelId, userId: params.userId },
  });
}

export async function isChannelParticipant(
  channelId: string,
  userId: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accessStatus: true },
  });
  if (!user || !isActiveAccess(user.accessStatus)) return false;

  const row = await prisma.projectChannelParticipant.findUnique({
    where: { channelId_userId: { channelId, userId } },
    select: { id: true },
  });
  return Boolean(row);
}

/**
 * ACL lecture/écriture canal.
 * Politique retrait : plus d’accès dès que non-participant (sauf messages déjà lus hors ligne — API refuse).
 */
export async function canAccessProjectChannel(
  userId: string,
  channelId: string,
  mode: "read" | "write" = "read",
): Promise<boolean> {
  const channel = await prisma.projectChannel.findUnique({
    where: { id: channelId },
    select: {
      id: true,
      type: true,
      projectId: true,
      externalOrganizationId: true,
      project: {
        select: {
          id: true,
          clientId: true,
          assignedToId: true,
          organizationId: true,
        },
      },
    },
  });
  if (!channel) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      personType: true,
      permissionProfile: true,
      accessStatus: true,
      externalOrganizationId: true,
    },
  });
  if (!user || !isActiveAccess(user.accessStatus)) return false;

  // Externe : jamais le canal INTERNE
  if (channel.type === "INTERNAL" && !isInternalPerson(user.personType)) {
    return false;
  }

  // Externe : doit appartenir à l’org du canal
  if (channel.externalOrganizationId) {
    if (!isInternalPerson(user.personType)) {
      if (user.externalOrganizationId !== channel.externalOrganizationId) {
        return false;
      }
    }
  }

  // Accès chantier de base
  const { canAccessProjectMessaging } = await import("@/lib/messaging/access");
  const projectOk = await canAccessProjectMessaging(user, channel.project);
  if (!projectOk) {
    // Internes org membres avec ProjectAccess messages
    if (isInternalPerson(user.personType) && channel.project.organizationId) {
      const member = await prisma.organizationMember.findFirst({
        where: {
          organizationId: channel.project.organizationId,
          userId,
        },
        select: { id: true },
      });
      if (!member) return false;
      const { userHasProjectScope } = await import("@/lib/equipe-acces/project-access");
      const scoped = await userHasProjectScope(userId, channel.project, "messages");
      const role = String(user.role ?? "");
      if (!scoped && role !== "MANAGER" && user.permissionProfile !== "DIRECTION") {
        // Direction peut superviser lecture sans être participant affiché — lecture seule
        if (mode === "write") return false;
        if (user.permissionProfile === "DIRECTION" || role === "MANAGER") {
          return true; // canView sans participation
        }
        return false;
      }
    } else {
      return false;
    }
  }

  const participant = await isChannelParticipant(channelId, userId);
  if (participant) return true;

  // Direction / Manager : lecture supervision sans être dans la liste participants
  if (
    mode === "read" &&
    isInternalPerson(user.personType) &&
    (user.permissionProfile === "DIRECTION" || String(user.role ?? "") === "MANAGER")
  ) {
    return true;
  }

  return false;
}

export type ProjectChannelListItem = {
  id: string;
  type: ProjectChannelType;
  externalOrganizationId: string | null;
  title: string;
  metaLabel: string;
  external: boolean;
  composerHint: string;
  participantCount: number;
  unreadCount: number;
  lastMessageAt: string | null;
};

/** Liste légère des canaux visibles pour un utilisateur sur un chantier. */
export async function listProjectChannelsForUser(
  userId: string,
  projectId: string,
): Promise<ProjectChannelListItem[]> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      organizationId: true,
      organization: { select: { name: true } },
    },
  });
  if (!project) return [];

  const hostName = project.organization?.name || DEMO_BRAND.companyName;

  let channels = await prisma.projectChannel.findMany({
    where: { projectId },
    include: {
      externalOrganization: { select: { name: true, tradeName: true, type: true } },
      _count: { select: { participants: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Bootstrap minimal si aucun canal
  if (channels.length === 0) {
    await bootstrapDefaultChannelsForProject(projectId);
    channels = await prisma.projectChannel.findMany({
      where: { projectId },
      include: {
        externalOrganization: { select: { name: true, tradeName: true, type: true } },
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  const visible: ProjectChannelListItem[] = [];
  for (const ch of channels) {
    const ok = await canAccessProjectChannel(userId, ch.id, "read");
    if (!ok) continue;
    const type = ch.type as ProjectChannelType;
    const display = getProjectChannelDisplay({
      type,
      orgName: ch.externalOrganization?.name,
      orgTradeName: ch.externalOrganization?.tradeName,
      hostCompanyName: hostName,
    });

    const unreadCount = await prisma.messageChannelReceipt.count({
      where: {
        userId,
        read: false,
        message: { channelId: ch.id, deletedAt: null },
      },
    });

    const last = await prisma.message.findFirst({
      where: { channelId: ch.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    visible.push({
      id: ch.id,
      type,
      externalOrganizationId: ch.externalOrganizationId,
      title: display.title,
      metaLabel: display.metaLabel,
      external: display.external,
      composerHint: display.composerHint,
      participantCount: ch._count.participants,
      unreadCount,
      lastMessageAt: last?.createdAt.toISOString() ?? null,
    });
  }

  // Ordre : INTERNAL, CLIENT, SUPPLIER, autres
  const order: Record<string, number> = {
    INTERNAL: 0,
    CLIENT: 1,
    SUPPLIER: 2,
    SUBCONTRACTOR: 3,
  };
  visible.sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9) || a.title.localeCompare(b.title, "fr"));
  return visible;
}

/** Crée les canaux par défaut d’un chantier (sans inventer d’acteurs). */
export async function bootstrapDefaultChannelsForProject(projectId: string): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      clientId: true,
      organizationId: true,
      assignedToId: true,
      client: { select: { id: true, externalOrganizationId: true, personType: true } },
    },
  });
  if (!project) return;

  const internal = await ensureProjectChannel({
    projectId,
    type: "INTERNAL",
  });

  // Participants internes candidats
  const internalUserIds = new Set<string>();
  if (project.assignedToId) internalUserIds.add(project.assignedToId);

  if (project.organizationId) {
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: project.organizationId },
      select: {
        user: {
          select: { id: true, personType: true, accessStatus: true, permissionProfile: true },
        },
      },
    });
    for (const m of members) {
      if (!m.user) continue;
      if (!isInternalPerson(m.user.personType)) continue;
      if (!isActiveAccess(m.user.accessStatus)) continue;
      // Direction optionnelle : pas auto-ajoutée partout (canView séparé)
      if (m.user.permissionProfile === "DIRECTION") continue;
      internalUserIds.add(m.user.id);
    }
  }

  // Accès projet explicites internes
  const accesses = await prisma.projectAccess.findMany({
    where: { projectId },
    select: {
      user: { select: { id: true, personType: true, accessStatus: true } },
    },
  });
  for (const a of accesses) {
    if (!a.user || !isInternalPerson(a.user.personType)) continue;
    if (!isActiveAccess(a.user.accessStatus)) continue;
    internalUserIds.add(a.user.id);
  }

  for (const uid of internalUserIds) {
    await addChannelParticipant({ channelId: internal.id, userId: uid });
  }

  // Canal client si org externe connue
  let clientOrgId = project.client.externalOrganizationId;
  if (!clientOrgId && project.organizationId) {
    const clientExt = await prisma.externalOrganization.findFirst({
      where: {
        hostOrganizationId: project.organizationId,
        type: "CLIENT_EXT",
        OR: [
          { people: { some: { id: project.clientId } } },
          { contacts: { some: { userId: project.clientId } } },
        ],
      },
      select: { id: true },
    });
    clientOrgId = clientExt?.id ?? null;
  }

  if (clientOrgId) {
    const clientCh = await ensureProjectChannel({
      projectId,
      type: "CLIENT",
      externalOrganizationId: clientOrgId,
    });
    await addChannelParticipant({ channelId: clientCh.id, userId: project.clientId });
    for (const uid of internalUserIds) {
      await addChannelParticipant({ channelId: clientCh.id, userId: uid });
    }
  }

  // Canaux fournisseurs via commandes du chantier
  const orders = await prisma.purchaseOrder.findMany({
    where: { projectId },
    select: { externalOrganizationId: true },
    distinct: ["externalOrganizationId"],
  });
  for (const o of orders) {
    if (!o.externalOrganizationId) continue;
    const supplierCh = await ensureProjectChannel({
      projectId,
      type: "SUPPLIER",
      externalOrganizationId: o.externalOrganizationId,
    });
    const people = await prisma.user.findMany({
      where: {
        externalOrganizationId: o.externalOrganizationId,
        accessStatus: { in: ["ACTIVE", "INVITED"] },
      },
      select: { id: true },
      take: 20,
    });
    for (const p of people) {
      await addChannelParticipant({ channelId: supplierCh.id, userId: p.id });
    }
    for (const uid of internalUserIds) {
      await addChannelParticipant({ channelId: supplierCh.id, userId: uid });
    }
  }
}

/**
 * Résout le canal métier pour un contexte (commande, type, org).
 * Anti-doublon : ensure + bootstrap.
 */
export async function resolveProjectChannelForContext(params: {
  projectId: string;
  type: ProjectChannelType;
  externalOrganizationId?: string | null;
}): Promise<{ id: string; type: string; externalOrganizationId: string | null }> {
  await bootstrapDefaultChannelsForProject(params.projectId);

  if (params.type === "INTERNAL") {
    return ensureProjectChannel({ projectId: params.projectId, type: "INTERNAL" });
  }

  let orgId = params.externalOrganizationId ?? null;
  if (!orgId && params.type === "CLIENT") {
    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
      select: {
        client: { select: { externalOrganizationId: true } },
      },
    });
    orgId = project?.client.externalOrganizationId ?? null;
  }
  if (!orgId && params.type === "SUPPLIER") {
    const po = await prisma.purchaseOrder.findFirst({
      where: { projectId: params.projectId },
      select: { externalOrganizationId: true },
      orderBy: { updatedAt: "desc" },
    });
    orgId = po?.externalOrganizationId ?? null;
  }
  if (!orgId) {
    throw new Error("Organisation externe introuvable pour ce canal.");
  }
  return ensureProjectChannel({
    projectId: params.projectId,
    type: params.type,
    externalOrganizationId: orgId,
  });
}

export async function listChannelParticipantUsers(channelId: string) {
  const rows = await prisma.projectChannelParticipant.findMany({
    where: { channelId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          personType: true,
          permissionProfile: true,
          company: true,
          accessStatus: true,
          externalOrganization: { select: { name: true, tradeName: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return rows
    .filter((r) => isActiveAccess(r.user.accessStatus))
    .map((r) => ({
      id: r.user.id,
      name: r.user.name,
      personType: r.user.personType,
      permissionProfile: r.user.permissionProfile,
      company:
        r.user.externalOrganization?.tradeName ||
        r.user.externalOrganization?.name ||
        r.user.company,
    }));
}

/** Destinataires notif / realtime : participants actifs hors auteur. */
export async function listChannelNotifyUserIds(
  channelId: string,
  excludeUserId: string,
): Promise<string[]> {
  const rows = await prisma.projectChannelParticipant.findMany({
    where: {
      channelId,
      userId: { not: excludeUserId },
      user: { accessStatus: { in: ["ACTIVE", "INVITED"] } },
    },
    select: { userId: true },
  });
  return rows.map((r) => r.userId);
}
