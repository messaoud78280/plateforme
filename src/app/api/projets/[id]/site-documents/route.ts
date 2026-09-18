import { NextResponse } from "next/server";
import type { SiteDocumentKind } from "@prisma/client";
import { requireSiteDocumentAccess } from "@/lib/site-documents/access";
import {
  buildProjectPromptSeed,
  createSiteDocument,
  listSiteDocuments,
} from "@/lib/site-documents/service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id: projectId } = await ctx.params;
  const auth = await requireSiteDocumentAccess(projectId);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const kind = new URL(req.url).searchParams.get("kind") as SiteDocumentKind | null;
  const items = await listSiteDocuments(
    auth.orgId,
    projectId,
    kind === "COMPTE_RENDU" || kind === "PPSPS" ? kind : undefined,
  );
  return NextResponse.json({ items, canWrite: auth.canWrite });
}

export async function POST(req: Request, ctx: Ctx) {
  const { id: projectId } = await ctx.params;
  const auth = await requireSiteDocumentAccess(projectId, { requireWrite: true });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const body = (await req.json().catch(() => null)) as {
    kind?: SiteDocumentKind;
    title?: string;
  } | null;
  if (body?.kind !== "COMPTE_RENDU" && body?.kind !== "PPSPS") {
    return NextResponse.json({ error: "kind requis (COMPTE_RENDU | PPSPS)" }, { status: 400 });
  }
  const seed = await buildProjectPromptSeed(projectId, auth.orgId);
  const doc = await createSiteDocument({
    orgId: auth.orgId,
    projectId,
    kind: body.kind,
    userId: auth.userId,
    title: body.title,
    seed: seed
      ? {
          clientLabel: seed.clientLabel,
          companyLabel: seed.companyLabel,
          siteAddress: seed.siteAddress,
          siteCity: seed.siteCity,
          description: seed.description,
          manager: seed.manager,
        }
      : {
          siteAddress: auth.project.siteAddress,
          siteCity: auth.project.siteCity,
          description: auth.project.description,
          manager: auth.project.internalManager,
        },
  });
  return NextResponse.json({ document: doc });
}
