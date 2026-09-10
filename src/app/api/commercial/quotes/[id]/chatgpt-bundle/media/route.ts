import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase";
import { DOCUMENTS_BUCKET } from "@/lib/storage/supabase-object";
import { upsertMediaStorageKeyInInternalNotes } from "@/lib/commercial/quote-project-presentation";

type Ctx = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

const MAX_BYTES = 12 * 1024 * 1024;

/** POST multipart — associe un visuel au devis (stockage documents existant). */
export async function POST(req: Request, ctx: Ctx) {
  const auth = await requireCommercialApiSession({
    requiredHref: "/dashboard/devis-facturation",
    requireWrite: true,
  });
  if (auth.error || !auth.session || !auth.orgId) {
    return NextResponse.json(
      { error: auth.error ?? "Non autorisé" },
      { status: auth.status },
    );
  }

  const { id: quoteId } = await ctx.params;
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: quoteId, organizationId: auth.orgId },
    select: { id: true, internalNotes: true },
  });
  if (!quote) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formulaire invalide" }, { status: 400 });
  }

  const key = String(form.get("key") ?? "").trim();
  const file = form.get("file");
  if (!key || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Clé média et fichier requis" },
      { status: 400 },
    );
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image trop volumineuse (max 12 Mo)." },
      { status: 400 },
    );
  }

  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().slice(0, 8);
  const path = `commercial/${auth.orgId}/quotes/${quoteId}/chatgpt-media/${safeKey}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: "Stockage indisponible" }, { status: 503 });
    }
    const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const nextNotes = upsertMediaStorageKeyInInternalNotes(
      quote.internalNotes,
      safeKey,
      path,
      file.name,
    );
    await prisma.commercialQuote.update({
      where: { id: quoteId },
      data: { internalNotes: nextNotes },
    });

    return NextResponse.json({
      ok: true,
      key: safeKey,
      storageKey: path,
      fileName: file.name,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload échoué" },
      { status: 500 },
    );
  }
}
