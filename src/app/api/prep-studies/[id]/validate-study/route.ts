import { NextResponse } from "next/server";
import { prepErrorResponse, readJsonBody, requirePrepApiContext } from "@/lib/preparation/access";
import { getPrepStudyView, PrepError, validatePrepStudy } from "@/lib/preparation/service";

export const dynamic = "force-dynamic";

/**
 * Validation finale du dossier métré : PRO_A_VALIDER → PRO_VALIDE.
 * Distinct de /validate-lines (niveau ligne).
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;
  try {
    const { id } = await ctx.params;
    const body = await readJsonBody(req);
    if (typeof body.expectedVersion !== "number") {
      throw new PrepError("Version attendue manquante");
    }
    const result = await validatePrepStudy({
      orgId: guard.ctx.orgId,
      userId: guard.ctx.userId,
      studyId: id,
      expectedVersion: body.expectedVersion,
    });
    const study = await getPrepStudyView(guard.ctx.orgId, id);
    return NextResponse.json({ ...result, study });
  } catch (e) {
    return prepErrorResponse(e);
  }
}
