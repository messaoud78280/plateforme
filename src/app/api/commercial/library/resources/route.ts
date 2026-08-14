import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { prisma } from "@/lib/prisma";
import {
  createMaterial,
  createLaborResource,
  createEquipmentResource,
  listMaterials,
  listLaborResources,
  listEquipmentResources,
} from "@/lib/commercial/library";

export async function GET(req: Request) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const kind = new URL(req.url).searchParams.get("kind") ?? "materials";
  const q = new URL(req.url).searchParams.get("q") ?? undefined;
  if (kind === "labor") {
    return NextResponse.json({ labor: await listLaborResources(auth.orgId) });
  }
  if (kind === "equipment") {
    return NextResponse.json({ equipment: await listEquipmentResources(auth.orgId) });
  }
  if (kind === "subcontract") {
    const query = q?.trim();
    const subcontractors = await prisma.externalOrganization.findMany({
      where: {
        hostOrganizationId: auth.orgId,
        type: "SUBCONTRACTOR",
        status: "ACTIVE",
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { tradeName: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: { id: true, name: true, tradeName: true },
      orderBy: { name: "asc" },
      take: 50,
    });
    return NextResponse.json({ subcontractors });
  }
  return NextResponse.json({ materials: await listMaterials(auth.orgId, { q }) });
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
    const kind = String(body.kind ?? "material");
    if (kind === "labor") {
      const labor = await createLaborResource(auth.orgId, {
        name: String(body.name ?? ""),
        trade: body.trade ? String(body.trade) : null,
        qualification: body.qualification ? String(body.qualification) : null,
        hourlyCostHt: body.hourlyCostHt != null ? Number(body.hourlyCostHt) : 0,
        loadedCostHt: body.loadedCostHt != null ? Number(body.loadedCostHt) : null,
        notes: body.notes ? String(body.notes) : null,
      });
      return NextResponse.json({ labor }, { status: 201 });
    }
    if (kind === "equipment") {
      const equipment = await createEquipmentResource(auth.orgId, {
        name: String(body.name ?? ""),
        kind: body.equipmentKind ? String(body.equipmentKind) : "OWNED",
        category: body.category ? String(body.category) : null,
        unit: body.unit ? String(body.unit) : "h",
        hourlyCostHt: body.hourlyCostHt != null ? Number(body.hourlyCostHt) : null,
        dailyCostHt: body.dailyCostHt != null ? Number(body.dailyCostHt) : null,
        notes: body.notes ? String(body.notes) : null,
      });
      return NextResponse.json({ equipment }, { status: 201 });
    }
    const material = await createMaterial(auth.orgId, {
      name: String(body.name ?? ""),
      reference: body.reference ? String(body.reference) : null,
      family: body.family ? String(body.family) : null,
      unit: body.unit ? String(body.unit) : "U",
      supplierName: body.supplierName ? String(body.supplierName) : null,
      manufacturer: body.manufacturer ? String(body.manufacturer) : null,
      priceSource: body.priceSource ? String(body.priceSource) : null,
      currentPriceHt: body.currentPriceHt != null ? Number(body.currentPriceHt) : 0,
      notes: body.notes ? String(body.notes) : null,
    });
    return NextResponse.json({ material }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
