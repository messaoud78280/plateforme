import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { getMaterial, updateMaterial } from "@/lib/commercial/library";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
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
    const material = await updateMaterial(auth.orgId, id, {
      name: body.name !== undefined ? String(body.name) : undefined,
      reference:
        body.reference !== undefined ? (body.reference ? String(body.reference) : null) : undefined,
      family: body.family !== undefined ? (body.family ? String(body.family) : null) : undefined,
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
      currentPriceHt: body.currentPriceHt != null ? Number(body.currentPriceHt) : undefined,
      notes: body.notes !== undefined ? (body.notes ? String(body.notes) : null) : undefined,
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
