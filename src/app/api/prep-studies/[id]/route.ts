import { NextResponse } from "next/server";
import { prepErrorResponse, readJsonBody, requirePrepApiContext } from "@/lib/preparation/access";
import { getPrepStudyView, PrepError, savePrepStudyEdits } from "@/lib/preparation/service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;
  try {
    const { id } = await ctx.params;
    const study = await getPrepStudyView(guard.ctx.orgId, id);
    if (!study) return NextResponse.json({ error: "Étude introuvable" }, { status: 404 });
    return NextResponse.json({ study });
  } catch (e) {
    return prepErrorResponse(e);
  }
}

function editList<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export async function PATCH(req: Request, ctx: Ctx) {
  const guard = await requirePrepApiContext();
  if (!guard.ok) return guard.response;
  try {
    const { id } = await ctx.params;
    const body = await readJsonBody(req);
    if (typeof body.expectedVersion !== "number") throw new PrepError("Version attendue manquante");
    const params = editList<Record<string, unknown>>(body.params).map((p) => ({
      key: String(p.key ?? ""),
      value: typeof p.value === "number" ? p.value : null,
      restore: p.restore === true,
    }));
    const lines = editList<Record<string, unknown>>(body.lines).map((l) => ({
      code: String(l.code ?? ""),
      quantity: typeof l.quantity === "number" ? l.quantity : null,
      restore: l.restore === true,
    }));
    const result = await savePrepStudyEdits({
      orgId: guard.ctx.orgId,
      userId: guard.ctx.userId,
      studyId: id,
      expectedVersion: body.expectedVersion,
      params,
      lines,
    });
    const study = await getPrepStudyView(guard.ctx.orgId, id);
    return NextResponse.json({ ...result, study });
  } catch (e) {
    return prepErrorResponse(e);
  }
}
