import { NextResponse } from "next/server";
import { requireSiteDocumentAccess } from "@/lib/site-documents/access";
import {
  buildProjectPromptSeed,
  getSiteDocument,
} from "@/lib/site-documents/service";
import { buildPpspsPrompt, buildSiteReportPrompt } from "@/lib/site-documents/prompt";
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
  const seed =
    (await buildProjectPromptSeed(projectId, auth.orgId)) ?? {
      projectTitle: auth.project.title,
      projectId,
      siteAddress: auth.project.siteAddress,
      siteCity: auth.project.siteCity,
      clientLabel: null,
      companyLabel: null,
      description: auth.project.description,
      quoteNumbers: [],
      manager: auth.project.internalManager,
    };

  const text =
    document.kind === "COMPTE_RENDU"
      ? buildSiteReportPrompt({
          project: seed,
          draft: document.payloadJson as unknown as SiteReportPayload,
          quickNotes: document.quickNotes,
        })
      : buildPpspsPrompt({
          project: seed,
          draft: document.payloadJson as unknown as PpspsPayload,
          quickNotes: document.quickNotes,
        });

  return NextResponse.json({
    text,
    kind: document.kind,
    steps: [
      "Copiez le prompt",
      "Envoyez-le à ChatGPT",
      "Copiez la réponse JSON",
      "Revenez ici et importez-la",
    ],
  });
}
