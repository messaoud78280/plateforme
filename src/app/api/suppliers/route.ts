import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { forbiddenUnlessDashboardHref } from "@/lib/equipe-acces/assert-api-dashboard-access";
import {
  createSupplier,
  searchSuppliers,
  type SupplierInput,
} from "@/lib/suppliers/service";

function parseSupplierBody(body: Record<string, unknown> | null): SupplierInput | null {
  if (!body?.name || typeof body.name !== "string") return null;
  const contactRaw = body.contact as Record<string, unknown> | null | undefined;
  const contact =
    contactRaw &&
    typeof contactRaw.firstName === "string" &&
    typeof contactRaw.lastName === "string" &&
    contactRaw.firstName.trim() &&
    contactRaw.lastName.trim()
      ? {
          firstName: String(contactRaw.firstName),
          lastName: String(contactRaw.lastName),
          jobTitle: contactRaw.jobTitle ? String(contactRaw.jobTitle) : null,
          email: contactRaw.email ? String(contactRaw.email) : null,
          phone: contactRaw.phone ? String(contactRaw.phone) : null,
        }
      : null;

  return {
    name: String(body.name),
    tradeName: body.tradeName ? String(body.tradeName) : null,
    activity: body.activity ? String(body.activity) : null,
    address: body.address ? String(body.address) : null,
    zipCode: body.zipCode ? String(body.zipCode) : null,
    city: body.city ? String(body.city) : null,
    phone: body.phone ? String(body.phone) : null,
    email: body.email ? String(body.email) : null,
    website: body.website ? String(body.website) : null,
    siret: body.siret ? String(body.siret) : null,
    paymentTerms: body.paymentTerms ? String(body.paymentTerms) : null,
    notes: body.notes ? String(body.notes) : null,
    parentExternalOrgId:
      body.parentExternalOrgId === undefined
        ? undefined
        : body.parentExternalOrgId
          ? String(body.parentExternalOrgId)
          : null,
    contact,
  };
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!isInternalPurchaseOrderActor(session.user)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const personaDeny = forbiddenUnlessDashboardHref(session.user, "/dashboard/fournisseurs");
  if (personaDeny) return personaDeny;

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
      parentExternalOrgId: true,
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
  const personaDeny = forbiddenUnlessDashboardHref(session.user, "/dashboard/fournisseurs");
  if (personaDeny) return personaDeny;

  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const data = parseSupplierBody(body);
  if (!data) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  const force = Boolean(body?.forceCreate);

  try {
    const result = await createSupplier({
      hostOrganizationId: orgId,
      data,
      force,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.blockedBySiret
            ? "Un fournisseur avec ce SIRET existe déjà."
            : "Un fournisseur similaire existe déjà",
          duplicates: result.duplicates,
          blockedBySiret: result.blockedBySiret,
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        organization: result.organization,
        contactId: result.contactId,
      },
      { status: 201 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
