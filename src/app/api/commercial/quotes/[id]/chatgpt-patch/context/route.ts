import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { buildQuotePatchContextForChatgpt } from "@/lib/commercial/chatgpt-patch/context";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession("/dashboard/devis-facturation");
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const ctxData = await buildQuotePatchContextForChatgpt({
    orgId: auth.orgId,
    quoteId: id,
  });
  if (!ctxData) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }
  return NextResponse.json(ctxData);
}
