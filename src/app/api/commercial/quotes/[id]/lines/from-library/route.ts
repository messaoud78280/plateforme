import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { addLineFromWorkItem } from "@/lib/commercial/quotes";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id: quoteId } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body?.workItemId) {
    return NextResponse.json({ error: "workItemId requis" }, { status: 400 });
  }
  try {
    const line = await addLineFromWorkItem(auth.orgId, quoteId, {
      workItemId: String(body.workItemId),
      quantity: body.quantity != null ? Number(body.quantity) : 1,
      sectionId: body.sectionId ? String(body.sectionId) : null,
    });
    return NextResponse.json({ line }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
