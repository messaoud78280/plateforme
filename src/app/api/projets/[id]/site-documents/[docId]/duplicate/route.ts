import { NextResponse } from "next/server";
import { requireSiteDocumentAccess } from "@/lib/site-documents/access";
import { duplicateSiteDocument } from "@/lib/site-documents/service";

type Ctx = { params: Promise<{ id: string; docId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const { id: projectId, docId } = await ctx.params;
  const auth = await requireSiteDocumentAccess(projectId, { requireWrite: true });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const document = await duplicateSiteDocument({
    orgId: auth.orgId,
    projectId,
    docId,
    userId: auth.userId,
  });
  if (!document) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }
  return NextResponse.json({ document });
}
