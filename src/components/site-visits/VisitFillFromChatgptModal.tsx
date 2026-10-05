"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import type { SurveyApplyPreview } from "@/lib/site-visits/survey-apply";

/**
 * CREATE / remplissage visite — BeWork ↔ ChatGPT ↔ BeWork.
 * Preview obligatoire avant application.
 */
export function VisitFillFromChatgptModal({
  visitId,
  onClose,
}: {
  visitId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"context" | "json" | "preview">("context");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sourcesFingerprint, setSourcesFingerprint] = useState<string | null>(null);
  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState<SurveyApplyPreview | null>(null);
  const [confirmProtected, setConfirmProtected] = useState(false);

  const copyContext = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/site-visits/${visitId}/chatgpt-fill/context`, {
        method: "POST",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Contexte indisponible");
      await navigator.clipboard.writeText(data.text);
      setSourcesFingerprint(data.sourcesFingerprint ?? null);
      setToast("Contexte VISIT CREATE copié — discutez avec ChatGPT, puis collez le JSON");
      window.setTimeout(() => setToast(null), 4000);
      setStep("json");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Copie impossible");
    } finally {
      setBusy(false);
    }
  }, [visitId]);

  useEffect(() => {
    void copyContext();
  }, [copyContext]);

  async function runPreview() {
    setBusy(true);
    setError(null);
    setPreview(null);
    try {
      if (!sourcesFingerprint) await copyContext();
      const res = await fetch(`/api/site-visits/${visitId}/chatgpt-fill/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw,
          sourcesFingerprint,
          confirmProtected,
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
      setPreview(data.preview as SurveyApplyPreview);
      setSourcesFingerprint(data.sourcesFingerprint ?? sourcesFingerprint);
      setStep("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (!preview || !sourcesFingerprint) return;
    if (preview.protectedConflicts.length > 0 && !confirmProtected) {
      setError(
        "Des données protégées seraient modifiées. Cochez la confirmation explicite.",
      );
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/site-visits/${visitId}/chatgpt-fill/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw,
          sourcesFingerprint,
          confirmProtected,
        }),
      });
      const data = await res.json().catch(() => null);
      if (data?.code === "PREVIEW_STALE") {
        setSourcesFingerprint(data.sourcesFingerprint ?? null);
        setStep("json");
        throw new Error(data.error);
      }
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? "Application impossible");
      }
      onClose();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-[1.05rem] font-semibold text-[#1e3a5f]">
            ✨ Préparer / remplir avec ChatGPT
          </h2>
          <p className="mt-1 text-[13px] text-slate-500">
            Contexte → discussion → JSON{" "}
            <code className="text-[12px]">bework_site_survey_v1</code> → preview →
            validation
          </p>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <div className="flex gap-2 text-[12px] font-medium">
            {(["context", "json", "preview"] as const).map((s) => (
              <span
                key={s}
                className={cn(
                  "rounded-full px-2.5 py-1",
                  step === s
                    ? "bg-[#1e3a5f] text-white"
                    : "bg-slate-100 text-slate-500",
                )}
              >
                {s === "context"
                  ? "1. Contexte"
                  : s === "json"
                    ? "2. JSON"
                    : "3. Preview"}
              </span>
            ))}
          </div>

          {step === "context" || step === "json" ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => void copyContext()}
                className="w-full rounded-xl border border-[#1e3a5f]/20 bg-[#1e3a5f]/5 px-3 py-2.5 text-[13px] font-semibold text-[#1e3a5f]"
              >
                {busy ? "…" : "Copier le contexte pour ChatGPT"}
              </button>
              <label className="block space-y-1.5">
                <span className="text-[12px] font-medium text-slate-600">
                  Collez le JSON bework_site_survey_v1
                </span>
                <textarea
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                  rows={10}
                  className="w-full rounded-xl border border-slate-200 p-3 font-mono text-[11px] outline-none focus:border-[#1e3a5f]/40 focus:ring-2 focus:ring-[#1e3a5f]/10"
                  placeholder='{ "type": "bework_site_survey_v1", ... }'
                />
              </label>
            </>
          ) : null}

          {step === "preview" && preview ? (
            <div className="space-y-3 text-[13px]">
              <section>
                <h3 className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-[#1e3a5f]">
                  Modifications
                </h3>
                {preview.fieldDiffs.length === 0 ? (
                  <p className="text-slate-500">Aucun champ texte modifié.</p>
                ) : (
                  <ul className="space-y-2">
                    {preview.fieldDiffs.map((d) => (
                      <li
                        key={d.field}
                        className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2"
                      >
                        <p className="font-semibold text-slate-800">
                          {d.label}
                          {d.protected ? (
                            <span className="ml-2 text-[11px] font-medium text-amber-800">
                              protégé
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-[12px] text-slate-500">
                          {d.before || "—"} →{" "}
                          <span className="text-slate-800">{d.after}</span>
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-[#1e3a5f]">
                  Mesures ({preview.measurements.length})
                </h3>
                <ul className="max-h-40 space-y-1 overflow-y-auto text-[12px]">
                  {preview.measurements.map((m, i) => (
                    <li key={`${m.label}-${i}`} className="text-slate-700">
                      <span className="font-medium">{m.action}</span> · {m.label} ·{" "}
                      {m.provenance_kind}
                      {m.quantity != null ? ` · ${m.quantity} ${m.unit}` : " · à confirmer"}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-[#1e3a5f]">
                  Sources utilisées
                </h3>
                <p className="text-[12px] text-slate-600">
                  PLAN {preview.sourcesUsed.plan} · MEASURE {preview.sourcesUsed.measure} ·
                  MANUAL {preview.sourcesUsed.manual} · CALC{" "}
                  {preview.sourcesUsed.calculation} · HYPOTHESIS{" "}
                  {preview.sourcesUsed.hypothesis} · UNKNOWN{" "}
                  {preview.sourcesUsed.unknown}
                </p>
              </section>

              {preview.toConfirm.length > 0 ? (
                <section>
                  <h3 className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-amber-900">
                    À confirmer
                  </h3>
                  <ul className="list-inside list-disc text-[12px] text-amber-950">
                    {preview.toConfirm.slice(0, 12).map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {preview.protectedConflicts.length > 0 ? (
                <label className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[12.5px] text-amber-950 ring-1 ring-amber-200/70">
                  <input
                    type="checkbox"
                    checked={confirmProtected}
                    onChange={(e) => setConfirmProtected(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    Je confirme explicitement le remplacement des données protégées :{" "}
                    {preview.protectedConflicts.join(", ")}
                  </span>
                </label>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p className="text-[12.5px] font-medium text-rose-700">{error}</p>
          ) : null}
          {toast ? (
            <p className="text-[12.5px] font-medium text-emerald-700">{toast}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl px-3.5 py-2 text-[13px] font-medium text-slate-600 hover:bg-white"
          >
            Annuler
          </button>
          {step !== "preview" ? (
            <button
              type="button"
              disabled={busy || !raw.trim()}
              onClick={() => void runPreview()}
              className="rounded-xl bg-[#1e3a5f] px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
            >
              {busy ? "…" : "Prévisualiser"}
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => setStep("json")}
                className="rounded-xl px-3.5 py-2 text-[13px] font-medium text-slate-600 hover:bg-white"
              >
                Retour
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void commit()}
                className="rounded-xl bg-[#1e3a5f] px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
              >
                {busy ? "…" : "Appliquer à la visite"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
