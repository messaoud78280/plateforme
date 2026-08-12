import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  getQuoteProrataSummary,
  updateQuoteProrataSettings,
} from "@/lib/commercial/prorata";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const summary = await getQuoteProrataSummary(auth.orgId, id);
  if (!summary) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }
  return NextResponse.json(summary);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  try {
    const summary = await updateQuoteProrataSettings({
      orgId: auth.orgId,
      userId: auth.session.user.id,
      quoteId: id,
      prorataEnabled:
        body.prorataEnabled != null ? Boolean(body.prorataEnabled) : undefined,
      prorataPercent:
        body.prorataPercent != null ? Number(body.prorataPercent) : undefined,
      prorataBaseMode: body.prorataBaseMode,
      prorataLabel:
        body.prorataLabel !== undefined ? body.prorataLabel : undefined,
    });
    return NextResponse.json(summary);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
