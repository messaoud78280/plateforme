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
  createCatalogProduct,
  type CatalogProductInput,
} from "@/lib/catalog/product-service";

type Ctx = { params: Promise<{ id: string }> };

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

  const { id: materialId } = await ctx.params;
  const body = (await req.json().catch(() => null)) as
    | (CatalogProductInput & { forceCreate?: boolean })
    | null;
  if (!body) {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  try {
    const { forceCreate, ...input } = body;
    const product = await createCatalogProduct({
      organizationId: orgId,
      catalogMaterialId: materialId,
      createdById: session.user.id,
      input,
      forceCreate: forceCreate === true,
    });
    return NextResponse.json({ ok: true, product }, { status: 201 });
  } catch (e) {
    const err = e as Error & { code?: string; candidates?: unknown };
    if (err.code === "DUPLICATE") {
      return NextResponse.json(
        {
          error: err.message,
          code: "DUPLICATE",
          candidates: err.candidates ?? [],
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: err.message || "Erreur" },
      { status: 400 },
    );
  }
}
