import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { isExternalPortalUser } from "@/lib/equipe-acces/nav-by-persona";
import { prisma } from "@/lib/prisma";
import { SupplyOfferDuplicateError } from "@/lib/supply/offer-service";
import {
  commitApplyCatalogToSupply,
  previewApplyCatalogToSupply,
} from "@/lib/catalog/apply-to-supply";

type Ctx = {
  params: Promise<{ id: string; requirementId: string }>;
};

async function assertAccess(opts: {
  orgId: string;
  projectId: string;
  requirementId: string;
}) {
  const req = await prisma.materialRequirement.findFirst({
    where: {
      id: opts.requirementId,
      organizationId: opts.orgId,
      projectId: opts.projectId,
    },
    select: { id: true },
  });
  return Boolean(req);
}

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
  const ok = await assertAccess({
    orgId,
    projectId,
    requirementId,
  });
  if (!ok) {
    return { error: NextResponse.json({ error: "Introuvable" }, { status: 404 }) };
  }
  return { session, orgId, projectId, requirementId };
}

/** GET ?catalogSupplierOfferId= — prévisualisation */
export async function GET(req: Request, ctx: Ctx) {
  const g = await gate(ctx);
  if ("error" in g && g.error) return g.error;
  const { orgId, projectId, requirementId } = g as {
    orgId: string;
    projectId: string;
    requirementId: string;
  };

  const catalogSupplierOfferId = new URL(req.url).searchParams
    .get("catalogSupplierOfferId")
    ?.trim();
  if (!catalogSupplierOfferId) {
    return NextResponse.json(
      { error: "catalogSupplierOfferId requis" },
      { status: 400 },
    );
  }

  try {
    const preview = await previewApplyCatalogToSupply({
      organizationId: orgId,
      projectId,
      requirementId,
      catalogSupplierOfferId,
    });
    return NextResponse.json({ preview });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}

/** POST — créer SupplyOffer depuis catalogue (confirm: true) */
export async function POST(req: Request, ctx: Ctx) {
  const g = await gate(ctx);
  if ("error" in g && g.error) return g.error;
  const { session, orgId, projectId, requirementId } = g as {
    session: { user: { id: string } };
    orgId: string;
    projectId: string;
    requirementId: string;
  };

  const body = (await req.json().catch(() => null)) as {
    catalogSupplierOfferId?: string;
    confirm?: boolean;
    forceCreate?: boolean;
  } | null;

  if (!body?.catalogSupplierOfferId?.trim()) {
    return NextResponse.json(
      { error: "catalogSupplierOfferId requis" },
      { status: 400 },
    );
  }
  if (body.confirm !== true) {
    return NextResponse.json(
      {
        error:
          "Confirmation humaine requise (confirm: true). Utilisez GET pour prévisualiser.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await commitApplyCatalogToSupply({
      organizationId: orgId,
      projectId,
      requirementId,
      catalogSupplierOfferId: body.catalogSupplierOfferId.trim(),
      recordedById: session.user.id,
      forceCreate: body.forceCreate === true,
    });
    return NextResponse.json(
      {
        ok: true,
        offer: result.offer,
        mode: result.mode,
        priceFreshnessLabel: result.priceFreshnessLabel,
        selected: false,
        purchaseOrdersCreated: 0,
      },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof SupplyOfferDuplicateError) {
      return NextResponse.json(
        {
          error: e.message,
          code: e.code,
          candidates: e.candidates,
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
