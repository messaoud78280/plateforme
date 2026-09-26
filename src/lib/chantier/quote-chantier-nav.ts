import { prisma } from "@/lib/prisma";
import { moduleChantierNav } from "@/components/chantier/ChantierHierarchyNav";

/**
 * Résout la navigation dossier chantier pour un devis commercial
 * (périmètre de référence, métré source, ou projet seul).
 */
export async function resolveQuoteChantierNav(
  orgId: string,
  quote: {
    id: string;
    projectId: string | null;
    sourcePrepStudyId: string | null;
    scopeId?: string | null;
    project: { id: string; title: string } | null;
  },
): Promise<ReturnType<typeof moduleChantierNav> | null> {
  if (quote.scopeId) {
    const byMembership = await prisma.projectScope.findFirst({
      where: { id: quote.scopeId, organizationId: orgId },
      select: {
        id: true,
        name: true,
        projectId: true,
        project: { select: { title: true } },
      },
    });
    if (byMembership) {
      return moduleChantierNav({
        projectId: byMembership.projectId,
        projectTitle: byMembership.project.title,
        scope: { id: byMembership.id, name: byMembership.name },
        currentLabel: "Devis",
      });
    }
  }

  const byRef = await prisma.projectScope.findFirst({
    where: { organizationId: orgId, referenceQuoteId: quote.id },
    select: {
      id: true,
      name: true,
      projectId: true,
      project: { select: { title: true } },
    },
  });
  if (byRef) {
    return moduleChantierNav({
      projectId: byRef.projectId,
      projectTitle: byRef.project.title,
      scope: { id: byRef.id, name: byRef.name },
      currentLabel: "Devis",
    });
  }

  if (quote.sourcePrepStudyId) {
    const study = await prisma.prepStudy.findFirst({
      where: {
        id: quote.sourcePrepStudyId,
        organizationId: orgId,
        archivedAt: null,
      },
      select: {
        projectId: true,
        scope: { select: { id: true, name: true } },
        project: { select: { title: true } },
      },
    });
    if (study?.projectId) {
      return moduleChantierNav({
        projectId: study.projectId,
        projectTitle: study.project.title,
        scope: study.scope
          ? { id: study.scope.id, name: study.scope.name }
          : null,
        currentLabel: "Devis",
      });
    }
  }

  if (quote.projectId && quote.project) {
    return moduleChantierNav({
      projectId: quote.project.id,
      projectTitle: quote.project.title,
      scope: null,
      currentLabel: "Devis",
    });
  }

  return null;
}
