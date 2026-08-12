import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  addMaterialSupplierPrice,
  applyMaterialReferencePrice,
  getMaterial,
  previewMaterialReferencePriceImpact,
  setMaterialPreferredSupplier,
  updateMaterial,
} from "@/lib/commercial/library";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const previewPrice = url.searchParams.get("previewPrice");
  if (previewPrice != null) {
    try {
      const impact = await previewMaterialReferencePriceImpact(
        auth.orgId,
        id,
        Number(previewPrice),
      );
      return NextResponse.json({ impact });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Erreur" },
        { status: 400 },
      );
    }
  }
  const material = await getMaterial(auth.orgId, id);
  if (!material) {
    return NextResponse.json({ error: "Matériau introuvable" }, { status: 404 });
  }
  return NextResponse.json({ material });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  try {
    if (body.action === "setPreferredSupplier") {
      const material = await setMaterialPreferredSupplier(
        auth.orgId,
        id,
        body.supplierExternalOrgId
          ? String(body.supplierExternalOrgId)
          : null,
      );
      return NextResponse.json({ material });
    }
    if (body.action === "applyReferencePrice") {
      const result = await applyMaterialReferencePrice(auth.orgId, id, {
        priceHt: Number(body.priceHt),
        fromPriceId: body.fromPriceId ? String(body.fromPriceId) : null,
        supplierExternalOrgId: body.supplierExternalOrgId
          ? String(body.supplierExternalOrgId)
          : null,
        supplierName: body.supplierName ? String(body.supplierName) : null,
        source: body.source ? String(body.source) : null,
        comment: body.comment ? String(body.comment) : null,
        refreshWorkItems: body.refreshWorkItems !== false,
      });
      return NextResponse.json(result);
    }
    if (body.action === "previewImpact") {
      const impact = await previewMaterialReferencePriceImpact(
        auth.orgId,
        id,
        Number(body.priceHt),
      );
      return NextResponse.json({ impact });
    }

    const material = await updateMaterial(auth.orgId, id, {
      name: body.name !== undefined ? String(body.name) : undefined,
      reference:
        body.reference !== undefined
          ? body.reference
            ? String(body.reference)
            : null
          : undefined,
      family:
        body.family !== undefined
          ? body.family
            ? String(body.family)
            : null
          : undefined,
      unit: body.unit !== undefined ? String(body.unit) : undefined,
      supplierName:
        body.supplierName !== undefined
          ? body.supplierName
            ? String(body.supplierName)
            : null
          : undefined,
      manufacturer:
        body.manufacturer !== undefined
          ? body.manufacturer
            ? String(body.manufacturer)
            : null
          : undefined,
      priceSource:
        body.priceSource !== undefined
          ? body.priceSource
            ? String(body.priceSource)
            : null
          : undefined,
      currentPriceHt:
        body.currentPriceHt != null ? Number(body.currentPriceHt) : undefined,
      notes:
        body.notes !== undefined
          ? body.notes
            ? String(body.notes)
            : null
          : undefined,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
      refreshWorkItems: body.refreshWorkItems !== false,
    });
    return NextResponse.json({ material });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  try {
    const result = await addMaterialSupplierPrice(auth.orgId, id, {
      priceHt: Number(body.priceHt),
      supplierExternalOrgId: body.supplierExternalOrgId
        ? String(body.supplierExternalOrgId)
        : null,
      supplierName: body.supplierName ? String(body.supplierName) : null,
      supplierReference: body.supplierReference
        ? String(body.supplierReference)
        : null,
      source: body.source ? String(body.source) : "MANUAL",
      notedAt: body.notedAt ? new Date(String(body.notedAt)) : null,
      comment: body.comment ? String(body.comment) : null,
      purchaseOrderLineId: body.purchaseOrderLineId
        ? String(body.purchaseOrderLineId)
        : null,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
