import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canListPurchaseOrders,
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { createPurchaseOrder } from "@/lib/purchase-orders/service";
import { forbiddenUnlessDashboardHref } from "@/lib/equipe-acces/assert-api-dashboard-access";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!canListPurchaseOrders(session.user)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const personaDeny = forbiddenUnlessDashboardHref(session.user, "/dashboard/commandes");
  if (personaDeny) return personaDeny;

  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });
  }

  const isSupplier =
    session.user.personType === "SUPPLIER" ||
    session.user.permissionProfile === "FOURNISSEUR";

  let supplierOrgId: string | null = null;
  if (isSupplier) {
    const u = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { externalOrganizationId: true },
    });
    supplierOrgId = u?.externalOrganizationId ?? null;
    if (!supplierOrgId) {
      return NextResponse.json({ orders: [] });
    }
  }

  const orders = await prisma.purchaseOrder.findMany({
    where: {
      organizationId: orgId,
      ...(isSupplier
        ? {
            sharedWithSupplier: true,
            externalOrganizationId: supplierOrgId!,
          }
        : {}),
    },
    select: {
      id: true,
      number: true,
      subject: true,
      status: true,
      amountHt: true,
      requestedDeliveryAt: true,
      confirmedDeliveryAt: true,
      updatedAt: true,
      project: { select: { id: true, title: true } },
      externalOrganization: { select: { id: true, name: true, tradeName: true } },
      responsible: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 80,
  });

  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!isInternalPurchaseOrderActor(session.user)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const personaDeny = forbiddenUnlessDashboardHref(session.user, "/dashboard/commandes");
  if (personaDeny) return personaDeny;

  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  try {
    const lines = Array.isArray(body.lines) ? body.lines : [];
    const order = await createPurchaseOrder({
      organizationId: orgId,
      subject: String(body.subject ?? ""),
      projectId: String(body.projectId ?? ""),
      externalOrganizationId: String(body.externalOrganizationId ?? ""),
      contactId: body.contactId ? String(body.contactId) : null,
      requestedById: session.user.id,
      responsibleId: body.responsibleId ? String(body.responsibleId) : null,
      followUpSheetId: body.followUpSheetId ? String(body.followUpSheetId) : null,
      requestedDeliveryAt: body.requestedDeliveryAt
        ? new Date(String(body.requestedDeliveryAt))
        : null,
      deliveryPlaceType: body.deliveryPlaceType
        ? String(body.deliveryPlaceType)
        : "CHANTIER",
      deliveryAddress: body.deliveryAddress ? String(body.deliveryAddress) : null,
      deliveryInstructions: body.deliveryInstructions
        ? String(body.deliveryInstructions)
        : null,
      internalNotes: body.internalNotes ? String(body.internalNotes) : null,
      urgency: body.urgency ? String(body.urgency) : null,
      defaultCostCategory: body.defaultCostCategory
        ? String(body.defaultCostCategory)
        : null,
      status: body.status === "BROUILLON" ? "BROUILLON" : "A_CONFIRMER",
      lines: lines.map((l: Record<string, unknown>) => ({
        designation: String(l.designation ?? ""),
        quantity: Number(l.quantity ?? 0),
        unit: l.unit ? String(l.unit) : "U",
        unitPriceHt:
          l.unitPriceHt === null || l.unitPriceHt === undefined || l.unitPriceHt === ""
            ? null
            : Number(l.unitPriceHt),
        tvaRate:
          l.tvaRate === null || l.tvaRate === undefined || l.tvaRate === ""
            ? null
            : Number(l.tvaRate),
        costCategory: l.costCategory ? String(l.costCategory) : null,
        materialRequirementId: l.materialRequirementId
          ? String(l.materialRequirementId)
          : null,
        quantityAllocated:
          l.quantityAllocated === null ||
          l.quantityAllocated === undefined ||
          l.quantityAllocated === ""
            ? null
            : Number(l.quantityAllocated),
      })),
      details: body.details
        ? {
            supplierRef: (body.details as Record<string, unknown>).supplierRef
              ? String((body.details as Record<string, unknown>).supplierRef)
              : null,
            quoteRef: (body.details as Record<string, unknown>).quoteRef
              ? String((body.details as Record<string, unknown>).quoteRef)
              : null,
            paymentTerms: (body.details as Record<string, unknown>).paymentTerms
              ? String((body.details as Record<string, unknown>).paymentTerms)
              : null,
            siteContactName: (body.details as Record<string, unknown>).siteContactName
              ? String((body.details as Record<string, unknown>).siteContactName)
              : null,
            siteContactPhone: (body.details as Record<string, unknown>).siteContactPhone
              ? String((body.details as Record<string, unknown>).siteContactPhone)
              : null,
            validatorId: (body.details as Record<string, unknown>).validatorId
              ? String((body.details as Record<string, unknown>).validatorId)
              : null,
          }
        : undefined,
    });

    return NextResponse.json({ ok: true, order }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
