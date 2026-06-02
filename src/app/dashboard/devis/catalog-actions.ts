"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { prisma } from "@/lib/prisma";
import {
  listWorkItemCatalogs,
  WORK_ITEM_CATALOG_COOKIE,
  type WorkItemCatalogSummary,
} from "@/lib/work-item-catalog";

const REVALIDATE = [
  "/dashboard/devis/bibliotheque",
  "/dashboard/devis/bibliotheque/codification",
  "/dashboard/devis/dce-remplissage",
  "/dashboard/devis/recherche",
  "/dashboard/devis/prix",
];

function revalidateCatalogPaths() {
  for (const p of REVALIDATE) revalidatePath(p);
}

export async function getWorkItemCatalogsForUi(): Promise<WorkItemCatalogSummary[]> {
  await requireBeWorkDevisSession();
  return listWorkItemCatalogs();
}

export async function setActiveWorkItemCatalog(
  catalogId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireBeWorkDevisSession();
  const id = catalogId.trim();
  if (!id) return { ok: false, error: "Catalogue manquant." };

  const exists = await prisma.workItemCatalog.findFirst({
    where: { id, status: "active" },
    select: { id: true },
  });
  if (!exists) return { ok: false, error: "Catalogue introuvable ou archivé." };

  const jar = await cookies();
  jar.set(WORK_ITEM_CATALOG_COOKIE, id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
  });

  revalidateCatalogPaths();
  return { ok: true };
}

export async function createWorkItemCatalog(input: {
  name: string;
  slug?: string;
  description?: string;
  sourceLabel?: string;
  setAsDefault?: boolean;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await requireBeWorkDevisSession();
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Nom du catalogue requis." };

  const slug =
    (input.slug?.trim() || name)
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "catalogue";

  const existing = await prisma.workItemCatalog.findUnique({ where: { slug } });
  if (existing) return { ok: false, error: `Le slug « ${slug} » existe déjà.` };

  const id = `bework-catalog-${slug}-${Date.now().toString(36)}`;

  await prisma.$transaction(async (tx) => {
    if (input.setAsDefault) {
      await tx.workItemCatalog.updateMany({ data: { isDefault: false } });
    }
    await tx.workItemCatalog.create({
      data: {
        id,
        slug,
        name,
        description: input.description?.trim() || null,
        sourceLabel: input.sourceLabel?.trim() || null,
        isDefault: input.setAsDefault === true,
      },
    });
  });

  revalidateCatalogPaths();
  return { ok: true, id };
}
