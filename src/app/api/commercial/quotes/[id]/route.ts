import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { getQuoteDetail, newVersion, updateQuoteMeta } from "@/lib/commercial/quotes";
import { loadDealFinancialSummary } from "@/lib/commercial/deal-summary";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const quote = await getQuoteDetail(auth.orgId, id);
  if (!quote) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }
  const deal = await loadDealFinancialSummary(auth.orgId, id);
  return NextResponse.json({ quote, deal });
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
    if (body.action === "newVersion") {
      const version = await newVersion(auth.orgId, id, auth.session.user.id);
      return NextResponse.json({ version });
    }

    const quote = await updateQuoteMeta(auth.orgId, id, {
      subject: body.subject !== undefined ? String(body.subject) : undefined,
      clientExternalOrgId:
        body.clientExternalOrgId !== undefined
          ? body.clientExternalOrgId
            ? String(body.clientExternalOrgId)
            : null
          : undefined,
      projectId:
        body.projectId !== undefined
          ? body.projectId
            ? String(body.projectId)
            : null
          : undefined,
      responsibleId:
        body.responsibleId !== undefined
          ? body.responsibleId
            ? String(body.responsibleId)
            : null
          : undefined,
      siteAddressSnapshot:
        body.siteAddressSnapshot !== undefined
          ? body.siteAddressSnapshot
            ? String(body.siteAddressSnapshot)
            : null
          : undefined,
      validityDate:
        body.validityDate !== undefined
          ? body.validityDate
            ? new Date(String(body.validityDate))
            : null
          : undefined,
      paymentTerms:
        body.paymentTerms !== undefined
          ? body.paymentTerms
            ? String(body.paymentTerms)
            : null
          : undefined,
      internalNotes:
        body.internalNotes !== undefined
          ? body.internalNotes
            ? String(body.internalNotes)
            : null
          : undefined,
      clientNotes:
        body.clientNotes !== undefined
          ? body.clientNotes
            ? String(body.clientNotes)
            : null
          : undefined,
      depositPercent:
        body.depositPercent !== undefined
          ? body.depositPercent != null && body.depositPercent !== ""
            ? Number(body.depositPercent)
            : null
          : undefined,
      depositAmountHt:
        body.depositAmountHt !== undefined
          ? body.depositAmountHt != null && body.depositAmountHt !== ""
            ? Number(body.depositAmountHt)
            : null
          : undefined,
    });
    return NextResponse.json({ quote });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur mise à jour" },
      { status: 400 },
    );
  }
}
