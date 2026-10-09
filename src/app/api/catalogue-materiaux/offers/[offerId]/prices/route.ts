import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { isExternalPortalUser } from "@/lib/equipe-acces/nav-by-persona";
import { forbiddenUnlessDashboardHref } from "@/lib/equipe-acces/assert-api-dashboard-access";
import {
  addCatalogPriceObservation,
  type CatalogPriceObservationInput,
} from "@/lib/catalog/product-service";

type Ctx = { params: Promise<{ offerId: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (
    isExternalPortalUser(session.user.personType) ||
    !isInternalPurchaseOrderActor(session.user)
  ) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const deny = forbiddenUnlessDashboardHref(
    session.user,
    "/dashboard/catalogue-materiaux",
  );
  if (deny) return deny;
  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });
  }

  const { offerId } = await ctx.params;
  const body = (await req.json().catch(() => null)) as
    | CatalogPriceObservationInput
    | null;
  if (!body?.priceSourceType) {
    return NextResponse.json(
      { error: "Provenance du prix requise" },
      { status: 400 },
    );
  }

  try {
    const observation = await addCatalogPriceObservation({
      organizationId: orgId,
      catalogSupplierOfferId: offerId,
      recordedById: session.user.id,
      input: body,
    });
    return NextResponse.json({ ok: true, observation }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
