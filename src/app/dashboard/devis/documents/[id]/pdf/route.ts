import { NextResponse } from "next/server";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { buildQuoteDocumentPdf } from "@/lib/be-work-devis-quote-pdf";
import { assertCanGenerateQuotePdf } from "@/lib/be-work-devis-quote-pdf-guard";
import { parsePresentationSettings } from "@/lib/be-work-devis-pdf-presentation";
import { isMissingQuoteSchemaError } from "@/lib/be-work-devis-prisma-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireBeWorkDevisSession();
  const { id } = await params;

  let document;
  let lines;
  try {
    document = await prisma.quoteDocument.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!document) {
      return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
    }
    lines = await prisma.quoteLine.findMany({
      where: { documentId: id },
      orderBy: [{ sortOrder: "asc" }, { lot: "asc" }],
    });
  } catch (e) {
    if (isMissingQuoteSchemaError(e)) {
      return NextResponse.json(
        {
          error:
            "Schéma base de données incomplet (tables ou colonnes Quote*). Réexécutez prisma/migrations/add-bework-quote-documents.sql sur Supabase.",
        },
        { status: 503 },
      );
    }
    throw e;
  }

  const url = new URL(req.url);
  const modeParam = url.searchParams.get("mode");
  const modeOverride = modeParam === "estimation" || modeParam === "official" ? modeParam : null;
  const guard = assertCanGenerateQuotePdf(document.project, document.presentationSettings, modeOverride);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: 400 });
  }

  const settings = parsePresentationSettings(document.presentationSettings);
  const docForPdf = {
    ...document,
    presentationSettings: { ...settings, pdfMode: guard.mode },
  };

  const buf = buildQuoteDocumentPdf(docForPdf, lines);
  const safeName = `${document.documentNumber.replace(/[^\w.-]+/g, "_")}.pdf`;
  const body = new Uint8Array(buf);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
