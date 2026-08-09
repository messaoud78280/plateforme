import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase";
import {
  MESSAGERIE_MEDIA_BUCKET,
  MESSAGERIE_MEDIA_MAX_BYTES,
  buildMessagerieStorageRef,
} from "@/lib/messagerie/media-storage";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/gif",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/msword",
  "text/csv",
  "text/plain",
  "application/octet-stream",
  "audio/webm",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
  "audio/aac",
  "audio/wav",
  "audio/x-m4a",
  "audio/mp3",
];

/** POST /api/messages/direct/upload — Upload PJ messagerie → bucket privé. */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const role = session.user.role;
  const allowed =
    role === "MANAGER" || role === "AGENT" || role === "AGENCE" || role === "CLIENT";
  if (!allowed) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Stockage non configuré. Ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local (Supabase → Settings → API → service_role)",
      },
      { status: 503 },
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

  if (file.size > MESSAGERIE_MEDIA_MAX_BYTES) {
    return NextResponse.json(
      {
        error:
          "Ce fichier dépasse 15 Mo. Compressez la photo ou raccourcissez le vocal, puis réessayez.",
      },
      { status: 400 },
    );
  }

  const mime = file.type || "application/octet-stream";
  const ext = file.name.split(".").pop()?.toLowerCase();
  const allowedExts = [
    "pdf",
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "docx",
    "xlsx",
    "xls",
    "csv",
    "txt",
    "doc",
    "webm",
    "ogg",
    "mp3",
    "m4a",
    "aac",
    "wav",
    "mp4",
  ];
  const mimeOk =
    ALLOWED_TYPES.includes(mime) || mime.startsWith("audio/") || mime.startsWith("image/");
  const extOk = ext && allowedExts.includes(ext);
  if (!mimeOk && !extOk) {
    return NextResponse.json(
      { error: "Type non accepté (photo, vocal, PDF, documents)." },
      { status: 400 },
    );
  }

  const durationRaw = formData.get("durationSec");
  const durationSec =
    typeof durationRaw === "string" && durationRaw !== ""
      ? Math.max(0, Math.round(Number(durationRaw)))
      : undefined;

  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storagePath = `v2c/${session.user.id}/${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(MESSAGERIE_MEDIA_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mime,
      upsert: false,
    });

  if (uploadError) {
    console.error("[messagerie upload]", uploadError.message);
    return NextResponse.json(
      { error: "Échec de l’envoi du fichier. Vérifiez la connexion et réessayez." },
      { status: 500 },
    );
  }

  const kind = mime.startsWith("audio/")
    ? "audio"
    : mime.startsWith("image/")
      ? "image"
      : "file";

  const fileUrl = buildMessagerieStorageRef(MESSAGERIE_MEDIA_BUCKET, storagePath);

  return NextResponse.json({
    name: file.name,
    fileUrl,
    fileSize: file.size,
    mimeType: mime,
    kind,
    bucket: MESSAGERIE_MEDIA_BUCKET,
    storagePath,
    ...(durationSec != null && Number.isFinite(durationSec) ? { durationSec } : {}),
  });
}
