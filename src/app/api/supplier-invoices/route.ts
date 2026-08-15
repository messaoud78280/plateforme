import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  isInternalPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
} from "@/lib/purchase-orders/access";
import { forbiddenUnlessDashboardHref } from "@/lib/equipe-acces/assert-api-dashboard-access";
import {
  createSupplierInvoice,
  listSupplierInvoices,
} from "@/lib/chantier/supplier-invoices";
import { attachSupplierInvoicePdfToPurchaseOrder } from "@/lib/chantier/attach-supplier-invoice-pdf";
import { createServiceRoleClient } from "@/lib/supabase";
import { buildDocumentsStorageRef, DOCUMENTS_BUCKET } from "@/lib/storage/supabase-object";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!isInternalPurchaseOrderActor(session.user)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const personaDeny = forbiddenUnlessDashboardHref(session.user, "/dashboard/depenses");
  if (personaDeny) return personaDeny;
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
  const personaDeny = forbiddenUnlessDashboardHref(session.user, "/dashboard/depenses");
  if (personaDeny) return personaDeny;
  const orgId = await resolvePurchaseOrderOrgId(session.user);
  if (!orgId) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });
  }

  const contentType = req.headers.get("content-type") || "";
  let body: Record<string, unknown> = {};
  let pdfFile: File | null = null;
  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      for (const [key, value] of form.entries()) {
        if (key === "pdfFile" && typeof value === "object" && value && "arrayBuffer" in value) {
          pdfFile = value as File;
        } else {
          body[key] = String(value);
        }
      }
    } else {
      const json = (await req.json().catch(() => null)) as Record<string, unknown> | null;
      if (!json) {
        return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
      }
      body = json;
    }
  } catch {
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

    if (pdfFile && invoice.purchaseOrderId) {
      const supabase = createServiceRoleClient();
      if (!supabase) {
        return NextResponse.json(
          { invoice, warning: "Facture enregistrée — stockage PDF indisponible" },
          { status: 201 },
        );
      }
      const buf = Buffer.from(await pdfFile.arrayBuffer());
      if (buf.length > 12 * 1024 * 1024) {
        return NextResponse.json(
          { invoice, warning: "Facture enregistrée — PDF trop volumineux (12 Mo)" },
          { status: 201 },
        );
      }
      const safeName = pdfFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `purchase-orders/${invoice.purchaseOrderId}/facture/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, buf, {
        contentType: pdfFile.type || "application/pdf",
        upsert: false,
      });
      if (!error) {
        await attachSupplierInvoicePdfToPurchaseOrder({
          orderId: invoice.purchaseOrderId,
          addedById: session.user.id,
          fileUrl: buildDocumentsStorageRef(path),
          fileName: pdfFile.name,
          invoiceNumber: invoice.supplierNumber,
        });
      }
    }

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
