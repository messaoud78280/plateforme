import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { cancelPurchaseOrderReceipt } from "@/lib/purchase-orders/receiving";
import { forbiddenUnlessDashboardHref } from "@/lib/equipe-acces/assert-api-dashboard-access";

type Ctx = { params: Promise<{ id: string; receiptId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!isInternalPurchaseOrderActor(session.user)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const personaDeny = forbiddenUnlessDashboardHref(session.user, "/dashboard/commandes");
  if (personaDeny) return personaDeny;

  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { receiptId } = await ctx.params;
  try {
    const result = await cancelPurchaseOrderReceipt({
      organizationId: orgId,
      receiptId,
      actorUserId: session.user.id,
      actorName: session.user.name || "Utilisateur",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
