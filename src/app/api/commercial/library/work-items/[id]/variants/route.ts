import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  createWorkItemVariant,
  linkAsVariant,
  listVariantsForParent,
  unlinkVariant,
} from "@/lib/commercial/library-variants";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  try {
    const variants = await listVariantsForParent(auth.orgId, id);
    return NextResponse.json({
      variants: variants.map((v) => ({
        ...v,
        unitSellHt: Number(v.unitSellHt),
        unitCostHt: Number(v.unitCostHt),
      })),
    });
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
  if (!body) {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  try {
    if (body.action === "link" && body.workItemId) {
      const workItem = await linkAsVariant({
        orgId: auth.orgId,
        workItemId: String(body.workItemId),
        parentId: id,
        variantKind: body.variantKind ? String(body.variantKind) : null,
        actorUserId: auth.session.user.id,
      });
      return NextResponse.json({ workItem });
    }
    if (body.action === "unlink") {
      const workItem = await unlinkVariant({
        orgId: auth.orgId,
        workItemId: id,
        actorUserId: auth.session.user.id,
      });
      return NextResponse.json({ workItem });
    }

    const workItem = await createWorkItemVariant({
      orgId: auth.orgId,
      parentId: id,
      name: String(body.name ?? ""),
      reference: body.reference ? String(body.reference) : null,
      description: body.description ? String(body.description) : null,
      unitSellHt: body.unitSellHt != null ? Number(body.unitSellHt) : undefined,
      saleUnit: body.saleUnit ? String(body.saleUnit) : undefined,
      variantKind:
        body.variantKind === "COMMERCIAL" ||
        body.variantKind === "CUSTOM" ||
        body.variantKind === "TECHNICAL"
          ? body.variantKind
          : "TECHNICAL",
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
