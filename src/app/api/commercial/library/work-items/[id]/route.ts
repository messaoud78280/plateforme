import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  archiveWorkItem,
  countWorkItemQuoteUsages,
  deleteWorkItem,
  getWorkItem,
  restoreWorkItem,
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
  const quoteLineCount = await countWorkItemQuoteUsages(auth.orgId, id);
  return NextResponse.json({ workItem, quoteLineCount });
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
    if (body.action === "archive") {
      const workItem = await archiveWorkItem(auth.orgId, id);
      return NextResponse.json({ workItem, message: "Ouvrage archivé." });
    }
    if (body.action === "restore") {
      const workItem = await restoreWorkItem(auth.orgId, id);
      return NextResponse.json({ workItem, message: "Ouvrage restauré." });
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
    return NextResponse.json({ workItem, message: "Ouvrage mis à jour." });
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
    return NextResponse.json({ ok: true, message: "Ouvrage supprimé." });
  } catch (e) {
    const err = e as Error & { code?: string; usageCount?: number };
    if (err.code === "WORK_ITEM_IN_USE") {
      return NextResponse.json(
        {
          error: err.message,
          code: err.code,
          usageCount: err.usageCount,
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
