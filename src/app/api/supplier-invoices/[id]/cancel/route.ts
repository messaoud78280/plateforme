import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { cancelSupplierInvoice } from "@/lib/chantier/supplier-invoices";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!isInternalPurchaseOrderActor(session.user)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });
  }

  const { id } = await ctx.params;
  try {
    const invoice = await cancelSupplierInvoice({
      orgId,
      userId: session.user.id,
      id,
    });
    return NextResponse.json({ invoice });
  } catch (e) {
    const err = e as Error & { code?: string };
    const status = err.code === "ALREADY_CANCELLED" ? 409 : 400;
    return NextResponse.json(
      { error: err.message || "Erreur", code: err.code },
      { status },
    );
  }
}
