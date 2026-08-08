import { prisma } from "@/lib/prisma";

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
              {
                contacts: {
                  some: {
                    OR: [
                      { lastName: { contains: q, mode: "insensitive" } },
                      { firstName: { contains: q, mode: "insensitive" } },
                      { email: { contains: q, mode: "insensitive" } },
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
  contact?: {
    firstName: string;
    lastName: string;
    jobTitle?: string | null;
    email?: string | null;
    phone?: string | null;
    userId?: string | null;
  } | null;
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

  let contactId: string | null = null;
  if (opts.contact?.firstName && opts.contact?.lastName) {
    const existing = await prisma.externalOrgContact.findFirst({
      where: {
        externalOrganizationId: org.id,
        firstName: { equals: opts.contact.firstName, mode: "insensitive" },
        lastName: { equals: opts.contact.lastName, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (existing) {
      contactId = existing.id;
    } else {
      const c = await prisma.externalOrgContact.create({
        data: {
          externalOrganizationId: org.id,
          firstName: opts.contact.firstName.trim(),
          lastName: opts.contact.lastName.trim(),
          jobTitle: opts.contact.jobTitle ?? undefined,
          email: opts.contact.email ?? undefined,
          phone: opts.contact.phone ?? undefined,
          userId: opts.contact.userId ?? undefined,
          isPrimary: true,
        },
      });
      contactId = c.id;
    }
  }

  return { organization: org, contactId };
}
