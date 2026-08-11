import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  createWorkItem,
  listWorkItems,
  listMaterials,
  listLaborResources,
  createMaterial,
  createLaborResource,
} from "@/lib/commercial/library";

export async function GET(req: Request) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") ?? "work-items";

  if (kind === "materials") {
    return NextResponse.json({ materials: await listMaterials(auth.orgId) });
  }
  if (kind === "labor") {
    return NextResponse.json({ labor: await listLaborResources(auth.orgId) });
  }
  return NextResponse.json({ workItems: await listWorkItems(auth.orgId) });
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
    const kind = String(body.kind ?? "work-item");
    if (kind === "material") {
      const material = await createMaterial(auth.orgId, {
        name: String(body.name ?? ""),
        reference: body.reference ? String(body.reference) : null,
        family: body.family ? String(body.family) : null,
        unit: body.unit ? String(body.unit) : "U",
        supplierName: body.supplierName ? String(body.supplierName) : null,
        currentPriceHt: body.currentPriceHt != null ? Number(body.currentPriceHt) : 0,
        notes: body.notes ? String(body.notes) : null,
      });
      return NextResponse.json({ material }, { status: 201 });
    }
    if (kind === "labor") {
      const labor = await createLaborResource(auth.orgId, {
        name: String(body.name ?? ""),
        hourlyCostHt: body.hourlyCostHt != null ? Number(body.hourlyCostHt) : 0,
        loadedCostHt:
          body.loadedCostHt != null ? Number(body.loadedCostHt) : null,
        notes: body.notes ? String(body.notes) : null,
      });
      return NextResponse.json({ labor }, { status: 201 });
    }
    const workItem = await createWorkItem(auth.orgId, {
      name: String(body.name ?? ""),
      reference: body.reference ? String(body.reference) : null,
      description: body.description ? String(body.description) : null,
      family: body.family ? String(body.family) : null,
      subFamily: body.subFamily ? String(body.subFamily) : null,
      saleUnit: body.saleUnit ? String(body.saleUnit) : "U",
      unitSellHt: body.unitSellHt != null ? Number(body.unitSellHt) : 0,
      marginPercent: body.marginPercent != null ? Number(body.marginPercent) : 0,
    });
    return NextResponse.json({ workItem }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur bibliothèque" },
      { status: 400 },
    );
  }
}
