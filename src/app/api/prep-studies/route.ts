import { NextResponse } from "next/server";
import { prepErrorResponse, requirePrepApiContext } from "@/lib/preparation/access";
import { listOrgProjectsForPrep, listPrepStudies } from "@/lib/preparation/service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;
  try {
    const projectId = new URL(req.url).searchParams.get("projectId");
    const [studies, projects] = await Promise.all([
      listPrepStudies(guard.ctx.orgId, { projectId }),
      listOrgProjectsForPrep(guard.ctx.orgId),
    ]);
    return NextResponse.json({ studies, projects });
  } catch (e) {
    return prepErrorResponse(e);
  }
}
