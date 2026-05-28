"use client";

import { useEffect, useMemo, useState } from "react";

type PreviewKind = "pdf" | "image" | "text" | "office" | "iwork" | "unknown" | "missing";

export type DocumentPreviewItem = {
  name: string;
  url: string | null;
  mimeType?: string | null;
  /** Si présent : aperçu via API BeWork (PDF/images/texte) — bucket privé OK */
  chantierFileId?: string | null;
  createdAtLabel?: string;
  statusLabel?: string;
};

function isAppleIWork(mime: string, lowerName: string): boolean {
  return (
    /iwork|vnd\.apple\.(pages|numbers|key)|x-iwork-/.test(mime) ||
    /\.(numbers|pages|key)$/i.test(lowerName)
  );
}

function canUseMicrosoftOfficeViewer(mime: string, lowerName: string): boolean {
  return (
    /(word|excel|powerpoint|officedocument|msword|vnd\.ms-excel|spreadsheet|presentation)/.test(mime) ||
    /\.(docx?|xlsx?|pptx?)$/i.test(lowerName)
  );
}

function inferKind(item: DocumentPreviewItem): PreviewKind {
  if (!item.url && !item.chantierFileId) return "missing";
  const mime = (item.mimeType ?? "").toLowerCase();
  const lowerName = item.name.toLowerCase();

  if (mime.includes("pdf") || lowerName.endsWith(".pdf")) return "pdf";
  if (mime.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|svg|heic|heif)$/i.test(lowerName)) return "image";
  if (mime.startsWith("text/") || /\.(txt|csv)$/i.test(lowerName)) return "text";

  if (isAppleIWork(mime, lowerName)) return "iwork";

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

function chantierPreviewUrl(fileId: string): string {
  return `/api/chantier/files/${fileId}/preview`;
}

function microsoftEmbedUrl(fileUrl: string): string {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
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
  const [officeEmbedUrl, setOfficeEmbedUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [showAsPdf, setShowAsPdf] = useState(false);

  const chantierDownloadUrl = item?.chantierFileId
    ? `${chantierPreviewUrl(item.chantierFileId)}?download=original`
    : null;

  useEffect(() => {
    if (!open || !item) return;
    setError("");
    setTextContent(null);
    setPreviewUrl(null);
    setOfficeEmbedUrl(null);
    setShowAsPdf(false);

    if (!item.url && !item.chantierFileId) return;

    let cancelled = false;
    (async () => {
      setLoading(true);

      const proxyUrl = item.chantierFileId ? chantierPreviewUrl(item.chantierFileId) : null;
      const mime = (item.mimeType ?? "").toLowerCase();
      const lowerName = item.name.toLowerCase();
      const tryConvert = kind === "office" || kind === "iwork";

      if (proxyUrl && (kind === "pdf" || kind === "image" || kind === "text" || tryConvert)) {
        if (tryConvert) {
          try {
            const resp = await fetch(proxyUrl);
            if (cancelled) return;
            if (resp.ok && resp.headers.get("content-type")?.includes("pdf")) {
              setPreviewUrl(proxyUrl);
              setShowAsPdf(true);
            } else {
              const data = (await resp.json().catch(() => ({}))) as { error?: string; hint?: string };
              setError(data.hint ?? data.error ?? "Impossible de générer l’aperçu PDF.");
            }
          } catch {
            if (!cancelled) setError("Erreur lors de la conversion en PDF.");
          }
        } else {
          if (!cancelled) setPreviewUrl(proxyUrl);
          if (kind === "pdf") setShowAsPdf(true);
          if (kind === "text") {
            try {
              const resp = await fetch(proxyUrl);
              if (!resp.ok) throw new Error("fetch");
              const t = await resp.text();
              if (!cancelled) setTextContent(t);
            } catch {
              if (!cancelled) setError("Impossible de charger l’aperçu texte.");
            }
          }
        }
      } else if (item.url) {
        const signed = await getSignedUrl(item.url);
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

        if (kind === "office" && canUseMicrosoftOfficeViewer(mime, lowerName)) {
          if (!cancelled) setOfficeEmbedUrl(microsoftEmbedUrl(signed));
        }
      }

      if (!cancelled) setLoading(false);
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

  const downloadHref = chantierDownloadUrl ?? previewUrl ?? item?.url ?? undefined;

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
            {downloadHref ? (
              <a
                href={downloadHref}
                target="_blank"
                rel="noopener noreferrer"
                download={item.name}
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
              {kind === "office" || kind === "iwork"
                ? "Conversion en PDF pour l’aperçu… (quelques secondes)"
                : "Chargement de l’aperçu…"}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-800">
              {error}
              {downloadHref ? (
                <p className="mt-3">
                  <a href={downloadHref} className="font-semibold text-[#1d4ed8] hover:underline" download>
                    Télécharger le fichier
                  </a>
                </p>
              ) : null}
            </div>
          ) : showAsPdf && previewUrl ? (
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
          ) : kind === "office" && officeEmbedUrl ? (
            <iframe
              src={officeEmbedUrl}
              className="h-[72vh] w-full rounded-xl border border-slate-200 bg-white"
              title={`Aperçu Office — ${item.name}`}
              onError={() => setError("L’aperçu en ligne n’a pas pu se charger.")}
            />
          ) : kind === "office" ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-semibold text-slate-900">Aperçu limité pour ce format</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Ce document ne peut pas être prévisualisé ici. Téléchargez-le ou exportez-le en PDF pour un aperçu dans
                BeWork.
              </p>
              {downloadHref ? (
                <a
                  href={downloadHref}
                  download={item.name}
                  className="mt-4 inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Télécharger
                </a>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-semibold text-slate-900">Aperçu indisponible pour ce format</p>
              <p className="mt-2 text-sm text-slate-600">Téléchargez le fichier ou déposez une version PDF.</p>
              {downloadHref ? (
                <a href={downloadHref} download className="mt-3 inline-block text-sm font-semibold text-[#1d4ed8] hover:underline">
                  Télécharger
                </a>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
