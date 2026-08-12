import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { markInvoiceReminded } from "@/lib/commercial/invoices";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    const invoice = await markInvoiceReminded({
      orgId: auth.orgId,
      invoiceId: id,
      userId: auth.session.user.id,
      comment: body.comment ? String(body.comment) : null,
      channel: body.channel ? String(body.channel) : "MANUEL",
    });
    return NextResponse.json({ invoice });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur relance" },
      { status: 400 },
    );
  }
}
