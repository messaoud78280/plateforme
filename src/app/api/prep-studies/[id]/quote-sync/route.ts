import { NextResponse } from "next/server";
import { prepErrorResponse, readJsonBody, requirePrepApiContext } from "@/lib/preparation/access";
import { PrepError } from "@/lib/preparation/service";
import { applyPrepQuoteQuantitySync } from "@/lib/preparation/quote-bridge/transfer";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;
  try {
    await ctx.params;
    const body = await readJsonBody(req);
    const linkId = typeof body.linkId === "string" ? body.linkId : "";
    if (!linkId) {
      return NextResponse.json({ error: "linkId requis" }, { status: 400 });
    }
    const result = await applyPrepQuoteQuantitySync({
      orgId: guard.ctx.orgId,
      userId: guard.ctx.userId,
      linkId,
      applyQuantity: body.applyQuantity === true,
      applyDesignation: body.applyDesignation === true,
      applyUnit: body.applyUnit === true,
      applyDescription: body.applyDescription === true,
    });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof PrepError) return prepErrorResponse(e);
    return prepErrorResponse(e);
  }
}
