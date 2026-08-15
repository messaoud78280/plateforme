import { NextResponse } from "next/server";
import type { CommercialQuoteStatus } from "@prisma/client";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { transitionQuoteStatus } from "@/lib/commercial/quotes";
import { acceptQuoteWithPdfArchive } from "@/lib/commercial/accepted-snapshot";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const toStatus = String(body?.status ?? "") as CommercialQuoteStatus;
  if (!toStatus) {
    return NextResponse.json({ error: "Statut requis" }, { status: 400 });
  }

  try {
    if (toStatus === "ACCEPTED") {
      const result = await acceptQuoteWithPdfArchive({
        orgId: auth.orgId,
        quoteId: id,
        actorUserId: auth.session.user.id,
      });
      return NextResponse.json({
        quote: result.quote,
        pdfArchived: result.pdfArchived,
        pdfArchiveError: result.pdfArchiveError,
        budgetInit: result.budgetInit,
      });
    }

    const quote = await transitionQuoteStatus(
      auth.orgId,
      id,
      toStatus,
      auth.session.user.id,
    );
    return NextResponse.json({ quote });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur statut" },
      { status: 400 },
    );
  }
}
