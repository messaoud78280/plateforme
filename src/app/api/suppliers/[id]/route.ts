import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { forbiddenUnlessDashboardHref } from "@/lib/equipe-acces/assert-api-dashboard-access";
import { updateSupplier, type SupplierInput } from "@/lib/suppliers/service";
import { prisma } from "@/lib/prisma";

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
    contact,
  };
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
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

  const { id } = await ctx.params;
  const supplier = await prisma.externalOrganization.findFirst({
    where: { id, hostOrganizationId: orgId, type: "SUPPLIER" },
    include: {
      contacts: {
        where: { isPrimary: true },
        take: 1,
      },
    },
  });
  if (!supplier) {
    return NextResponse.json({ error: "Fournisseur introuvable" }, { status: 404 });
  }

  const primary = supplier.contacts[0] ?? null;
  return NextResponse.json({
    supplier: {
      id: supplier.id,
      name: supplier.name,
      tradeName: supplier.tradeName,
      activity: supplier.activity,
      address: supplier.address,
      zipCode: supplier.zipCode,
      city: supplier.city,
      phone: supplier.phone,
      email: supplier.email,
      website: supplier.website,
      siret: supplier.siret,
      paymentTerms: supplier.paymentTerms,
      notes: supplier.notes,
      contact: primary
        ? {
            firstName: primary.firstName,
            lastName: primary.lastName,
            jobTitle: primary.jobTitle,
            email: primary.email,
            phone: primary.phone,
          }
        : null,
    },
  });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
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

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const data = parseSupplierBody(body);
  if (!data) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  try {
    const result = await updateSupplier({
      hostOrganizationId: orgId,
      id,
      data,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    const status = msg.includes("introuvable") ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
