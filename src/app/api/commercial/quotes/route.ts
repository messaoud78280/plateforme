import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { createQuote, listQuotes } from "@/lib/commercial/quotes";

export async function GET() {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const quotes = await listQuotes(auth.orgId);
  return NextResponse.json({ quotes });
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
    const quote = await createQuote({
      orgId: auth.orgId,
      userId: auth.session.user.id,
      subject: String(body.subject ?? ""),
      clientExternalOrgId: body.clientExternalOrgId
        ? String(body.clientExternalOrgId)
        : null,
      projectId: body.projectId ? String(body.projectId) : null,
      responsibleId: body.responsibleId ? String(body.responsibleId) : null,
      siteAddressSnapshot: body.siteAddressSnapshot
        ? String(body.siteAddressSnapshot)
        : null,
      validityDate: body.validityDate ? new Date(String(body.validityDate)) : null,
      paymentTerms: body.paymentTerms ? String(body.paymentTerms) : null,
      internalNotes: body.internalNotes ? String(body.internalNotes) : null,
      clientNotes: body.clientNotes ? String(body.clientNotes) : null,
      depositPercent:
        body.depositPercent != null && body.depositPercent !== ""
          ? Number(body.depositPercent)
          : null,
    });
    return NextResponse.json({ quote }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur création devis" },
      { status: 400 },
    );
  }
}
