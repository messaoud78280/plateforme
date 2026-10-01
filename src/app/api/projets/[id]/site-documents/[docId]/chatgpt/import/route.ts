import { NextResponse } from "next/server";
import { requireSiteDocumentAccess } from "@/lib/site-documents/access";
import {
  getSiteDocument,
  applyChatgptImport,
  getDocumentContentVersion,
} from "@/lib/site-documents/service";
import { parsePpspsJson, parseSiteReportJson } from "@/lib/site-documents/parse";
import {
  DOCUMENT_IMPORT_STALE_CODE,
  DOCUMENT_IMPORT_STALE_MESSAGE,
} from "@/lib/site-documents/chatgpt-import-snapshot";

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
    documentBaseVersion?: number;
  } | null;
  if (!body?.raw?.trim()) {
    return NextResponse.json({ error: "JSON manquant" }, { status: 400 });
  }

  const liveBaseVersion = getDocumentContentVersion(document);

  if (document.kind === "COMPTE_RENDU" || document.kind === "NOTICE") {
    const parsed = parseSiteReportJson(body.raw);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: "JSON invalide", errors: parsed.errors },
        { status: 400 },
      );
    }
    if (!body.commit) {
      return NextResponse.json({
        preview: true,
        format: parsed.format,
        importId: parsed.importId,
        payload: parsed.report,
        documentBaseVersion: liveBaseVersion,
        writePerformed: false,
        message: "Aucune modification n’est encore enregistrée.",
      });
    }
    if (
      typeof body.documentBaseVersion !== "number" ||
      !Number.isFinite(body.documentBaseVersion)
    ) {
      return NextResponse.json(
        {
          error:
            "Version de document manquante — analysez de nouveau avant d’importer.",
          code: "DOCUMENT_BASE_VERSION_REQUIRED",
          writePerformed: false,
        },
        { status: 400 },
      );
    }
    const result = await applyChatgptImport({
      orgId: auth.orgId,
      projectId,
      docId,
      userId: auth.userId,
      importId: parsed.importId,
      format: parsed.format,
      incoming: parsed.report,
      documentBaseVersion: body.documentBaseVersion,
      replaceAll: Boolean(body.replaceAll),
    });
    if (!result.ok) {
      const status =
        result.code === DOCUMENT_IMPORT_STALE_CODE
          ? 409
          : result.code === "IMPORT_ALREADY_APPLIED"
            ? 409
            : 409;
      return NextResponse.json(
        {
          error: result.error,
          code: "code" in result ? result.code : undefined,
          writePerformed: false,
          message:
            result.code === DOCUMENT_IMPORT_STALE_CODE
              ? DOCUMENT_IMPORT_STALE_MESSAGE
              : undefined,
        },
        { status },
      );
    }
    return NextResponse.json({
      ok: true,
      document: result.document,
      documentBaseVersion: result.documentBaseVersion,
      versionAfter: result.versionAfter,
      writePerformed: true,
    });
  }

  const parsed = parsePpspsJson(body.raw);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: "JSON invalide", errors: parsed.errors },
      { status: 400 },
    );
  }
  if (!body.commit) {
    return NextResponse.json({
      preview: true,
      format: parsed.format,
      importId: parsed.importId,
      payload: parsed.ppsps,
      documentBaseVersion: liveBaseVersion,
      writePerformed: false,
      message: "Aucune modification n’est encore enregistrée.",
    });
  }
  if (
    typeof body.documentBaseVersion !== "number" ||
    !Number.isFinite(body.documentBaseVersion)
  ) {
    return NextResponse.json(
      {
        error:
          "Version de document manquante — analysez de nouveau avant d’importer.",
        code: "DOCUMENT_BASE_VERSION_REQUIRED",
        writePerformed: false,
      },
      { status: 400 },
    );
  }
  const result = await applyChatgptImport({
    orgId: auth.orgId,
    projectId,
    docId,
    userId: auth.userId,
    importId: parsed.importId,
    format: parsed.format,
    incoming: parsed.ppsps,
    documentBaseVersion: body.documentBaseVersion,
    replaceAll: Boolean(body.replaceAll),
  });
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        code: "code" in result ? result.code : undefined,
        writePerformed: false,
        message:
          result.code === DOCUMENT_IMPORT_STALE_CODE
            ? DOCUMENT_IMPORT_STALE_MESSAGE
            : undefined,
      },
      { status: 409 },
    );
  }
  return NextResponse.json({
    ok: true,
    document: result.document,
    documentBaseVersion: result.documentBaseVersion,
    versionAfter: result.versionAfter,
    writePerformed: true,
  });
}
