import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { parseBeworkQuoteBundle } from "@/lib/commercial/chatgpt-bundle/parse";
import { buildBundleImportPreview } from "@/lib/commercial/chatgpt-bundle/commit";

export const runtime = "nodejs";

/** POST — dry-run sans devis existant (page Nouveau devis). */
export async function POST(req: Request) {
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
    quoteId: null,
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
