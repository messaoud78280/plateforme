import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { parseBeworkQuoteBundle } from "@/lib/commercial/chatgpt-bundle/parse";
import { buildBundleImportPreview } from "@/lib/commercial/chatgpt-bundle/commit";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

/** POST — dry-run : parse + prévisualisation, aucune écriture DB. */
export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession({
    requiredHref: "/dashboard/devis-facturation",
    requireWrite: true,
  });
  if (auth.error || !auth.session || !auth.orgId) {
    return NextResponse.json(
      { error: auth.error ?? "Non autorisé" },
      { status: auth.status },
    );
  }

  const { id: quoteId } = await ctx.params;
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: quoteId, organizationId: auth.orgId },
    select: { id: true },
  });
  if (!quote) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as {
    rawText?: string;
  } | null;
  const rawText = typeof body?.rawText === "string" ? body.rawText : "";

  const parsed = parseBeworkQuoteBundle(rawText);
  if (!parsed.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "Le dossier n’a pas pu être interprété.",
        errors: parsed.errors,
        rawKept: true,
      },
      { status: 422 },
    );
  }

  const preview = await buildBundleImportPreview({
    orgId: auth.orgId,
    quoteId,
    bundle: parsed.bundle,
    fingerprint: parsed.fingerprint,
    parseWarnings: parsed.warnings.map((w) => w.message),
  });

  return NextResponse.json({
    ok: true,
    bundle: parsed.bundle,
    fingerprint: parsed.fingerprint,
    warnings: parsed.warnings,
    preview,
  });
}
