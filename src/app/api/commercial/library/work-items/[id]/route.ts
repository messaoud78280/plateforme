import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  deleteWorkItem,
  getWorkItem,
  updateWorkItem,
  recomputeWorkItemCost,
} from "@/lib/commercial/library";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const workItem = await getWorkItem(auth.orgId, id);
  if (!workItem) {
    return NextResponse.json({ error: "Ouvrage introuvable" }, { status: 404 });
  }
  return NextResponse.json({ workItem });
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
    if (body.action === "recompute") {
      const workItem = await recomputeWorkItemCost(auth.orgId, id);
      return NextResponse.json({ workItem });
    }
    const workItem = await updateWorkItem(auth.orgId, id, {
      name: body.name !== undefined ? String(body.name) : undefined,
      reference: body.reference !== undefined ? (body.reference ? String(body.reference) : null) : undefined,
      description:
        body.description !== undefined
          ? body.description
            ? String(body.description)
            : null
          : undefined,
      family: body.family !== undefined ? (body.family ? String(body.family) : null) : undefined,
      subFamily:
        body.subFamily !== undefined ? (body.subFamily ? String(body.subFamily) : null) : undefined,
      tags: body.tags !== undefined ? (body.tags ? String(body.tags) : null) : undefined,
      saleUnit: body.saleUnit !== undefined ? String(body.saleUnit) : undefined,
      kind: body.kind === "COMPOSITE" || body.kind === "SIMPLE" ? body.kind : undefined,
      unitSellHt: body.unitSellHt != null ? Number(body.unitSellHt) : undefined,
      marginPercent: body.marginPercent != null ? Number(body.marginPercent) : undefined,
      feesPercent: body.feesPercent != null ? Number(body.feesPercent) : undefined,
      feesAmountHt: body.feesAmountHt != null ? Number(body.feesAmountHt) : undefined,
      sellMode: body.sellMode === "FIXED_SELL" || body.sellMode === "MARGIN" ? body.sellMode : undefined,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
    });
    return NextResponse.json({ workItem });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  try {
    await deleteWorkItem(auth.orgId, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
