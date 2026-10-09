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
  archiveSupplyOffer,
  clearSelectedSupplyOffer,
  deleteSupplyOffer,
  selectSupplyOffer,
  updateSupplyOffer,
} from "@/lib/supply/offer-service";
import type { SupplyOfferInput } from "@/lib/supply/offer-types";

type Ctx = {
  params: Promise<{ id: string; requirementId: string; offerId: string }>;
};

async function gate(sessionUser: {
  id: string;
  personType?: string | null;
}): Promise<{ orgId: string } | NextResponse> {
  if (
    isExternalPortalUser(sessionUser.personType) ||
    !isInternalPurchaseOrderActor(sessionUser)
  ) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const orgId = await resolvePurchaseOrderOrgId(sessionUser);
  if (!orgId) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });
  }
  return { orgId };
}

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const g = await gate(session.user);
  if (g instanceof NextResponse) return g;

  const { id: projectId, requirementId, offerId } = await ctx.params;
  const existing = await prisma.supplyOffer.findFirst({
    where: {
      id: offerId,
      requirementId,
      organizationId: g.orgId,
      requirement: { projectId },
    },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as
    | (Partial<SupplyOfferInput> & {
        select?: boolean;
        clearSelection?: boolean;
        archive?: boolean;
        allowClearSelection?: boolean;
      })
    | null;
  if (!body) return NextResponse.json({ error: "Corps invalide" }, { status: 400 });

  try {
    if (body.archive) {
      const result = await archiveSupplyOffer({
        organizationId: g.orgId,
        projectId,
        requirementId,
        offerId,
        allowClearSelection: body.allowClearSelection === true,
      });
      return NextResponse.json({ ok: true, ...result });
    }
    if (body.clearSelection) {
      await clearSelectedSupplyOffer({
        organizationId: g.orgId,
        projectId,
        requirementId,
      });
      return NextResponse.json({ ok: true, selectedOfferId: null });
    }
    if (body.select) {
      const result = await selectSupplyOffer({
        organizationId: g.orgId,
        projectId,
        requirementId,
        offerId,
      });
      return NextResponse.json({
        ok: true,
        selectedOfferId: result.selectedOfferId,
        purchaseOrdersCreated: result.purchaseOrdersCreated,
      });
    }

    const input: Partial<SupplyOfferInput> = { ...body };
    delete (input as { select?: boolean }).select;
    delete (input as { clearSelection?: boolean }).clearSelection;
    delete (input as { archive?: boolean }).archive;
    delete (input as { allowClearSelection?: boolean }).allowClearSelection;
    const offer = await updateSupplyOffer({
      organizationId: g.orgId,
      projectId,
      requirementId,
      offerId,
      input,
    });
    return NextResponse.json({ ok: true, offer });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const g = await gate(session.user);
  if (g instanceof NextResponse) return g;

  const { id: projectId, requirementId, offerId } = await ctx.params;
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode"); // hard | archive (défaut hard)

  try {
    if (mode === "archive") {
      const allowClear =
        url.searchParams.get("allowClearSelection") === "1";
      const result = await archiveSupplyOffer({
        organizationId: g.orgId,
        projectId,
        requirementId,
        offerId,
        allowClearSelection: allowClear,
      });
      return NextResponse.json({ ok: true, ...result });
    }
    const result = await deleteSupplyOffer({
      organizationId: g.orgId,
      projectId,
      requirementId,
      offerId,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Erreur",
        suggestArchive: true,
      },
      { status: 400 },
    );
  }
}
