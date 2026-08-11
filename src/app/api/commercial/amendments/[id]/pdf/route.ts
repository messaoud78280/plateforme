import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { buildAmendmentPdfBuffer } from "@/lib/commercial/pdf-amendment";
import { loadDealFinancialSummary } from "@/lib/commercial/deal-summary";
import type { QuotePdfSnapshot } from "@/lib/commercial/pdf-quote";

type Ctx = { params: Promise<{ id: string }> };

function asSnapshot(raw: unknown): QuotePdfSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as QuotePdfSnapshot;
}

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;

  const amendment = await prisma.commercialAmendment.findFirst({
    where: { id, organizationId: auth.orgId },
    include: {
      lines: { orderBy: { sortOrder: "asc" } },
      quote: {
        select: {
          id: true,
          number: true,
          siteAddressSnapshot: true,
          clientSnapshotJson: true,
          issuerSnapshotJson: true,
          totalSellHt: true,
          project: { select: { title: true } },
        },
      },
    },
  });

  if (!amendment) {
    return NextResponse.json({ error: "Avenant introuvable" }, { status: 404 });
  }

  const deal =
    amendment.status === "ACCEPTED"
      ? await loadDealFinancialSummary(auth.orgId, amendment.quoteId)
      : null;

  const buffer = buildAmendmentPdfBuffer({
    number: amendment.number,
    subject: amendment.subject,
    status: amendment.status,
    issueDate: amendment.issueDate,
    quoteNumber: amendment.quote.number,
    projectTitle: amendment.quote.project?.title ?? null,
    clientNotes: amendment.clientNotes,
    issuer: asSnapshot(amendment.quote.issuerSnapshotJson),
    client: asSnapshot(amendment.quote.clientSnapshotJson),
    siteAddressSnapshot: amendment.quote.siteAddressSnapshot,
    lines: amendment.lines.map((l) => ({
      designation: l.designation,
      quantity: d(l.quantity),
      unit: l.unit,
      unitSellHt: d(l.unitSellHt),
      lineSellHt: d(l.lineSellHt),
    })),
    totals: {
      totalSellHt: d(amendment.totalSellHt),
      totalVat: d(amendment.totalVat),
      totalTtc: d(amendment.totalTtc),
    },
    impactHt: d(amendment.totalSellHt),
    initialMarketHt: deal?.initialMarketHt ?? d(amendment.quote.totalSellHt),
    updatedMarketHt: deal?.updatedMarketHt ?? null,
  });

  const filename = `avenant-${amendment.number.replace(/[^\w.-]+/g, "_")}.pdf`;
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Commercial-Pdf": amendment.status === "ACCEPTED" ? "accepted" : "projection",
    },
  });
}
