import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { searchSuppliers, upsertSupplier } from "@/lib/suppliers/service";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!isInternalPurchaseOrderActor(session.user)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const typesRaw = url.searchParams.get("types");
  const types = typesRaw
    ? typesRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : ["SUPPLIER"];

  if (url.searchParams.has("q")) {
    const results = await searchSuppliers({ hostOrganizationId: orgId, query: q });
    return NextResponse.json({ suppliers: results });
  }

  const suppliers = await prisma.externalOrganization.findMany({
    where: { hostOrganizationId: orgId, type: { in: types } },
    select: {
      id: true,
      name: true,
      tradeName: true,
      activity: true,
      city: true,
      phone: true,
      email: true,
      status: true,
      _count: { select: { contacts: true, purchaseOrders: true } },
    },
    orderBy: { name: "asc" },
    take: 100,
  });

  return NextResponse.json({ suppliers });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!isInternalPurchaseOrderActor(session.user)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body?.name) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  try {
    const result = await upsertSupplier({
      hostOrganizationId: orgId,
      name: String(body.name),
      tradeName: body.tradeName ? String(body.tradeName) : null,
      activity: body.activity ? String(body.activity) : null,
      address: body.address ? String(body.address) : null,
      city: body.city ? String(body.city) : null,
      phone: body.phone ? String(body.phone) : null,
      email: body.email ? String(body.email) : null,
      notes: body.notes ? String(body.notes) : null,
      contact: body.contact
        ? {
            firstName: String((body.contact as Record<string, unknown>).firstName ?? ""),
            lastName: String((body.contact as Record<string, unknown>).lastName ?? ""),
            jobTitle: (body.contact as Record<string, unknown>).jobTitle
              ? String((body.contact as Record<string, unknown>).jobTitle)
              : null,
            email: (body.contact as Record<string, unknown>).email
              ? String((body.contact as Record<string, unknown>).email)
              : null,
            phone: (body.contact as Record<string, unknown>).phone
              ? String((body.contact as Record<string, unknown>).phone)
              : null,
          }
        : null,
    });
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
