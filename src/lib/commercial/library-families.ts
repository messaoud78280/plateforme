/**
 * Gestion familles / sous-familles bibliothèque commerciale.
 * Les libellés restent sur CommercialWorkItem ; la taxonomie (ordres + familles vides)
 * est stockée dans CommercialOrgSettings.libraryTaxonomyJson.
 */
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ensureCommercialOrgSettings } from "@/lib/commercial/settings";
import { listLibraryFamilyTree } from "@/lib/commercial/library";

export type TaxonomySubFamily = { id: string; name: string; sortOrder: number };
export type TaxonomyFamily = {
  id: string;
  name: string;
  sortOrder: number;
  subFamilies: TaxonomySubFamily[];
};
export type LibraryTaxonomy = { families: TaxonomyFamily[] };

function newId() {
  return `tax_${randomBytes(8).toString("hex")}`;
}

function parseTaxonomy(raw: unknown): LibraryTaxonomy {
  if (!raw || typeof raw !== "object") return { families: [] };
  const fams = (raw as { families?: unknown }).families;
  if (!Array.isArray(fams)) return { families: [] };
  return {
    families: fams
      .map((f, i) => {
        if (!f || typeof f !== "object") return null;
        const o = f as Record<string, unknown>;
        const name = String(o.name ?? "").trim();
        if (!name) return null;
        const subs = Array.isArray(o.subFamilies) ? o.subFamilies : [];
        return {
          id: String(o.id ?? newId()),
          name,
          sortOrder: typeof o.sortOrder === "number" ? o.sortOrder : i,
          subFamilies: subs
            .map((s, j) => {
              if (!s || typeof s !== "object") return null;
              const so = s as Record<string, unknown>;
              const sn = String(so.name ?? "").trim();
              if (!sn) return null;
              return {
                id: String(so.id ?? newId()),
                name: sn,
                sortOrder: typeof so.sortOrder === "number" ? so.sortOrder : j,
              };
            })
            .filter((x): x is TaxonomySubFamily => Boolean(x))
            .sort((a, b) => a.sortOrder - b.sortOrder),
        };
      })
      .filter((x): x is TaxonomyFamily => Boolean(x))
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

async function loadTaxonomy(orgId: string): Promise<LibraryTaxonomy> {
  const settings = await ensureCommercialOrgSettings(orgId);
  return parseTaxonomy(settings.libraryTaxonomyJson);
}

async function saveTaxonomy(orgId: string, taxonomy: LibraryTaxonomy) {
  await ensureCommercialOrgSettings(orgId);
  await prisma.commercialOrgSettings.update({
    where: { organizationId: orgId },
    data: { libraryTaxonomyJson: taxonomy },
  });
  return taxonomy;
}

/** Arbre complet : taxonomie + comptes réels des ouvrages. */
export async function getLibraryFamilyManagement(orgId: string) {
  const [taxonomy, live] = await Promise.all([
    loadTaxonomy(orgId),
    listLibraryFamilyTree(orgId),
  ]);

  const byName = new Map(live.map((f) => [f.family, f]));
  const merged: Array<{
    id: string;
    name: string;
    sortOrder: number;
    count: number;
    subFamilies: Array<{ id: string; name: string; sortOrder: number; count: number }>;
  }> = [];

  const seen = new Set<string>();

  for (const tf of taxonomy.families) {
    const liveF = byName.get(tf.name);
    seen.add(tf.name);
    const subCounts = new Map(
      (liveF?.subFamilies ?? []).map((s) => [s.name, s.count]),
    );
    merged.push({
      id: tf.id,
      name: tf.name,
      sortOrder: tf.sortOrder,
      count: liveF?.count ?? 0,
      subFamilies: tf.subFamilies.map((s) => ({
        id: s.id,
        name: s.name,
        sortOrder: s.sortOrder,
        count: subCounts.get(s.name) ?? 0,
      })),
    });
  }

  // Familles présentes en base mais absentes de la taxonomie
  for (const lf of live) {
    if (seen.has(lf.family)) continue;
    merged.push({
      id: newId(),
      name: lf.family,
      sortOrder: merged.length,
      count: lf.count,
      subFamilies: lf.subFamilies.map((s, i) => ({
        id: newId(),
        name: s.name,
        sortOrder: i,
        count: s.count,
      })),
    });
  }

  return { families: merged.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "fr")) };
}

export async function createLibraryFamily(orgId: string, name: string) {
  const n = name.trim();
  if (!n) throw new Error("Nom de famille requis");
  const taxonomy = await loadTaxonomy(orgId);
  if (taxonomy.families.some((f) => f.name.toLowerCase() === n.toLowerCase())) {
    throw new Error("Cette famille existe déjà");
  }
  taxonomy.families.push({
    id: newId(),
    name: n,
    sortOrder: taxonomy.families.length,
    subFamilies: [],
  });
  await saveTaxonomy(orgId, taxonomy);
  return getLibraryFamilyManagement(orgId);
}

export async function renameLibraryFamily(orgId: string, fromName: string, toName: string) {
  const from = fromName.trim();
  const to = toName.trim();
  if (!from || !to) throw new Error("Noms requis");
  if (from === to) return getLibraryFamilyManagement(orgId);

  await prisma.commercialWorkItem.updateMany({
    where: { organizationId: orgId, family: from },
    data: { family: to },
  });

  const taxonomy = await loadTaxonomy(orgId);
  const fam = taxonomy.families.find((f) => f.name === from);
  if (fam) fam.name = to;
  else {
    taxonomy.families.push({
      id: newId(),
      name: to,
      sortOrder: taxonomy.families.length,
      subFamilies: [],
    });
  }
  await saveTaxonomy(orgId, taxonomy);
  return getLibraryFamilyManagement(orgId);
}

export async function createLibrarySubFamily(
  orgId: string,
  familyName: string,
  subName: string,
) {
  const family = familyName.trim();
  const sub = subName.trim();
  if (!family || !sub) throw new Error("Famille et sous-famille requises");

  const taxonomy = await loadTaxonomy(orgId);
  let fam = taxonomy.families.find((f) => f.name === family);
  if (!fam) {
    fam = { id: newId(), name: family, sortOrder: taxonomy.families.length, subFamilies: [] };
    taxonomy.families.push(fam);
  }
  if (fam.subFamilies.some((s) => s.name.toLowerCase() === sub.toLowerCase())) {
    throw new Error("Cette sous-famille existe déjà");
  }
  fam.subFamilies.push({ id: newId(), name: sub, sortOrder: fam.subFamilies.length });
  await saveTaxonomy(orgId, taxonomy);
  return getLibraryFamilyManagement(orgId);
}

export async function renameLibrarySubFamily(opts: {
  orgId: string;
  familyName: string;
  fromSub: string;
  toSub: string;
}) {
  const family = opts.familyName.trim();
  const from = opts.fromSub.trim();
  const to = opts.toSub.trim();
  if (!family || !from || !to) throw new Error("Paramètres requis");

  await prisma.commercialWorkItem.updateMany({
    where: { organizationId: opts.orgId, family, subFamily: from },
    data: { subFamily: to },
  });

  const taxonomy = await loadTaxonomy(opts.orgId);
  const fam = taxonomy.families.find((f) => f.name === family);
  const sub = fam?.subFamilies.find((s) => s.name === from);
  if (sub) sub.name = to;
  await saveTaxonomy(opts.orgId, taxonomy);
  return getLibraryFamilyManagement(opts.orgId);
}

export async function moveLibrarySubFamily(opts: {
  orgId: string;
  fromFamily: string;
  toFamily: string;
  subName: string;
}) {
  const fromFamily = opts.fromFamily.trim();
  const toFamily = opts.toFamily.trim();
  const subName = opts.subName.trim();
  if (!fromFamily || !toFamily || !subName) throw new Error("Paramètres requis");

  await prisma.commercialWorkItem.updateMany({
    where: {
      organizationId: opts.orgId,
      family: fromFamily,
      subFamily: subName,
    },
    data: { family: toFamily },
  });

  const taxonomy = await loadTaxonomy(opts.orgId);
  const from = taxonomy.families.find((f) => f.name === fromFamily);
  const to = taxonomy.families.find((f) => f.name === toFamily);
  const sub = from?.subFamilies.find((s) => s.name === subName);
  if (from && sub) {
    from.subFamilies = from.subFamilies.filter((s) => s.id !== sub.id);
  }
  if (to) {
    if (!to.subFamilies.some((s) => s.name === subName)) {
      to.subFamilies.push({
        id: sub?.id ?? newId(),
        name: subName,
        sortOrder: to.subFamilies.length,
      });
    }
  } else {
    taxonomy.families.push({
      id: newId(),
      name: toFamily,
      sortOrder: taxonomy.families.length,
      subFamilies: [{ id: newId(), name: subName, sortOrder: 0 }],
    });
  }
  await saveTaxonomy(opts.orgId, taxonomy);
  return getLibraryFamilyManagement(opts.orgId);
}

export async function reorderLibraryFamilies(
  orgId: string,
  orderedFamilyNames: string[],
) {
  const taxonomy = await loadTaxonomy(orgId);
  const byName = new Map(taxonomy.families.map((f) => [f.name, f]));
  const live = await listLibraryFamilyTree(orgId);
  for (const lf of live) {
    if (!byName.has(lf.family)) {
      const f: TaxonomyFamily = {
        id: newId(),
        name: lf.family,
        sortOrder: 0,
        subFamilies: lf.subFamilies.map((s, i) => ({
          id: newId(),
          name: s.name,
          sortOrder: i,
        })),
      };
      taxonomy.families.push(f);
      byName.set(f.name, f);
    }
  }
  const ordered: TaxonomyFamily[] = [];
  const used = new Set<string>();
  orderedFamilyNames.forEach((name, i) => {
    const f = byName.get(name);
    if (f) {
      f.sortOrder = i;
      ordered.push(f);
      used.add(name);
    }
  });
  for (const f of taxonomy.families) {
    if (!used.has(f.name)) {
      f.sortOrder = ordered.length;
      ordered.push(f);
    }
  }
  await saveTaxonomy(orgId, { families: ordered });
  return getLibraryFamilyManagement(orgId);
}

export async function assignWorkItemsFamily(opts: {
  orgId: string;
  ids: string[];
  family: string | null;
  subFamily?: string | null;
}) {
  const uniqueIds = Array.from(new Set(opts.ids)).slice(0, 500);
  if (uniqueIds.length === 0) return { updated: 0 };

  const result = await prisma.commercialWorkItem.updateMany({
    where: { organizationId: opts.orgId, id: { in: uniqueIds } },
    data: {
      family: opts.family,
      ...(opts.subFamily !== undefined ? { subFamily: opts.subFamily } : {}),
    },
  });

  if (opts.family) {
    const taxonomy = await loadTaxonomy(opts.orgId);
    if (!taxonomy.families.some((f) => f.name === opts.family)) {
      taxonomy.families.push({
        id: newId(),
        name: opts.family,
        sortOrder: taxonomy.families.length,
        subFamilies: [],
      });
      await saveTaxonomy(opts.orgId, taxonomy);
    }
  }

  return { updated: result.count };
}
