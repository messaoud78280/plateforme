import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { applyQuotePriceCheck } from "@/lib/commercial/price-check";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Applique les prix bibliothèque actuels aux lignes sélectionnées.
 * Recharge les prix côté serveur — ne fait pas confiance aux montants client.
 */
export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id: quoteId } = await ctx.params;
  const body = (await req.json().catch(() => null)) as {
    versionId?: string;
    lineIds?: string[];
  } | null;

  if (!body?.versionId || !Array.isArray(body.lineIds) || body.lineIds.length === 0) {
    return NextResponse.json(
      { error: "versionId et lineIds requis" },
      { status: 400 },
    );
  }

  try {
    const result = await applyQuotePriceCheck(auth.orgId, quoteId, {
      versionId: body.versionId,
      lineIds: body.lineIds.filter((id): id is string => typeof id === "string"),
    });
    return NextResponse.json(result);
  } catch (e) {
    const status =
      e && typeof e === "object" && "status" in e && typeof (e as { status: unknown }).status === "number"
        ? (e as { status: number }).status
        : 400;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status },
    );
  }
}
