import { NextResponse } from "next/server";
import { prepErrorResponse, readJsonBody, requirePrepApiContext } from "@/lib/preparation/access";
import { PrepError } from "@/lib/preparation/service";
import { commitPrepSchedule } from "@/lib/preparation/schedule/transfer";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;
  try {
    const { id } = await ctx.params;
    const body = await readJsonBody(req);
    const selectedStepIds = Array.isArray(body.selectedStepIds)
      ? body.selectedStepIds.filter((c): c is string => typeof c === "string" && !!c.trim())
      : [];
    const idempotencyKey =
      typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
    const quoteId = typeof body.quoteId === "string" && body.quoteId ? body.quoteId : null;
    const title = typeof body.title === "string" ? body.title : null;
    const durationOverrides =
      body.durationOverrides && typeof body.durationOverrides === "object"
        ? (body.durationOverrides as Record<string, number>)
        : undefined;

    const result = await commitPrepSchedule({
      orgId: guard.ctx.orgId,
      studyId: id,
      userId: guard.ctx.userId,
      selectedStepIds,
      idempotencyKey,
      quoteId,
      title,
      durationOverrides,
    });
    return NextResponse.json(result, { status: result.action === "created" ? 201 : 200 });
  } catch (e) {
    if (e instanceof PrepError) return prepErrorResponse(e);
    return prepErrorResponse(e);
  }
}
