import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import {
  createGlobalPrepFromQuote,
  previewGlobalPrepFromQuote,
} from "@/lib/chantier/global-prep-from-quote";

type Ctx = { params: Promise<{ id: string }> };

async function resolveProject(projectId: string, user: { id: string; role: string }) {
  const access = await canAccessChantierProject(user, projectId);
  if (!access.ok) return null;
  return prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, organizationId: true },
  });
}

/** GET ?quoteId= — aperçu métré / planning global depuis devis (+ visite). */
export async function GET(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id: projectId } = await ctx.params;
  const project = await resolveProject(projectId, session.user);
  if (!project?.organizationId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const quoteId = new URL(req.url).searchParams.get("quoteId")?.trim() || null;

  try {
    const preview = await previewGlobalPrepFromQuote({
      orgId: project.organizationId,
      projectId,
      quoteId,
    });
    return NextResponse.json(preview);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Aperçu impossible" },
      { status: 400 },
    );
  }
}

/**
 * POST — crée le métré global + le planning unique du chantier
 * depuis la visite (si présente) et le devis.
 */
export async function POST(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id: projectId } = await ctx.params;
  const project = await resolveProject(projectId, session.user);
  if (!project?.organizationId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as {
    quoteId?: string;
    forceNewPlan?: boolean;
    /** Rattache une visite existante au chantier (jamais de nouvelle visite). */
    attachVisitId?: string;
    action?: "attach_visit" | "create_prep";
  } | null;

  try {
    if (body?.action === "attach_visit" || body?.attachVisitId) {
      const visitId = body.attachVisitId?.trim();
      if (!visitId) {
        return NextResponse.json({ error: "attachVisitId requis" }, { status: 400 });
      }
      const visit = await prisma.siteVisit.findFirst({
        where: { id: visitId, organizationId: project.organizationId },
        select: { id: true, projectId: true, commercialQuoteId: true },
      });
      if (!visit) {
        return NextResponse.json({ error: "Visite introuvable" }, { status: 404 });
      }
      if (visit.projectId && visit.projectId !== projectId) {
        return NextResponse.json(
          { error: "Cette visite est déjà rattachée à un autre chantier" },
          { status: 409 },
        );
      }
      const quoteId = body.quoteId?.trim() || null;
      await prisma.siteVisit.update({
        where: { id: visit.id },
        data: {
          projectId,
          ...(quoteId && !visit.commercialQuoteId
            ? { commercialQuoteId: quoteId }
            : {}),
        },
      });
      return NextResponse.json({
        ok: true,
        attachedVisitId: visit.id,
        projectId,
      });
    }

    const result = await createGlobalPrepFromQuote({
      orgId: project.organizationId,
      projectId,
      userId: session.user.id,
      quoteId: body?.quoteId?.trim() || null,
      forceNewPlan: body?.forceNewPlan === true,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Création impossible" },
      { status: 400 },
    );
  }
}
