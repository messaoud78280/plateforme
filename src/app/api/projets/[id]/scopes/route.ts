import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import { isBeworkStaff } from "@/lib/authz";
import {
  codeFromScopeName,
  ensureProjectScope,
  getProjectWorkspace,
} from "@/lib/chantier/project-workspace";

type Ctx = { params: Promise<{ id: string }> };

async function resolveOrgProject(projectId: string, userId: string, role: string) {
  const access = await canAccessChantierProject({ id: userId, role }, projectId);
  if (!access.ok) return null;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, organizationId: true, title: true },
  });
  if (!project?.organizationId) return null;
  return project;
}

/** GET — liste des périmètres + éléments non classés. */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id: projectId } = await ctx.params;
  const project = await resolveOrgProject(
    projectId,
    session.user.id,
    session.user.role,
  );
  if (!project) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const workspace = await getProjectWorkspace(project.organizationId!, projectId);
  if (!workspace) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  return NextResponse.json({
    scopes: workspace.scopes.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      progress: s.progress,
    })),
    unscoped: workspace.unscoped,
  });
}

/** POST — créer un périmètre (lot de travaux). */
export async function POST(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!isBeworkStaff(session.user)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id: projectId } = await ctx.params;
  const project = await resolveOrgProject(
    projectId,
    session.user.id,
    session.user.role,
  );
  if (!project?.organizationId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as {
    name?: string;
    code?: string;
    description?: string;
  } | null;

  const name = body?.name?.trim() ?? "";
  if (!name) {
    return NextResponse.json({ error: "Nom du périmètre requis" }, { status: 400 });
  }

  const codeRaw = body?.code?.trim() || codeFromScopeName(name);
  const code = codeRaw.slice(0, 32) || "LOT";

  const count = await prisma.projectScope.count({
    where: { projectId, organizationId: project.organizationId },
  });

  const result = await ensureProjectScope({
    orgId: project.organizationId,
    projectId,
    code,
    name,
    description: body?.description?.trim() || null,
    displayOrder: count,
  });

  return NextResponse.json({
    ok: true,
    id: result.id,
    created: result.created,
    code,
    name,
  });
}
