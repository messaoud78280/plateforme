import { prisma } from "@/lib/prisma";
import type { PersonType } from "./types";

/** Types d’org externe (pas INTERNAL). */
const EXTERNAL_ORG_TYPES = new Set([
  "CLIENT_EXT",
  "SUPPLIER",
  "SUBCONTRACTOR",
  "MOE",
  "CONTROL_OFFICE",
  "PARTNER",
]);

export async function findOrCreateExternalOrganization(input: {
  hostOrganizationId: string;
  name: string;
  personType: PersonType;
}): Promise<string | null> {
  const name = input.name.trim();
  if (!name) return null;
  const type = EXTERNAL_ORG_TYPES.has(input.personType)
    ? input.personType
    : "PARTNER";

  const existing = await prisma.externalOrganization.findFirst({
    where: {
      hostOrganizationId: input.hostOrganizationId,
      name: { equals: name, mode: "insensitive" },
      type,
    },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.externalOrganization.create({
    data: {
      hostOrganizationId: input.hostOrganizationId,
      name,
      type,
    },
    select: { id: true },
  });
  return created.id;
}
