import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  createProjectFromAcceptedQuote,
  linkAcceptedQuoteToProject,
} from "@/lib/commercial/link-project";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body?.action) {
    return NextResponse.json({ error: "action requise" }, { status: 400 });
  }

  try {
    if (body.action === "link") {
      const projectId = String(body.projectId ?? "");
      if (!projectId) {
        return NextResponse.json({ error: "projectId requis" }, { status: 400 });
      }
      const result = await linkAcceptedQuoteToProject({
        organizationId: auth.orgId,
        quoteId: id,
        projectId,
      });
      return NextResponse.json(result);
    }

    if (body.action === "create") {
      const project = await createProjectFromAcceptedQuote({
        organizationId: auth.orgId,
        quoteId: id,
        title: body.title ? String(body.title) : undefined,
        siteAddress:
          body.siteAddress !== undefined
            ? body.siteAddress
              ? String(body.siteAddress)
              : null
            : undefined,
        siteCity:
          body.siteCity !== undefined
            ? body.siteCity
              ? String(body.siteCity)
              : null
            : undefined,
      });
      return NextResponse.json({ project }, { status: 201 });
    }

    return NextResponse.json({ error: "action inconnue" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
