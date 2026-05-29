import { prisma } from "@/lib/prisma";

export async function canViewClientCredits(
  userId: string,
  role: string,
  clientId: string
): Promise<boolean> {
  if (role === "MANAGER" || role === "AGENCE") return true;
  if (role === "AGENT") {
    const linked = await prisma.task.findFirst({
      where: { clientId, assignedToId: userId },
      select: { id: true },
    });
    return Boolean(linked);
  }
  return false;
}
