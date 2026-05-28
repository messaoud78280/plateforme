import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase";

function extractStoragePathFromUrl(url: string, bucket: string): string | null {
  try {
    const u = new URL(url);
    const s = u.toString();
    // formats typiques :
    // .../storage/v1/object/public/<bucket>/<path>
    // .../storage/v1/object/sign/<bucket>/<path>?token=...
    const idx = s.indexOf("/storage/v1/object/");
    if (idx === -1) return null;
    const tail = s.slice(idx);
    const m = tail.match(new RegExp(`/storage/v1/object/(public|sign)/${bucket}/(.+)$`));
    if (!m?.[2]) return null;
    const pathAndMaybeQuery = m[2];
    return decodeURIComponent(pathAndMaybeQuery.split("?")[0] ?? "");
  } catch {
    return null;
  }
}

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

  const bucket = String(body.bucket ?? "documents").trim() || "documents";
  const expiresIn = Math.min(60 * 60, Math.max(60, Number(body.expiresIn ?? 10 * 60))); // 1 min → 1h

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Stockage non configuré (service role)" }, { status: 503 });
  }

  const path = extractStoragePathFromUrl(url, bucket);
  if (!path) {
    // fallback : on ne peut pas signer, on renvoie l'URL telle quelle
    return NextResponse.json({ signedUrl: url, fallback: true });
  }

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) {
    return NextResponse.json({ signedUrl: url, fallback: true });
  }

  return NextResponse.json({ signedUrl: data.signedUrl, fallback: false });
}

