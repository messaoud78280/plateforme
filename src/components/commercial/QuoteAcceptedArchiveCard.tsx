"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function fmtAcceptedAt(d: Date | string | null): string {
  if (!d) return "Date d’acceptation non enregistrée";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "Date d’acceptation non enregistrée";
  return date.toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortHash(sha: string): string {
  if (sha.length < 12) return sha;
  return `${sha.slice(0, 4)}…${sha.slice(-4)}`;
}

export function QuoteAcceptedArchiveCard({
  quoteId,
  versionNumber,
  acceptedAt,
  snapshot,
  historicalMissing,
  pdfArchiveError,
}: {
  quoteId: string;
  versionNumber: number | null;
  acceptedAt: Date | string | null;
  snapshot: {
    sha256: string;
    fileSize: number;
    generatedAt: Date | string;
    storageKey: string;
  } | null;
  historicalMissing: boolean;
  pdfArchiveError?: string | null;
}) {
  const router = useRouter();
  const [details, setDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [retryBusy, setRetryBusy] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  async function retryArchive() {
    setRetryBusy(true);
    setRetryError(null);
    try {
      const res = await fetch(`/api/commercial/quotes/${quoteId}/accepted-pdf`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Archivage impossible");
      router.refresh();
    } catch (e) {
      setRetryError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setRetryBusy(false);
    }
  }

  async function copySha() {
    if (!snapshot) return;
    try {
      await navigator.clipboard.writeText(snapshot.sha256);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
      <h2 className="text-sm font-bold text-slate-900">Version acceptée</h2>
      <p className="text-sm text-slate-700">
        Version {versionNumber ?? "—"}
        {acceptedAt ? ` · Acceptée le ${fmtAcceptedAt(acceptedAt)}` : ""}
      </p>

      {snapshot ? (
        <>
          <p className="text-sm text-slate-700">PDF figé à l’acceptation · Version acceptée archivée</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={`/api/commercial/quotes/${quoteId}/accepted-pdf`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white"
            >
              Ouvrir le PDF
            </a>
            <button
              type="button"
              onClick={() => setDetails((v) => !v)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
            >
              {details ? "Masquer les détails" : "Détails d’intégrité"}
            </button>
          </div>
          {details ? (
            <dl className="mt-2 grid gap-1 text-xs text-slate-600">
              <div>
                <dt className="text-slate-400">Fichier</dt>
                <dd className="break-all font-mono">{snapshot.storageKey.split("/").pop()}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Taille</dt>
                <dd>{(snapshot.fileSize / 1024).toFixed(1)} Ko</dd>
              </div>
              <div>
                <dt className="text-slate-400">Archivé le</dt>
                <dd>{fmtAcceptedAt(snapshot.generatedAt)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">SHA-256</dt>
                <dd className="flex flex-wrap items-center gap-2">
                  <span className="font-mono">{shortHash(snapshot.sha256)}</span>
                  <button
                    type="button"
                    onClick={() => void copySha()}
                    className="text-[#1d4ed8] font-semibold"
                  >
                    {copied ? "Copié" : "Copier"}
                  </button>
                </dd>
              </div>
              <p className="pt-1 text-[11px] text-slate-400">
                Contrôle d’intégrité du fichier archivé — pas une signature électronique.
              </p>
            </dl>
          ) : null}
        </>
      ) : historicalMissing ? (
        <div className="space-y-2">
          <p className="text-sm text-amber-900">
            Version acceptée enregistrée. Snapshot PDF historique non disponible — le fichier n’a
            pas été archivé le jour de l’acceptation.
          </p>
          <a
            href={`/api/commercial/quotes/${quoteId}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-[#1e3a5f]"
          >
            Aperçu PDF (régénéré, non archivé)
          </a>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-amber-900">
            Accepté — archivage PDF à finaliser
            {pdfArchiveError ? ` · ${pdfArchiveError}` : ""}
          </p>
          <button
            type="button"
            disabled={retryBusy}
            onClick={() => void retryArchive()}
            className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {retryBusy ? "Archivage…" : "Finaliser l’archivage PDF"}
          </button>
          {retryError ? <p className="text-xs text-red-700">{retryError}</p> : null}
        </div>
      )}
    </section>
  );
}
