/**
 * Backfill MESSAGERIE-V2C.6 — ProjectChannel + channelId sur Message.
 * Idempotent. À lancer après migration SQL / db push.
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import {
  addChannelParticipant,
  ensureProjectChannel,
  typeFromLegacyChannel,
  type ProjectChannelType,
} from "@/lib/messagerie/project-channels";

async function resolveOrgForSupplierMessage(params: {
  projectId: string;
  senderId: string;
  receiverId: string;
}): Promise<string | null> {
  const users = await prisma.user.findMany({
    where: { id: { in: [params.senderId, params.receiverId] } },
    select: { id: true, personType: true, externalOrganizationId: true },
  });
  for (const u of users) {
    if (
      (u.personType === "SUPPLIER" || u.personType === "SUBCONTRACTOR") &&
      u.externalOrganizationId
    ) {
      return u.externalOrganizationId;
    }
  }
  const po = await prisma.purchaseOrder.findFirst({
    where: { projectId: params.projectId },
    select: { externalOrganizationId: true },
    orderBy: { updatedAt: "desc" },
  });
  return po?.externalOrganizationId ?? null;
}

async function resolveOrgForClientMessage(projectId: string): Promise<string | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      client: { select: { externalOrganizationId: true } },
      organizationId: true,
      clientId: true,
    },
  });
  if (!project) return null;
  if (project.client.externalOrganizationId) return project.client.externalOrganizationId;
  if (!project.organizationId) return null;
  const org = await prisma.externalOrganization.findFirst({
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
  return org?.id ?? null;
}

async function main() {
  const messages = await prisma.message.findMany({
    where: { channelId: null },
    select: {
      id: true,
      projectId: true,
      channel: true,
      senderId: true,
      receiverId: true,
    },
    take: 5000,
  });

  console.log(`[v2c6] messages sans channelId: ${messages.length}`);
  let linked = 0;
  let skipped = 0;

  for (const m of messages) {
    const type = typeFromLegacyChannel(m.channel) as ProjectChannelType;
    try {
      let channelId: string | null = null;
      if (type === "INTERNAL") {
        const ch = await ensureProjectChannel({ projectId: m.projectId, type: "INTERNAL" });
        channelId = ch.id;
      } else if (type === "CLIENT") {
        const orgId = await resolveOrgForClientMessage(m.projectId);
        if (!orgId) {
          skipped += 1;
          continue;
        }
        const ch = await ensureProjectChannel({
          projectId: m.projectId,
          type: "CLIENT",
          externalOrganizationId: orgId,
        });
        channelId = ch.id;
      } else if (type === "SUPPLIER" || type === "SUBCONTRACTOR") {
        const orgId = await resolveOrgForSupplierMessage({
          projectId: m.projectId,
          senderId: m.senderId,
          receiverId: m.receiverId,
        });
        if (!orgId) {
          skipped += 1;
          continue;
        }
        const ch = await ensureProjectChannel({
          projectId: m.projectId,
          type: type === "SUBCONTRACTOR" ? "SUBCONTRACTOR" : "SUPPLIER",
          externalOrganizationId: orgId,
        });
        channelId = ch.id;
      } else {
        skipped += 1;
        continue;
      }

      await prisma.message.update({
        where: { id: m.id },
        data: { channelId },
      });
      await addChannelParticipant({ channelId, userId: m.senderId });
      await addChannelParticipant({ channelId, userId: m.receiverId });
      linked += 1;
    } catch (e) {
      skipped += 1;
      console.warn(`[v2c6] skip message ${m.id}`, e);
    }
  }

  const projects = await prisma.project.findMany({
    select: { id: true },
    take: 500,
  });
  const { bootstrapDefaultChannelsForProject } = await import(
    "@/lib/messagerie/project-channels"
  );
  for (const p of projects) {
    await bootstrapDefaultChannelsForProject(p.id);
  }

  console.log(`[v2c6] linked=${linked} skipped=${skipped} projectsBootstrapped=${projects.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
