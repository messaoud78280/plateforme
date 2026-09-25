import { NextResponse } from "next/server";
import { prepErrorResponse, requirePrepApiContext } from "@/lib/preparation/access";
import { getPrepStudyView, undoLastPrepImport } from "@/lib/preparation/service";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;
  try {
    const { id } = await ctx.params;
    const result = await undoLastPrepImport({ orgId: guard.ctx.orgId, userId: guard.ctx.userId, studyId: id });
    const study = result.action === "restored" ? await getPrepStudyView(guard.ctx.orgId, id) : null;
    return NextResponse.json({ ...result, study });
  } catch (e) {
    return prepErrorResponse(e);
  }
}
