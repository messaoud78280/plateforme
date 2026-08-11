import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  deleteWorkItemComponent,
  upsertWorkItemComponent,
} from "@/lib/commercial/library";
import type { CommercialComponentType } from "@prisma/client";

type Ctx = { params: Promise<{ id: string }> };

const TYPES: CommercialComponentType[] = [
  "MATERIAL",
  "LABOR",
  "EQUIPMENT",
  "SUBCONTRACT",
  "OTHER",
];

export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id: workItemId } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  try {
    const typeRaw = String(body.type ?? "MATERIAL");
    const type = TYPES.includes(typeRaw as CommercialComponentType)
      ? (typeRaw as CommercialComponentType)
      : "MATERIAL";
    const workItem = await upsertWorkItemComponent(auth.orgId, workItemId, {
      componentId: body.componentId ? String(body.componentId) : undefined,
      name: String(body.name ?? ""),
      type,
      quantityPerUnit: body.quantityPerUnit != null ? Number(body.quantityPerUnit) : 1,
      unit: body.unit ? String(body.unit) : undefined,
      unitCostHt: body.unitCostHt != null ? Number(body.unitCostHt) : undefined,
      lossPercent: body.lossPercent != null ? Number(body.lossPercent) : 0,
      comment: body.comment != null ? String(body.comment) : null,
      materialId: body.materialId ? String(body.materialId) : null,
      laborId: body.laborId ? String(body.laborId) : null,
      equipmentId: body.equipmentId ? String(body.equipmentId) : null,
      subcontractorExternalOrgId: body.subcontractorExternalOrgId
        ? String(body.subcontractorExternalOrgId)
        : null,
      sortOrder: body.sortOrder != null ? Number(body.sortOrder) : undefined,
    });
    return NextResponse.json({ workItem });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id: workItemId } = await ctx.params;
  const url = new URL(req.url);
  const componentId = url.searchParams.get("componentId");
  if (!componentId) {
    return NextResponse.json({ error: "componentId requis" }, { status: 400 });
  }
  try {
    const workItem = await deleteWorkItemComponent(auth.orgId, workItemId, componentId);
    return NextResponse.json({ workItem });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
