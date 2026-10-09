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
  commitCapitalizeSupplyOffer,
  previewCapitalizeSupplyOffer,
} from "@/lib/catalog/capitalize-from-supply";

async function gate() {
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
  const deny = forbiddenUnlessDashboardHref(
    session.user,
    "/dashboard/catalogue-materiaux",
  );
  if (deny) return { error: deny };
  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) {
    return {
      error: NextResponse.json(
        { error: "Organisation introuvable" },
        { status: 403 },
      ),
    };
  }
  return { session, orgId };
}

/** GET ?supplyOfferId= — prévisualisation sans écriture */
export async function GET(req: Request) {
  const g = await gate();
  if ("error" in g && g.error) return g.error;
  const { orgId } = g as { orgId: string };

  const url = new URL(req.url);
  const supplyOfferId = url.searchParams.get("supplyOfferId")?.trim();
  if (!supplyOfferId) {
    return NextResponse.json(
      { error: "supplyOfferId requis" },
      { status: 400 },
    );
  }

  try {
    const preview = await previewCapitalizeSupplyOffer({
      organizationId: orgId,
      supplyOfferId,
    });
    return NextResponse.json({ preview });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}

/** POST — commit atomique après validation humaine */
export async function POST(req: Request) {
  const g = await gate();
  if ("error" in g && g.error) return g.error;
  const { session, orgId } = g as {
    session: { user: { id: string } };
    orgId: string;
  };

  const body = (await req.json().catch(() => null)) as {
    supplyOfferId?: string;
    catalogMaterialId?: string | null;
    catalogProductId?: string | null;
    forceCreateMaterial?: boolean;
    forceCreateProduct?: boolean;
    confirm?: boolean;
  } | null;

  if (!body?.supplyOfferId?.trim()) {
    return NextResponse.json(
      { error: "supplyOfferId requis" },
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
    const result = await commitCapitalizeSupplyOffer({
      organizationId: orgId,
      supplyOfferId: body.supplyOfferId.trim(),
      recordedById: session.user.id,
      catalogMaterialId: body.catalogMaterialId,
      catalogProductId: body.catalogProductId,
      forceCreateMaterial: body.forceCreateMaterial === true,
      forceCreateProduct: body.forceCreateProduct === true,
    });
    return NextResponse.json({
      ok: true,
      ...result,
      catalogHref: `/dashboard/catalogue-materiaux/${result.catalogMaterialId}`,
    });
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
