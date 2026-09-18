"use client";

import { useCallback, useEffect, useState } from "react";
import { roundMoney } from "@/lib/commercial/money";
import type { QuotePatchPreview } from "@/lib/commercial/chatgpt-patch/preview";

function fmtMoney(n: number) {
  return roundMoney(n, 2).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type Props = {
  quoteId: string;
  quoteNumber: string;
  open: boolean;
  onClose: () => void;
  onApplied: (info: { canUndo: boolean }) => void;
};

type Step = "paste" | "preview";

export function ChatGptPatchImportModal({
  quoteId,
  quoteNumber,
  open,
  onClose,
  onApplied,
}: Props) {
  const [step, setStep] = useState<Step>("paste");
  const [rawText, setRawText] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [parseErrors, setParseErrors] = useState<Array<{ path: string; message: string }>>([]);
  const [preview, setPreview] = useState<QuotePatchPreview | null>(null);
  const [forceVersion, setForceVersion] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  const reset = useCallback(() => {
    setStep("paste");
    setErrorBanner(null);
    setParseErrors([]);
    setPreview(null);
    setForceVersion(false);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  if (!open) return null;

  async function analyze() {
    setBusy(true);
    setErrorBanner(null);
    setParseErrors([]);
    try {
      const res = await fetch(`/api/commercial/quotes/${quoteId}/chatgpt-patch/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: rawText }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setParseErrors(data?.errors ?? []);
        setErrorBanner(data?.error ?? "Analyse impossible");
        return;
      }
      setPreview(data.preview as QuotePatchPreview);
      setStep("preview");
    } catch {
      setErrorBanner("Erreur réseau lors de l’analyse.");
    } finally {
      setBusy(false);
    }
  }

  async function apply() {
    if (!preview?.ok && !preview?.versionMismatch) return;
    setBusy(true);
    setErrorBanner(null);
    try {
      const res = await fetch(`/api/commercial/quotes/${quoteId}/chatgpt-patch/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw: rawText,
          forceVersionMismatch: forceVersion || Boolean(preview?.versionMismatch),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (data?.code === "VERSION_MISMATCH") {
          setErrorBanner(data.error);
          setForceVersion(true);
          return;
        }
        setErrorBanner(data?.error ?? "Application impossible");
        return;
      }
      onApplied({ canUndo: true });
      onClose();
    } catch {
      setErrorBanner("Erreur réseau lors de l’application.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="chatgpt-patch-title"
        className="flex max-h-[min(92vh,820px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-bework-navy/10 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.22)]"
      >
        <div className="border-b border-bework-navy/8 px-5 py-4 sm:px-6">
          <h2 id="chatgpt-patch-title" className="text-[16px] font-semibold text-bework-navy">
            Modifier ce devis depuis ChatGPT
          </h2>
          <p className="mt-1 text-[13px] text-bework-muted">
            Devis <span className="font-semibold text-bework-ink">{quoteNumber}</span> — collez
            un bloc <code className="text-[12px]">bework_quote_patch_v1</code>. Les changements
            seront vérifiés avant d’être appliqués.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {errorBanner ? (
            <p role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
              {errorBanner}
            </p>
          ) : null}

          {step === "paste" ? (
            <div className="space-y-3">
              <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Coller le JSON ici
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={14}
                placeholder='{ "type": "bework_quote_patch_v1", ... }'
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 font-mono text-[12.5px] text-slate-800 outline-none ring-bework-navy/30 focus:bg-white focus:ring-2"
              />
              {parseErrors.length > 0 ? (
                <ul className="space-y-1 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-[12.5px] text-amber-950">
                  {parseErrors.map((e, i) => (
                    <li key={`${e.path}-${i}`}>
                      {e.path ? <strong>{e.path}</strong> : null}
                      {e.path ? " — " : null}
                      {e.message}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : preview ? (
            <div className="space-y-4">
              {preview.warnings.map((w) => (
                <p
                  key={w}
                  className="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-[13px] text-amber-950"
                >
                  {w}
                </p>
              ))}
              {!preview.ok && preview.errors.length > 0 ? (
                <ul className="space-y-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
                  {preview.errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              ) : null}

              <div>
                <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-400">
                  Modifications proposées
                </h3>
                <ul className="mt-2 space-y-2">
                  {preview.operations.map((op, idx) => (
                    <li
                      key={idx}
                      className={
                        op.kind === "add"
                          ? "rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2.5"
                          : op.kind === "delete"
                            ? "rounded-xl border border-red-200 bg-red-50/70 px-3 py-2.5"
                            : op.kind === "update"
                              ? "rounded-xl border border-indigo-200 bg-indigo-50/60 px-3 py-2.5"
                              : op.kind === "error"
                                ? "rounded-xl border border-red-300 bg-red-50 px-3 py-2.5"
                                : "rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                      }
                    >
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        {op.kind === "add"
                          ? "+ Ajout"
                          : op.kind === "delete"
                            ? "− Suppression"
                            : op.kind === "update"
                              ? "~ Modification"
                              : op.kind === "error"
                                ? "Erreur"
                                : "Méta"}
                      </p>
                      <p className="mt-0.5 text-[13.5px] font-semibold text-bework-ink">
                        {op.label}
                      </p>
                      <p className="text-[12.5px] text-bework-muted">{op.detail}</p>
                      {op.kind === "update" || op.kind === "meta" ? (
                        <ul className="mt-2 space-y-1.5">
                          {op.fields.map((f) => (
                            <li key={f.field} className="text-[12.5px]">
                              <span className="font-medium text-slate-600">{f.label} :</span>{" "}
                              <span className="text-slate-500 line-through">
                                {f.before == null || f.before === ""
                                  ? "—"
                                  : String(f.before)}
                              </span>
                              {" → "}
                              <span className="font-semibold text-bework-navy">
                                {f.after == null || f.after === ""
                                  ? "—"
                                  : String(f.after)}
                              </span>
                              {f.impactHt != null ? (
                                <span className="ml-1 text-indigo-700">
                                  ({f.impactHt >= 0 ? "+" : ""}
                                  {fmtMoney(f.impactHt)} € HT)
                                </span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {op.kind === "add" && op.amountHt > 0 ? (
                        <p className="mt-1 text-[12.5px] font-semibold text-emerald-800">
                          +{fmtMoney(op.amountHt)} € HT
                        </p>
                      ) : null}
                      {op.kind === "delete" ? (
                        <p className="mt-1 text-[12.5px] font-semibold text-red-700">
                          −{fmtMoney(op.amountHt)} € HT
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-xl border border-bework-navy/10 bg-bework-soft-navy/40 p-3 text-center">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500">Ancien total</p>
                  <p className="text-[14px] font-semibold tabular-nums">
                    {fmtMoney(preview.totals.beforeHt)} € HT
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500">Nouveau total</p>
                  <p className="text-[14px] font-semibold tabular-nums text-bework-navy">
                    {fmtMoney(preview.totals.afterHt)} € HT
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500">Écart</p>
                  <p
                    className={`text-[14px] font-semibold tabular-nums ${
                      preview.totals.deltaHt >= 0 ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {preview.totals.deltaHt >= 0 ? "+" : ""}
                    {fmtMoney(preview.totals.deltaHt)} € HT
                  </p>
                </div>
              </div>

              {preview.versionMismatch ? (
                <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-[13px] text-amber-950">
                  <input
                    type="checkbox"
                    checked={forceVersion}
                    onChange={(e) => setForceVersion(e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    Je confirme avoir vérifié les changements malgré l’écart de version.
                  </span>
                </label>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-bework-navy/8 bg-slate-50/80 px-5 py-3.5 sm:px-6">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-[13.5px] font-medium text-bework-muted hover:bg-white hover:text-bework-ink disabled:opacity-60"
          >
            Annuler
          </button>
          {step === "preview" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => setStep("paste")}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13.5px] font-semibold text-bework-navy disabled:opacity-60"
            >
              ← Modifier le JSON
            </button>
          ) : null}
          {step === "paste" ? (
            <button
              type="button"
              disabled={busy || !rawText.trim()}
              onClick={() => void analyze()}
              className="rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Analyse…" : "Analyser les modifications"}
            </button>
          ) : (
            <button
              type="button"
              disabled={
                busy ||
                !preview ||
                (!preview.ok && !preview.versionMismatch) ||
                (preview.versionMismatch && !forceVersion)
              }
              onClick={() => void apply()}
              className="rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Application…" : "Appliquer les modifications"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
