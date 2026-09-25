import { NextResponse } from "next/server";
import { prepErrorResponse, readJsonBody, requirePrepApiContext } from "@/lib/preparation/access";
import { parsePrepPatchText } from "@/lib/preparation/chatgpt-patch/parse";
import { applyPrepPatch } from "@/lib/preparation/chatgpt-patch/apply";
import { getPrepStudyView, PrepError } from "@/lib/preparation/service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;
  try {
    const { id } = await ctx.params;
    const body = await readJsonBody(req);
    const raw = typeof body.raw === "string" ? body.raw : "";
    const parsed = parsePrepPatchText(raw);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: "JSON incorrectif invalide", errors: parsed.errors },
        { status: 422 },
      );
    }
    const result = await applyPrepPatch({
      orgId: guard.ctx.orgId,
      studyId: id,
      userId: guard.ctx.userId,
      patch: parsed.patch,
      forceVersionMismatch: body.forceVersionMismatch === true,
    });
    if (!result.ok) {
      const status =
        result.code === "VERSION_MISMATCH" ? 409 : result.code === "ALREADY_APPLIED" ? 409 : 422;
      return NextResponse.json(result, { status });
    }
    const study = await getPrepStudyView(guard.ctx.orgId, id);
    return NextResponse.json({ ...result, study });
  } catch (e) {
    if (e instanceof PrepError) return prepErrorResponse(e);
    return prepErrorResponse(e);
  }
}
