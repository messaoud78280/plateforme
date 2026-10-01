import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import { buildMetreChatgptContext } from "@/lib/chantier/metre-chatgpt-context";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @deprecated Phase A — GET lecture seule, sans call site UI actif.
 * Préférer POST /api/bework-patch/context (bework_chatgpt_context_v1).
 * Conservé pour rétrocompatibilité ; aucune écriture.
 */
/** GET — contexte métré à coller dans ChatGPT (visite + devis + étude). */
export async function GET(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id: projectId } = await ctx.params;
  const access = await canAccessChantierProject(session.user, projectId);
  if (!access.ok) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true },
  });
  if (!project?.organizationId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const url = new URL(req.url);
  const quoteId = url.searchParams.get("quoteId")?.trim() || null;
  const studyId = url.searchParams.get("studyId")?.trim() || null;

  try {
    const context = await buildMetreChatgptContext({
      orgId: project.organizationId,
      projectId,
      quoteId,
      studyId,
    });
    return NextResponse.json(context);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Contexte impossible" },
      { status: 400 },
    );
  }
}
