import { NextResponse } from "next/server";
import { requireSiteDocumentAccess } from "@/lib/site-documents/access";
import {
  buildProjectPromptSeed,
  getSiteDocument,
} from "@/lib/site-documents/service";
import { generatePpspsPdf, generateSiteReportPdf } from "@/lib/site-documents/pdf";
import type { PpspsPayload, SiteReportPayload } from "@/lib/site-documents/types";

type Ctx = { params: Promise<{ id: string; docId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id: projectId, docId } = await ctx.params;
  const auth = await requireSiteDocumentAccess(projectId);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const document = await getSiteDocument(auth.orgId, projectId, docId);
  if (!document) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }
  const seed = await buildProjectPromptSeed(projectId, auth.orgId);
  const meta = {
    projectTitle: seed?.projectTitle ?? auth.project.title,
    siteAddress: [seed?.siteAddress, seed?.siteCity].filter(Boolean).join(", ") || null,
    clientLabel: seed?.clientLabel ?? null,
    companyLabel: seed?.companyLabel ?? null,
    number: document.number,
    status: document.status,
  };

  const bytes =
    document.kind === "COMPTE_RENDU"
      ? generateSiteReportPdf({
          meta,
          payload: document.payloadJson as unknown as SiteReportPayload,
        })
      : generatePpspsPdf({
          meta,
          payload: document.payloadJson as unknown as PpspsPayload,
        });

  const filename = `${document.number}.pdf`.replace(/[^\w.-]+/g, "_");
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
