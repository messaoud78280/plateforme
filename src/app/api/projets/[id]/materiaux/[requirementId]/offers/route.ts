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
  createSupplyOffer,
  listSupplyOffersForRequirement,
} from "@/lib/supply/offer-service";
import { compareSupplyOffers } from "@/lib/supply/offer-compare";
import type { SupplyOfferInput } from "@/lib/supply/offer-types";

type Ctx = { params: Promise<{ id: string; requirementId: string }> };

async function assertAccess(opts: {
  userId: string;
  orgId: string;
  projectId: string;
  requirementId: string;
}) {
  const req = await prisma.materialRequirement.findFirst({
    where: {
      id: opts.requirementId,
      projectId: opts.projectId,
      organizationId: opts.orgId,
    },
    select: { id: true },
  });
  return req;
}

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
  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });
  }

  const { id: projectId, requirementId } = await ctx.params;
  const ok = await assertAccess({
    userId: session.user.id,
    orgId,
    projectId,
    requirementId,
  });
  if (!ok) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const offers = await listSupplyOffersForRequirement({
    organizationId: orgId,
    projectId,
    requirementId,
  });
  const comparison = compareSupplyOffers(offers);

  return NextResponse.json({ offers, comparison });
}

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
  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });
  }

  const { id: projectId, requirementId } = await ctx.params;
  const ok = await assertAccess({
    userId: session.user.id,
    orgId,
    projectId,
    requirementId,
  });
  if (!ok) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as SupplyOfferInput | null;
  if (!body) return NextResponse.json({ error: "Corps invalide" }, { status: 400 });

  try {
    const offer = await createSupplyOffer({
      organizationId: orgId,
      projectId,
      requirementId,
      recordedById: session.user.id,
      input: body,
    });
    return NextResponse.json({ ok: true, offer }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
