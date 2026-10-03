"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import type { BundleImportPreview } from "@/lib/commercial/chatgpt-bundle/commit";
import type { QuoteCreateQuantityDrift } from "@/lib/bework-context/adapt-quote-create";

type PriceSummary = {
  withPrice: number;
  zeroPrice: number;
  aiProposal: number;
  linkedToMetre: number;
};

/**
 * CREATE devis — BeWork ↔ ChatGPT ↔ BeWork.
 * Preview obligatoire avant « Créer le devis ».
 */
export function QuoteCreateFromChatgptModal({
  projectId,
  studyId,
  onClose,
  onCreated,
}: {
  projectId: string;
  studyId?: string | null;
  onClose: () => void;
  onCreated?: (quoteId: string) => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"context" | "json" | "preview">("context");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sourcesFingerprint, setSourcesFingerprint] = useState<string | null>(null);
  const [resolvedStudyId, setResolvedStudyId] = useState<string | null>(studyId ?? null);
  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState<BundleImportPreview | null>(null);
  const [priceSummary, setPriceSummary] = useState<PriceSummary | null>(null);
  const [drifts, setDrifts] = useState<QuoteCreateQuantityDrift[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [acceptQuantityDrifts, setAcceptQuantityDrifts] = useState(false);
  const [allowDuplicate, setAllowDuplicate] = useState(false);

  const copyContext = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projets/${projectId}/quote-create/context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studyId: studyId ?? null }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (data?.code === "QUOTE_ALREADY_EXISTS") {
          throw new Error(
            "Un devis existe déjà — utilisez « Modifier avec ChatGPT » depuis le devis.",
          );
        }
        if (data?.code === "STUDY_REQUIRED") {
          throw new Error("Préparez d’abord le métré avant le devis.");
        }
        throw new Error(data?.error ?? "Contexte indisponible");
      }
      await navigator.clipboard.writeText(data.text);
      setSourcesFingerprint(data.sourcesFingerprint ?? null);
      setResolvedStudyId(data.studyId ?? studyId ?? null);
      setToast("Contexte CREATE devis copié — discutez prix et choix, puis collez le JSON");
      window.setTimeout(() => setToast(null), 4000);
      setStep("json");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Copie impossible");
    } finally {
      setBusy(false);
    }
  }, [projectId, studyId]);

  useEffect(() => {
    void copyContext();
  }, [copyContext]);

  async function runPreview() {
    setBusy(true);
    setError(null);
    setPreview(null);
    setPriceSummary(null);
    setDrifts([]);
    try {
      if (!sourcesFingerprint) {
        await copyContext();
      }
      const res = await fetch(`/api/projets/${projectId}/quote-create/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw,
          sourcesFingerprint,
          studyId: resolvedStudyId,
        }),
      });
      const data = await res.json().catch(() => null);
      if (data?.code === "PREVIEW_STALE") {
        setSourcesFingerprint(data.sourcesFingerprint ?? null);
        throw new Error(data.error);
      }
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? "Prévisualisation impossible");
      }
      setPreview(data.preview as BundleImportPreview);
      setPriceSummary(data.priceSummary as PriceSummary);
      setDrifts((data.quantityDrifts as QuoteCreateQuantityDrift[]) ?? []);
      setWarnings((data.warnings as string[]) ?? []);
      setSourcesFingerprint(data.sourcesFingerprint ?? sourcesFingerprint);
      setResolvedStudyId(data.studyId ?? resolvedStudyId);
      setStep("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (!preview || !sourcesFingerprint) return;
    if (drifts.length && !acceptQuantityDrifts) {
      setError("Des quantités s’écartent du métré — cochez pour confirmer explicitement.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projets/${projectId}/quote-create/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw,
          sourcesFingerprint,
          studyId: resolvedStudyId,
          acceptQuantityDrifts,
          allowDuplicate,
        }),
      });
      const data = await res.json().catch(() => null);
      if (data?.code === "PREVIEW_STALE") {
        setSourcesFingerprint(data.sourcesFingerprint ?? null);
        setStep("json");
        throw new Error(data.error);
      }
      if (data?.code === "QUANTITY_DRIFT") {
        setDrifts((data.quantityDrifts as QuoteCreateQuantityDrift[]) ?? []);
        throw new Error(data.error);
      }
      if (!res.ok || !data?.ok) {
        if (data?.action === "idempotent" || data?.code === "QUOTE_ALREADY_EXISTS") {
          setAllowDuplicate(true);
        }
        throw new Error(data?.error ?? "Création impossible");
      }
      const quoteId = data.quoteId as string;
      onCreated?.(quoteId);
      onClose();
      router.push(data.href ?? `/dashboard/devis-facturation/devis/${quoteId}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 sm:items-center">
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        role="dialog"
        aria-labelledby="quote-create-title"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Devis · CREATE
            </p>
            <h2
              id="quote-create-title"
              className="text-[1.05rem] font-semibold text-[#1e3a5f]"
            >
              Préparer le devis avec ChatGPT
            </h2>
            <p className="mt-0.5 text-[12.5px] text-slate-600">
              ChatGPT propose · BeWork contrôle · vous validez. Quantités issues du métré.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] text-slate-600"
          >
            Fermer
          </button>
        </header>

        <div className="flex gap-2 border-b border-slate-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          <span className={step !== "context" ? "text-[#1e3a5f]" : ""}>1. Contexte</span>
          <span>·</span>
          <span className={step === "json" || step === "preview" ? "text-[#1e3a5f]" : ""}>
            2. JSON
          </span>
          <span>·</span>
          <span className={step === "preview" ? "text-[#1e3a5f]" : ""}>3. Preview</span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {toast ? (
            <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-900">
              {toast}
            </p>
          ) : null}
          {error ? (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
              {error}
            </p>
          ) : null}

          {step !== "preview" ? (
            <div className="space-y-3">
              <p className="text-[13px] text-slate-600">
                Discutez prestations, prix, marge, TVA et exclusions dans ChatGPT. Collez ensuite
                uniquement le JSON <code className="text-[12px]">bework_quote_bundle_v1</code>.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void copyContext()}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12.5px] font-semibold text-[#1e3a5f]"
                >
                  {busy && step === "context" ? "Copie…" : "Recopier le contexte"}
                </button>
              </div>
              <textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                rows={12}
                placeholder='{ "format": "bework_quote_bundle_v1", ... }'
                className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-[12px] text-slate-800"
              />
            </div>
          ) : preview ? (
            <div className="space-y-3">
              {priceSummary ? (
                <div className="grid grid-cols-2 gap-2 text-[12.5px] sm:grid-cols-4">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Lignes</p>
                    <p className="font-semibold text-slate-800">{preview.lineCount}</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                    <p className="text-[10px] font-bold uppercase text-slate-400">PU renseignés</p>
                    <p className="font-semibold text-slate-800">{priceSummary.withPrice}</p>
                  </div>
                  <div className="rounded-lg border border-amber-100 bg-amber-50/80 px-2.5 py-2">
                    <p className="text-[10px] font-bold uppercase text-amber-700">À confirmer</p>
                    <p className="font-semibold text-amber-900">{priceSummary.zeroPrice}</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Total HT</p>
                    <p className="font-semibold text-slate-800">
                      {preview.totalHt.toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </p>
                  </div>
                </div>
              ) : null}

              {warnings.length ? (
                <ul className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-900">
                  {warnings.map((w) => (
                    <li key={w}>⚠ {w}</li>
                  ))}
                </ul>
              ) : null}

              {drifts.length ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-900">
                  <p className="font-semibold">Écarts de quantité métré → devis</p>
                  <ul className="mt-1 space-y-1">
                    {drifts.map((d) => (
                      <li key={d.sourcePrepLineCode}>
                        {d.designation} ({d.sourcePrepLineCode}) : métré{" "}
                        {d.metreQuantity.toLocaleString("fr-FR")} → devis{" "}
                        {d.quoteQuantity.toLocaleString("fr-FR")}
                      </li>
                    ))}
                  </ul>
                  <label className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={acceptQuantityDrifts}
                      onChange={(e) => setAcceptQuantityDrifts(e.target.checked)}
                    />
                    J’accepte explicitement ces écarts de quantité
                  </label>
                </div>
              ) : null}

              {preview.alreadyImported ? (
                <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[12.5px]">
                  <input
                    type="checkbox"
                    checked={allowDuplicate}
                    onChange={(e) => setAllowDuplicate(e.target.checked)}
                  />
                  Ce JSON a déjà créé un devis. Forcer une copie distincte
                </label>
              ) : null}

              <div className="space-y-2">
                {preview.sections.map((sec) => (
                  <div key={sec.title} className="rounded-xl border border-slate-100">
                    <p className="border-b border-slate-100 bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-[#1e3a5f]">
                      {sec.title}
                    </p>
                    <ul className="divide-y divide-slate-50 px-3">
                      {sec.lines.map((line, i) => (
                        <li
                          key={`${sec.title}-${i}`}
                          className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-[12.5px]"
                        >
                          <span className="min-w-0 flex-1 font-medium text-slate-800">
                            {line.designation}
                            {line.unitPriceHt <= 0 ? (
                              <span className="ml-2 text-[11px] font-semibold text-amber-700">
                                PU à confirmer
                              </span>
                            ) : (
                              <span className="ml-2 text-[11px] text-slate-500">
                                Proposition / prix saisi
                              </span>
                            )}
                          </span>
                          <span className="tabular-nums text-slate-600">
                            {line.quantity.toLocaleString("fr-FR")} {line.unit} ×{" "}
                            {line.unitPriceHt.toLocaleString("fr-FR", {
                              style: "currency",
                              currency: "EUR",
                            })}{" "}
                            ={" "}
                            {line.lineHt.toLocaleString("fr-FR", {
                              style: "currency",
                              currency: "EUR",
                            })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 px-4 py-3">
          {step === "preview" ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => setStep("json")}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12.5px] text-slate-700"
              >
                Retour
              </button>
              <button
                type="button"
                disabled={
                  busy ||
                  (Boolean(preview?.alreadyImported) && !allowDuplicate) ||
                  (drifts.length > 0 && !acceptQuantityDrifts)
                }
                onClick={() => void commit()}
                className={cn(
                  "rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-[12.5px] font-semibold text-white",
                  "disabled:opacity-50",
                )}
              >
                {busy ? "Création…" : "Créer le devis"}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={busy || !raw.trim()}
              onClick={() => void runPreview()}
              className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Analyse…" : "Prévisualiser"}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
