"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

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

async function getSignedUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch("/api/files/signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, bucket: "documents", expiresIn: 10 * 60 }),
    });
    const data = await res.json();
    if (res.ok && data?.signedUrl) return String(data.signedUrl);
    return null;
  } catch {
    return null;
  }
}

function chantierPreviewUrl(fileId: string): string {
  return `/api/chantier/files/${fileId}/preview`;
}

function microsoftEmbedUrl(fileUrl: string): string {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
}

type PdfFit = "width" | "page" | "custom";

export function DocumentPreviewModal({
  open,
  onClose,
  item,
  /** Par défaut maximisé (lecture plan / PDF confortable). */
  defaultMaximized = true,
}: {
  open: boolean;
  onClose: () => void;
  item: DocumentPreviewItem | null;
  defaultMaximized?: boolean;
}) {
  const kind = useMemo(() => (item ? inferKind(item) : "unknown"), [item]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [officeEmbedUrl, setOfficeEmbedUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [showAsPdf, setShowAsPdf] = useState(false);
  const [maximized, setMaximized] = useState(defaultMaximized);
  const [browserFs, setBrowserFs] = useState(false);
  const [pdfFit, setPdfFit] = useState<PdfFit>("width");
  const [zoomPct, setZoomPct] = useState(100);
  const shellRef = useRef<HTMLDivElement>(null);

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
    setMaximized(defaultMaximized);
    setPdfFit("width");
    setZoomPct(100);

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
          try {
            const resp = await fetch(proxyUrl, { method: "GET", credentials: "same-origin" });
            if (cancelled) return;
            const ct = (resp.headers.get("content-type") || "").toLowerCase();
            if (!resp.ok || ct.includes("application/json")) {
              setError("Impossible d’ouvrir ce document.");
            } else if (kind === "text") {
              const t = await resp.text();
              if (!cancelled) {
                setTextContent(t);
                setPreviewUrl(proxyUrl);
              }
            } else {
              if (!cancelled) {
                setPreviewUrl(proxyUrl);
                if (kind === "pdf") setShowAsPdf(true);
              }
            }
          } catch {
            if (!cancelled) setError("Impossible d’ouvrir ce document.");
          }
        }
      } else if (item.url) {
        const signed = await getSignedUrl(item.url);
        if (cancelled) return;
        if (!signed) {
          setError("Accès refusé ou aperçu indisponible.");
        } else {
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
      }

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, item, kind, defaultMaximized]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (document.fullscreenElement) {
          void document.exitFullscreen().catch(() => undefined);
          return;
        }
        onClose();
      }
      if ((showAsPdf || kind === "image") && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        setPdfFit("custom");
        setZoomPct((z) => Math.min(300, z + 15));
      }
      if ((showAsPdf || kind === "image") && e.key === "-") {
        e.preventDefault();
        setPdfFit("custom");
        setZoomPct((z) => Math.max(40, z - 15));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, showAsPdf, kind]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    const onFs = () => setBrowserFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const downloadHref = chantierDownloadUrl ?? previewUrl ?? item?.url ?? undefined;

  const pdfSrc = useMemo(() => {
    if (!previewUrl || !showAsPdf) return null;
    const base = previewUrl.split("#")[0]!;
    if (pdfFit === "width") {
      return `${base}#toolbar=1&navpanes=0&scrollbar=1&view=FitH&zoom=page-width`;
    }
    if (pdfFit === "page") {
      return `${base}#toolbar=1&navpanes=0&scrollbar=1&view=Fit&zoom=page-fit`;
    }
    return `${base}#toolbar=1&navpanes=0&scrollbar=1&zoom=${zoomPct}`;
  }, [previewUrl, showAsPdf, pdfFit, zoomPct]);

  async function toggleBrowserFullscreen() {
    const el = shellRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
        setMaximized(true);
      } else {
        await document.exitFullscreen();
      }
    } catch {
      setMaximized(true);
    }
  }

  if (!open || !item) return null;

  const showZoomBar = showAsPdf || kind === "image";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-1.5 sm:p-2 md:p-3"
      role="dialog"
      aria-modal="true"
      aria-label={`Aperçu — ${item.name}`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px]"
        onClick={onClose}
        aria-label="Fermer l’aperçu"
      />

      <div
        ref={shellRef}
        className={cn(
          "relative flex flex-col overflow-hidden border border-slate-200/80 bg-white shadow-2xl",
          maximized || browserFs
            ? "h-[min(96vh,100%)] w-[min(98vw,100%)] rounded-xl"
            : "h-[min(82vh,100%)] w-full max-w-5xl rounded-2xl",
          browserFs && "h-screen w-screen max-w-none rounded-none border-0",
        )}
      >
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2.5 sm:px-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 sm:text-[15px]">
              {item.name}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-slate-500 sm:text-xs">
              {item.statusLabel ? `${item.statusLabel} · ` : ""}
              {item.createdAtLabel ?? "Aperçu document"}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:gap-2">
            {showZoomBar ? (
              <div className="mr-1 flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                <button
                  type="button"
                  title="Adapter à la largeur"
                  onClick={() => {
                    setPdfFit("width");
                    setZoomPct(100);
                  }}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-[11px] font-semibold",
                    pdfFit === "width"
                      ? "bg-white text-[#1e3a5f] shadow-sm"
                      : "text-slate-600 hover:bg-white/80",
                  )}
                >
                  Largeur
                </button>
                <button
                  type="button"
                  title="Adapter à la page"
                  onClick={() => {
                    setPdfFit("page");
                    setZoomPct(100);
                  }}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-[11px] font-semibold",
                    pdfFit === "page"
                      ? "bg-white text-[#1e3a5f] shadow-sm"
                      : "text-slate-600 hover:bg-white/80",
                  )}
                >
                  Page
                </button>
                <button
                  type="button"
                  aria-label="Zoom arrière"
                  onClick={() => {
                    setPdfFit("custom");
                    setZoomPct((z) => Math.max(40, z - 15));
                  }}
                  className="rounded-md px-2 py-1.5 text-[13px] font-bold text-slate-700 hover:bg-white"
                >
                  −
                </button>
                <span className="min-w-[2.75rem] text-center text-[11px] font-semibold tabular-nums text-slate-700">
                  {pdfFit === "custom" ? `${zoomPct}%` : "auto"}
                </span>
                <button
                  type="button"
                  aria-label="Zoom avant"
                  onClick={() => {
                    setPdfFit("custom");
                    setZoomPct((z) => Math.min(300, z + 15));
                  }}
                  className="rounded-md px-2 py-1.5 text-[13px] font-bold text-slate-700 hover:bg-white"
                >
                  +
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setMaximized((v) => !v)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {maximized ? "Réduire" : "Agrandir"}
            </button>
            <button
              type="button"
              onClick={() => void toggleBrowserFullscreen()}
              className="hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:inline-flex"
            >
              {browserFs ? "Quitter plein écran" : "Plein écran"}
            </button>
            {downloadHref ? (
              <a
                href={downloadHref}
                target="_blank"
                rel="noopener noreferrer"
                download={item.name}
                className="rounded-lg bg-[#1e3a5f] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#16304f] sm:text-sm"
              >
                Télécharger
              </a>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:text-sm"
            >
              Fermer
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-slate-100/80 p-1.5 sm:p-2">
          {kind === "missing" ? (
            <div className="flex h-full min-h-[50vh] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-700">
              Fichier introuvable (pièce marquée à récupérer).
            </div>
          ) : loading ? (
            <div className="flex h-full min-h-[50vh] items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-700">
              {kind === "office" || kind === "iwork"
                ? "Conversion en PDF pour l’aperçu… (quelques secondes)"
                : "Chargement de l’aperçu…"}
            </div>
          ) : error ? (
            <div className="flex h-full min-h-[50vh] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-base font-semibold text-slate-900">
                Impossible d’ouvrir ce document
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Le fichier n’est pas disponible actuellement.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Fermer
                </button>
                {downloadHref ? (
                  <a
                    href={downloadHref}
                    download={item.name}
                    className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#16304f]"
                  >
                    Télécharger le document
                  </a>
                ) : null}
              </div>
            </div>
          ) : showAsPdf && pdfSrc ? (
            <iframe
              key={pdfSrc}
              src={pdfSrc}
              className="h-full min-h-[calc(96vh-5.5rem)] w-full rounded-lg border border-slate-200 bg-white"
              title={`Aperçu PDF — ${item.name}`}
            />
          ) : kind === "image" && previewUrl ? (
            <div className="flex h-full min-h-[calc(96vh-5.5rem)] items-start justify-center overflow-auto rounded-lg border border-slate-200 bg-slate-900/5 p-2">
              <img
                src={previewUrl}
                alt={item.name}
                style={{
                  width: pdfFit === "custom" ? `${zoomPct}%` : "100%",
                  maxWidth: pdfFit === "page" ? "100%" : undefined,
                  height: "auto",
                }}
                className="rounded-md object-contain"
                onError={() => setError("Impossible de charger l’aperçu image.")}
              />
            </div>
          ) : kind === "text" ? (
            <div className="h-full min-h-[50vh] overflow-auto rounded-xl border border-slate-200 bg-white p-4">
              <pre className="whitespace-pre-wrap break-words text-sm text-slate-800">
                {textContent ?? "Aperçu indisponible."}
              </pre>
            </div>
          ) : kind === "office" && officeEmbedUrl ? (
            <iframe
              src={officeEmbedUrl}
              className="h-full min-h-[calc(96vh-5.5rem)] w-full rounded-lg border border-slate-200 bg-white"
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
