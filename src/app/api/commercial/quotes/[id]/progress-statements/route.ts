import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  createProgressStatement,
  getQuoteProgressSummary,
} from "@/lib/commercial/progress-statements";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const summary = await getQuoteProgressSummary(auth.orgId, id);
  if (!summary) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }
  return NextResponse.json(summary);
}

export async function POST(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  try {
    const statement = await createProgressStatement({
      orgId: auth.orgId,
      userId: auth.session.user.id,
      quoteId: id,
    });
    return NextResponse.json({ statement }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur situation" },
      { status: 400 },
    );
  }
}
