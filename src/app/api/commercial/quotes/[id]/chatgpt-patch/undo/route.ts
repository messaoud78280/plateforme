import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { undoLastQuotePatch } from "@/lib/commercial/chatgpt-patch/apply";
import {
  isLegacyChatgptPatchWritesEnabled,
  legacyChatgptPatchDisabledBody,
} from "@/lib/bework-patch/legacy-chatgpt-patch-gate";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession({
    requiredHref: "/dashboard/devis-facturation",
    requireWrite: true,
  });
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isLegacyChatgptPatchWritesEnabled()) {
    return NextResponse.json(legacyChatgptPatchDisabledBody("quote"), {
      status: 410,
    });
  }

  const { id } = await ctx.params;
  const result = await undoLastQuotePatch({ orgId: auth.orgId, quoteId: id });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json({
    ok: true,
    message: "Dernière modification ChatGPT annulée.",
  });
}
