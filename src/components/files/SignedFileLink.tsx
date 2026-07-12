"use client";

import { useState } from "react";
import { DOCUMENTS_BUCKET } from "@/lib/storage/supabase-object";

type Props = {
  url: string;
  children: React.ReactNode;
  className?: string;
  bucket?: string;
  title?: string;
};

/**
 * Lien fichier : demande une URL signée puis ouvre l’onglet.
 * Si la signature échoue, ouvre l’URL stockée (compatibilité).
 */
export function SignedFileLink({
  url,
  children,
  className,
  bucket = DOCUMENTS_BUCKET,
  title,
}: Props) {
  const [busy, setBusy] = useState(false);

  async function openSigned(e: React.MouseEvent) {
    e.preventDefault();
    if (!url || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/files/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, bucket, expiresIn: 15 * 60 }),
      });
      const data = (await res.json().catch(() => ({}))) as { signedUrl?: string };
      const target = data.signedUrl || url;
      window.open(target, "_blank", "noopener,noreferrer");
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  }

  return (
    <a href={url} onClick={(e) => void openSigned(e)} className={className} title={title} rel="noopener noreferrer">
      {busy ? "Ouverture…" : children}
    </a>
  );
}
