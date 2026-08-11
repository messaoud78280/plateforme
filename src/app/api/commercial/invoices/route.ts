import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  createDepositInvoice,
  createStandardInvoice,
  issueInvoice,
  listInvoices,
} from "@/lib/commercial/invoices";

export async function GET() {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const invoices = await listInvoices(auth.orgId);
  return NextResponse.json({ invoices });
}

export async function POST(req: Request) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  try {
    if (body.type === "DEPOSIT") {
      const invoice = await createDepositInvoice({
        orgId: auth.orgId,
        userId: auth.session.user.id,
        quoteId: String(body.quoteId ?? ""),
        percent: body.percent != null ? Number(body.percent) : undefined,
        amountHt: body.amountHt != null ? Number(body.amountHt) : undefined,
        dueDate: body.dueDate ? new Date(String(body.dueDate)) : null,
      });
      if (body.issue) {
        await issueInvoice(auth.orgId, invoice.id, auth.session.user.id);
        const issued = await listInvoices(auth.orgId);
        const fresh = issued.find((i) => i.id === invoice.id) ?? invoice;
        return NextResponse.json({ invoice: fresh }, { status: 201 });
      }
      return NextResponse.json({ invoice }, { status: 201 });
    }

    const lines = Array.isArray(body.lines) ? body.lines : [];
    const invoice = await createStandardInvoice({
      orgId: auth.orgId,
      userId: auth.session.user.id,
      quoteId: body.quoteId ? String(body.quoteId) : null,
      subject: String(body.subject ?? ""),
      clientExternalOrgId: body.clientExternalOrgId
        ? String(body.clientExternalOrgId)
        : null,
      projectId: body.projectId ? String(body.projectId) : null,
      dueDate: body.dueDate ? new Date(String(body.dueDate)) : null,
      lines: lines.map((l: Record<string, unknown>) => ({
        designation: String(l.designation ?? ""),
        quantity: l.quantity != null ? Number(l.quantity) : 1,
        unit: l.unit ? String(l.unit) : "U",
        unitSellHt: Number(l.unitSellHt ?? 0),
        vatRate: l.vatRate != null ? Number(l.vatRate) : 20,
        description: l.description ? String(l.description) : null,
      })),
    });
    return NextResponse.json({ invoice }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur facture" },
      { status: 400 },
    );
  }
}
