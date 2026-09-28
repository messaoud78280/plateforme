import { NextResponse } from "next/server";
import { prepErrorResponse, readJsonBody, requirePrepApiContext } from "@/lib/preparation/access";
import { PrepError } from "@/lib/preparation/service";
import { setStudyScheduleStartDate } from "@/lib/technical-engine/set-start-date";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;
  try {
    const { id } = await ctx.params;
    const body = await readJsonBody(req);
    const startDate = typeof body.startDate === "string" ? body.startDate : "";
    if (!startDate.trim()) {
      throw new PrepError("Indiquez une date de démarrage (YYYY-MM-DD)");
    }
    const result = await setStudyScheduleStartDate({
      orgId: guard.ctx.orgId,
      studyId: id,
      userId: guard.ctx.userId,
      startDate,
      planId: typeof body.planId === "string" ? body.planId : null,
    });
    return NextResponse.json(result);
  } catch (e) {
    return prepErrorResponse(e);
  }
}
