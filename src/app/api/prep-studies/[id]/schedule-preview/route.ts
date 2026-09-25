import { NextResponse } from "next/server";
import { prepErrorResponse, requirePrepApiContext } from "@/lib/preparation/access";
import { PrepError } from "@/lib/preparation/service";
import { previewPrepSchedule } from "@/lib/preparation/schedule/transfer";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;
  try {
    const { id } = await ctx.params;
    const url = new URL(req.url);
    const quoteId = url.searchParams.get("quoteId");
    const preview = await previewPrepSchedule({
      orgId: guard.ctx.orgId,
      studyId: id,
      quoteId: quoteId || null,
    });
    return NextResponse.json(preview);
  } catch (e) {
    if (e instanceof PrepError) return prepErrorResponse(e);
    return prepErrorResponse(e);
  }
}
