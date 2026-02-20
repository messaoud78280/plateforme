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
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Stockage non configuré" }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !file.size) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 400 });
    }

    const mimeType = file.type;
    if (!ALLOWED_TYPES.includes(mimeType) && !mimeType.startsWith("image/")) {
      return NextResponse.json({
        error: "Type non autorisé (PDF, images, Word, Excel, texte)",
      }, { status: 400 });
    }

    const path = `reports/${session.user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const buf = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(path, buf, { contentType: mimeType, upsert: false });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
    const fileUrl = urlData.publicUrl;

    return NextResponse.json({
      name: file.name,
      fileUrl,
      fileSize: file.size,
      mimeType,
    });
  } catch (error) {
    console.error("Erreur upload rapport:", error);
    return NextResponse.json({ error: "Erreur lors de l'upload." }, { status: 500 });
  }
}
