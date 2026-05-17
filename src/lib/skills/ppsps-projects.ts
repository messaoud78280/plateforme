import { prisma } from "@/lib/prisma";

export type PpspsProjectOption = {
  id: string;
  title: string;
  status: string;
  clientName: string | null;
  siteHint: string | null;
};

/** Projets accessibles pour lier une session PPSPS (équipe BeWork). */
export async function listPpspsProjectsForUser(
  userId: string,
  role: string | null | undefined,
): Promise<PpspsProjectOption[]> {
  const isAgence = role === "AGENCE" || role === "MANAGER";

  const where = isAgence
    ? {}
    : role === "AGENT"
      ? {
          OR: [
            { assignedToId: userId },
            { tasks: { some: { assignedToId: userId } } },
          ],
        }
      : { id: "__none__" };

  const rows = await prisma.project.findMany({
    where,
    select: {
      id: true,
      title: true,
      status: true,
      description: true,
      client: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 80,
  });

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    clientName: r.client?.name ?? null,
    siteHint: r.description?.slice(0, 120) ?? null,
  }));
}

export async function canUserAccessPpspsProject(
  userId: string,
  role: string | null | undefined,
  projectId: string,
): Promise<{ ok: boolean; clientId?: string; title?: string }> {
  const isAgence = role === "AGENCE" || role === "MANAGER";

  const project = await prisma.project.findFirst({
    where: isAgence
      ? { id: projectId }
      : role === "AGENT"
        ? {
            id: projectId,
            OR: [
              { assignedToId: userId },
              { tasks: { some: { assignedToId: userId } } },
            ],
          }
        : { id: "__none__" },
    select: { id: true, clientId: true, title: true },
  });

  if (!project) return { ok: false };
  return { ok: true, clientId: project.clientId, title: project.title };
}
