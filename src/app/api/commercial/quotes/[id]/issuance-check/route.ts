import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { validateQuoteForIssuance } from "@/lib/commercial/validate-quote-issuance";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const validation = await validateQuoteForIssuance(auth.orgId, id);
  if (!validation) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }
  return NextResponse.json({ validation });
}
