/**
 * Classification métier des ressources chantier — comparaison fiche / taxonomie suggérée.
 */

import type { PrismaClient, SiteResourceType } from "@prisma/client";
import { normalizeResourceLabel } from "@/lib/chantier-resources/normalize-label";
import { suggestTaxonomyFromText, type ChantierResourceTaxonomySuggestion } from "@/lib/chantier-resources/taxonomy";

export type ResourceForClassification = {
  id: string;
  shortName: string;
  fullDescription: string | null;
  resourceType: SiteResourceType;
  family: string;
  subFamily: string | null;
  aliasLabels?: string[];
};

export type ClassificationFix = {
  id: string;
  shortName: string;
  currentType: SiteResourceType;
  currentFamily: string;
  currentSubFamily: string | null;
  suggestedType: SiteResourceType;
  suggestedFamily: string;
  suggestedSubFamily: string | null;
};

/** Texte analysé pour la famille (titre + description + alias — évite les faux positifs sur un seul mot). */
export function buildResourceClassificationText(resource: ResourceForClassification): string {
  const parts = [resource.shortName, resource.fullDescription, ...(resource.aliasLabels ?? [])].filter(
    (p): p is string => Boolean(p?.trim()),
  );
  return parts.join(" · ");
}

export function isTaxonomyMisclassified(
  current: Pick<ResourceForClassification, "resourceType" | "family" | "subFamily">,
  suggested: ChantierResourceTaxonomySuggestion,
): boolean {
  return (
    current.resourceType !== suggested.resourceType ||
    current.family !== suggested.family ||
    current.subFamily !== suggested.subFamily
  );
}

export function collectClassificationFixes(resources: ResourceForClassification[]): ClassificationFix[] {
  const fixes: ClassificationFix[] = [];
  for (const r of resources) {
    const text = buildResourceClassificationText(r);
    const tax = suggestTaxonomyFromText(text);
    if (!isTaxonomyMisclassified(r, tax)) continue;
    fixes.push({
      id: r.id,
      shortName: r.shortName,
      currentType: r.resourceType,
      currentFamily: r.family,
      currentSubFamily: r.subFamily,
      suggestedType: tax.resourceType,
      suggestedFamily: tax.family,
      suggestedSubFamily: tax.subFamily,
    });
  }
  return fixes;
}

export async function loadResourcesForClassification(prisma: PrismaClient): Promise<ResourceForClassification[]> {
  const rows = await prisma.siteResource.findMany({
    where: { mergedIntoId: null, status: { not: "fusionne" } },
    select: {
      id: true,
      shortName: true,
      fullDescription: true,
      resourceType: true,
      family: true,
      subFamily: true,
      aliases: { select: { label: true }, orderBy: { createdAt: "desc" }, take: 8 },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    shortName: r.shortName,
    fullDescription: r.fullDescription,
    resourceType: r.resourceType,
    family: r.family,
    subFamily: r.subFamily,
    aliasLabels: r.aliases.map((a) => a.label),
  }));
}

export async function applyClassificationFixes(
  prisma: PrismaClient,
  fixes: ClassificationFix[],
): Promise<number> {
  let applied = 0;
  for (const fix of fixes) {
    await prisma.siteResource.update({
      where: { id: fix.id },
      data: {
        resourceType: fix.suggestedType,
        family: fix.suggestedFamily,
        subFamily: fix.suggestedSubFamily,
        normalizedDesignation: normalizeResourceLabel(fix.shortName),
      },
    });
    applied += 1;
  }
  return applied;
}

export async function reclassifyAllSiteResources(prisma: PrismaClient): Promise<{
  analyzed: number;
  fixes: ClassificationFix[];
  applied: number;
}> {
  const resources = await loadResourcesForClassification(prisma);
  const fixes = collectClassificationFixes(resources);
  const applied = await applyClassificationFixes(prisma, fixes);
  return { analyzed: resources.length, fixes, applied };
}
