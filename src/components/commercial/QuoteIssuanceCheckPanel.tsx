"use client";

import { useCallback, useEffect, useState } from "react";
import type { QuoteIssuanceValidation } from "@/lib/commercial/validate-quote-issuance";

export type QuoteFinalizeSummary = {
  amountHtLabel: string;
  lineCount: number;
  paymentScheduleLabel: string | null;
  isDemonstration: boolean;
};

export function QuoteIssuanceCheckPanel({
  quoteId,
  open,
  onClose,
  onEmit,
  onDownloadDraft,
  mode = "emit",
  finalizeSummary = null,
}: {
  quoteId: string;
  open: boolean;
  onClose: () => void;
  onEmit: () => void;
  onDownloadDraft: () => void;
  /** finalize = préparation → Prêt ; emit = émission / envoi (hors démo). */
  mode?: "finalize" | "emit";
  finalizeSummary?: QuoteFinalizeSummary | null;
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
  const isFinalize = mode === "finalize";
  const canConfirm = Boolean(validation?.canEmit) && !loading;

  const title = loading
    ? isFinalize
      ? "Vérification…"
      : "Vérification…"
    : errors.length > 0
      ? "Impossible de finaliser le devis"
      : isFinalize
        ? "Finaliser le devis"
        : validation?.canEmit
          ? "Devis prêt à envoyer"
          : "Informations à compléter";

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/30 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#1e3a5f]">{title}</h2>
            <p className="mt-1 text-xs text-slate-500">
              {isFinalize
                ? "Contrôles avant de marquer le devis Prêt — BeWork assiste, sans engagement contractuel automatique."
                : "Contrôles de conformité effectués — BeWork assiste, sans remplacer une validation juridique adaptée."}
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
            {isFinalize && errors.length === 0 && finalizeSummary ? (
              <dl className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Montant</dt>
                  <dd className="font-semibold tabular-nums text-slate-900">
                    {finalizeSummary.amountHtLabel} HT
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Nombre de postes</dt>
                  <dd className="font-semibold tabular-nums text-slate-900">
                    {finalizeSummary.lineCount}
                  </dd>
                </div>
                {finalizeSummary.paymentScheduleLabel ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Conditions de paiement</dt>
                    <dd className="text-right font-semibold text-slate-900">
                      {finalizeSummary.paymentScheduleLabel}
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : null}

            {isFinalize &&
            finalizeSummary?.isDemonstration &&
            errors.length === 0 ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
                Ce devis sera marqué <strong>Prêt</strong>.
                <br />
                Il s’agit d’un devis de démonstration non contractuel. Aucun
                envoi client, aucune acceptation, aucune facturation et aucun
                encaissement ne seront déclenchés.
              </p>
            ) : null}

            {errors.length === 0 && warnings.length === 0 && !isFinalize ? (
              <ul className="space-y-1 text-sm text-emerald-800">
                <li>✓ Entreprise</li>
                <li>✓ Client</li>
                <li>✓ Prestations</li>
                <li>✓ Totaux / TVA</li>
              </ul>
            ) : null}
            {errors.map((i) => (
              <button
                key={i.code}
                type="button"
                onClick={() => {
                  onClose();
                  const anchor =
                    i.code === "LINES"
                      ? "quote-lines"
                      : i.code === "CLIENT"
                        ? "quote-client"
                        : i.code === "ISSUER"
                          ? "quote-issuer"
                          : i.code === "PAYMENT"
                            ? "quote-payment"
                            : i.code === "SUBJECT"
                              ? "quote-subject"
                              : null;
                  if (anchor) {
                    document
                      .getElementById(anchor)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                className="block w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-left text-sm text-red-800 hover:bg-red-100"
              >
                ✕ {i.message}
              </button>
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
            Annuler
          </button>
          <button
            type="button"
            onClick={onDownloadDraft}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Prévisualiser PDF
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={onEmit}
            className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            {isFinalize ? "Finaliser le devis" : "Émettre"}
          </button>
        </div>
      </div>
    </div>
  );
}
