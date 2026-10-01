"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DOCUMENT_IMPORT_STALE_CODE,
  DOCUMENT_IMPORT_STALE_MESSAGE,
} from "@/lib/site-documents/chatgpt-import-snapshot";

type Props = {
  projectId: string;
  docId: string;
  kind: "COMPTE_RENDU" | "NOTICE" | "PPSPS";
  open: boolean;
  mode: "prepare" | "import";
  onClose: () => void;
  onImported: () => void;
};

export function SiteDocChatGptModal({
  projectId,
  docId,
  kind,
  open,
  mode,
  onClose,
  onImported,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState<unknown>(null);
  const [importId, setImportId] = useState<string | null>(null);
  const [documentBaseVersion, setDocumentBaseVersion] = useState<number | null>(
    null,
  );

  const base = `/api/projets/${projectId}/site-documents/${docId}/chatgpt`;

  const loadPrompt = useCallback(async () => {
    setBusy(true);
    setError(null);
    setStale(false);
    try {
      const res = await fetch(`${base}/prepare`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Prompt indisponible");
      setPrompt(data.text);
      if (typeof data.documentBaseVersion === "number") {
        setDocumentBaseVersion(data.documentBaseVersion);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }, [base]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setStale(false);
    setPreview(null);
    setRaw("");
    setCopied(false);
    setImportId(null);
    setDocumentBaseVersion(null);
    if (mode === "prepare") void loadPrompt();
  }, [open, mode, loadPrompt]);

  if (!open) return null;

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  }

  async function analyze() {
    setBusy(true);
    setError(null);
    setStale(false);
    try {
      const res = await fetch(`${base}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw, commit: false }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error ||
            (data.errors?.[0]?.message ?? "Analyse impossible"),
        );
        return;
      }
      setPreview(data.payload);
      setImportId(data.importId);
      if (typeof data.documentBaseVersion === "number") {
        setDocumentBaseVersion(data.documentBaseVersion);
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (documentBaseVersion == null) {
      setError("Analysez de nouveau avant d’importer.");
      setStale(true);
      return;
    }
    setBusy(true);
    setError(null);
    setStale(false);
    try {
      const res = await fetch(`${base}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw,
          commit: true,
          documentBaseVersion,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const isStale = data.code === DOCUMENT_IMPORT_STALE_CODE;
        setStale(isStale);
        setError(
          isStale
            ? DOCUMENT_IMPORT_STALE_MESSAGE
            : data.error || "Import impossible",
        );
        if (isStale) {
          setPreview(null);
          setDocumentBaseVersion(null);
        }
        return;
      }
      onImported();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import impossible");
    } finally {
      setBusy(false);
    }
  }

  const title =
    mode === "prepare"
      ? kind === "PPSPS"
        ? "Générer / compléter le PPSPS avec ChatGPT"
        : kind === "NOTICE"
          ? "Générer / compléter la notice avec ChatGPT"
          : "Générer / compléter le compte rendu avec ChatGPT"
      : kind === "PPSPS"
        ? "Importer le PPSPS généré avec ChatGPT"
        : kind === "NOTICE"
          ? "Importer la notice générée avec ChatGPT"
          : "Importer le compte rendu généré avec ChatGPT";

  const help =
    kind === "PPSPS"
      ? "Utilisez ce mode pour compléter le contenu structuré du PPSPS : risques, EPI, organisation de chantier, coactivité."
      : "Utilisez ce mode pour compléter le contenu structuré : participants, travaux, observations, réserves, prochaines étapes et autres informations.";

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[min(92vh,820px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#1e3a5f]/10 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.22)]"
      >
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 className="text-[16px] font-semibold text-[#1e3a5f]">{title}</h2>
          <p className="mt-1 text-[13px] text-slate-500">{help}</p>
          <p className="mt-1 text-[12px] text-slate-400">
            Assistant ChatGPT externe — aucune API IA dans BeWork.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {error ? (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
              <p>{error}</p>
              {stale ? (
                <button
                  type="button"
                  disabled={busy || !raw.trim()}
                  onClick={() => void analyze()}
                  className="mt-2 text-[12px] font-semibold text-[#1e3a5f] underline-offset-2 hover:underline"
                >
                  Analyser de nouveau
                </button>
              ) : null}
            </div>
          ) : null}

          {mode === "prepare" ? (
            <div className="space-y-3">
              <textarea
                value={prompt}
                readOnly
                rows={16}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 font-mono text-[12px] text-slate-800"
              />
              <ol className="list-decimal space-y-1 pl-5 text-[13px] text-slate-600">
                <li>Copiez le prompt</li>
                <li>Envoyez-le à ChatGPT</li>
                <li>Copiez la réponse JSON</li>
                <li>Revenez ici et importez-la</li>
              </ol>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Collez ici le bloc JSON généré par ChatGPT
              </label>
              <textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                rows={12}
                placeholder={
                  kind === "PPSPS"
                    ? '{ "format": "bework_ppsps_v1", ... }'
                    : '{ "format": "bework_site_report_v1", ... }'
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 font-mono text-[12.5px] text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#1e3a5f]/30"
              />
              {preview ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-[13px] text-emerald-950">
                  <p className="font-semibold">Prévisualisation prête</p>
                  <p className="mt-0.5 text-[12px] font-medium text-emerald-900">
                    Aucune modification n’est encore enregistrée.
                  </p>
                  <p className="mt-0.5 text-[12px] text-emerald-800/90">
                    import_id : {importId}
                  </p>
                  <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-white/80 p-2 text-[11px] text-slate-700">
                    {JSON.stringify(preview, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-3.5">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-[13.5px] font-medium text-slate-500 hover:bg-white"
          >
            Fermer
          </button>
          {mode === "prepare" ? (
            <button
              type="button"
              disabled={busy || !prompt}
              onClick={() => void copyPrompt()}
              className="rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-60"
            >
              {copied ? "Copié ✓" : "Copier le prompt"}
            </button>
          ) : preview ? (
            <button
              type="button"
              disabled={busy || documentBaseVersion == null}
              onClick={() => void commit()}
              className="rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Import…" : "Importer le document"}
            </button>
          ) : (
            <button
              type="button"
              disabled={busy || !raw.trim()}
              onClick={() => void analyze()}
              className="rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Analyse…" : "Analyser"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
