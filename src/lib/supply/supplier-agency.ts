/**
 * Agences fournisseur — ExternalOrganization.parentExternalOrgId
 * Pas de second référentiel.
 */
import { prisma } from "@/lib/prisma";

export type SupplierAgencyNode = {
  id: string;
  name: string;
  tradeName: string | null;
  city: string | null;
  zipCode: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  parentExternalOrgId: string | null;
  isAgency: boolean;
};

/**
 * Empêche les cycles et le rattachement hors tenant / hors SUPPLIER.
 */
export async function assertValidSupplierParent(opts: {
  hostOrganizationId: string;
  childId: string;
  parentExternalOrgId: string | null;
}) {
  if (!opts.parentExternalOrgId) return;
  if (opts.parentExternalOrgId === opts.childId) {
    throw new Error("Une organisation ne peut pas être sa propre agence parente");
  }

  const parent = await prisma.externalOrganization.findFirst({
    where: {
      id: opts.parentExternalOrgId,
      hostOrganizationId: opts.hostOrganizationId,
      type: "SUPPLIER",
      status: "ACTIVE",
    },
    select: { id: true, parentExternalOrgId: true },
  });
  if (!parent) throw new Error("Enseigne parente introuvable ou inactive");

  // Remonter la chaîne pour détecter un cycle
  let cursor: string | null = parent.parentExternalOrgId;
  const seen = new Set<string>([opts.childId, parent.id]);
  while (cursor) {
    if (seen.has(cursor)) {
      throw new Error("Cycle détecté dans la hiérarchie d’agences fournisseur");
    }
    seen.add(cursor);
    const row: { parentExternalOrgId: string | null } | null =
      await prisma.externalOrganization.findFirst({
        where: { id: cursor, hostOrganizationId: opts.hostOrganizationId },
        select: { parentExternalOrgId: true },
      });
    cursor = row?.parentExternalOrgId ?? null;
  }
}

export async function listSupplierAgencies(opts: {
  hostOrganizationId: string;
  parentExternalOrgId: string;
}): Promise<SupplierAgencyNode[]> {
  const rows = await prisma.externalOrganization.findMany({
    where: {
      hostOrganizationId: opts.hostOrganizationId,
      type: "SUPPLIER",
      status: "ACTIVE",
      parentExternalOrgId: opts.parentExternalOrgId,
    },
    select: {
      id: true,
      name: true,
      tradeName: true,
      city: true,
      zipCode: true,
      address: true,
      phone: true,
      email: true,
      parentExternalOrgId: true,
    },
    orderBy: [{ city: "asc" }, { name: "asc" }],
  });
  return rows.map((r) => ({ ...r, isAgency: true }));
}

export async function setSupplierParent(opts: {
  hostOrganizationId: string;
  supplierId: string;
  parentExternalOrgId: string | null;
}) {
  const child = await prisma.externalOrganization.findFirst({
    where: {
      id: opts.supplierId,
      hostOrganizationId: opts.hostOrganizationId,
      type: "SUPPLIER",
    },
    select: { id: true },
  });
  if (!child) throw new Error("Fournisseur introuvable");

  await assertValidSupplierParent({
    hostOrganizationId: opts.hostOrganizationId,
    childId: opts.supplierId,
    parentExternalOrgId: opts.parentExternalOrgId,
  });

  return prisma.externalOrganization.update({
    where: { id: opts.supplierId },
    data: { parentExternalOrgId: opts.parentExternalOrgId },
    select: {
      id: true,
      name: true,
      tradeName: true,
      parentExternalOrgId: true,
      city: true,
    },
  });
}
