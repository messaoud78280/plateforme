import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import { isBeworkStaff } from "@/lib/authz";
import {
  createScopesFromQuoteSections,
  previewScopesFromQuoteSections,
} from "@/lib/chantier/project-workspace";

type Ctx = { params: Promise<{ id: string }> };

async function resolveProject(projectId: string, user: { id: string; role: string }) {
  const access = await canAccessChantierProject(user, projectId);
  if (!access.ok) return null;
  return prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, organizationId: true },
  });
}

/** GET ?quoteId= — aperçu des lots à créer depuis les sections du devis. */
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

  const quoteId = new URL(req.url).searchParams.get("quoteId")?.trim();
  if (!quoteId) {
    return NextResponse.json({ error: "quoteId requis" }, { status: 400 });
  }

  try {
    const preview = await previewScopesFromQuoteSections({
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

/** POST — crée / rattache les lots retenus depuis les sections du devis. */
export async function POST(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!isBeworkStaff(session.user)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id: projectId } = await ctx.params;
  const project = await resolveProject(projectId, session.user);
  if (!project?.organizationId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as {
    quoteId?: string;
    sectionIds?: string[];
  } | null;

  const quoteId = body?.quoteId?.trim();
  const sectionIds = Array.isArray(body?.sectionIds)
    ? body!.sectionIds.map((id) => String(id).trim()).filter(Boolean)
    : [];

  if (!quoteId) {
    return NextResponse.json({ error: "quoteId requis" }, { status: 400 });
  }
  if (sectionIds.length === 0) {
    return NextResponse.json(
      { error: "Sélectionnez au moins une section" },
      { status: 400 },
    );
  }

  try {
    const result = await createScopesFromQuoteSections({
      orgId: project.organizationId,
      projectId,
      quoteId,
      sectionIds,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Création impossible" },
      { status: 400 },
    );
  }
}
