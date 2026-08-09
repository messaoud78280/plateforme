"use client";

import { useState } from "react";
import { DOCUMENTS_BUCKET } from "@/lib/storage/supabase-object";

type Props = {
  url: string;
  children: React.ReactNode;
  className?: string;
  bucket?: string;
  title?: string;
  /** Contexte ACL messagerie (optionnel). */
  messageKind?: "TASK" | "DIRECT" | "PROJECT";
  messageId?: string;
  /** Ressource GED explicite (préféré). */
  resourceKind?: "CHANTIER_FILE" | "PURCHASE_ORDER_DOCUMENT" | "LEGACY_DOCUMENT";
  resourceId?: string;
};

/**
 * Lien fichier : URL signée après ACL serveur.
 * Ne retombe plus sur l’URL publique stockée en cas d’échec.
 */
export function SignedFileLink({
  url,
  children,
  className,
  bucket = DOCUMENTS_BUCKET,
  title,
  messageKind,
  messageId,
  resourceKind,
  resourceId,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function openSigned(e: React.MouseEvent) {
    e.preventDefault();
    if (!url || busy) return;
    setBusy(true);
    setErr(null);
    try {
      if (resourceKind && resourceId) {
        const res = await fetch("/api/ged/access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: resourceKind, id: resourceId, expiresIn: 15 * 60 }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          signedUrl?: string;
          error?: string;
        };
        if (!res.ok || !data.signedUrl) {
          setErr(data.error || "Accès refusé");
          return;
        }
        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
        return;
      }

      const res = await fetch("/api/files/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          bucket,
          expiresIn: 15 * 60,
          messageKind,
          messageId,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        signedUrl?: string;
        error?: string;
      };
      if (!res.ok || !data.signedUrl) {
        setErr(data.error || "Accès refusé");
        return;
      }
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch {
      setErr("Ouverture impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <button
        type="button"
        onClick={(e) => void openSigned(e)}
        className={className}
        title={title ?? (err || undefined)}
        disabled={busy}
      >
        {busy ? "Ouverture…" : children}
      </button>
      {err ? <span className="text-[10px] font-medium text-red-600">{err}</span> : null}
    </span>
  );
}
