"use client";

import { useCallback, useEffect, useState } from "react";
import type { BeworkPatchSection } from "@/lib/bework-patch/types";
import type { SectionPatchCapability } from "@/lib/bework-patch/capability";
import type { BeworkPatchAnalyzeResult } from "@/lib/bework-patch/analyze";
import {
  canDelegateToPrepPatch,
  toLegacyPrepPatch,
} from "@/lib/bework-patch/adapters/prep";
import {
  canDelegateToQuotePatch,
  toLegacyQuotePatch,
} from "@/lib/bework-patch/adapters/quote";

type Props = {
  open: boolean;
  mode: "chatgpt" | "json";
  section: BeworkPatchSection;
  projectId: string;
  entityId: string;
  version: number;
  capability: SectionPatchCapability;
  entityLabel?: string;
  legacyCommit?: { kind: "quote" | "prep"; id: string } | null;
  onClose: () => void;
  onApplied: () => void;
};

type Step = "paste" | "result" | "success" | "failure";

export function BeworkPatchModal({
  open,
  mode,
  section,
  projectId,
  entityId,
  version,
  capability,
  entityLabel,
  legacyCommit = null,
  onClose,
  onApplied,
}: Props) {
  const [step, setStep] = useState<Step>("paste");
  const [rawText, setRawText] = useState("");
  const [busy, setBusy] = useState(false);
  const [analysis, setAnalysis] = useState<BeworkPatchAnalyzeResult | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStep("paste");
    setRawText("");
    setAnalysis(null);
    setBanner(null);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  async function analyze() {
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch("/api/bework-patch/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw: rawText,
          projectId,
          entityId,
          section,
          currentVersion: version,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setBanner(data?.error ?? "Analyse impossible");
        setStep("failure");
        return;
      }
      setAnalysis(data.analysis as BeworkPatchAnalyzeResult);
      setStep("result");
    } catch {
      setBanner("Erreur réseau lors de l’analyse.");
      setStep("failure");
    } finally {
      setBusy(false);
    }
  }

  async function applyLegacy() {
    if (!analysis?.canCommit || !analysis.patch || !legacyCommit) return;
    setBusy(true);
    setBanner(null);
    try {
      if (legacyCommit.kind === "quote") {
        // Prefer universal → legacy conversion, else raw if already quote patch
        let raw: unknown = rawText;
        if (canDelegateToQuotePatch(analysis.patch)) {
          const del = toLegacyQuotePatch(analysis.patch);
          if (!del.ok) {
            setBanner(del.errors[0]?.message ?? "Conversion devis impossible");
            return;
          }
          // Enrich quote number from entity label if needed
          del.quotePatch.target.quoteNumber =
            entityLabel?.trim() || del.quotePatch.target.quoteNumber;
          raw = del.quotePatch;
        }
        const res = await fetch(
          `/api/commercial/quotes/${legacyCommit.id}/chatgpt-patch/commit`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ raw, forceVersionMismatch: false }),
          },
        );
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setBanner(data?.error ?? "Application devis impossible");
          setStep("failure");
          return;
        }
      } else {
        let raw: unknown = rawText;
        if (canDelegateToPrepPatch(analysis.patch)) {
          const del = toLegacyPrepPatch(analysis.patch);
          if (!del.ok) {
            setBanner(del.errors[0]?.message ?? "Conversion métré impossible");
            return;
          }
          raw = del.prepPatch;
        }
        const res = await fetch(
          `/api/prep-studies/${legacyCommit.id}/chatgpt-patch/commit`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ raw }),
          },
        );
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setBanner(data?.error ?? "Application métré impossible");
          setStep("failure");
          return;
        }
      }
      setStep("success");
      onApplied();
    } catch {
      setBanner("Erreur réseau lors de l’application.");
      setStep("failure");
    } finally {
      setBusy(false);
    }
  }

  const title =
    mode === "chatgpt" ? "Modifier avec ChatGPT" : "Modifier par bloc JSON";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/40 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bework-patch-title"
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2
              id="bework-patch-title"
              className="text-[16px] font-semibold text-[#1e3a5f]"
            >
              {title}
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-500">
              Section {section}
              {entityLabel ? ` · ${entityLabel}` : ""} · v{version}
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-[13px] text-slate-500 hover:bg-slate-50"
            onClick={onClose}
            disabled={busy}
          >
            Fermer
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {capability.mode === "PREVIEW_ONLY" && capability.label ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-950">
              {capability.label}
            </div>
          ) : null}

          {step === "paste" ? (
            <>
              {mode === "chatgpt" ? (
                <ol className="list-decimal space-y-1 pl-4 text-[13px] text-slate-700">
                  <li>Copiez le contexte ChatGPT (bouton de la barre).</li>
                  <li>Collez-le dans ChatGPT et décrivez la modification.</li>
                  <li>
                    Collez ici le bloc{" "}
                    <code className="text-[12px]">bework_patch_v1</code> retourné.
                  </li>
                </ol>
              ) : (
                <p className="text-[13px] text-slate-600">
                  Collez un bloc{" "}
                  <code className="text-[12px]">bework_patch_v1</code> (ou format
                  legacy devis/métré via adapter).
                </p>
              )}
              <textarea
                className="min-h-[220px] w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 font-mono text-[12px] text-slate-800 outline-none focus:ring-2 focus:ring-[#1e3a5f]/25"
                placeholder='{ "type": "bework_patch_v1", ... }'
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                spellCheck={false}
              />
              {banner ? (
                <p className="text-[13px] text-red-700">{banner}</p>
              ) : null}
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-medium text-slate-600"
                  onClick={onClose}
                  disabled={busy}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
                  disabled={busy || !rawText.trim()}
                  onClick={() => void analyze()}
                >
                  {busy ? "Analyse…" : "Analyser"}
                </button>
              </div>
            </>
          ) : null}

          {step === "result" && analysis ? (
            <>
              {analysis.errors.length ? (
                <IssueBlock title="Erreurs" tone="error" items={analysis.errors.map((e) => `${e.code} — ${e.message}`)} />
              ) : null}
              {analysis.warnings.length ? (
                <IssueBlock title="Avertissements" tone="warn" items={analysis.warnings.map((w) => `${w.code} — ${w.message}`)} />
              ) : null}
              {analysis.infos.length ? (
                <IssueBlock title="Infos" tone="info" items={analysis.infos} />
              ) : null}

              <div>
                <h3 className="text-[13px] font-semibold text-[#1e3a5f]">
                  Modifications demandées (directes)
                </h3>
                {analysis.directChanges.length === 0 ? (
                  <p className="mt-1 text-[12.5px] text-slate-500">Aucune</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {analysis.directChanges.map((c, i) => (
                      <li
                        key={i}
                        className="rounded-xl border border-slate-150 border-slate-200 bg-slate-50/70 px-3 py-2 text-[12.5px]"
                      >
                        <p className="font-semibold text-slate-800">{c.op}</p>
                        <p className="text-slate-600">{c.targetSummary}</p>
                        <p className="mt-0.5 font-mono text-[11.5px] text-emerald-800">
                          {c.changesSummary}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {analysis.potentialImpacts.length ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2">
                  <h3 className="text-[13px] font-semibold text-slate-700">
                    Impacts potentiels détectés
                  </h3>
                  <p className="mt-1 text-[11.5px] font-medium text-amber-800">
                    Propagation non activée dans cette phase.
                  </p>
                  <ul className="mt-2 space-y-1 text-[12.5px] text-slate-600">
                    {analysis.potentialImpacts.map((p, i) => (
                      <li key={i}>
                        <span className="font-medium text-slate-800">{p.kind}</span>{" "}
                        — {p.label} · {p.detail}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {banner ? <p className="text-[13px] text-red-700">{banner}</p> : null}

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-medium"
                  onClick={() => {
                    setStep("paste");
                    setBanner(null);
                  }}
                  disabled={busy}
                >
                  Retour
                </button>
                {analysis.canCommit && legacyCommit ? (
                  <button
                    type="button"
                    className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
                    disabled={busy || !analysis.ok}
                    onClick={() => void applyLegacy()}
                  >
                    {busy ? "Application…" : "Appliquer"}
                  </button>
                ) : capability.mode === "PREVIEW_ONLY" ? (
                  <span className="self-center text-[12px] font-medium text-amber-800">
                    Preview uniquement — pas d’application
                  </span>
                ) : null}
              </div>
            </>
          ) : null}

          {step === "success" ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-900">
              Modification appliquée.
              <div className="mt-3">
                <button
                  type="button"
                  className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-[13px] font-semibold text-white"
                  onClick={onClose}
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : null}

          {step === "failure" ? (
            <div className="space-y-3">
              <p className="text-[13px] text-red-700">{banner ?? "Échec"}</p>
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-2 text-[13px]"
                onClick={() => setStep("paste")}
              >
                Réessayer
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function IssueBlock({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "error" | "warn" | "info";
  items: string[];
}) {
  const cls =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-900"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-950"
        : "border-sky-200 bg-sky-50 text-sky-950";
  return (
    <div className={`rounded-xl border px-3 py-2 ${cls}`}>
      <p className="text-[12px] font-semibold uppercase tracking-wide">{title}</p>
      <ul className="mt-1 space-y-1 text-[12.5px]">
        {items.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
    </div>
  );
}
