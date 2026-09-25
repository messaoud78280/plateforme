import { NextResponse } from "next/server";
import { prepErrorResponse, readJsonBody, requirePrepApiContext } from "@/lib/preparation/access";
import { PrepError } from "@/lib/preparation/service";
import { commitPrepToQuote } from "@/lib/preparation/quote-bridge/transfer";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;
  try {
    const { id } = await ctx.params;
    const body = await readJsonBody(req);
    const selectedCodes = Array.isArray(body.selectedCodes)
      ? body.selectedCodes.filter((c): c is string => typeof c === "string" && c.trim().length > 0)
      : [];
    const idempotencyKey =
      typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject : null;

    const result = await commitPrepToQuote({
      orgId: guard.ctx.orgId,
      studyId: id,
      userId: guard.ctx.userId,
      selectedCodes,
      idempotencyKey,
      subject,
    });
    return NextResponse.json(result, { status: result.action === "created" ? 201 : 200 });
  } catch (e) {
    if (e instanceof PrepError) return prepErrorResponse(e);
    return prepErrorResponse(e);
  }
}
