import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { parseBeworkQuotePatch } from "@/lib/commercial/chatgpt-patch/parse";
import { applyQuotePatch } from "@/lib/commercial/chatgpt-patch/apply";

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
    forceVersionMismatch?: boolean;
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

  const result = await applyQuotePatch({
    orgId: auth.orgId,
    quoteId: id,
    patch: parsed.patch,
    userId: auth.session.user.id,
    forceVersionMismatch: Boolean(body?.forceVersionMismatch),
  });

  if (!result.ok) {
    const status =
      result.code === "ALREADY_APPLIED" || result.code === "VERSION_MISMATCH"
        ? 409
        : result.code === "BLOCKED"
          ? 409
          : 400;
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status },
    );
  }

  return NextResponse.json({
    ok: true,
    patchRecordId: result.patchRecordId,
    summary: result.summary,
    message: "Modifications ChatGPT appliquées.",
  });
}
