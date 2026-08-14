import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  getExternalOrgForSubcontract,
  quickCreateSubcontractorOrg,
  searchExternalOrgsForSubcontract,
} from "@/lib/commercial/subcontracts";

/** Recherche / création rapide d’entreprises externes (annuaire unique). */
export async function GET(req: Request) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (id) {
    const item = await getExternalOrgForSubcontract({ orgId: auth.orgId, id });
    if (!item) {
      return NextResponse.json({ error: "Entreprise introuvable" }, { status: 404 });
    }
    return NextResponse.json({ item });
  }
  const q = url.searchParams.get("q") ?? "";
  const items = await searchExternalOrgsForSubcontract({
    orgId: auth.orgId,
    query: q,
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body?.name) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }
  try {
    const item = await quickCreateSubcontractorOrg({
      orgId: auth.orgId,
      name: String(body.name),
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
