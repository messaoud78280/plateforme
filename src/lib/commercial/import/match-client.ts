/**
 * Matching / création client commercial (ExternalOrganization CLIENT_EXT).
 */
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

function namesEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a?.trim() || !b?.trim()) return false;
  return normName(a) === normName(b);
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
    take: 300,
  });

  const results: ClientMatchOption[] = [];
  const email = customer.email?.trim().toLowerCase() ?? "";
  const phone = normalizePhone(customer.phone);
  const name = customer.name ? normName(customer.name) : "";
  const company = customer.company ? normName(customer.company) : "";

  for (const c of clients) {
    let score = 0;
    let reason = "";

    if (email && c.email?.trim().toLowerCase() === email) {
      score = 100;
      reason = "Email exact";
    } else if (phone && normalizePhone(c.phone) === phone && phone.length >= 8) {
      score = 85;
      reason = "Téléphone";
    } else if (name && namesEqual(c.name, customer.name)) {
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
      company &&
      (namesEqual(c.tradeName, customer.company) || namesEqual(c.name, customer.company))
    ) {
      score = 75;
      reason = "Raison sociale";
      if (
        customer.postalCode &&
        c.zipCode &&
        customer.postalCode === c.zipCode
      ) {
        score = 88;
        reason = "Raison sociale + code postal";
      }
    } else if (
      name &&
      (normName(c.name).includes(name) ||
        name.includes(normName(c.name)) ||
        (c.tradeName &&
          (normName(c.tradeName).includes(name) || name.includes(normName(c.tradeName)))))
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

  // Anti-doublon : re-match avant création
  const matches = await matchClientsInOrganization(opts.orgId, opts.customer);
  const best = matches[0];
  if (best && best.score >= 70) {
    return { id: best.id, name: best.name };
  }

  const existing = await prisma.externalOrganization.findFirst({
    where: {
      hostOrganizationId: opts.orgId,
      type: { in: ["CLIENT_EXT", "CLIENT"] },
      OR: [
        { name: { equals: name, mode: "insensitive" } },
        ...(opts.customer.company?.trim()
          ? [
              {
                tradeName: {
                  equals: opts.customer.company.trim(),
                  mode: "insensitive" as const,
                },
              },
            ]
          : []),
      ],
    },
    select: { id: true, name: true },
  });
  if (existing) return existing;

  const created = await prisma.externalOrganization.create({
    data: {
      hostOrganizationId: opts.orgId,
      name,
      tradeName: opts.customer.company?.trim() || null,
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
