import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { getQuoteDetail } from "@/lib/commercial/quotes";
import { generateQuotePdfBuffer } from "@/lib/commercial/pdf-quote";
import type { QuotePdfSnapshot } from "@/lib/commercial/pdf-quote";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const quote = await getQuoteDetail(auth.orgId, id);
  if (!quote || !quote.currentVersion) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }

  const version = quote.currentVersion;
  const sections = version.sections.map((s) => ({
    title: s.title,
    lines: version.lines
      .filter((l) => l.sectionId === s.id)
      .map((l) => ({
        kind: l.kind,
        reference: l.reference,
        designation: l.designation,
        quantity: l.quantity,
        unit: l.unit,
        unitSellHt: l.unitSellHt,
        vatRate: l.vatRate,
        lineSellHt: l.lineSellHt,
        isOptional: l.isOptional,
      })),
  }));

  const orphanLines = version.lines.filter((l) => !l.sectionId);
  if (orphanLines.length) {
    sections.push({
      title: "Divers",
      lines: orphanLines.map((l) => ({
        kind: l.kind,
        reference: l.reference,
        designation: l.designation,
        quantity: l.quantity,
        unit: l.unit,
        unitSellHt: l.unitSellHt,
        vatRate: l.vatRate,
        lineSellHt: l.lineSellHt,
        isOptional: l.isOptional,
      })),
    });
  }

  const buffer = generateQuotePdfBuffer({
    number: quote.number,
    subject: quote.subject,
    status: quote.status,
    issueDate: quote.issueDate,
    validityDate: quote.validityDate,
    paymentTerms: quote.paymentTerms,
    clientNotes: quote.clientNotes,
    siteAddressSnapshot: quote.siteAddressSnapshot,
    issuer: (quote.issuerSnapshotJson as QuotePdfSnapshot | null) ?? null,
    client: (quote.clientSnapshotJson as QuotePdfSnapshot | null) ?? null,
    currency: quote.currency,
    totals: {
      totalSellHt: quote.totalSellHt,
      totalVat: quote.totalVat,
      totalTtc: quote.totalTtc,
    },
    sections,
  });

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${quote.number}.pdf"`,
    },
  });
}
