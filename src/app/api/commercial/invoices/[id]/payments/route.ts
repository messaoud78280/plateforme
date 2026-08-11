import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { recordPayment } from "@/lib/commercial/invoices";

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
    const payment = await recordPayment({
      orgId: auth.orgId,
      invoiceId: id,
      userId: auth.session.user.id,
      amount: Number(body.amount ?? 0),
      paidAt: body.paidAt ? new Date(String(body.paidAt)) : undefined,
      method: body.method ? String(body.method) : "VIREMENT",
      reference: body.reference ? String(body.reference) : null,
      comment: body.comment ? String(body.comment) : null,
    });
    return NextResponse.json({ payment }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur règlement" },
      { status: 400 },
    );
  }
}
