"use client";

import { useCallback, useEffect, useState } from "react";
import type { QuoteIssuanceValidation } from "@/lib/commercial/validate-quote-issuance";

export function QuoteIssuanceCheckPanel({
  quoteId,
  open,
  onClose,
  onEmit,
  onDownloadDraft,
}: {
  quoteId: string;
  open: boolean;
  onClose: () => void;
  onEmit: () => void;
  onDownloadDraft: () => void;
}) {
  const [validation, setValidation] = useState<QuoteIssuanceValidation | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/commercial/quotes/${quoteId}/issuance-check`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setValidation(data.validation);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  if (!open) return null;

  const errors = validation?.items.filter((i) => i.severity === "ERROR") ?? [];
  const warnings =
    validation?.items.filter((i) => i.severity === "WARNING") ?? [];
  const infos = validation?.items.filter((i) => i.severity === "INFO") ?? [];

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/30 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#1e3a5f]">
              {validation?.canEmit
                ? "Devis prêt à envoyer"
                : "Informations à compléter"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Contrôles de conformité effectués — BeWork assiste, sans remplacer
              une validation juridique adaptée.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-50"
          >
            Fermer
          </button>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-slate-500">Vérification…</p>
        ) : error ? (
          <p className="mt-6 text-sm text-red-700">{error}</p>
        ) : (
          <div className="mt-4 space-y-3">
            {errors.length === 0 && warnings.length === 0 ? (
              <ul className="space-y-1 text-sm text-emerald-800">
                <li>✓ Entreprise</li>
                <li>✓ Client</li>
                <li>✓ Prestations</li>
                <li>✓ Totaux / TVA</li>
              </ul>
            ) : null}
            {errors.map((i) => (
              <p
                key={i.code}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              >
                ✕ {i.message}
              </p>
            ))}
            {warnings.map((i) => (
              <p
                key={i.code}
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
              >
                ⚠ {i.message}
              </p>
            ))}
            {infos.map((i) => (
              <p key={i.code} className="text-xs text-slate-500">
                · {i.message}
              </p>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Corriger
          </button>
          <button
            type="button"
            onClick={onDownloadDraft}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Télécharger brouillon
          </button>
          <button
            type="button"
            disabled={!validation?.canEmit || loading}
            onClick={onEmit}
            className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            Émettre
          </button>
        </div>
      </div>
    </div>
  );
}
