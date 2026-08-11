import { NextResponse } from "next/server";
import type { CommercialQuoteStatus } from "@prisma/client";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { transitionQuoteStatus } from "@/lib/commercial/quotes";

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
