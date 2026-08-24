import { prisma } from "@/lib/prisma";
import type { ClientMatchOption, ImportedCustomer } from "@/lib/commercial/import/types";

function normalizePhone(p: string | null | undefined): string {
  return (p ?? "").replace(/\D/g, "");
}

function normName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Matching client dans l’organisation courante uniquement. */
export async function matchClientsInOrganization(
  orgId: string,
  customer: ImportedCustomer,
): Promise<ClientMatchOption[]> {
  const clients = await prisma.externalOrganization.findMany({
    where: {
      hostOrganizationId: orgId,
      type: { in: ["CLIENT_EXT", "CLIENT"] },
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      tradeName: true,
      email: true,
      phone: true,
      city: true,
      zipCode: true,
      address: true,
    },
    take: 200,
  });

  const results: ClientMatchOption[] = [];
  const email = customer.email?.trim().toLowerCase() ?? "";
  const phone = normalizePhone(customer.phone);
  const name = customer.name ? normName(customer.name) : "";

  for (const c of clients) {
    let score = 0;
    let reason = "";

    if (email && c.email?.trim().toLowerCase() === email) {
      score = 100;
      reason = "Email exact";
    } else if (phone && normalizePhone(c.phone) === phone && phone.length >= 8) {
      score = 85;
      reason = "Téléphone";
    } else if (name && normName(c.name) === name) {
      score = 70;
      reason = "Nom exact";
      if (
        customer.postalCode &&
        c.zipCode &&
        customer.postalCode === c.zipCode
      ) {
        score = 90;
        reason = "Nom + code postal";
      }
    } else if (
      name &&
      (normName(c.name).includes(name) || name.includes(normName(c.name)))
    ) {
      score = 45;
      reason = "Nom similaire";
    }

    if (score > 0) {
      results.push({
        id: c.id,
        name: c.name,
        tradeName: c.tradeName,
        email: c.email,
        phone: c.phone,
        city: c.city,
        score,
        reason,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 5);
}

export async function createCommercialClientFromImport(opts: {
  orgId: string;
  customer: ImportedCustomer;
}): Promise<{ id: string; name: string }> {
  const name = opts.customer.name?.trim();
  if (!name) throw new Error("Nom client requis pour la création");

  const existing = await prisma.externalOrganization.findFirst({
    where: {
      hostOrganizationId: opts.orgId,
      name: { equals: name, mode: "insensitive" },
      type: { in: ["CLIENT_EXT", "CLIENT"] },
    },
    select: { id: true, name: true },
  });
  if (existing) return existing;

  const created = await prisma.externalOrganization.create({
    data: {
      hostOrganizationId: opts.orgId,
      name,
      type: "CLIENT_EXT",
      status: "ACTIVE",
      email: opts.customer.email,
      phone: opts.customer.phone,
      address: opts.customer.addressLine1,
      zipCode: opts.customer.postalCode,
      city: opts.customer.city,
    },
    select: { id: true, name: true },
  });
  return created;
}
