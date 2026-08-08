import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isSupplierPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import {
  REFUSE_REASONS,
  type SupplierRefuseReasonKey,
  sanitizeOrderForSupplier,
  supplierConfirmPurchaseOrder,
  supplierProposeDelivery,
  supplierRefusePurchaseOrder,
} from "@/lib/purchase-orders/supplier-collaboration";
import { purchaseOrderDetailInclude } from "@/lib/purchase-orders/service";

type Ctx = { params: Promise<{ id: string }> };

async function resolveSupplierContext(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      externalOrganizationId: true,
      externalOrganization: { select: { id: true, name: true, tradeName: true } },
    },
  });
  if (!u?.externalOrganizationId || !u.externalOrganization) return null;
  return {
    userId: u.id,
    name: u.name || "Fournisseur",
    supplierOrganizationId: u.externalOrganizationId,
    supplierOrgName: u.externalOrganization.tradeName || u.externalOrganization.name,
  };
}

export async function POST(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!isSupplierPurchaseOrderActor(session.user)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const hostOrgId = await resolvePurchaseOrderOrgId(session.user);
  const supplierCtx = await resolveSupplierContext(session.user.id);
  if (!hostOrgId || !supplierCtx) {
    return NextResponse.json({ error: "Organisation fournisseur introuvable" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as {
    action?: string;
    proposedDeliveryAt?: string;
    comment?: string;
    reasonKey?: string;
    detail?: string;
  } | null;

  try {
    if (body?.action === "confirm") {
      await supplierConfirmPurchaseOrder({
        orderId: id,
        hostOrganizationId: hostOrgId,
        supplierOrganizationId: supplierCtx.supplierOrganizationId,
        actorUserId: supplierCtx.userId,
        actorName: supplierCtx.name,
        supplierOrgName: supplierCtx.supplierOrgName,
      });
    } else if (body?.action === "propose") {
      if (!body.proposedDeliveryAt) {
        return NextResponse.json({ error: "Date proposée requise" }, { status: 400 });
      }
      await supplierProposeDelivery({
        orderId: id,
        hostOrganizationId: hostOrgId,
        supplierOrganizationId: supplierCtx.supplierOrganizationId,
        actorUserId: supplierCtx.userId,
        actorName: supplierCtx.name,
        supplierOrgName: supplierCtx.supplierOrgName,
        proposedDeliveryAt: new Date(body.proposedDeliveryAt),
        comment: body.comment ?? null,
      });
    } else if (body?.action === "refuse") {
      const key = (body.reasonKey ?? "OTHER") as SupplierRefuseReasonKey;
      if (!REFUSE_REASONS.some((r) => r.key === key)) {
        return NextResponse.json({ error: "Motif invalide" }, { status: 400 });
      }
      await supplierRefusePurchaseOrder({
        orderId: id,
        hostOrganizationId: hostOrgId,
        supplierOrganizationId: supplierCtx.supplierOrganizationId,
        actorUserId: supplierCtx.userId,
        actorName: supplierCtx.name,
        supplierOrgName: supplierCtx.supplierOrgName,
        reasonKey: key,
        detail: body.detail ?? null,
      });
    } else {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const order = await prisma.purchaseOrder.findFirst({
      where: {
        id,
        organizationId: hostOrgId,
        externalOrganizationId: supplierCtx.supplierOrganizationId,
        sharedWithSupplier: true,
      },
      include: purchaseOrderDetailInclude,
    });
    if (!order) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      order: sanitizeOrderForSupplier(order as unknown as Record<string, unknown>),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
