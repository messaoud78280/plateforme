import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  addChannelParticipant,
  canAccessProjectChannel,
  canManageProjectChannelParticipants,
  isChannelParticipant,
  listChannelParticipantCandidates,
  listChannelParticipantUsers,
  removeChannelParticipant,
} from "@/lib/messagerie/project-channels";

type Ctx = { params: Promise<{ channelId: string }> };

/**
 * GET /api/messages/channels/[channelId]/participants
 * V2C.6A — liste + mode accès + candidats si gestion autorisée.
 */
export async function GET(_request: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { channelId } = await ctx.params;
  const ok = await canAccessProjectChannel(session.user.id, channelId, "read");
  if (!ok) {
    return NextResponse.json({ error: "Canal non autorisé" }, { status: 403 });
  }

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
          title: true,
          organization: { select: { name: true } },
        },
      },
      externalOrganization: { select: { name: true, tradeName: true, type: true } },
    },
  });
  if (!channel) {
    return NextResponse.json({ error: "Canal introuvable" }, { status: 404 });
  }

  const [participants, isParticipant, canManage] = await Promise.all([
    listChannelParticipantUsers(channelId),
    isChannelParticipant(channelId, session.user.id),
    canManageProjectChannelParticipants(session.user.id, channel.projectId),
  ]);

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, permissionProfile: true, role: true, personType: true },
  });
  const isSupervisor =
    !isParticipant &&
    (me?.permissionProfile === "DIRECTION" || String(me?.role ?? "") === "MANAGER");

  let candidates: Awaited<ReturnType<typeof listChannelParticipantCandidates>> | null = null;
  if (canManage) {
    candidates = await listChannelParticipantCandidates(channelId);
  }

  return NextResponse.json({
    channel,
    participants,
    canManage,
    isParticipant,
    isSupervisor,
    supervisor: isSupervisor
      ? {
          id: session.user.id,
          name: me?.name ?? "Direction",
          roleLabel: "Direction",
        }
      : null,
    candidates,
  });
}

/**
 * PUT /api/messages/channels/[channelId]/participants
 * Body: { userIds: string[] } — remplace la liste (internes tenant + org du canal uniquement).
 */
export async function PUT(request: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { channelId } = await ctx.params;

  const channel = await prisma.projectChannel.findUnique({
    where: { id: channelId },
    select: {
      id: true,
      type: true,
      projectId: true,
      externalOrganizationId: true,
      project: { select: { organizationId: true } },
    },
  });
  if (!channel) {
    return NextResponse.json({ error: "Canal introuvable" }, { status: 404 });
  }

  const canManage = await canManageProjectChannelParticipants(
    session.user.id,
    channel.projectId,
  );
  if (!canManage) {
    return NextResponse.json({ error: "Droit insuffisant" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const userIds = Array.isArray(body?.userIds)
    ? (body.userIds as unknown[]).filter((x): x is string => typeof x === "string")
    : null;
  if (!userIds) {
    return NextResponse.json({ error: "userIds requis" }, { status: 400 });
  }

  const hostOrgId = channel.project.organizationId;
  const hostMemberIds = new Set<string>();
  if (hostOrgId) {
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: hostOrgId },
      select: { userId: true },
    });
    for (const m of members) hostMemberIds.add(m.userId);
  }

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      personType: true,
      externalOrganizationId: true,
      accessStatus: true,
    },
  });

  const allowedIds: string[] = [];
  for (const u of users) {
    if (u.accessStatus === "DISABLED" || u.accessStatus === "SUSPENDED") continue;
    const internal = !u.personType || u.personType === "INTERNAL";
    if (channel.type === "INTERNAL") {
      if (!internal) continue;
      if (hostOrgId && !hostMemberIds.has(u.id)) continue;
      allowedIds.push(u.id);
      continue;
    }
    if (internal) {
      if (hostOrgId && !hostMemberIds.has(u.id)) continue;
      allowedIds.push(u.id);
      continue;
    }
    // Externe : uniquement la même org que le canal (jamais ABC dans Point.P)
    if (
      channel.externalOrganizationId &&
      u.externalOrganizationId === channel.externalOrganizationId
    ) {
      allowedIds.push(u.id);
    }
  }

  const existing = await prisma.projectChannelParticipant.findMany({
    where: { channelId },
    select: { userId: true },
  });
  const existingSet = new Set(existing.map((e) => e.userId));
  const nextSet = new Set(allowedIds);

  for (const id of allowedIds) {
    if (!existingSet.has(id)) {
      await addChannelParticipant({
        channelId,
        userId: id,
        addedById: session.user.id,
      });
    }
  }
  for (const id of existingSet) {
    if (!nextSet.has(id)) {
      await removeChannelParticipant({ channelId, userId: id });
    }
  }

  const participants = await listChannelParticipantUsers(channelId);
  return NextResponse.json({ ok: true, participants });
}
