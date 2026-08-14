import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import {
  createSupplierInvoice,
  listSupplierInvoices,
} from "@/lib/chantier/supplier-invoices";

export async function GET(req: Request) {
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

  const url = new URL(req.url);
  const invoices = await listSupplierInvoices({
    orgId,
    projectId: url.searchParams.get("projectId") ?? undefined,
    purchaseOrderId: url.searchParams.get("purchaseOrderId") ?? undefined,
  });
  return NextResponse.json({ invoices });
}

export async function POST(req: Request) {
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

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  try {
    const invoice = await createSupplierInvoice({
      orgId,
      userId: session.user.id,
      projectId: String(body.projectId ?? ""),
      purchaseOrderId: body.purchaseOrderId ? String(body.purchaseOrderId) : null,
      externalOrganizationId: String(body.externalOrganizationId ?? ""),
      supplierNumber: String(body.supplierNumber ?? ""),
      kind: body.kind === "CREDIT" ? "CREDIT" : "STANDARD",
      category: body.category ? String(body.category) : undefined,
      invoiceDate: body.invoiceDate
        ? new Date(String(body.invoiceDate))
        : new Date(),
      amountHt: Number(body.amountHt),
      amountVat: body.amountVat != null ? Number(body.amountVat) : 0,
      amountTtc: body.amountTtc != null ? Number(body.amountTtc) : undefined,
      notes: body.notes ? String(body.notes) : null,
    });
    return NextResponse.json({ invoice }, { status: 201 });
  } catch (e) {
    const err = e as Error & { code?: string };
    const status = err.code === "DUPLICATE" ? 409 : 400;
    return NextResponse.json(
      { error: err.message || "Erreur", code: err.code },
      { status },
    );
  }
}
