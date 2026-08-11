import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  downloadAcceptedSnapshotBytes,
  ensureAcceptedQuoteSnapshot,
  getAcceptedQuoteSnapshot,
} from "@/lib/commercial/accepted-snapshot";

type Ctx = { params: Promise<{ id: string }> };

/** Téléchargement du PDF figé à l’acceptation — org-scoped, jamais d’URL publique. */
export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const snapshot = await getAcceptedQuoteSnapshot(auth.orgId, id);
  if (!snapshot) {
    return NextResponse.json(
      { error: "Aucun PDF figé à l’acceptation pour ce devis" },
      { status: 404 },
    );
  }

  try {
    const bytes = await downloadAcceptedSnapshotBytes(auth.orgId, snapshot);
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${snapshot.quoteId}-accepte.pdf"`,
        "Cache-Control": "private, no-store",
        ETag: `"${snapshot.sha256}"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    const status = msg === "Accès refusé" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

/** Retry idempotent d’archivage (devis déjà ACCEPTED). */
export async function POST(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  try {
    const result = await ensureAcceptedQuoteSnapshot(auth.orgId, id);
    return NextResponse.json({
      snapshot: {
        id: result.snapshot.id,
        quoteVersionId: result.snapshot.quoteVersionId,
        sha256: result.snapshot.sha256,
        fileSize: result.snapshot.fileSize,
        generatedAt: result.snapshot.generatedAt,
      },
      created: result.created,
      generationMs: result.generationMs,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Archivage impossible" },
      { status: 400 },
    );
  }
}
