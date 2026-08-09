import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase";
import { DOCUMENTS_BUCKET } from "@/lib/storage/supabase-object";
import { resolveDownloadUrl } from "@/lib/storage/signed-url";
import {
  isMessagerieMediaPath,
  parseMessagerieStorageRef,
} from "@/lib/messagerie/media-storage";
import { canAccessMessagerieMedia, type MessagerieMessageKind } from "@/lib/messagerie/media-acl";

/**
 * POST — URL signée temporaire.
 * Médias messagerie (bucket messagerie / dm/) : ACL conversation obligatoire.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: {
    url?: string;
    bucket?: string;
    expiresIn?: number;
    messageKind?: string;
    messageId?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const url = String(body.url ?? "").trim();
  if (!url) return NextResponse.json({ error: "URL requise" }, { status: 400 });

  const parsed = parseMessagerieStorageRef(url);
  if (parsed && isMessagerieMediaPath(parsed.bucket, parsed.path)) {
    const messageKind = body.messageKind as MessagerieMessageKind | undefined;
    const messageId = String(body.messageId ?? "").trim();
    if (!messageKind || !messageId || !["TASK", "DIRECT", "PROJECT"].includes(messageKind)) {
      return NextResponse.json(
        {
          error:
            "Ce fichier messagerie nécessite messageKind et messageId (ACL conversation).",
        },
        { status: 403 },
      );
    }
    const access = await canAccessMessagerieMedia(
      { id: session.user.id, role: session.user.role },
      { messageKind, messageId, fileUrl: url },
    );
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: "Stockage indisponible" }, { status: 503 });
    }
    const expiresIn = Math.min(60 * 60, Math.max(60, Number(body.expiresIn ?? 15 * 60)));
    const { data, error } = await supabase.storage
      .from(access.bucket)
      .createSignedUrl(access.path, expiresIn);
    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: "Signature impossible" }, { status: 500 });
    }
    return NextResponse.json({
      signedUrl: data.signedUrl,
      fallback: false,
      signed: true,
    });
  }

  const bucket = String(body.bucket ?? DOCUMENTS_BUCKET).trim() || DOCUMENTS_BUCKET;
  const expiresIn = Math.min(60 * 60, Math.max(60, Number(body.expiresIn ?? 10 * 60)));

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ signedUrl: url, fallback: true, signed: false });
  }

  const resolved = await resolveDownloadUrl(supabase, url, { bucket, expiresIn });
  return NextResponse.json({
    signedUrl: resolved.url,
    fallback: resolved.fallback,
    signed: resolved.signed,
  });
}
