import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { addSection, updateSectionTitle } from "@/lib/commercial/quotes";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  try {
    const section = await addSection(
      auth.orgId,
      id,
      String(body?.title ?? "Section"),
    );
    return NextResponse.json({ section }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur section" },
      { status: 400 },
    );
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const sectionId = String(body?.sectionId ?? "");
  const title = String(body?.title ?? "");
  if (!sectionId) {
    return NextResponse.json({ error: "sectionId requis" }, { status: 400 });
  }
  try {
    const section = await updateSectionTitle(auth.orgId, id, sectionId, title);
    return NextResponse.json({ section });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur section" },
      { status: 400 },
    );
  }
}
