import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type PilotageSessionUser = { id: string; role?: string | null; name?: string | null };

const LIST_PATH = "/dashboard/pilotage-travaux";

export function canAccessPilotageModule(role?: string | null): boolean {
  return role === "MANAGER" || role === "AGENCE" || role === "AGENT" || role === "CLIENT";
}

export function canManagePilotage(role?: string | null): boolean {
  return role === "MANAGER" || role === "AGENCE";
}

export function canEditPilotageOperational(role?: string | null): boolean {
  return role === "MANAGER" || role === "AGENCE" || role === "AGENT";
}

export async function requirePilotageSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/connexion?callbackUrl=${LIST_PATH}`);
  }
  if (!canAccessPilotageModule(session.user.role)) {
    redirect("/dashboard");
  }
  return session;
}

/** Scope Prisma pour lister les pilotages selon le rôle. */
export function buildPilotageListWhere(user: PilotageSessionUser) {
  const base = { archivedAt: null as Date | null };
  if (user.role === "MANAGER" || user.role === "AGENCE") {
    return base;
  }
  if (user.role === "AGENT") {
    return {
      ...base,
      OR: [{ assistantId: user.id }, { conducteurId: user.id }, { project: { assignedToId: user.id } }],
    };
  }
  // CLIENT : chantiers de son entreprise
  return { ...base, clientId: user.id };
}

export async function canAccessPilotage(user: PilotageSessionUser, pilotageId: string) {
  const pilotage = await prisma.worksitePilotage.findUnique({
    where: { id: pilotageId },
    select: {
      id: true,
      clientId: true,
      assistantId: true,
      conducteurId: true,
      archivedAt: true,
      project: { select: { id: true, clientId: true, assignedToId: true, title: true } },
    },
  });
  if (!pilotage) return { ok: false as const, pilotage: null };

  if (user.role === "MANAGER" || user.role === "AGENCE") {
    return { ok: true as const, pilotage };
  }
  if (user.role === "AGENT") {
    const allowed =
      pilotage.assistantId === user.id ||
      pilotage.conducteurId === user.id ||
      pilotage.project.assignedToId === user.id;
    return allowed ? { ok: true as const, pilotage } : { ok: false as const, pilotage: null };
  }
  if (pilotage.clientId === user.id || pilotage.project.clientId === user.id) {
    return { ok: true as const, pilotage };
  }
  return { ok: false as const, pilotage: null };
}

export async function requirePilotageAccess(user: PilotageSessionUser, pilotageId: string) {
  const access = await canAccessPilotage(user, pilotageId);
  if (!access.ok || !access.pilotage) {
    redirect(LIST_PATH);
  }
  return access.pilotage;
}
