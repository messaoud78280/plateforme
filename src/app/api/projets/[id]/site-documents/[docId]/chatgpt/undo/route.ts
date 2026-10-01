import { NextResponse } from "next/server";
import { requireSiteDocumentAccess } from "@/lib/site-documents/access";
import { undoLastChatgptImport } from "@/lib/site-documents/service";
import {
  DOCUMENT_UNDO_STALE_CODE,
  DOCUMENT_UNDO_STALE_MESSAGE,
} from "@/lib/site-documents/chatgpt-import-snapshot";

type Ctx = { params: Promise<{ id: string; docId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const { id: projectId, docId } = await ctx.params;
  const auth = await requireSiteDocumentAccess(projectId, { requireWrite: true });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const result = await undoLastChatgptImport({
    orgId: auth.orgId,
    projectId,
    docId,
  });
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        code: "code" in result ? result.code : undefined,
        writePerformed: false,
        message:
          "code" in result && result.code === DOCUMENT_UNDO_STALE_CODE
            ? DOCUMENT_UNDO_STALE_MESSAGE
            : undefined,
      },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true, writePerformed: true });
}
