import { NextResponse } from "next/server";
import { prepErrorResponse, readJsonBody, requirePrepApiContext } from "@/lib/preparation/access";
import { parsePrepPatchText } from "@/lib/preparation/chatgpt-patch/parse";
import { previewPrepPatch } from "@/lib/preparation/chatgpt-patch/apply";
import { PrepError } from "@/lib/preparation/service";

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
    const preview = await previewPrepPatch({
      orgId: guard.ctx.orgId,
      studyId: id,
      patch: parsed.patch,
    });
    return NextResponse.json({
      ok: preview.ok,
      preview,
      warnings: parsed.warnings,
    });
  } catch (e) {
    if (e instanceof PrepError) return prepErrorResponse(e);
    return prepErrorResponse(e);
  }
}
