import { NextResponse } from "next/server";
import { requireSiteDocumentAccess } from "@/lib/site-documents/access";
import { getSiteDocument, applyChatgptImport } from "@/lib/site-documents/service";
import { parsePpspsJson, parseSiteReportJson } from "@/lib/site-documents/parse";

type Ctx = { params: Promise<{ id: string; docId: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { id: projectId, docId } = await ctx.params;
  const auth = await requireSiteDocumentAccess(projectId, { requireWrite: true });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const document = await getSiteDocument(auth.orgId, projectId, docId);
  if (!document) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as {
    raw?: string;
    commit?: boolean;
    replaceAll?: boolean;
  } | null;
  if (!body?.raw?.trim()) {
    return NextResponse.json({ error: "JSON manquant" }, { status: 400 });
  }

  if (document.kind === "COMPTE_RENDU") {
    const parsed = parseSiteReportJson(body.raw);
    if (!parsed.ok) {
      return NextResponse.json({ error: "JSON invalide", errors: parsed.errors }, { status: 400 });
    }
    if (!body.commit) {
      return NextResponse.json({
        preview: true,
        format: parsed.format,
        importId: parsed.importId,
        payload: parsed.report,
      });
    }
    const result = await applyChatgptImport({
      orgId: auth.orgId,
      projectId,
      docId,
      userId: auth.userId,
      importId: parsed.importId,
      format: parsed.format,
      incoming: parsed.report,
      replaceAll: Boolean(body.replaceAll),
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }
    return NextResponse.json({ ok: true, document: result.document });
  }

  const parsed = parsePpspsJson(body.raw);
  if (!parsed.ok) {
    return NextResponse.json({ error: "JSON invalide", errors: parsed.errors }, { status: 400 });
  }
  if (!body.commit) {
    return NextResponse.json({
      preview: true,
      format: parsed.format,
      importId: parsed.importId,
      payload: parsed.ppsps,
    });
  }
  const result = await applyChatgptImport({
    orgId: auth.orgId,
    projectId,
    docId,
    userId: auth.userId,
    importId: parsed.importId,
    format: parsed.format,
    incoming: parsed.ppsps,
    replaceAll: Boolean(body.replaceAll),
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json({ ok: true, document: result.document });
}
