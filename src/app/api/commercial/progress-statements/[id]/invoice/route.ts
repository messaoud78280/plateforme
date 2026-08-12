import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { generateInvoiceFromProgressStatement } from "@/lib/commercial/progress-statements";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  try {
    const invoice = await generateInvoiceFromProgressStatement({
      orgId: auth.orgId,
      userId: auth.session.user.id,
      statementId: id,
    });
    return NextResponse.json({ invoice }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur facture" },
      { status: 400 },
    );
  }
}
