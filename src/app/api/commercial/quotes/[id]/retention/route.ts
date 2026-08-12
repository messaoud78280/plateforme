import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  getQuoteRetentionSummary,
  updateQuoteRetentionSettings,
} from "@/lib/commercial/retention";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const summary = await getQuoteRetentionSummary(auth.orgId, id);
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
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  try {
    await updateQuoteRetentionSettings({
      orgId: auth.orgId,
      quoteId: id,
      retentionGuaranteePercent:
        body.retentionGuaranteePercent != null
          ? Number(body.retentionGuaranteePercent)
          : undefined,
      retentionReleaseDueDate:
        body.retentionReleaseDueDate === null
          ? null
          : body.retentionReleaseDueDate
            ? new Date(String(body.retentionReleaseDueDate))
            : undefined,
    });
    const summary = await getQuoteRetentionSummary(auth.orgId, id);
    return NextResponse.json(summary);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur RG" },
      { status: 400 },
    );
  }
}
