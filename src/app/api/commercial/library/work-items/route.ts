import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  bulkUpdateWorkItems,
  createWorkItem,
  duplicateWorkItem,
  listLibraryFamilyTree,
  listWorkItems,
  searchLibraryWorkItems,
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
  const kindParam = url.searchParams.get("kind");
  const kind =
    kindParam === "SIMPLE" || kindParam === "COMPOSITE" ? kindParam : undefined;
  const favorite = url.searchParams.get("favorite") === "1";
  const needsPriceRecalc = url.searchParams.get("needsPriceRecalc") === "1";
  const family = url.searchParams.get("family") ?? undefined;
  const subFamily = url.searchParams.get("subFamily") ?? undefined;
  const sellModeParam = url.searchParams.get("sellMode");
  const sellMode =
    sellModeParam === "MARGIN" || sellModeParam === "FIXED_SELL"
      ? sellModeParam
      : undefined;
  const priceMinRaw = url.searchParams.get("priceMin");
  const priceMaxRaw = url.searchParams.get("priceMax");
  const priceMin = priceMinRaw != null && priceMinRaw !== "" ? Number(priceMinRaw) : undefined;
  const priceMax = priceMaxRaw != null && priceMaxRaw !== "" ? Number(priceMaxRaw) : undefined;
  const sortParam = url.searchParams.get("sort");
  const sort =
    sortParam === "name" ||
    sortParam === "reference" ||
    sortParam === "price" ||
    sortParam === "updatedAt" ||
    sortParam === "family"
      ? sortParam
      : "updatedAt";
  const sortDir = url.searchParams.get("sortDir") === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(url.searchParams.get("page") || 1) || 1);
  const pageSize = Math.min(
    100,
    Math.max(10, Number(url.searchParams.get("pageSize") || 50) || 50),
  );
  const skip = (page - 1) * pageSize;
  const includeVariants = url.searchParams.get("includeVariants") === "1";
  const withVariants = url.searchParams.get("withVariants") === "1";
  const meta = url.searchParams.get("meta");

  if (meta === "families") {
    const families = await listLibraryFamilyTree(auth.orgId);
    return NextResponse.json({ families });
  }

  if (withVariants) {
    const { listWorkItemsWithVariantMeta } = await import(
      "@/lib/commercial/library-variants"
    );
    const workItems = await listWorkItemsWithVariantMeta(auth.orgId, {
      q,
      take: pageSize,
    });
    return NextResponse.json({
      workItems,
      total: workItems.length,
      page: 1,
      pageSize,
      pageCount: 1,
    });
  }

  const listOpts: Parameters<typeof listWorkItems>[1] = {
    q,
    take: format === "csv" ? 2000 : pageSize,
    skip: format === "csv" ? 0 : skip,
    active: view === "archived" ? false : true,
    kind,
    favorite: favorite || undefined,
    needsPriceRecalc: needsPriceRecalc || undefined,
    family,
    subFamily,
    sellMode,
    priceMin: priceMin != null && Number.isFinite(priceMin) ? priceMin : undefined,
    priceMax: priceMax != null && Number.isFinite(priceMax) ? priceMax : undefined,
    sort,
    sortDir,
    rootsOnly: !includeVariants,
    includeComponents: format === "csv",
  };

  if (format === "csv") {
    const items = await listWorkItems(auth.orgId, listOpts);
    const csv = workItemsToCsv(items);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="bibliotheque-ouvrages.csv"',
      },
    });
  }

  const { items, total } = await searchLibraryWorkItems(auth.orgId, listOpts);
  return NextResponse.json({
    workItems: items,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  });
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
    if (body.action === "bulk" && Array.isArray(body.ids)) {
      const result = await bulkUpdateWorkItems(
        auth.orgId,
        body.ids.map(String),
        {
          family: body.family !== undefined ? (body.family as string | null) : undefined,
          subFamily:
            body.subFamily !== undefined ? (body.subFamily as string | null) : undefined,
          isFavorite:
            typeof body.isFavorite === "boolean" ? body.isFavorite : undefined,
          isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
          tagsAppend: body.tagsAppend ? String(body.tagsAppend) : undefined,
        },
      );
      return NextResponse.json(result);
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
