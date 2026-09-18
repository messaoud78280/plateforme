import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { parseBeworkQuotePatch } from "@/lib/commercial/chatgpt-patch/parse";
import { previewQuotePatch } from "@/lib/commercial/chatgpt-patch/preview";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession({
    requiredHref: "/dashboard/devis-facturation",
    requireWrite: true,
  });
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as {
    raw?: string;
    json?: unknown;
  } | null;

  const raw = body?.raw ?? body?.json;
  if (raw == null) {
    return NextResponse.json({ error: "JSON manquant" }, { status: 400 });
  }

  const parsed = parseBeworkQuotePatch(raw);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: "JSON invalide", errors: parsed.errors },
      { status: 400 },
    );
  }

  const preview = await previewQuotePatch({
    orgId: auth.orgId,
    quoteId: id,
    patch: parsed.patch,
  });

  return NextResponse.json({
    patch: parsed.patch,
    warnings: parsed.warnings,
    preview,
  });
}
