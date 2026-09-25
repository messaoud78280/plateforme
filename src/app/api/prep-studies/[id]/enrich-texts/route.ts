import { NextResponse } from "next/server";
import { prepErrorResponse, readJsonBody, requirePrepApiContext } from "@/lib/preparation/access";
import { enrichPrepStudyTexts, getPrepStudyView, PrepError } from "@/lib/preparation/service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Enrichit les désignations / fiches techniques sans toucher aux quantités ni formules.
 * Body : { expectedVersion, source?: "c01-fondations" | "bundle", raw?: string }
 */
export async function POST(req: Request, ctx: Ctx) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;
  try {
    const { id } = await ctx.params;
    const body = await readJsonBody(req);
    if (typeof body.expectedVersion !== "number") throw new PrepError("Version attendue manquante");
    const source =
      body.source === "bundle" || body.source === "c01-fondations" ? body.source : undefined;
    const result = await enrichPrepStudyTexts({
      orgId: guard.ctx.orgId,
      userId: guard.ctx.userId,
      studyId: id,
      expectedVersion: body.expectedVersion,
      source,
      raw: typeof body.raw === "string" ? body.raw : null,
    });
    const study = await getPrepStudyView(guard.ctx.orgId, id);
    return NextResponse.json({ ...result, study });
  } catch (e) {
    return prepErrorResponse(e);
  }
}
