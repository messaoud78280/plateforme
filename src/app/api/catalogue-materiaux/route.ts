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
  createCatalogMaterial,
  listCatalogMaterials,
} from "@/lib/catalog/service";
import type { CatalogMaterialInput, CatalogMaterialStatus } from "@/lib/catalog/types";

export async function GET(req: Request) {
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

  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const family = url.searchParams.get("family");
  const status = url.searchParams.get("status") as
    | CatalogMaterialStatus
    | "ALL"
    | null;
  const page = Number(url.searchParams.get("page") || "1");
  const pageSize = Number(url.searchParams.get("pageSize") || "24");

  const result = await listCatalogMaterials({
    organizationId: orgId,
    q,
    family,
    status,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 24,
  });
  return NextResponse.json(result);
}

export async function POST(req: Request) {
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

  const body = (await req.json().catch(() => null)) as
    | (CatalogMaterialInput & { forceCreate?: boolean })
    | null;
  if (!body) {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  try {
    const { forceCreate, ...input } = body;
    const material = await createCatalogMaterial({
      organizationId: orgId,
      createdById: session.user.id,
      input,
      forceCreate: forceCreate === true,
    });
    return NextResponse.json({ ok: true, material }, { status: 201 });
  } catch (e) {
    const err = e as Error & {
      code?: string;
      candidates?: unknown;
    };
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
