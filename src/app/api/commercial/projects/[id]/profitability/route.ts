import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  initializeProjectBudget,
  loadProjectProfitability,
} from "@/lib/chantier/project-profitability";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const data = await loadProjectProfitability(auth.orgId, id);
  if (!data) {
    return NextResponse.json({ error: "Chantier introuvable" }, { status: 404 });
  }
  return NextResponse.json({ profitability: data });
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body?.quoteId) {
    return NextResponse.json({ error: "quoteId requis" }, { status: 400 });
  }
  try {
    const budget = await initializeProjectBudget({
      orgId: auth.orgId,
      projectId: id,
      quoteId: String(body.quoteId),
      userId: auth.session.user.id,
    });
    const profitability = await loadProjectProfitability(auth.orgId, id);
    return NextResponse.json({ budget, profitability }, { status: 201 });
  } catch (e) {
    const err = e as Error & { code?: string };
    const status = err.code === "BUDGET_EXISTS" ? 409 : 400;
    return NextResponse.json(
      { error: err.message || "Erreur", code: err.code },
      { status },
    );
  }
}
