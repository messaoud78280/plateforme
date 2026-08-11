import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { loadMaterialRequirementsForProject } from "@/lib/materiaux/load-for-project";
import {
  createMaterialRequirement,
  findSimilarMaterialRequirements,
} from "@/lib/materiaux/service";
import { isExternalPortalUser } from "@/lib/equipe-acces/nav-by-persona";

type Ctx = { params: Promise<{ projectId: string }> };

async function assertProjectAccess(opts: {
  userId: string;
  orgId: string;
  projectId: string;
}) {
  return prisma.project.findFirst({
    where: {
      id: opts.projectId,
      organizationId: opts.orgId,
    },
    select: { id: true, title: true, organizationId: true },
  });
}

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (isExternalPortalUser(session.user.personType)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  if (!isInternalPurchaseOrderActor(session.user)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });

  const { projectId } = await ctx.params;
  const project = await assertProjectAccess({
    userId: session.user.id,
    orgId,
    projectId,
  });
  if (!project) return NextResponse.json({ error: "Chantier introuvable" }, { status: 404 });

  const rows = await loadMaterialRequirementsForProject({
    organizationId: orgId,
    projectId,
  });

  return NextResponse.json({ project: { id: project.id, title: project.title }, rows });
}

export async function POST(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (isExternalPortalUser(session.user.personType)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  if (!isInternalPurchaseOrderActor(session.user)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });

  const { projectId } = await ctx.params;
  const project = await assertProjectAccess({
    userId: session.user.id,
    orgId,
    projectId,
  });
  if (!project) return NextResponse.json({ error: "Chantier introuvable" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Corps invalide" }, { status: 400 });

  try {
    if (body.checkSimilarOnly) {
      const similar = await findSimilarMaterialRequirements({
        organizationId: orgId,
        projectId,
        label: String(body.label ?? ""),
        unit: String(body.unit ?? "U"),
      });
      return NextResponse.json({ similar });
    }

    const result = await createMaterialRequirement({
      organizationId: orgId,
      projectId,
      createdById: session.user.id,
      label: String(body.label ?? ""),
      quantityRequired: Number(body.quantityRequired ?? 0),
      unit: String(body.unit ?? "U"),
      siteResourceId: body.siteResourceId ? String(body.siteResourceId) : null,
      neededAt: body.neededAt ? new Date(String(body.neededAt)) : null,
      lossFactor:
        body.lossFactor === null || body.lossFactor === undefined || body.lossFactor === ""
          ? null
          : Number(body.lossFactor),
      force: Boolean(body.force),
    });

    if (result.similar.length > 0 && !result.requirement) {
      return NextResponse.json(
        {
          similar: result.similar,
          error: "Un besoin similaire existe déjà.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({ ok: true, requirement: result.requirement }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
