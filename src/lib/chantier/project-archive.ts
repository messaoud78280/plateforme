/**
 * Archivage / restauration / suppression définitive d’un chantier.
 * Soft-delete par défaut (archivedAt) — jamais de DELETE silencieux si docs commerciaux.
 */
import type { CommercialQuoteStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canDeleteChantierProject } from "@/lib/chantier-dossier/access";
import { getUserOrganizationIds } from "@/lib/organization/access";
import { isBeworkStaff } from "@/lib/authz";
import { createServiceRoleClient } from "@/lib/supabase";
import { deleteChantierProjectStorage } from "@/lib/chantier-dossier/delete-project-storage";

export type ProjectArchiveErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "ALREADY_ARCHIVED"
  | "NOT_ARCHIVED"
  | "COMMERCIAL_LOCK"
  | "CONFIRMATION_REQUIRED"
  | "ERROR";

const PROTECTED_QUOTE_STATUSES: CommercialQuoteStatus[] = [
  "SENT",
  "ACCEPTED",
  "REFUSED",
  "EXPIRED",
];

export type ProjectArchiveAssessment = {
  project: {
    id: string;
    title: string;
    organizationId: string | null;
    clientId: string;
    archivedAt: Date | null;
  };
  isArchived: boolean;
  canArchive: boolean;
  canRestore: boolean;
  canHardDelete: boolean;
  commercialLock: boolean;
  commercialReasons: string[];
};

export async function assessProjectArchive(opts: {
  projectId: string;
  user: { id: string; role?: string | null };
}): Promise<
  | { ok: true; assessment: ProjectArchiveAssessment }
  | { ok: false; code: ProjectArchiveErrorCode; error: string }
> {
  const project = await prisma.project.findFirst({
    where: { id: opts.projectId },
    select: {
      id: true,
      title: true,
      organizationId: true,
      clientId: true,
      archivedAt: true,
    },
  });

  if (!project) {
    return { ok: false, code: "NOT_FOUND", error: "Chantier introuvable." };
  }

  if (!canDeleteChantierProject(opts.user, project)) {
    return {
      ok: false,
      code: "FORBIDDEN",
      error: "Vous n’avez pas l’autorisation de gérer ce chantier.",
    };
  }

  // Isolation multi-tenant : refuser si org projet ∉ orgs utilisateur (sauf staff BeWork).
  if (project.organizationId && !isBeworkStaff(opts.user)) {
    const userOrgs = await getUserOrganizationIds(opts.user.id);
    if (!userOrgs.includes(project.organizationId)) {
      return {
        ok: false,
        code: "FORBIDDEN",
        error: "Ce chantier appartient à une autre organisation.",
      };
    }
  }

  const [protectedQuotes, invoiceCount, progressCount] = await Promise.all([
    prisma.commercialQuote.findMany({
      where: {
        projectId: project.id,
        status: { in: PROTECTED_QUOTE_STATUSES },
      },
      select: { id: true, number: true, status: true },
      take: 20,
    }),
    prisma.commercialInvoice.count({
      where: { projectId: project.id },
    }),
    prisma.commercialProgressStatement.count({
      where: { projectId: project.id },
    }),
  ]);

  const commercialReasons: string[] = [];
  if (protectedQuotes.length > 0) {
    const labels = protectedQuotes
      .slice(0, 3)
      .map((q) => `${q.number} (${q.status})`)
      .join(", ");
    commercialReasons.push(
      protectedQuotes.length === 1
        ? `devis commercial protégé : ${labels}`
        : `${protectedQuotes.length} devis commerciaux protégés (${labels}${protectedQuotes.length > 3 ? "…" : ""})`,
    );
  }
  if (invoiceCount > 0) {
    commercialReasons.push(
      invoiceCount === 1
        ? "une facture est liée à ce chantier"
        : `${invoiceCount} factures sont liées à ce chantier`,
    );
  }
  if (progressCount > 0) {
    commercialReasons.push(
      progressCount === 1
        ? "une situation de travaux est liée"
        : `${progressCount} situations de travaux sont liées`,
    );
  }

  const commercialLock = commercialReasons.length > 0;
  const isArchived = Boolean(project.archivedAt);

  return {
    ok: true,
    assessment: {
      project,
      isArchived,
      canArchive: !isArchived,
      canRestore: isArchived,
      canHardDelete: isArchived && !commercialLock,
      commercialLock,
      commercialReasons,
    },
  };
}

/** Clause Prisma : projets actifs (non archivés). */
export function activeProjectWhere(): { archivedAt: null } {
  return { archivedAt: null };
}

/** Clause Prisma : uniquement archivés. */
export function archivedProjectWhere(): { archivedAt: { not: null } } {
  return { archivedAt: { not: null } };
}

export async function archiveProject(opts: {
  projectId: string;
  user: { id: string; role?: string | null };
}): Promise<
  | { ok: true; projectId: string; title: string }
  | { ok: false; code: ProjectArchiveErrorCode; error: string }
> {
  const assessed = await assessProjectArchive(opts);
  if (!assessed.ok) return assessed;
  if (!assessed.assessment.canArchive) {
    return {
      ok: false,
      code: "ALREADY_ARCHIVED",
      error: "Ce chantier est déjà archivé.",
    };
  }

  await prisma.project.update({
    where: { id: opts.projectId },
    data: {
      archivedAt: new Date(),
      archivedById: opts.user.id,
    },
  });

  return {
    ok: true,
    projectId: assessed.assessment.project.id,
    title: assessed.assessment.project.title,
  };
}

export async function restoreProject(opts: {
  projectId: string;
  user: { id: string; role?: string | null };
}): Promise<
  | { ok: true; projectId: string; title: string }
  | { ok: false; code: ProjectArchiveErrorCode; error: string }
> {
  const assessed = await assessProjectArchive(opts);
  if (!assessed.ok) return assessed;
  if (!assessed.assessment.canRestore) {
    return {
      ok: false,
      code: "NOT_ARCHIVED",
      error: "Ce chantier n’est pas archivé.",
    };
  }

  await prisma.project.update({
    where: { id: opts.projectId },
    data: {
      archivedAt: null,
      archivedById: null,
    },
  });

  return {
    ok: true,
    projectId: assessed.assessment.project.id,
    title: assessed.assessment.project.title,
  };
}

export async function hardDeleteProject(opts: {
  projectId: string;
  user: { id: string; role?: string | null };
  confirmation: string;
}): Promise<
  | { ok: true; projectId: string; title: string }
  | { ok: false; code: ProjectArchiveErrorCode; error: string }
> {
  const assessed = await assessProjectArchive(opts);
  if (!assessed.ok) return assessed;

  const { assessment } = assessed;
  if (!assessment.isArchived) {
    return {
      ok: false,
      code: "NOT_ARCHIVED",
      error:
        "Archivez d’abord le chantier. La suppression définitive n’est possible que depuis les archives.",
    };
  }
  if (assessment.commercialLock || !assessment.canHardDelete) {
    return {
      ok: false,
      code: "COMMERCIAL_LOCK",
      error:
        "Ce chantier contient des documents commerciaux et ne peut pas être supprimé définitivement. Conservez-le en archive.",
    };
  }

  const expected = "SUPPRIMER";
  const titleNorm = assessment.project.title.trim().toLowerCase();
  const confNorm = opts.confirmation.trim();
  const okConfirm =
    confNorm === expected || confNorm.toLowerCase() === titleNorm;
  if (!okConfirm) {
    return {
      ok: false,
      code: "CONFIRMATION_REQUIRED",
      error: `Saisissez « ${expected} » ou le nom exact du chantier pour confirmer.`,
    };
  }

  const supabase = createServiceRoleClient();
  if (supabase) {
    try {
      await deleteChantierProjectStorage(supabase, opts.projectId);
    } catch (e) {
      console.error("deleteChantierProjectStorage:", e);
    }
  }

  try {
    await prisma.project.delete({ where: { id: opts.projectId } });
    return {
      ok: true,
      projectId: assessment.project.id,
      title: assessment.project.title,
    };
  } catch (e) {
    console.error("hardDeleteProject:", e);
    return {
      ok: false,
      code: "ERROR",
      error: "Erreur lors de la suppression définitive du chantier.",
    };
  }
}
