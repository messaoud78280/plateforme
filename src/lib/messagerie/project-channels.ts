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
 * V2C.6A — 3 notions distinctes :
 * - canView  : participant OU supervision DIRECTION/MANAGER
 * - canWrite : participant, OU superviseur (qui devient participant au 1er envoi)
 * - participant : ligne ProjectChannelParticipant (seul pour notif / unread / Discussions)
 *
 * Retrait participant → plus d’accès (sauf supervision Direction en lecture).
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

  const isSupervisor =
    isInternalPerson(user.personType) &&
    (user.permissionProfile === "DIRECTION" || String(user.role ?? "") === "MANAGER");

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
        if (mode === "write") return false;
        if (isSupervisor) return true;
        return false;
      }
    } else {
      return false;
    }
  }

  const participant = await isChannelParticipant(channelId, userId);
  if (participant) return true;

  // Supervision Direction/Manager : lecture + écriture (écriture → devient participant)
  if (isSupervisor) {
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
  /** V2C.6A — membre explicite vs supervision */
  isParticipant: boolean;
  accessMode: "participant" | "supervision";
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

    const isParticipant = await isChannelParticipant(ch.id, userId);

    // Unread : uniquement pour les participants (supervision = consultation à la demande)
    const unreadCount = isParticipant
      ? await prisma.messageChannelReceipt.count({
          where: {
            userId,
            read: false,
            message: { channelId: ch.id, deletedAt: null },
          },
        })
      : 0;

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
      isParticipant,
      accessMode: isParticipant ? "participant" : "supervision",
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
          jobTitle: true,
          externalOrganization: { select: { name: true, tradeName: true, type: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return rows
    .filter((r) => isActiveAccess(r.user.accessStatus))
    .map((r) => {
      const company =
        r.user.externalOrganization?.tradeName ||
        r.user.externalOrganization?.name ||
        r.user.company;
      return {
        id: r.user.id,
        name: r.user.name,
        personType: r.user.personType,
        permissionProfile: r.user.permissionProfile,
        company,
        roleLabel: participantRoleLabel({
          personType: r.user.personType,
          permissionProfile: r.user.permissionProfile,
          jobTitle: r.user.jobTitle,
          externalOrgType: r.user.externalOrganization?.type,
        }),
        subtitle: [company, participantRoleLabel({
          personType: r.user.personType,
          permissionProfile: r.user.permissionProfile,
          jobTitle: r.user.jobTitle,
          externalOrgType: r.user.externalOrganization?.type,
        })].filter(Boolean).join(" · "),
      };
    });
}

function participantRoleLabel(opts: {
  personType?: string | null;
  permissionProfile?: string | null;
  jobTitle?: string | null;
  externalOrgType?: string | null;
}): string {
  if (opts.jobTitle?.trim()) return opts.jobTitle.trim();
  const profile = (opts.permissionProfile ?? "").toUpperCase();
  if (profile === "DIRECTION") return "Direction";
  if (profile === "CONDUCTEUR") return "Conducteur de travaux";
  if (profile === "ADMINISTRATIF") return "Administratif";
  if (profile === "CHEF_CHANTIER") return "Chef de chantier";
  if (opts.personType === "CLIENT_EXT" || opts.externalOrgType === "CLIENT_EXT") return "Client";
  if (opts.personType === "SUPPLIER" || opts.externalOrgType === "SUPPLIER") return "Fournisseur";
  if (opts.personType === "SUBCONTRACTOR") return "Sous-traitant";
  if (opts.personType === "INTERNAL" || !opts.personType) return "Interne";
  return "Contact";
}

/** Candidats pour « Gérer les participants » (internes tenant + externes org canal). */
export async function listChannelParticipantCandidates(channelId: string): Promise<{
  internals: { id: string; name: string; roleLabel: string; company: string | null }[];
  externals: { id: string; name: string; roleLabel: string; company: string | null }[];
}> {
  const channel = await prisma.projectChannel.findUnique({
    where: { id: channelId },
    select: {
      type: true,
      externalOrganizationId: true,
      project: {
        select: {
          organizationId: true,
          organization: { select: { name: true } },
        },
      },
      externalOrganization: { select: { name: true, tradeName: true, type: true } },
    },
  });
  if (!channel) return { internals: [], externals: [] };

  const hostName = channel.project.organization?.name || DEMO_BRAND.companyName;
  const internals: { id: string; name: string; roleLabel: string; company: string | null }[] = [];

  if (channel.project.organizationId) {
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: channel.project.organizationId },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            personType: true,
            permissionProfile: true,
            accessStatus: true,
            jobTitle: true,
            company: true,
          },
        },
      },
    });
    for (const m of members) {
      if (!m.user || !isInternalPerson(m.user.personType)) continue;
      if (!isActiveAccess(m.user.accessStatus)) continue;
      internals.push({
        id: m.user.id,
        name: m.user.name,
        roleLabel: participantRoleLabel({
          personType: m.user.personType,
          permissionProfile: m.user.permissionProfile,
          jobTitle: m.user.jobTitle,
        }),
        company: m.user.company || hostName,
      });
    }
  }

  const externals: { id: string; name: string; roleLabel: string; company: string | null }[] = [];
  if (channel.type !== "INTERNAL" && channel.externalOrganizationId) {
    const people = await prisma.user.findMany({
      where: {
        externalOrganizationId: channel.externalOrganizationId,
        accessStatus: { in: ["ACTIVE", "INVITED"] },
      },
      select: {
        id: true,
        name: true,
        personType: true,
        permissionProfile: true,
        jobTitle: true,
        company: true,
      },
      take: 40,
    });
    const orgLabel =
      channel.externalOrganization?.tradeName ||
      channel.externalOrganization?.name ||
      null;
    for (const p of people) {
      externals.push({
        id: p.id,
        name: p.name,
        roleLabel: participantRoleLabel({
          personType: p.personType,
          permissionProfile: p.permissionProfile,
          jobTitle: p.jobTitle,
          externalOrgType: channel.externalOrganization?.type,
        }),
        company: orgLabel || p.company,
      });
    }
  }

  internals.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  externals.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return { internals, externals };
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

/**
 * MESSAGERIE-V2C.7.1 / V2C.6A — Projection Discussions.
 * UNIQUEMENT les canaux où l’utilisateur est PARTICIPANT (pas la supervision globale).
 * Par chantier reste la vue pour explorer / superviser.
 */
export type InboxProjectChannelItem = {
  id: string;
  type: ProjectChannelType;
  externalOrganizationId: string | null;
  projectId: string;
  projectTitle: string;
  title: string;
  /** Titre liste : « Point.P — Résidence Les Lilas » */
  listTitle: string;
  metaLabel: string;
  external: boolean;
  unreadCount: number;
  lastMessageAt: string | null;
  lastMessage: {
    content: string;
    createdAt: string;
    senderName: string;
  } | null;
  href: string;
};

export async function listInboxProjectChannelsForUser(
  userId: string,
): Promise<InboxProjectChannelItem[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      personType: true,
      accessStatus: true,
      externalOrganizationId: true,
    },
  });
  if (!user || !isActiveAccess(user.accessStatus)) return [];

  // V2C.6A — Discussions = boîte personnelle : participants uniquement
  const participantRows = await prisma.projectChannelParticipant.findMany({
    where: { userId },
    select: { channelId: true },
  });
  const ids = participantRows.map((r) => r.channelId);
  if (ids.length === 0) return [];

  const isInternal = isInternalPerson(user.personType);

  const channels = await prisma.projectChannel.findMany({
    where: { id: { in: ids } },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          organizationId: true,
          organization: { select: { name: true } },
        },
      },
      externalOrganization: { select: { name: true, tradeName: true, type: true } },
    },
    take: 200,
  });

  const accessible = channels.filter((ch) => {
    if (ch.type === "INTERNAL" && !isInternal) return false;
    if (ch.externalOrganizationId && !isInternal) {
      if (user.externalOrganizationId !== ch.externalOrganizationId) return false;
    }
    return true;
  });
  if (accessible.length === 0) return [];

  const accessibleIds = accessible.map((c) => c.id);

  const [unreadRows, recentMessages] = await Promise.all([
    prisma.messageChannelReceipt.findMany({
      where: {
        userId,
        read: false,
        message: { channelId: { in: accessibleIds }, deletedAt: null },
      },
      select: { message: { select: { channelId: true } } },
    }),
    prisma.message.findMany({
      where: { channelId: { in: accessibleIds }, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: Math.min(accessibleIds.length * 4, 400),
      select: {
        channelId: true,
        content: true,
        createdAt: true,
        sender: { select: { name: true } },
      },
    }),
  ]);

  const unreadByChannel = new Map<string, number>();
  for (const row of unreadRows) {
    const cid = row.message.channelId;
    if (!cid) continue;
    unreadByChannel.set(cid, (unreadByChannel.get(cid) ?? 0) + 1);
  }

  const lastByChannel = new Map<
    string,
    { content: string; createdAt: Date; senderName: string }
  >();
  for (const m of recentMessages) {
    if (!m.channelId || lastByChannel.has(m.channelId)) continue;
    lastByChannel.set(m.channelId, {
      content: m.content,
      createdAt: m.createdAt,
      senderName: m.sender.name,
    });
  }

  const items: InboxProjectChannelItem[] = [];
  for (const ch of accessible) {
    const last = lastByChannel.get(ch.id);
    if (!last) continue;

    const type = ch.type as ProjectChannelType;
    const hostName = ch.project.organization?.name || DEMO_BRAND.companyName;
    const display = getProjectChannelDisplay({
      type,
      orgName: ch.externalOrganization?.name,
      orgTradeName: ch.externalOrganization?.tradeName,
      hostCompanyName: hostName,
    });
    const projectTitle = ch.project.title;
    const listTitle = `${display.title} — ${projectTitle}`;

    const q = new URLSearchParams({
      view: "chantiers",
      project: ch.projectId,
      channelId: ch.id,
    });
    if (ch.externalOrganizationId) {
      q.set("externalOrganizationId", ch.externalOrganizationId);
    }

    items.push({
      id: ch.id,
      type,
      externalOrganizationId: ch.externalOrganizationId,
      projectId: ch.projectId,
      projectTitle,
      title: display.title,
      listTitle,
      metaLabel: display.metaLabel,
      external: display.external,
      unreadCount: unreadByChannel.get(ch.id) ?? 0,
      lastMessageAt: last.createdAt.toISOString(),
      lastMessage: {
        content: last.content,
        createdAt: last.createdAt.toISOString(),
        senderName: last.senderName,
      },
      href: `/dashboard/messagerie?${q.toString()}`,
    });
  }

  items.sort((a, b) => {
    const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return tb - ta;
  });
  return items;
}

