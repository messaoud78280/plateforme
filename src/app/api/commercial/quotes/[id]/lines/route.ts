import { NextResponse } from "next/server";
import type { CommercialLineKind } from "@prisma/client";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { upsertLine } from "@/lib/commercial/quotes";

type Ctx = { params: Promise<{ id: string }> };

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
    const line = await upsertLine(auth.orgId, id, {
      sectionId: body.sectionId ? String(body.sectionId) : null,
      kind: (body.kind as CommercialLineKind) || "WORK",
      reference: body.reference ? String(body.reference) : null,
      designation: String(body.designation ?? ""),
      description: body.description ? String(body.description) : null,
      quantity: body.quantity != null ? Number(body.quantity) : 1,
      unit: body.unit ? String(body.unit) : "U",
      unitCostHt: body.unitCostHt != null ? Number(body.unitCostHt) : 0,
      unitSellHt: body.unitSellHt != null ? Number(body.unitSellHt) : 0,
      discountPercent: body.discountPercent != null ? Number(body.discountPercent) : 0,
      vatRate: body.vatRate != null ? Number(body.vatRate) : undefined,
      commercialWorkItemId: body.commercialWorkItemId
        ? String(body.commercialWorkItemId)
        : null,
      isOptional: Boolean(body.isOptional),
      sortOrder: body.sortOrder != null ? Number(body.sortOrder) : undefined,
    });
    return NextResponse.json({ line }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur ligne" },
      { status: 400 },
    );
  }
}
