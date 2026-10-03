import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import { getProjectWorkspace } from "@/lib/chantier/project-workspace";
import {
  buildDossierNavFromWorkspace,
  serializeDossierNavSnapshot,
  type DossierNavStepId,
} from "@/lib/chantier/dossier-nav";

type Ctx = { params: Promise<{ id: string }> };

const STEPS: DossierNavStepId[] = [
  "visite",
  "metre",
  "devis",
  "planning",
  "suivi",
  "compte_rendu",
  "notice",
];

/**
 * GET — snapshot léger navigation transversale dossier chantier.
 * Une seule résolution via getProjectWorkspace (CURRENT / scope).
 */
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
    select: { id: true, organizationId: true },
  });
  if (!project?.organizationId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const url = new URL(req.url);
  const activeRaw = url.searchParams.get("activeStep");
  const activeStep =
    activeRaw && STEPS.includes(activeRaw as DossierNavStepId)
      ? (activeRaw as DossierNavStepId)
      : null;
  const scopeId = url.searchParams.get("scopeId");

  const workspace = await getProjectWorkspace(
    project.organizationId,
    projectId,
  );
  if (!workspace) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const snap = buildDossierNavFromWorkspace(workspace, {
    activeStep,
    scopeId,
  });

  return NextResponse.json(serializeDossierNavSnapshot(snap), {
    headers: {
      "Cache-Control": "private, max-age=15",
    },
  });
}
