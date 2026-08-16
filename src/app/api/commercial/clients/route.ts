import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { prisma } from "@/lib/prisma";

/** Création rapide d’un client commercial (ExternalOrganization CLIENT_EXT). */
export async function POST(req: Request) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Nom du client requis" }, { status: 400 });
  }

  const tradeName = body?.tradeName ? String(body.tradeName).trim() : null;
  const email = body?.email ? String(body.email).trim() : null;
  const phone = body?.phone ? String(body.phone).trim() : null;
  const city = body?.city ? String(body.city).trim() : null;
  const address = body?.address ? String(body.address).trim() : null;
  const zipCode = body?.zipCode ? String(body.zipCode).trim() : null;
  const siret = body?.siret ? String(body.siret).trim() : null;
  const notes = body?.notes ? String(body.notes).trim() : null;

  const contactFirst = body?.contactFirstName ? String(body.contactFirstName).trim() : "";
  const contactLast = body?.contactLastName ? String(body.contactLastName).trim() : "";
  const contactEmail = body?.contactEmail ? String(body.contactEmail).trim() : null;
  const contactPhone = body?.contactPhone ? String(body.contactPhone).trim() : null;
  const contactJob = body?.contactJobTitle ? String(body.contactJobTitle).trim() : null;
  const hasContact = Boolean(contactFirst || contactLast);

  const existing = await prisma.externalOrganization.findFirst({
    where: {
      hostOrganizationId: auth.orgId,
      name: { equals: name, mode: "insensitive" },
      type: { in: ["CLIENT_EXT", "CLIENT"] },
    },
    select: {
      id: true,
      name: true,
      tradeName: true,
      email: true,
      phone: true,
      city: true,
      address: true,
      zipCode: true,
      siret: true,
      contacts: {
        where: { isPrimary: true },
        take: 1,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          jobTitle: true,
        },
      },
    },
  });
  if (existing) {
    const primary = existing.contacts[0] ?? null;
    return NextResponse.json({
      client: {
        id: existing.id,
        name: existing.name,
        tradeName: existing.tradeName,
        email: existing.email,
        phone: existing.phone,
        city: existing.city,
        address: existing.address,
        zipCode: existing.zipCode,
        siret: existing.siret,
        primaryContact: primary
          ? {
              id: primary.id,
              firstName: primary.firstName,
              lastName: primary.lastName,
              email: primary.email,
              phone: primary.phone,
              jobTitle: primary.jobTitle,
            }
          : null,
      },
      created: false,
    });
  }

  const client = await prisma.$transaction(async (tx) => {
    const created = await tx.externalOrganization.create({
      data: {
        hostOrganizationId: auth.orgId,
        name,
        tradeName: tradeName || null,
        type: "CLIENT_EXT",
        email: email || null,
        phone: phone || null,
        city: city || null,
        address: address || null,
        zipCode: zipCode || null,
        siret: siret || null,
        notes: notes || null,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        tradeName: true,
        email: true,
        phone: true,
        city: true,
        address: true,
        zipCode: true,
        siret: true,
      },
    });

    let primaryContact: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
      jobTitle: string | null;
    } | null = null;

    if (hasContact) {
      primaryContact = await tx.externalOrgContact.create({
        data: {
          externalOrganizationId: created.id,
          firstName: contactFirst || "—",
          lastName: contactLast || name,
          email: contactEmail || email || null,
          phone: contactPhone || phone || null,
          jobTitle: contactJob || null,
          isPrimary: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          jobTitle: true,
        },
      });
    }

    return { ...created, primaryContact };
  });

  return NextResponse.json({ client, created: true }, { status: 201 });
}

export async function GET() {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const clients = await prisma.externalOrganization.findMany({
    where: {
      hostOrganizationId: auth.orgId,
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
      address: true,
      zipCode: true,
    },
    orderBy: { name: "asc" },
    take: 200,
  });
  return NextResponse.json({ clients });
}
