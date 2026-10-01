import { NextResponse } from "next/server";
import { prepErrorResponse, requirePrepApiContext } from "@/lib/preparation/access";
import { undoLastPrepPatch } from "@/lib/preparation/chatgpt-patch/apply";
import { getPrepStudyView } from "@/lib/preparation/service";
import {
  isLegacyChatgptPatchWritesEnabled,
  legacyChatgptPatchDisabledBody,
} from "@/lib/bework-patch/legacy-chatgpt-patch-gate";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;

  if (!isLegacyChatgptPatchWritesEnabled()) {
    return NextResponse.json(legacyChatgptPatchDisabledBody("prep"), {
      status: 410,
    });
  }

  try {
    const { id } = await ctx.params;
    const result = await undoLastPrepPatch({
      orgId: guard.ctx.orgId,
      studyId: id,
      userId: guard.ctx.userId,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }
    const study = await getPrepStudyView(guard.ctx.orgId, id);
    return NextResponse.json({ ok: true, version: result.version, study });
  } catch (e) {
    return prepErrorResponse(e);
  }
}
