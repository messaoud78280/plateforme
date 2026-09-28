import { NextResponse } from "next/server";
import { prepErrorResponse, readJsonBody, requirePrepApiContext } from "@/lib/preparation/access";
import { PrepError } from "@/lib/preparation/service";
import { commitTechnicalImport } from "@/lib/technical-engine/commit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;
  try {
    const body = await readJsonBody(req);
    const projectId = typeof body.projectId === "string" ? body.projectId : "";
    const raw = typeof body.raw === "string" ? body.raw : "";
    if (!projectId) throw new PrepError("Sélectionnez un projet");
    if (!raw.trim()) throw new PrepError("Collez ou chargez un JSON technique");
    const result = await commitTechnicalImport({
      orgId: guard.ctx.orgId,
      projectId,
      userId: guard.ctx.userId,
      raw,
      targetStudyId: typeof body.targetStudyId === "string" ? body.targetStudyId : null,
      confirmReplace: body.confirmReplace === true,
      allowDuplicate: body.allowDuplicate === true,
    });
    return NextResponse.json(result, {
      status: result.kind === "CREATE" ? 201 : 200,
    });
  } catch (e) {
    return prepErrorResponse(e);
  }
}
