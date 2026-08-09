import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase";
import { canAccessMessagerieMedia, type MessagerieMessageKind } from "@/lib/messagerie/media-acl";
import {
  MESSAGERIE_MEDIA_BUCKET,
  MESSAGERIE_SIGNED_URL_TTL_SEC,
  parseMessagerieStorageRef,
} from "@/lib/messagerie/media-storage";

/**
 * POST /api/messagerie/media
 * Signed URL après ACL conversation (ou owner path pour message optimistic temp-*).
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: {
    messageKind?: string;
    messageId?: string;
    fileUrl?: string;
    expiresIn?: number;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const messageKind = body.messageKind as MessagerieMessageKind;
  const messageId = String(body.messageId ?? "").trim();
  const fileUrl = String(body.fileUrl ?? "").trim();
  if (!messageKind || !messageId || !fileUrl) {
    return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
  }
  if (!["TASK", "DIRECT", "PROJECT"].includes(messageKind)) {
    return NextResponse.json({ error: "Type de message invalide." }, { status: 400 });
  }

  const expiresIn = Math.min(
    60 * 60,
    Math.max(60, Number(body.expiresIn ?? MESSAGERIE_SIGNED_URL_TTL_SEC)),
  );

  let bucket: string;
  let path: string;

  if (messageId.startsWith("temp-")) {
    const parsed = parseMessagerieStorageRef(fileUrl);
    if (!parsed || parsed.bucket !== MESSAGERIE_MEDIA_BUCKET) {
      return NextResponse.json({ error: "Référence média invalide." }, { status: 400 });
    }
    if (!parsed.path.startsWith(`v2c/${session.user.id}/`)) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }
    bucket = parsed.bucket;
    path = parsed.path;
  } else {
    const access = await canAccessMessagerieMedia(
      { id: session.user.id, role: session.user.role },
      { messageKind, messageId, fileUrl },
    );
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    bucket = access.bucket;
    path = access.path;
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Stockage indisponible." }, { status: 503 });
  }

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) {
    console.error("[messagerie/media] signedUrl:", error?.message);
    return NextResponse.json(
      { error: "Impossible de générer l’accès au fichier." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    expiresIn,
    signed: true,
  });
}

/** GET interdit — pas d’accès média sans corps ACL. */
export async function GET() {
  return NextResponse.json(
    { error: "Utilisez POST avec messageKind, messageId et fileUrl." },
    { status: 405 },
  );
}
