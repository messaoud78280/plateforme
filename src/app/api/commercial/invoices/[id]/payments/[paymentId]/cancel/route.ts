import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { cancelPayment } from "@/lib/commercial/invoices";

type Ctx = { params: Promise<{ id: string; paymentId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { paymentId } = await ctx.params;
  try {
    const result = await cancelPayment({
      orgId: auth.orgId,
      paymentId,
      userId: auth.session.user.id,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur annulation" },
      { status: 400 },
    );
  }
}
