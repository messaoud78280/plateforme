import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  getProgressStatementDetail,
  updateProgressStatementLines,
} from "@/lib/commercial/progress-statements";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const statement = await getProgressStatementDetail(auth.orgId, id);
  if (!statement) {
    return NextResponse.json({ error: "Situation introuvable" }, { status: 404 });
  }
  return NextResponse.json({ statement });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  try {
    const lines = Array.isArray(body.lines) ? body.lines : [];
    const statement = await updateProgressStatementLines({
      orgId: auth.orgId,
      statementId: id,
      periodStart: body.periodStart
        ? new Date(String(body.periodStart))
        : body.periodStart === null
          ? null
          : undefined,
      periodEnd: body.periodEnd
        ? new Date(String(body.periodEnd))
        : body.periodEnd === null
          ? null
          : undefined,
      lines: lines.map((l: Record<string, unknown>) => ({
        id: String(l.id ?? ""),
        periodPercent:
          l.periodPercent != null ? Number(l.periodPercent) : undefined,
        periodQuantity:
          l.periodQuantity != null ? Number(l.periodQuantity) : undefined,
        inputMode:
          l.inputMode === "quantity" || l.inputMode === "percent"
            ? l.inputMode
            : undefined,
      })),
    });
    return NextResponse.json({ statement });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur mise à jour" },
      { status: 400 },
    );
  }
}
