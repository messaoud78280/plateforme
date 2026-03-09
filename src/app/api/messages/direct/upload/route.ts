import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/gif",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
];

/** POST /api/messages/direct/upload — Upload d'une pièce jointe pour message direct */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const role = session.user.role;
  const isAgence = role === "AGENCE" || role === "MANAGER";
  const isAgent = role === "AGENT";
  if (!isAgence && !isAgent) {
    return NextResponse.json({ error: "Réservé aux gérants et agents" }, { status: 403 });
  }

  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Stockage non configuré" },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Données formulaire invalides" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File) || !file.size) {
    return NextResponse.json({ error: "Aucun fichier envoyé" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 10 MB)" }, { status: 400 });
  }

  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_TYPES.includes(mime)) {
    return NextResponse.json({ error: "Type de fichier non accepté (PDF, images, DOCX, XLSX, CSV, TXT)" }, { status: 400 });
  }

  const bucket = "documents";
  const storagePath = `dm/${session.user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, buffer, {
    contentType: mime,
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ error: `Erreur upload : ${uploadError.message}` }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  const fileUrl = urlData.publicUrl;

  return NextResponse.json({
    name: file.name,
    fileUrl,
    fileSize: file.size,
    mimeType: mime,
  });
}
