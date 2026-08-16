import { prisma } from "@/lib/prisma";

export type SupplierInput = {
  name: string;
  tradeName?: string | null;
  activity?: string | null;
  address?: string | null;
  zipCode?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  siret?: string | null;
  paymentTerms?: string | null;
  notes?: string | null;
  contact?: {
    firstName: string;
    lastName: string;
    jobTitle?: string | null;
    email?: string | null;
    phone?: string | null;
    userId?: string | null;
  } | null;
};

export type SupplierDuplicate = {
  id: string;
  name: string;
  tradeName: string | null;
  siret: string | null;
  email: string | null;
  city: string | null;
  reason: "siret" | "email" | "name";
};

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function cleanSiret(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 9 ? digits : null;
}

function cleanEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const e = raw.trim().toLowerCase();
  return e.includes("@") ? e : null;
}

export async function searchSuppliers(opts: {
  hostOrganizationId: string;
  query: string;
  take?: number;
}) {
  const q = opts.query.trim();
  const take = opts.take ?? 20;

  const orgs = await prisma.externalOrganization.findMany({
    where: {
      hostOrganizationId: opts.hostOrganizationId,
      type: "SUPPLIER",
      status: "ACTIVE",
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { tradeName: { contains: q, mode: "insensitive" } },
              { activity: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { siret: { contains: q.replace(/\s/g, ""), mode: "insensitive" } },
              {
                contacts: {
                  some: {
                    OR: [
                      { lastName: { contains: q, mode: "insensitive" } },
                      { firstName: { contains: q, mode: "insensitive" } },
                      { email: { contains: q, mode: "insensitive" } },
                      { phone: { contains: q, mode: "insensitive" } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      tradeName: true,
      activity: true,
      city: true,
      phone: true,
      email: true,
      contacts: {
        where: { isPrimary: true },
        take: 1,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          jobTitle: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { name: "asc" },
    take,
  });

  return orgs.map((o) => ({
    id: o.id,
    name: o.name,
    tradeName: o.tradeName,
    activity: o.activity,
    city: o.city,
    phone: o.phone,
    email: o.email,
    primaryContact: o.contacts[0]
      ? {
          id: o.contacts[0].id,
          name: `${o.contacts[0].firstName} ${o.contacts[0].lastName}`.trim(),
          jobTitle: o.contacts[0].jobTitle,
          email: o.contacts[0].email,
          phone: o.contacts[0].phone,
        }
      : null,
  }));
}

/** Doublons STRICTEMENT limités à hostOrganizationId. */
export async function findSupplierDuplicates(opts: {
  hostOrganizationId: string;
  name: string;
  siret?: string | null;
  email?: string | null;
  excludeId?: string | null;
}): Promise<SupplierDuplicate[]> {
  const name = opts.name.trim();
  if (!name) return [];

  const siret = cleanSiret(opts.siret);
  const email = cleanEmail(opts.email);
  const found = new Map<string, SupplierDuplicate>();

  if (siret) {
    const bySiret = await prisma.externalOrganization.findMany({
      where: {
        hostOrganizationId: opts.hostOrganizationId,
        type: "SUPPLIER",
        ...(opts.excludeId ? { id: { not: opts.excludeId } } : {}),
        siret: { contains: siret.slice(0, 9), mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        tradeName: true,
        siret: true,
        email: true,
        city: true,
      },
      take: 10,
    });
    for (const o of bySiret) {
      const digits = cleanSiret(o.siret);
      if (digits && (digits === siret || digits.startsWith(siret.slice(0, 9)) || siret.startsWith(digits.slice(0, 9)))) {
        found.set(o.id, { ...o, reason: "siret" });
      }
    }
  }

  if (email) {
    const byEmail = await prisma.externalOrganization.findMany({
      where: {
        hostOrganizationId: opts.hostOrganizationId,
        type: "SUPPLIER",
        ...(opts.excludeId ? { id: { not: opts.excludeId } } : {}),
        email: { equals: email, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        tradeName: true,
        siret: true,
        email: true,
        city: true,
      },
      take: 10,
    });
    for (const o of byEmail) {
      if (!found.has(o.id)) found.set(o.id, { ...o, reason: "email" });
    }
  }

  const candidates = await prisma.externalOrganization.findMany({
    where: {
      hostOrganizationId: opts.hostOrganizationId,
      type: "SUPPLIER",
      ...(opts.excludeId ? { id: { not: opts.excludeId } } : {}),
      OR: [
        { name: { equals: name, mode: "insensitive" } },
        { tradeName: { equals: name, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      tradeName: true,
      siret: true,
      email: true,
      city: true,
    },
    take: 20,
  });

  const norm = normalizeName(name);
  for (const o of candidates) {
    if (found.has(o.id)) continue;
    const n1 = normalizeName(o.name);
    const n2 = o.tradeName ? normalizeName(o.tradeName) : "";
    if (n1 === norm || n2 === norm) {
      found.set(o.id, { ...o, reason: "name" });
    }
  }

  return [...found.values()];
}

async function upsertPrimaryContact(
  orgId: string,
  contact: NonNullable<SupplierInput["contact"]>,
) {
  if (!contact.firstName?.trim() || !contact.lastName?.trim()) return null;

  const existing = await prisma.externalOrgContact.findFirst({
    where: {
      externalOrganizationId: orgId,
      firstName: { equals: contact.firstName.trim(), mode: "insensitive" },
      lastName: { equals: contact.lastName.trim(), mode: "insensitive" },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.externalOrgContact.update({
      where: { id: existing.id },
      data: {
        jobTitle: contact.jobTitle ?? undefined,
        email: contact.email ?? undefined,
        phone: contact.phone ?? undefined,
        userId: contact.userId ?? undefined,
        isPrimary: true,
      },
    });
    return existing.id;
  }

  // Un seul principal : bascule les autres
  await prisma.externalOrgContact.updateMany({
    where: { externalOrganizationId: orgId, isPrimary: true },
    data: { isPrimary: false },
  });

  const c = await prisma.externalOrgContact.create({
    data: {
      externalOrganizationId: orgId,
      firstName: contact.firstName.trim(),
      lastName: contact.lastName.trim(),
      jobTitle: contact.jobTitle ?? undefined,
      email: contact.email ?? undefined,
      phone: contact.phone ?? undefined,
      userId: contact.userId ?? undefined,
      isPrimary: true,
    },
  });
  return c.id;
}

/**
 * Création directe fournisseur.
 * Si doublon et !force → { duplicates } sans écriture.
 * SIRET strictement identique dans l’org : refuse même avec force (intégrité).
 */
export async function createSupplier(opts: {
  hostOrganizationId: string;
  data: SupplierInput;
  force?: boolean;
}): Promise<
  | { ok: true; organization: { id: string; name: string }; contactId: string | null }
  | { ok: false; duplicates: SupplierDuplicate[]; blockedBySiret: boolean }
> {
  const name = opts.data.name.trim();
  if (!name) throw new Error("Nom fournisseur requis");

  const duplicates = await findSupplierDuplicates({
    hostOrganizationId: opts.hostOrganizationId,
    name,
    siret: opts.data.siret,
    email: opts.data.email,
  });

  const siretDupes = duplicates.filter((d) => d.reason === "siret");
  const blockedBySiret = siretDupes.length > 0 && Boolean(cleanSiret(opts.data.siret));

  if (duplicates.length > 0 && (!opts.force || blockedBySiret)) {
    return { ok: false, duplicates, blockedBySiret };
  }

  const org = await prisma.externalOrganization.create({
    data: {
      hostOrganizationId: opts.hostOrganizationId,
      name,
      type: "SUPPLIER",
      tradeName: opts.data.tradeName?.trim() || undefined,
      activity: opts.data.activity?.trim() || undefined,
      address: opts.data.address?.trim() || undefined,
      zipCode: opts.data.zipCode?.trim() || undefined,
      city: opts.data.city?.trim() || undefined,
      phone: opts.data.phone?.trim() || undefined,
      email: opts.data.email?.trim() || undefined,
      website: opts.data.website?.trim() || undefined,
      siret: cleanSiret(opts.data.siret) ?? undefined,
      paymentTerms: opts.data.paymentTerms?.trim() || undefined,
      notes: opts.data.notes?.trim() || undefined,
      status: "ACTIVE",
    },
  });

  const contactId = opts.data.contact
    ? await upsertPrimaryContact(org.id, opts.data.contact)
    : null;

  return { ok: true, organization: { id: org.id, name: org.name }, contactId };
}

export async function updateSupplier(opts: {
  hostOrganizationId: string;
  id: string;
  data: SupplierInput;
}): Promise<{ organization: { id: string; name: string }; contactId: string | null }> {
  const name = opts.data.name.trim();
  if (!name) throw new Error("Nom fournisseur requis");

  const existing = await prisma.externalOrganization.findFirst({
    where: {
      id: opts.id,
      hostOrganizationId: opts.hostOrganizationId,
      type: "SUPPLIER",
    },
    select: { id: true },
  });
  if (!existing) throw new Error("Fournisseur introuvable");

  const siret = cleanSiret(opts.data.siret);
  if (siret) {
    const clash = await findSupplierDuplicates({
      hostOrganizationId: opts.hostOrganizationId,
      name,
      siret,
      email: null,
      excludeId: opts.id,
    });
    if (clash.some((d) => d.reason === "siret")) {
      throw new Error("Un fournisseur avec ce SIRET existe déjà dans votre organisation.");
    }
  }

  const org = await prisma.externalOrganization.update({
    where: { id: opts.id },
    data: {
      name,
      tradeName: opts.data.tradeName?.trim() || null,
      activity: opts.data.activity?.trim() || null,
      address: opts.data.address?.trim() || null,
      zipCode: opts.data.zipCode?.trim() || null,
      city: opts.data.city?.trim() || null,
      phone: opts.data.phone?.trim() || null,
      email: opts.data.email?.trim() || null,
      website: opts.data.website?.trim() || null,
      siret: siret,
      paymentTerms: opts.data.paymentTerms?.trim() || null,
      notes: opts.data.notes?.trim() || null,
      status: "ACTIVE",
    },
  });

  const contactId = opts.data.contact
    ? await upsertPrimaryContact(org.id, opts.data.contact)
    : null;

  return { organization: { id: org.id, name: org.name }, contactId };
}

/** Compat commandes / flux existants : upsert par nom (création implicite). */
export async function upsertSupplier(opts: {
  hostOrganizationId: string;
  name: string;
  tradeName?: string | null;
  activity?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  contact?: SupplierInput["contact"];
}) {
  const name = opts.name.trim();
  if (!name) throw new Error("Nom fournisseur requis");

  let org = await prisma.externalOrganization.findFirst({
    where: {
      hostOrganizationId: opts.hostOrganizationId,
      type: "SUPPLIER",
      name: { equals: name, mode: "insensitive" },
    },
  });

  if (org) {
    org = await prisma.externalOrganization.update({
      where: { id: org.id },
      data: {
        tradeName: opts.tradeName ?? org.tradeName,
        activity: opts.activity ?? org.activity,
        address: opts.address ?? org.address,
        city: opts.city ?? org.city,
        phone: opts.phone ?? org.phone,
        email: opts.email ?? org.email,
        notes: opts.notes ?? org.notes,
        status: "ACTIVE",
      },
    });
  } else {
    org = await prisma.externalOrganization.create({
      data: {
        hostOrganizationId: opts.hostOrganizationId,
        name,
        type: "SUPPLIER",
        tradeName: opts.tradeName ?? undefined,
        activity: opts.activity ?? undefined,
        address: opts.address ?? undefined,
        city: opts.city ?? undefined,
        phone: opts.phone ?? undefined,
        email: opts.email ?? undefined,
        notes: opts.notes ?? undefined,
        status: "ACTIVE",
      },
    });
  }

  const contactId = opts.contact
    ? await upsertPrimaryContact(org.id, opts.contact)
    : null;

  return { organization: org, contactId };
}
