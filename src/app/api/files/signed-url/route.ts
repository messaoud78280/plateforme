import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase";
import { DOCUMENTS_BUCKET } from "@/lib/storage/supabase-object";
import { resolveDownloadUrl } from "@/lib/storage/signed-url";

/** POST — Génère une URL signée temporaire pour un fichier Storage (si possible). */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: { url?: string; bucket?: string; expiresIn?: number };
  try {
    body = (await request.json()) as { url?: string; bucket?: string; expiresIn?: number };
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const url = String(body.url ?? "").trim();
  if (!url) return NextResponse.json({ error: "URL requise" }, { status: 400 });

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
