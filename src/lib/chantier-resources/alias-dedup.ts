/** Déduplication des alias / synonymes d'une fiche ressource chantier. */

import type { Prisma, SiteResourceAlias, SiteResourceAliasKind } from "@prisma/client";
import { normalizeResourceLabel } from "@/lib/chantier-resources/normalize-label";

export type AliasRowForDedup = Pick<
  SiteResourceAlias,
  "id" | "normalizedLabel" | "label" | "createdAt" | "confidenceScore" | "sourceWorkItemId"
>;

export function aliasNormalizedKey(a: Pick<AliasRowForDedup, "normalizedLabel" | "label">): string {
  const n = a.normalizedLabel?.trim();
  if (n) return n;
  return normalizeResourceLabel(a.label);
}

/** Score pour choisir l'alias à conserver (le plus informatif / le plus ancien). */
export function scoreAliasToKeep(a: AliasRowForDedup): number {
  let s = 0;
  if (a.sourceWorkItemId) s += 20;
  if (a.confidenceScore != null) s += Math.min(a.confidenceScore, 100) / 5;
  // Préférer le plus ancien (stabilité des références)
  s -= a.createdAt.getTime() / 1e12;
  return s;
}

/** Identifiants des alias en double à supprimer (un seul conservé par libellé normalisé). */
export function aliasIdsToRemoveKeepingOnePerNormalized(aliases: AliasRowForDedup[]): string[] {
  const byNorm = new Map<string, AliasRowForDedup[]>();
  for (const a of aliases) {
    const key = aliasNormalizedKey(a);
    const list = byNorm.get(key) ?? [];
    list.push(a);
    byNorm.set(key, list);
  }
  const toRemove: string[] = [];
  for (const group of byNorm.values()) {
    if (group.length <= 1) continue;
    const sorted = [...group].sort((a, b) => scoreAliasToKeep(b) - scoreAliasToKeep(a));
    toRemove.push(...sorted.slice(1).map((x) => x.id));
  }
  return toRemove;
}

export function countRedundantAliases(aliases: AliasRowForDedup[]): number {
  return aliasIdsToRemoveKeepingOnePerNormalized(aliases).length;
}

export type CreateAliasParams = {
  siteResourceId: string;
  label: string;
  normalizedLabel?: string;
  aliasKind: SiteResourceAliasKind;
  sourceWorkItemId?: string | null;
  sourceField?: SiteResourceAlias["sourceField"];
  sourceSnippet?: string | null;
  confidenceScore?: number | null;
};

type Db = {
  siteResourceAlias: {
    findFirst: (args: {
      where: { siteResourceId: string; normalizedLabel: string };
    }) => Promise<{ id: string } | null>;
    create: (args: { data: Prisma.SiteResourceAliasCreateInput }) => Promise<{ id: string }>;
  };
};

/** Crée un alias uniquement si aucun alias avec le même libellé normalisé n'existe déjà. */
export async function createSiteResourceAliasIfAbsent(
  db: Db,
  params: CreateAliasParams,
): Promise<{ created: boolean; id: string }> {
  const normalizedLabel = params.normalizedLabel ?? normalizeResourceLabel(params.label);
  const existing = await db.siteResourceAlias.findFirst({
    where: { siteResourceId: params.siteResourceId, normalizedLabel },
  });
  if (existing) return { created: false, id: existing.id };

  const created = await db.siteResourceAlias.create({
    data: {
      siteResource: { connect: { id: params.siteResourceId } },
      label: params.label,
      normalizedLabel,
      aliasKind: params.aliasKind,
      ...(params.sourceWorkItemId ? { sourceWorkItem: { connect: { id: params.sourceWorkItemId } } } : {}),
      sourceField: params.sourceField ?? undefined,
      sourceSnippet: params.sourceSnippet ?? undefined,
      confidenceScore: params.confidenceScore ?? undefined,
    },
  });
  return { created: true, id: created.id };
}
