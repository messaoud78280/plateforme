import { prisma } from "@/lib/prisma";

export type ChantierShareRecipient = {
  id: string;
  name: string;
  roleLabel: string;
  channel: "project" | "direct";
};

/** Destinataires possibles pour transférer un document chantier. */
export async function listChantierShareRecipients(
  projectId: string,
  sessionUserId: string,
  sessionRole: string | null | undefined
): Promise<ChantierShareRecipient[]> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      clientId: true,
      assignedToId: true,
      client: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });
  if (!project) return [];

  const isStaff =
    sessionRole === "AGENCE" || sessionRole === "MANAGER" || sessionRole === "AGENT";
  const recipients: ChantierShareRecipient[] = [];
  const seen = new Set<string>();

  function add(r: ChantierShareRecipient) {
    if (r.id === sessionUserId || seen.has(r.id)) return;
    seen.add(r.id);
    recipients.push(r);
  }

  if (project.client && project.clientId !== sessionUserId) {
    add({
      id: project.client.id,
      name: project.client.name,
      roleLabel: "Client",
      channel: "project",
    });
  }

  if (project.assignedTo && project.assignedToId !== sessionUserId) {
    add({
      id: project.assignedTo.id,
      name: project.assignedTo.name,
      roleLabel: "Agent référent",
      channel: isStaff ? "direct" : "project",
    });
  }

  if (isStaff) {
    const team = await prisma.user.findMany({
      where: {
        id: { not: sessionUserId },
        role: { in: ["AGENCE", "AGENT", "MANAGER"] },
      },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
      take: 40,
    });
    for (const u of team) {
      const roleLabel =
        u.role === "MANAGER" ? "Gérant" : u.role === "AGENT" ? "Agent" : "Équipe BeWork";
      add({
        id: u.id,
        name: u.name,
        roleLabel,
        channel: "direct",
      });
    }
  }

  return recipients;
}
