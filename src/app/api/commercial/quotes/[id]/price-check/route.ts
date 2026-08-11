import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  runQuotePriceCheck,
  shouldOfferPriceCheck,
} from "@/lib/commercial/price-check";

import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

/** Vérification des prix — lecture seule, pas de mutation. */
export async function POST(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id: quoteId } = await ctx.params;

  const quote = await prisma.commercialQuote.findFirst({
    where: { id: quoteId, organizationId: auth.orgId },
    select: { id: true, status: true },
  });
  if (!quote) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }
  if (!shouldOfferPriceCheck(quote.status)) {
    return NextResponse.json(
      {
        error:
          "Vérification des prix non proposée pour ce statut (document clos ou accepté).",
      },
      { status: 400 },
    );
  }

  try {
    const result = await runQuotePriceCheck(auth.orgId, quoteId);
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}

export async function GET(req: Request, ctx: Ctx) {
  return POST(req, ctx);
}
