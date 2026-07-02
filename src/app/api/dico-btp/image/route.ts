import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageBeWorkDico } from "@/lib/be-work-devis-access";
import { prisma } from "@/lib/prisma";
import { DOCUMENTS_BUCKET, extractStoragePathFromUrl } from "@/lib/storage/supabase-object";
import { createServiceRoleClient } from "@/lib/supabase";

// Image illustrative d'une fiche Dico BTP : téléversée directement depuis la fiche.
const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8 Mo

function isImageMime(mime: string | null | undefined): boolean {
  if (!mime) return false;
  return mime.toLowerCase().startsWith("image/");
}

async function requireManager() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  // Dépôt d'images = réservé aux gérants (les autres consultent uniquement).
  if (!canManageBeWorkDico(session.user.role)) {
    return { error: NextResponse.json({ error: "Réservé aux gérants." }, { status: 403 }) };
  }
  return { session };
}

/** POST — Téléverser (ou remplacer) l'image d'un terme. */
export async function POST(request: Request) {
  const auth = await requireManager();
  if (auth.error) return auth.error;

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Stockage non configuré (service role)" }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formulaire invalide" }, { status: 400 });
  }

  const termId = String(formData.get("termId") ?? "").trim();
  if (!termId) {
    return NextResponse.json({ error: "Terme requis." }, { status: 400 });
  }

  const term = await prisma.btpDictionaryTerm.findUnique({
    where: { id: termId },
    select: { id: true, imageUrl: true },
  });
  if (!term) {
    return NextResponse.json({ error: "Terme introuvable." }, { status: 404 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Image requise." }, { status: 400 });
  }
  if (!isImageMime(file.type)) {
    return NextResponse.json({ error: "Seules les images sont acceptées." }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "Image trop volumineuse (max 8 Mo)." }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `dico-btp/${termId}/${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(storagePath, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (uploadError) {
    console.error("Upload dico-btp image:", {
      message: uploadError.message,
      storagePath,
      mimeType: file.type,
      fileSize: file.size,
    });
    return NextResponse.json({ error: "Échec de l'envoi de l'image." }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(storagePath);
  const imageUrl = urlData.publicUrl;

  try {
    await prisma.btpDictionaryTerm.update({ where: { id: termId }, data: { imageUrl } });
  } catch (error) {
    console.error("DB dico-btp image:", error);
    // Nettoyage : on retire l'objet fraîchement téléversé pour éviter un orphelin.
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
    return NextResponse.json({ error: "Erreur d'enregistrement." }, { status: 500 });
  }

  // Suppression de l'ancienne image (best-effort) après mise à jour réussie.
  if (term.imageUrl) {
    const oldPath = extractStoragePathFromUrl(term.imageUrl, DOCUMENTS_BUCKET);
    if (oldPath && oldPath !== storagePath) {
      await supabase.storage.from(DOCUMENTS_BUCKET).remove([oldPath]);
    }
  }

  return NextResponse.json({ ok: true, imageUrl });
}
