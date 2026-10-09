import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { isExternalPortalUser } from "@/lib/equipe-acces/nav-by-persona";
import {
  commitMetreDriftRevision,
  previewMetreDriftRevision,
} from "@/lib/supply/sync-metre-drift";

type Ctx = {
  params: Promise<{ id: string; requirementId: string }>;
};

async function gate(ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  }
  if (
    isExternalPortalUser(session.user.personType) ||
    !isInternalPurchaseOrderActor(session.user)
  ) {
    return { error: NextResponse.json({ error: "Non autorisé" }, { status: 403 }) };
  }
  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) {
    return {
      error: NextResponse.json(
        { error: "Organisation introuvable" },
        { status: 403 },
      ),
    };
  }
  const { id: projectId, requirementId } = await ctx.params;
  const req = await prisma.materialRequirement.findFirst({
    where: {
      id: requirementId,
      projectId,
      organizationId: orgId,
    },
    select: { id: true },
  });
  if (!req) {
    return { error: NextResponse.json({ error: "Introuvable" }, { status: 404 }) };
  }
  return { orgId, projectId, requirementId };
}

/** Prévisualisation révision quantité après drift métré */
export async function GET(_req: Request, ctx: Ctx) {
  const g = await gate(ctx);
  if ("error" in g && g.error) return g.error;
  const { orgId, projectId, requirementId } = g as {
    orgId: string;
    projectId: string;
    requirementId: string;
  };
  try {
    const preview = await previewMetreDriftRevision(prisma, {
      organizationId: orgId,
      projectId,
      requirementId,
    });
    return NextResponse.json({ preview });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}

/** Commit décision humaine : RECALCULATE | KEEP */
export async function POST(req: Request, ctx: Ctx) {
  const g = await gate(ctx);
  if ("error" in g && g.error) return g.error;
  const { orgId, projectId, requirementId } = g as {
    orgId: string;
    projectId: string;
    requirementId: string;
  };

  const body = (await req.json().catch(() => null)) as {
    action?: string;
    confirm?: boolean;
    confirmQuantityWhenOrdered?: boolean;
  } | null;

  if (body?.confirm !== true) {
    return NextResponse.json(
      { error: "Confirmation humaine requise (confirm: true)." },
      { status: 400 },
    );
  }
  if (body.action !== "RECALCULATE" && body.action !== "KEEP") {
    return NextResponse.json(
      { error: "action doit être RECALCULATE ou KEEP" },
      { status: 400 },
    );
  }

  try {
    const result = await commitMetreDriftRevision(prisma, {
      organizationId: orgId,
      projectId,
      requirementId,
      action: body.action,
      confirmQuantityWhenOrdered: body.confirmQuantityWhenOrdered === true,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
