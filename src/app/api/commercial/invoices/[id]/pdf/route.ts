import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { generateInvoicePdfPreview } from "@/lib/commercial/invoices";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const preview = await generateInvoicePdfPreview(auth.orgId, id);
  if (!preview) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(preview.buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${preview.filename}"`,
      "Cache-Control": "private, no-store",
      "X-Commercial-Pdf": "invoice",
    },
  });
}
