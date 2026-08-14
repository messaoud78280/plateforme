import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  completeSubcontract,
  deleteSubcontract,
  getSubcontract,
  updateSubcontract,
  type SubcontractInput,
  type SubcontractStatus,
} from "@/lib/commercial/subcontracts";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const item = await getSubcontract(auth.orgId, id);
  if (!item) {
    return NextResponse.json({ error: "Sous-traitant introuvable" }, { status: 404 });
  }
  return NextResponse.json({ item });
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
    if (body.action === "complete") {
      const item = await completeSubcontract(auth.orgId, id);
      return NextResponse.json({ item });
    }
    const data: Partial<SubcontractInput> = {};
    if (body.externalOrganizationId != null) {
      data.externalOrganizationId = String(body.externalOrganizationId);
    }
    if (body.scope != null) data.scope = String(body.scope);
    if (body.contractAmountHt != null) data.contractAmountHt = body.contractAmountHt as number;
    if (body.status != null) data.status = body.status as SubcontractStatus;
    if (body.contractRef !== undefined) {
      data.contractRef = body.contractRef ? String(body.contractRef) : null;
    }
    if (body.contractDate !== undefined) {
      data.contractDate = body.contractDate ? String(body.contractDate) : null;
    }
    if (body.startDate !== undefined) {
      data.startDate = body.startDate ? String(body.startDate) : null;
    }
    if (body.endDate !== undefined) {
      data.endDate = body.endDate ? String(body.endDate) : null;
    }
    if (body.contactId !== undefined) {
      data.contactId = body.contactId ? String(body.contactId) : null;
    }
    if (body.notes !== undefined) {
      data.notes = body.notes ? String(body.notes) : null;
    }
    if (body.progressPercent !== undefined) {
      data.progressPercent =
        body.progressPercent === "" || body.progressPercent == null
          ? null
          : (body.progressPercent as number);
    }
    const item = await updateSubcontract({ orgId: auth.orgId, id, data });
    return NextResponse.json({ item });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    const status = msg.includes("introuvable") ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  try {
    await deleteSubcontract(auth.orgId, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    const status = msg.includes("introuvable") ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
