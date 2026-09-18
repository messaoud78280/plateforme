import { getServerSession } from "next-auth";
import type { SiteDocumentKind } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessChantierProject, isChantierStaff } from "@/lib/chantier-dossier/access";
import { ensureOrganizationForOwner } from "@/lib/organization/access";

export type SiteDocAuth =
  | {
      ok: true;
      userId: string;
      role: string | null;
      orgId: string;
      project: {
        id: string;
        title: string;
        description: string | null;
        siteAddress: string | null;
        siteCity: string | null;
        internalManager: string | null;
        organizationId: string | null;
        clientId: string;
      };
      canWrite: boolean;
    }
  | { ok: false; status: number; error: string };

export async function requireSiteDocumentAccess(
  projectId: string,
  opts?: { requireWrite?: boolean },
): Promise<SiteDocAuth> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, status: 401, error: "Non authentifié" };
  }

  const access = await canAccessChantierProject(session.user, projectId);
  if (!access.ok || !access.project) {
    return { ok: false, status: 403, error: "Accès chantier refusé" };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      description: true,
      siteAddress: true,
      siteCity: true,
      internalManager: true,
      organizationId: true,
      clientId: true,
      client: { select: { name: true, company: true } },
    },
  });
  if (!project) {
    return { ok: false, status: 404, error: "Chantier introuvable" };
  }

  let orgId = project.organizationId;
  if (!orgId) {
    try {
      const ensured = await ensureOrganizationForOwner(project.clientId);
      if (!ensured) {
        return { ok: false, status: 400, error: "Organisation chantier manquante" };
      }
      orgId = ensured;
      await prisma.project.update({
        where: { id: projectId },
        data: { organizationId: orgId },
      });
    } catch {
      return { ok: false, status: 400, error: "Organisation chantier manquante" };
    }
  }

  const canWrite = isChantierStaff(session.user.role);
  if (opts?.requireWrite && !canWrite) {
    return { ok: false, status: 403, error: "Écriture réservée à l’équipe chantier" };
  }

  return {
    ok: true,
    userId: session.user.id,
    role: session.user.role ?? null,
    orgId,
    project: {
      id: project.id,
      title: project.title,
      description: project.description,
      siteAddress: project.siteAddress,
      siteCity: project.siteCity,
      internalManager: project.internalManager,
      organizationId: orgId,
      clientId: project.clientId,
    },
    canWrite,
  };
}

export async function nextSiteDocumentNumber(
  projectId: string,
  kind: SiteDocumentKind,
): Promise<string> {
  const prefix = kind === "COMPTE_RENDU" ? "CR" : "PPSPS";
  const existing = await prisma.siteDocument.findMany({
    where: { projectId, kind },
    select: { number: true },
  });
  let max = 0;
  for (const row of existing) {
    const m = row.number.match(/(\d+)\s*$/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}
