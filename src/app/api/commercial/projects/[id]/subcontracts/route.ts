import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  createSubcontract,
  listSubcontracts,
  type SubcontractInput,
  type SubcontractStatus,
} from "@/lib/commercial/subcontracts";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id: projectId } = await ctx.params;
  try {
    const items = await listSubcontracts(auth.orgId, projectId);
    return NextResponse.json({ items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    const status = msg.includes("introuvable") ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id: projectId } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  try {
    const data: SubcontractInput = {
      externalOrganizationId: String(body.externalOrganizationId ?? ""),
      scope: String(body.scope ?? ""),
      contractAmountHt: body.contractAmountHt as number,
      status: body.status as SubcontractStatus | undefined,
      contractRef: body.contractRef != null ? String(body.contractRef) : null,
      contractDate: body.contractDate != null ? String(body.contractDate) : null,
      startDate: body.startDate != null ? String(body.startDate) : null,
      endDate: body.endDate != null ? String(body.endDate) : null,
      contactId: body.contactId ? String(body.contactId) : null,
      notes: body.notes != null ? String(body.notes) : null,
      progressPercent:
        body.progressPercent === undefined || body.progressPercent === ""
          ? null
          : (body.progressPercent as number),
    };
    const item = await createSubcontract({
      orgId: auth.orgId,
      projectId,
      data,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    const status = msg.includes("introuvable") ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
