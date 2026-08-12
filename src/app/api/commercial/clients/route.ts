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

  const existing = await prisma.externalOrganization.findFirst({
    where: {
      hostOrganizationId: auth.orgId,
      name: { equals: name, mode: "insensitive" },
      type: { in: ["CLIENT_EXT", "CLIENT"] },
    },
    select: { id: true, name: true, tradeName: true },
  });
  if (existing) {
    return NextResponse.json({ client: existing, created: false });
  }

  const client = await prisma.externalOrganization.create({
    data: {
      hostOrganizationId: auth.orgId,
      name,
      tradeName: tradeName || null,
      type: "CLIENT_EXT",
      email: email || null,
      phone: phone || null,
      city: city || null,
      address: address || null,
      status: "ACTIVE",
    },
    select: { id: true, name: true, tradeName: true },
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
    select: { id: true, name: true, tradeName: true },
    orderBy: { name: "asc" },
    take: 200,
  });
  return NextResponse.json({ clients });
}
