import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { getInvoiceDetail, issueInvoice, updateInvoiceDueDate } from "@/lib/commercial/invoices";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const invoice = await getInvoiceDetail(auth.orgId, id);
  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }
  return NextResponse.json({ invoice });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  try {
    if ("dueDate" in body) {
      await updateInvoiceDueDate({
        orgId: auth.orgId,
        invoiceId: id,
        userId: auth.session.user.id,
        dueDate:
          body.dueDate === null || body.dueDate === ""
            ? null
            : new Date(String(body.dueDate)),
      });
    }
    const invoice = await getInvoiceDetail(auth.orgId, id);
    return NextResponse.json({ invoice });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || body.action !== "issue") {
    return NextResponse.json(
      { error: "Action invalide — utilisez { action: \"issue\" }" },
      { status: 400 },
    );
  }
  try {
    await issueInvoice(auth.orgId, id, auth.session.user.id);
    const invoice = await getInvoiceDetail(auth.orgId, id);
    return NextResponse.json({ invoice });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur émission" },
      { status: 400 },
    );
  }
}
