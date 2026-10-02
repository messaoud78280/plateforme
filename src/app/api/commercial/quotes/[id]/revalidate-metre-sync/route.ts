import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  QuoteRevalidateError,
  revalidateQuoteMetreSync,
} from "@/lib/preparation/quote-bridge/revalidate-quote-service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Revalidation générique devis ↔ métré (CTX-03).
 * Ne modifie pas le statut commercial ni le planning.
 */
export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;

  const expectedQuoteVersion = Number(body?.expectedQuoteVersion);
  const expectedStudyVersion = Number(body?.expectedStudyVersion);
  const expectedTransferStudyVersion = Number(body?.expectedTransferStudyVersion);

  if (
    !Number.isFinite(expectedQuoteVersion) ||
    !Number.isFinite(expectedStudyVersion) ||
    !Number.isFinite(expectedTransferStudyVersion)
  ) {
    return NextResponse.json(
      { error: "Versions attendues manquantes ou invalides", code: "INVALID_PAYLOAD" },
      { status: 400 },
    );
  }

  try {
    const result = await revalidateQuoteMetreSync({
      orgId: auth.orgId,
      quoteId: id,
      userId: auth.session.user.id,
      expectedQuoteVersion,
      expectedStudyVersion,
      expectedTransferStudyVersion,
    });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof QuoteRevalidateError) {
      return NextResponse.json(
        {
          error: e.message,
          code: e.code,
          details: e.details ?? null,
        },
        { status: e.status },
      );
    }
    console.error("[revalidate-metre-sync]", e);
    return NextResponse.json(
      { error: "Impossible de revalider le devis", code: "ERROR" },
      { status: 500 },
    );
  }
}
