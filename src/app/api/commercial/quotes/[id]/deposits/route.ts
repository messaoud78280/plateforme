import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { getQuoteDepositBalance } from "@/lib/commercial/deposit";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const quote = await prisma.commercialQuote.findFirst({
    where: { id, organizationId: auth.orgId },
    select: { id: true },
  });
  if (!quote) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }
  const balance = await getQuoteDepositBalance(auth.orgId, id);
  return NextResponse.json(balance);
}
