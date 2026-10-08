import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import {
  cancelMaterialRequirement,
  updateMaterialRequirement,
} from "@/lib/materiaux/service";
import { isExternalPortalUser } from "@/lib/equipe-acces/nav-by-persona";

type Ctx = { params: Promise<{ id: string; requirementId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (isExternalPortalUser(session.user.personType) || !isInternalPurchaseOrderActor(session.user)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });

  const { id: projectId, requirementId } = await ctx.params;
  const existing = await prisma.materialRequirement.findFirst({
    where: { id: requirementId, projectId, organizationId: orgId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Corps invalide" }, { status: 400 });

  try {
    if (body.cancel) {
      const requirement = await cancelMaterialRequirement({
        organizationId: orgId,
        id: requirementId,
      });
      return NextResponse.json({ ok: true, requirement });
    }
    const qty =
      body.validatedOrderQuantity != null
        ? Number(body.validatedOrderQuantity)
        : body.quantityRequired != null
          ? Number(body.quantityRequired)
          : undefined;
    const requirement = await updateMaterialRequirement({
      organizationId: orgId,
      id: requirementId,
      label: body.label != null ? String(body.label) : undefined,
      quantityRequired: qty,
      unit: body.unit != null ? String(body.unit) : undefined,
      neededAt:
        body.neededAt === null
          ? null
          : body.neededAt
            ? new Date(String(body.neededAt))
            : undefined,
      lossFactor:
        body.lossFactor === null
          ? null
          : body.lossFactor !== undefined
            ? Number(body.lossFactor)
            : undefined,
      siteResourceId:
        body.siteResourceId === null
          ? null
          : body.siteResourceId
            ? String(body.siteResourceId)
            : undefined,
      category: body.category
        ? (String(body.category) as import("@prisma/client").MaterialRequirementCategory)
        : undefined,
      procurementMode: body.procurementMode
        ? (String(
            body.procurementMode,
          ) as import("@prisma/client").MaterialRequirementProcurementMode)
        : undefined,
      description:
        body.description === null
          ? null
          : body.description != null
            ? String(body.description)
            : undefined,
      notes:
        body.notes === null
          ? null
          : body.notes != null
            ? String(body.notes)
            : undefined,
      status: body.status
        ? (String(body.status) as import("@prisma/client").MaterialRequirementStatus)
        : undefined,
      allowQuantityChangeWhenOrdered: Boolean(body.allowQuantityChangeWhenOrdered),
    });
    return NextResponse.json({ ok: true, requirement });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
