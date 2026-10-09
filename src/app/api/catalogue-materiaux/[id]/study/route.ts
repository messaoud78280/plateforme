import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { isExternalPortalUser } from "@/lib/equipe-acces/nav-by-persona";
import { forbiddenUnlessDashboardHref } from "@/lib/equipe-acces/assert-api-dashboard-access";
import { loadCatalogStudy } from "@/lib/catalog/product-service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
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

  const { id } = await ctx.params;
  const study = await loadCatalogStudy({
    organizationId: orgId,
    materialId: id,
  });
  if (!study) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  return NextResponse.json({ study });
}
