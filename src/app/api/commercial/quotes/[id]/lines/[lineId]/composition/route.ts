import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { updateLineCompositionSnapshot } from "@/lib/commercial/quotes";

type Ctx = { params: Promise<{ id: string; lineId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id: quoteId, lineId } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || !Array.isArray(body.components)) {
    return NextResponse.json({ error: "components requis" }, { status: 400 });
  }
  try {
    const line = await updateLineCompositionSnapshot(
      auth.orgId,
      quoteId,
      lineId,
      {
        components: body.components as Array<{
          name: string;
          type: string;
          quantityPerUnit: number;
          unit: string;
          unitCostHt: number;
          lossPercent?: number;
          comment?: string | null;
        }>,
        feesPercent: body.feesPercent != null ? Number(body.feesPercent) : undefined,
        feesAmountHt: body.feesAmountHt != null ? Number(body.feesAmountHt) : undefined,
        sellMode: body.sellMode === "FIXED_SELL" ? "FIXED_SELL" : "MARGIN",
        marginPercent: body.marginPercent != null ? Number(body.marginPercent) : undefined,
        unitSellHt: body.unitSellHt != null ? Number(body.unitSellHt) : undefined,
      },
      { pushToLibrary: Boolean(body.pushToLibrary) },
    );
    return NextResponse.json({ line });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
