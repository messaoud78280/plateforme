import { NextResponse } from "next/server";
import type { CommercialLineKind } from "@prisma/client";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { deleteLine, upsertLine } from "@/lib/commercial/quotes";

type Ctx = { params: Promise<{ id: string; lineId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id, lineId } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  try {
    const line = await upsertLine(auth.orgId, id, {
      lineId,
      sectionId:
        body.sectionId !== undefined
          ? body.sectionId
            ? String(body.sectionId)
            : null
          : undefined,
      kind: body.kind ? (body.kind as CommercialLineKind) : undefined,
      reference:
        body.reference !== undefined
          ? body.reference
            ? String(body.reference)
            : null
          : undefined,
      designation: String(body.designation ?? ""),
      description:
        body.description !== undefined
          ? body.description
            ? String(body.description)
            : null
          : undefined,
      quantity: body.quantity != null ? Number(body.quantity) : undefined,
      unit: body.unit ? String(body.unit) : undefined,
      unitCostHt: body.unitCostHt != null ? Number(body.unitCostHt) : undefined,
      unitSellHt: body.unitSellHt != null ? Number(body.unitSellHt) : undefined,
      discountPercent:
        body.discountPercent != null ? Number(body.discountPercent) : undefined,
      vatRate: body.vatRate != null ? Number(body.vatRate) : undefined,
      isOptional: body.isOptional != null ? Boolean(body.isOptional) : undefined,
      sortOrder: body.sortOrder != null ? Number(body.sortOrder) : undefined,
      commercialWorkItemId:
        body.commercialWorkItemId !== undefined
          ? body.commercialWorkItemId
            ? String(body.commercialWorkItemId)
            : null
          : undefined,
    });
    return NextResponse.json({ line });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur ligne" },
      { status: 400 },
    );
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id, lineId } = await ctx.params;
  try {
    await deleteLine(auth.orgId, id, lineId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur suppression" },
      { status: 400 },
    );
  }
}
