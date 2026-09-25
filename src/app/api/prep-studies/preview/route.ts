import { NextResponse } from "next/server";
import { prepErrorResponse, readJsonBody, requirePrepApiContext } from "@/lib/preparation/access";
import { PrepError, previewPrepImport } from "@/lib/preparation/service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;
  try {
    const body = await readJsonBody(req);
    const projectId = typeof body.projectId === "string" ? body.projectId : "";
    const raw = typeof body.raw === "string" ? body.raw : "";
    if (!projectId) throw new PrepError("Sélectionnez un projet");
    if (!raw.trim()) throw new PrepError("Collez ou chargez un JSON");
    const result = await previewPrepImport({
      orgId: guard.ctx.orgId,
      projectId,
      raw,
      targetStudyId: typeof body.targetStudyId === "string" ? body.targetStudyId : null,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (e) {
    return prepErrorResponse(e);
  }
}
