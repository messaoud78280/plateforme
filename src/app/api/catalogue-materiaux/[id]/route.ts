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
  getCatalogMaterial,
  updateCatalogMaterial,
} from "@/lib/catalog/service";
import type { CatalogMaterialInput } from "@/lib/catalog/types";

type Ctx = { params: Promise<{ id: string }> };

async function gate(sessionUser: {
  id: string;
  personType?: string | null;
  permissionProfile?: string | null;
}) {
  if (
    isExternalPortalUser(sessionUser.personType) ||
    !isInternalPurchaseOrderActor(sessionUser)
  ) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const deny = forbiddenUnlessDashboardHref(
    sessionUser,
    "/dashboard/catalogue-materiaux",
  );
  if (deny) return deny;
  const orgId = await resolvePurchaseOrderOrgId(sessionUser);
  if (!orgId) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });
  }
  return { orgId };
}

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const g = await gate(session.user);
  if (g instanceof NextResponse) return g;

  const { id } = await ctx.params;
  const material = await getCatalogMaterial({
    organizationId: g.orgId,
    id,
  });
  if (!material) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  return NextResponse.json({ material });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const g = await gate(session.user);
  if (g instanceof NextResponse) return g;

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as
    | Partial<CatalogMaterialInput>
    | null;
  if (!body) {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  try {
    const material = await updateCatalogMaterial({
      organizationId: g.orgId,
      id,
      input: body,
    });
    return NextResponse.json({ ok: true, material });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
