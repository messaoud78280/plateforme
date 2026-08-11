import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  acceptAmendment,
  addAmendmentLine,
  cancelAmendment,
  createAmendment,
  listAmendments,
  refuseAmendment,
  sendAmendment,
  updateAmendmentMeta,
} from "@/lib/commercial/amendments";

export async function GET() {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const amendments = await listAmendments(auth.orgId);
  return NextResponse.json({ amendments });
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
    const action = String(body.action ?? "");
    if (action === "addLine") {
      const amendment = await addAmendmentLine(
        auth.orgId,
        String(body.amendmentId ?? ""),
        {
          designation: String(body.designation ?? ""),
          quantity: body.quantity != null ? Number(body.quantity) : 1,
          unit: body.unit ? String(body.unit) : "U",
          unitSellHt: body.unitSellHt != null ? Number(body.unitSellHt) : 0,
          vatRate: body.vatRate != null ? Number(body.vatRate) : undefined,
        },
      );
      return NextResponse.json({ amendment });
    }
    if (action === "accept") {
      const amendment = await acceptAmendment(
        auth.orgId,
        String(body.amendmentId ?? ""),
        auth.session.user.id,
      );
      return NextResponse.json({ amendment });
    }
    if (action === "send") {
      const amendment = await sendAmendment(
        auth.orgId,
        String(body.amendmentId ?? ""),
        auth.session.user.id,
      );
      return NextResponse.json({ amendment });
    }
    if (action === "refuse") {
      const amendment = await refuseAmendment(
        auth.orgId,
        String(body.amendmentId ?? ""),
        auth.session.user.id,
      );
      return NextResponse.json({ amendment });
    }
    if (action === "cancel") {
      const amendment = await cancelAmendment(
        auth.orgId,
        String(body.amendmentId ?? ""),
        auth.session.user.id,
      );
      return NextResponse.json({ amendment });
    }
    if (action === "updateMeta") {
      const amendment = await updateAmendmentMeta(
        auth.orgId,
        String(body.amendmentId ?? ""),
        {
          subject: body.subject !== undefined ? String(body.subject) : undefined,
          clientNotes:
            body.clientNotes !== undefined
              ? body.clientNotes
                ? String(body.clientNotes)
                : null
              : undefined,
          internalNotes:
            body.internalNotes !== undefined
              ? body.internalNotes
                ? String(body.internalNotes)
                : null
              : undefined,
        },
      );
      return NextResponse.json({ amendment });
    }

    const amendment = await createAmendment({
      orgId: auth.orgId,
      quoteId: String(body.quoteId ?? ""),
      subject: String(body.subject ?? ""),
      userId: auth.session.user.id,
    });
    return NextResponse.json({ amendment }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur avenant" },
      { status: 400 },
    );
  }
}
