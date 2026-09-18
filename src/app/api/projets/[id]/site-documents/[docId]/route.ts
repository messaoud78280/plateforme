import { NextResponse } from "next/server";
import { requireSiteDocumentAccess } from "@/lib/site-documents/access";
import {
  deleteSiteDocument,
  getSiteDocument,
  updateSiteDocument,
} from "@/lib/site-documents/service";
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
  return NextResponse.json({ document, canWrite: auth.canWrite, project: auth.project });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id: projectId, docId } = await ctx.params;
  const auth = await requireSiteDocumentAccess(projectId, { requireWrite: true });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const body = (await req.json().catch(() => null)) as {
    title?: string;
    status?: string;
    visitDate?: string | null;
    visitTime?: string | null;
    weather?: string | null;
    authorName?: string | null;
    quickNotes?: string | null;
    payload?: SiteReportPayload | PpspsPayload;
  } | null;
  if (!body) {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  const document = await updateSiteDocument({
    orgId: auth.orgId,
    projectId,
    docId,
    userId: auth.userId,
    ...body,
  });
  if (!document) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }
  return NextResponse.json({ document });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id: projectId, docId } = await ctx.params;
  const auth = await requireSiteDocumentAccess(projectId, { requireWrite: true });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const ok = await deleteSiteDocument(auth.orgId, projectId, docId);
  if (!ok) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
