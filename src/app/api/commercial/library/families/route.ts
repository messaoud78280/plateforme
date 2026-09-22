import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  assignWorkItemsFamily,
  createLibraryFamily,
  createLibrarySubFamily,
  getLibraryFamilyManagement,
  moveLibrarySubFamily,
  renameLibraryFamily,
  renameLibrarySubFamily,
  reorderLibraryFamilies,
} from "@/lib/commercial/library-families";

export async function GET() {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const data = await getLibraryFamilyManagement(auth.orgId);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body?.action) {
    return NextResponse.json({ error: "Action requise" }, { status: 400 });
  }
  try {
    const action = String(body.action);
    if (action === "createFamily") {
      return NextResponse.json(
        await createLibraryFamily(auth.orgId, String(body.name ?? "")),
      );
    }
    if (action === "renameFamily") {
      return NextResponse.json(
        await renameLibraryFamily(
          auth.orgId,
          String(body.from ?? ""),
          String(body.to ?? ""),
        ),
      );
    }
    if (action === "createSubFamily") {
      return NextResponse.json(
        await createLibrarySubFamily(
          auth.orgId,
          String(body.family ?? ""),
          String(body.name ?? ""),
        ),
      );
    }
    if (action === "renameSubFamily") {
      return NextResponse.json(
        await renameLibrarySubFamily({
          orgId: auth.orgId,
          familyName: String(body.family ?? ""),
          fromSub: String(body.from ?? ""),
          toSub: String(body.to ?? ""),
        }),
      );
    }
    if (action === "moveSubFamily") {
      return NextResponse.json(
        await moveLibrarySubFamily({
          orgId: auth.orgId,
          fromFamily: String(body.fromFamily ?? ""),
          toFamily: String(body.toFamily ?? ""),
          subName: String(body.subName ?? ""),
        }),
      );
    }
    if (action === "reorder") {
      const names = Array.isArray(body.orderedNames)
        ? body.orderedNames.map(String)
        : [];
      return NextResponse.json(await reorderLibraryFamilies(auth.orgId, names));
    }
    if (action === "assign") {
      return NextResponse.json(
        await assignWorkItemsFamily({
          orgId: auth.orgId,
          ids: Array.isArray(body.ids) ? body.ids.map(String) : [],
          family: body.family != null ? String(body.family) : null,
          subFamily:
            body.subFamily !== undefined
              ? body.subFamily
                ? String(body.subFamily)
                : null
              : undefined,
        }),
      );
    }
    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
