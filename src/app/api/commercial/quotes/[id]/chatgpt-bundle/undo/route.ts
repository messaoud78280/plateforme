import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { undoLastChatgptImport } from "@/lib/commercial/chatgpt-bundle/commit";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

/** POST — annule le dernier import ChatGPT (lignes/sections du batch). */
export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession({
    requiredHref: "/dashboard/devis-facturation",
    requireWrite: true,
  });
  if (auth.error || !auth.session || !auth.orgId) {
    return NextResponse.json(
      { error: auth.error ?? "Non autorisé" },
      { status: auth.status },
    );
  }

  const { id: quoteId } = await ctx.params;
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: quoteId, organizationId: auth.orgId },
    select: { id: true },
  });
  if (!quote) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }

  const result = await undoLastChatgptImport({
    orgId: auth.orgId,
    quoteId,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
