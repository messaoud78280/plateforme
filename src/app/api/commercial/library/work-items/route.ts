import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  createWorkItem,
  duplicateWorkItem,
  listWorkItems,
  workItemsToCsv,
} from "@/lib/commercial/library";

export async function GET(req: Request) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? undefined;
  const format = url.searchParams.get("format");
  const view = url.searchParams.get("view"); // archived | (default active)
  const items = await listWorkItems(auth.orgId, {
    q,
    take: format === "csv" ? 2000 : 100,
    active: view === "archived" ? false : true,
  });
  if (format === "csv") {
    const csv = workItemsToCsv(items);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="bibliotheque-ouvrages.csv"',
      },
    });
  }
  return NextResponse.json({ workItems: items });
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
    if (body.action === "duplicate" && body.sourceId) {
      const workItem = await duplicateWorkItem(
        auth.orgId,
        String(body.sourceId),
        auth.session.user.id,
      );
      return NextResponse.json({ workItem }, { status: 201 });
    }
    const workItem = await createWorkItem(auth.orgId, {
      name: String(body.name ?? ""),
      reference: body.reference ? String(body.reference) : null,
      description: body.description ? String(body.description) : null,
      family: body.family ? String(body.family) : null,
      subFamily: body.subFamily ? String(body.subFamily) : null,
      tags: body.tags ? String(body.tags) : null,
      saleUnit: body.saleUnit ? String(body.saleUnit) : "U",
      kind: body.kind === "COMPOSITE" ? "COMPOSITE" : "SIMPLE",
      unitSellHt: body.unitSellHt != null ? Number(body.unitSellHt) : 0,
      marginPercent: body.marginPercent != null ? Number(body.marginPercent) : 0,
      feesPercent: body.feesPercent != null ? Number(body.feesPercent) : 0,
      feesAmountHt: body.feesAmountHt != null ? Number(body.feesAmountHt) : 0,
      sellMode: body.sellMode === "FIXED_SELL" ? "FIXED_SELL" : "MARGIN",
      createdById: auth.session.user.id,
    });
    return NextResponse.json({ workItem }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
