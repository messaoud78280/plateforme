import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { generateCurrentQuotePdfPreview } from "@/lib/commercial/accepted-snapshot";

type Ctx = { params: Promise<{ id: string }> };

/** Aperçu PDF de la version courante — jamais présenté comme l’original accepté. */
export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;

  const preview = await generateCurrentQuotePdfPreview(auth.orgId, id);
  if (!preview) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(preview.buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${preview.filename}"`,
      "Cache-Control": "private, no-store",
      "X-Commercial-Pdf": "preview",
    },
  });
}
