import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import {
  canReceivePurchaseOrder,
  createPurchaseOrderReceipt,
  getPurchaseOrderReceivingState,
} from "@/lib/purchase-orders/receiving";
import { createServiceRoleClient } from "@/lib/supabase";
import { DOCUMENTS_BUCKET } from "@/lib/storage/supabase-object";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const isSupplier =
    session.user.personType === "SUPPLIER" ||
    session.user.permissionProfile === "FOURNISSEUR";

  const order = await prisma.purchaseOrder.findFirst({
    where: {
      id,
      organizationId: orgId,
      ...(isSupplier ? { sharedWithSupplier: true } : {}),
    },
    select: { id: true, externalOrganizationId: true },
  });
  if (!order) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (isSupplier) {
    const u = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { externalOrganizationId: true },
    });
    if (u?.externalOrganizationId !== order.externalOrganizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
  }

  const state = await getPurchaseOrderReceivingState(id);
  const receipts = await prisma.purchaseOrderReceipt.findMany({
    where: { purchaseOrderId: id, cancelledAt: null },
    orderBy: { receivedAt: "desc" },
    select: {
      id: true,
      receivedAt: true,
      status: true,
      deliveryNoteNumber: true,
      commentShared: true,
      commentInternal: true,
      receivedBy: { select: { id: true, name: true } },
      lines: {
        select: {
          id: true,
          receivedQty: true,
          damagedQty: true,
          refusedQty: true,
          refuseReason: true,
          orderLine: { select: { designation: true, unit: true } },
        },
      },
      documents: {
        where: { kind: "BL" },
        select: { id: true, name: true, fileUrl: true, kind: true },
      },
    },
  });

  const safeReceipts = receipts.map((r) => ({
    ...r,
    commentInternal: isSupplier ? null : r.commentInternal,
  }));

  return NextResponse.json({ state, receipts: safeReceipts });
}

export async function POST(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!isInternalPurchaseOrderActor(session.user) || !canReceivePurchaseOrder(session.user)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const contentType = req.headers.get("content-type") || "";
  let lines: Array<Record<string, unknown>> = [];
  let deliveryNoteNumber: string | null = null;
  let commentShared: string | null = null;
  let commentInternal: string | null = null;
  let blFileUrl: string | null = null;
  let blFileName: string | null = null;

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const linesRaw = form.get("lines");
      lines = linesRaw ? (JSON.parse(String(linesRaw)) as Array<Record<string, unknown>>) : [];
      deliveryNoteNumber = form.get("deliveryNoteNumber")
        ? String(form.get("deliveryNoteNumber"))
        : null;
      commentShared = form.get("commentShared") ? String(form.get("commentShared")) : null;
      commentInternal = form.get("commentInternal")
        ? String(form.get("commentInternal"))
        : null;

      const file = form.get("blFile");
      if (file && typeof file === "object" && "arrayBuffer" in file) {
        const f = file as File;
        const supabase = createServiceRoleClient();
        if (!supabase) {
          return NextResponse.json({ error: "Stockage non configuré" }, { status: 503 });
        }
        const buf = Buffer.from(await f.arrayBuffer());
        if (buf.length > 12 * 1024 * 1024) {
          return NextResponse.json({ error: "Fichier trop volumineux (12 Mo max)" }, { status: 400 });
        }
        const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `purchase-orders/${id}/bl/${Date.now()}-${safeName}`;
        const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, buf, {
          contentType: f.type || "application/octet-stream",
          upsert: false,
        });
        if (error) {
          return NextResponse.json({ error: `Upload BL : ${error.message}` }, { status: 500 });
        }
        const { data: urlData } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(path);
        blFileUrl = urlData.publicUrl;
        blFileName = f.name;
      }
    } else {
      const body = (await req.json()) as Record<string, unknown>;
      lines = Array.isArray(body.lines) ? (body.lines as Array<Record<string, unknown>>) : [];
      deliveryNoteNumber = body.deliveryNoteNumber
        ? String(body.deliveryNoteNumber)
        : null;
      commentShared = body.commentShared ? String(body.commentShared) : null;
      commentInternal = body.commentInternal ? String(body.commentInternal) : null;
      blFileUrl = body.blFileUrl ? String(body.blFileUrl) : null;
      blFileName = body.blFileName ? String(body.blFileName) : null;
    }

    const result = await createPurchaseOrderReceipt({
      organizationId: orgId,
      orderId: id,
      receivedById: session.user.id,
      receivedByName: session.user.name || "Utilisateur",
      deliveryNoteNumber,
      commentShared,
      commentInternal,
      blFileUrl,
      blFileName,
      lines: lines.map((l) => ({
        orderLineId: String(l.orderLineId ?? ""),
        receivedQty: Number(l.receivedQty ?? 0),
        damagedQty: Number(l.damagedQty ?? 0),
        refusedQty: Number(l.refusedQty ?? 0),
        refuseReason: l.refuseReason ? String(l.refuseReason) : null,
        comment: l.comment ? String(l.comment) : null,
      })),
    });

    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
