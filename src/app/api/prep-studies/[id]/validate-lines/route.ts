import { NextResponse } from "next/server";
import { prepErrorResponse, readJsonBody, requirePrepApiContext } from "@/lib/preparation/access";
import { getPrepStudyView, PrepError, setPrepLinesValidation } from "@/lib/preparation/service";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;
  try {
    const { id } = await ctx.params;
    const body = await readJsonBody(req);
    if (typeof body.expectedVersion !== "number") throw new PrepError("Version attendue manquante");
    const codes = Array.isArray(body.codes) ? body.codes.filter((c): c is string => typeof c === "string") : [];
    const result = await setPrepLinesValidation({
      orgId: guard.ctx.orgId,
      userId: guard.ctx.userId,
      studyId: id,
      expectedVersion: body.expectedVersion,
      codes,
      validated: body.validated !== false,
    });
    const study = await getPrepStudyView(guard.ctx.orgId, id);
    return NextResponse.json({ ...result, study });
  } catch (e) {
    return prepErrorResponse(e);
  }
}
