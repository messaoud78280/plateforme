"use client";

import { useEffect, useMemo, useState } from "react";

type PreviewKind = "pdf" | "image" | "text" | "office" | "unknown" | "missing";

export type DocumentPreviewItem = {
  name: string;
  url: string | null;
  mimeType?: string | null;
  createdAtLabel?: string;
  statusLabel?: string;
};

function inferKind(item: DocumentPreviewItem): PreviewKind {
  if (!item.url) return "missing";
  const mime = (item.mimeType ?? "").toLowerCase();
  const lowerName = item.name.toLowerCase();

  if (mime.includes("pdf") || lowerName.endsWith(".pdf")) return "pdf";
  if (mime.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|svg|heic|heif)$/i.test(lowerName)) return "image";
  if (mime.startsWith("text/") || /\.(txt|csv)$/i.test(lowerName)) return "text";

  // Office / iWork : on affiche une fiche + téléchargement
  if (
    /(word|excel|powerpoint|officedocument|msword|vnd\.ms-excel|presentation)/.test(mime) ||
    /\.(docx?|xlsx?|pptx?|numbers|pages|key)$/i.test(lowerName)
  ) {
    return "office";
  }

  return "unknown";
}

async function getSignedUrl(url: string): Promise<string> {
  try {
    const res = await fetch("/api/files/signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, bucket: "documents", expiresIn: 10 * 60 }),
    });
    const data = await res.json();
    if (res.ok && data?.signedUrl) return String(data.signedUrl);
    return url;
  } catch {
    return url;
  }
}

export function DocumentPreviewModal({
  open,
  onClose,
  item,
}: {
  open: boolean;
  onClose: () => void;
  item: DocumentPreviewItem | null;
}) {
  const kind = useMemo(() => (item ? inferKind(item) : "unknown"), [item]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !item) return;
    setError("");
    setTextContent(null);
    setPreviewUrl(null);

    if (!item.url) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      const signed = await getSignedUrl(item.url ?? "");
      if (cancelled) return;
      setPreviewUrl(signed);

      if (kind === "text") {
        try {
          const resp = await fetch(signed);
          const t = await resp.text();
          if (!cancelled) setTextContent(t);
        } catch {
          if (!cancelled) setError("Impossible de charger l’aperçu texte.");
        }
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, item, kind]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6 sm:px-6" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Fermer l’aperçu"
      />

      <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {item.statusLabel ? `${item.statusLabel} · ` : ""}
              {item.createdAtLabel ?? ""}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e40af]"
              >
                Télécharger
              </a>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Fermer
            </button>
          </div>
        </div>

        <div className="max-h-[78vh] overflow-auto bg-slate-50/40 p-4 sm:p-5">
          {kind === "missing" ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-700">
              Fichier introuvable (pièce marquée à récupérer).
            </div>
          ) : loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-700">
              Chargement de l’aperçu…
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-800">
              {error}
            </div>
          ) : kind === "pdf" && previewUrl ? (
            <iframe
              src={`${previewUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
              className="h-[72vh] w-full rounded-xl border border-slate-200 bg-white"
              title={`Aperçu PDF — ${item.name}`}
            />
          ) : kind === "image" && previewUrl ? (
            <div className="rounded-xl border border-slate-200 bg-white p-2">
              <img
                src={previewUrl}
                alt={item.name}
                className="mx-auto max-h-[72vh] w-auto max-w-full rounded-lg object-contain"
                onError={() => setError("Impossible de charger l’aperçu image.")}
              />
            </div>
          ) : kind === "text" ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <pre className="whitespace-pre-wrap break-words text-sm text-slate-800">
                {textContent ?? "Aperçu indisponible."}
              </pre>
            </div>
          ) : kind === "office" ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-semibold text-slate-900">Aperçu limité pour ce format</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Word / Excel / PowerPoint / Pages / Numbers ne s’affichent pas toujours correctement dans le navigateur.
                Téléchargez le fichier pour l’ouvrir avec votre outil.
              </p>
              {previewUrl ? (
                <p className="mt-3 text-xs text-slate-500">
                  Type : {item.mimeType || "inconnu"}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-semibold text-slate-900">Aperçu indisponible pour ce format</p>
              <p className="mt-2 text-sm text-slate-600">Téléchargez le fichier pour le consulter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

