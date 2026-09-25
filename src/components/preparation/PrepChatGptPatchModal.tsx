"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { PrepPatchPreview } from "@/lib/preparation/chatgpt-patch/apply";
import { displayUnit, formatQty } from "@/lib/preparation/units";
import type { PrepStudyView } from "@/lib/preparation/service";

type Props = {
  studyId: string;
  studyTitle: string;
  open: boolean;
  onClose: () => void;
  onApplied: (study: PrepStudyView) => void;
};

type Step = "paste" | "preview";

export function PrepChatGptPatchModal({ studyId, studyTitle, open, onClose, onApplied }: Props) {
  const [step, setStep] = useState<Step>("paste");
  const [rawText, setRawText] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [parseErrors, setParseErrors] = useState<Array<{ path: string; message: string }>>([]);
  const [preview, setPreview] = useState<PrepPatchPreview | null>(null);
  const [forceVersion, setForceVersion] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  async function pasteClipboard() {
    try {
      const t = await navigator.clipboard.readText();
      if (t.trim()) setRawText(t);
    } catch {
      setErrorBanner("Collage impossible — autorisez l'accès au presse-papiers ou collez manuellement (Ctrl+V).");
    }
  }

  async function onFile(file: File | null) {
    if (!file) return;
    const text = await file.text();
    setRawText(text);
  }

  async function analyze() {
    setBusy(true);
    setErrorBanner(null);
    setParseErrors([]);
    try {
      const res = await fetch(`/api/prep-studies/${studyId}/chatgpt-patch/parse`, {
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
      setPreview(data.preview as PrepPatchPreview);
      setStep("preview");
      if (!data.preview?.ok) {
        setErrorBanner(data.preview?.blockedReason ?? "Patch non applicable — vérifiez le détail ci-dessous.");
      }
    } catch {
      setErrorBanner("Erreur réseau lors de l'analyse.");
    } finally {
      setBusy(false);
    }
  }

  async function apply() {
    if (!preview) return;
    if (!preview.ok && !preview.versionMismatch) return;
    setBusy(true);
    setErrorBanner(null);
    try {
      const res = await fetch(`/api/prep-studies/${studyId}/chatgpt-patch/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw: rawText,
          forceVersionMismatch: forceVersion || Boolean(preview.versionMismatch),
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
      if (data.study) onApplied(data.study as PrepStudyView);
      onClose();
    } catch {
      setErrorBanner("Erreur réseau lors de l'application.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-3 backdrop-blur-[1px] sm:items-center" role="dialog" aria-modal="true">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-[12px] text-slate-500">Étude · {studyTitle}</p>
            <h2 className="text-[17px] font-semibold text-[#1e3a5f]">Modifier avec ChatGPT</h2>
            <p className="mt-0.5 text-[12.5px] text-slate-600">
              Collez un bloc <code className="rounded bg-slate-100 px-1 text-[12px]">bework_prep_patch_v1</code>.
              Prévisualisation obligatoire avant enregistrement — aucune API d&apos;IA.
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100">
            Fermer
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {errorBanner ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">{errorBanner}</div>
          ) : null}

          {step === "paste" ? (
            <>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void pasteClipboard()}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-700 hover:bg-slate-50"
                >
                  Coller
                </button>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-700 hover:bg-slate-50"
                >
                  Charger un fichier JSON
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={16}
                spellCheck={false}
                placeholder='{ "format": "bework_prep_patch_v1", "patch_id": "…", "target": { "base_version": 2 }, "operations": [ … ] }'
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 font-mono text-[12px] text-slate-800 outline-none focus:border-[#1e3a5f]/40 focus:ring-2 focus:ring-[#1e3a5f]/15"
              />
              {parseErrors.length ? (
                <ul className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-900">
                  {parseErrors.map((e, i) => (
                    <li key={i}>
                      <span className="font-mono">{e.path}</span> — {e.message}
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : null}

          {step === "preview" && preview ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-[12px]">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">Version actuelle {preview.version}</span>
                {preview.versionMismatch ? (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-900">Écart de version</span>
                ) : null}
                {preview.alreadyApplied ? (
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-red-800">Déjà appliqué</span>
                ) : null}
                {preview.ok ? (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">Prêt à appliquer</span>
                ) : (
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-red-800">Non applicable</span>
                )}
              </div>

              {preview.warnings.length ? (
                <ul className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-900">
                  {preview.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              ) : null}

              <section>
                <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                  Modifications demandées
                </h3>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Élément</th>
                        <th className="px-3 py-2">Avant</th>
                        <th className="px-3 py-2">Après</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.operations.map((op, i) => (
                        <PreviewOpRows key={i} op={op} />
                      ))}
                      {!preview.operations.length ? (
                        <tr>
                          <td colSpan={3} className="px-3 py-4 text-center text-slate-500">
                            Aucune opération
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </section>

              {preview.quantityImpacts.length ? (
                <section>
                  <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                    Quantités recalculées
                  </h3>
                  <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {preview.quantityImpacts.map((q) => (
                      <li key={q.code} className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2 text-[13px]">
                        <span>
                          <span className="font-mono text-[12px] font-semibold text-[#1e3a5f]">{q.code}</span>{" "}
                          <span className="text-slate-600">{q.designation}</span>
                        </span>
                        <span className="tabular-nums text-slate-800">
                          {formatQty(q.before)} → <strong>{formatQty(q.after)}</strong> {displayUnit(q.unit)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : (
                <p className="text-[12.5px] text-slate-500">
                  Aucune quantité recalculée (modifications purement textuelles ou sans effet sur le moteur).
                </p>
              )}

              {preview.errors.length ? (
                <ul className="space-y-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-800">
                  {preview.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              ) : null}

              {preview.versionMismatch ? (
                <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-950">
                  <input
                    type="checkbox"
                    checked={forceVersion}
                    onChange={(e) => setForceVersion(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    J&apos;ai vérifié les écarts et je confirme l&apos;application malgré la différence de version.
                  </span>
                </label>
              ) : null}
            </div>
          ) : null}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-5 py-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => (step === "preview" ? setStep("paste") : onClose())}
            className="rounded-xl px-3 py-2 text-[13px] text-slate-600 hover:bg-slate-100"
          >
            {step === "preview" ? "Retour" : "Annuler"}
          </button>
          <div className="flex gap-2">
            {step === "paste" ? (
              <button
                type="button"
                disabled={busy || !rawText.trim()}
                onClick={() => void analyze()}
                className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-40"
              >
                {busy ? "Analyse…" : "Prévisualiser les modifications"}
              </button>
            ) : (
              <button
                type="button"
                disabled={
                  busy ||
                  !preview ||
                  preview.alreadyApplied ||
                  (!preview.ok && !preview.versionMismatch) ||
                  (preview.versionMismatch && !forceVersion)
                }
                onClick={() => void apply()}
                className={cn(
                  "rounded-xl px-4 py-2 text-[13px] font-medium text-white disabled:opacity-40",
                  "bg-[#1e3a5f]",
                )}
              >
                {busy ? "Application…" : "Appliquer les modifications"}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

function PreviewOpRows({ op }: { op: PrepPatchPreview["operations"][number] }) {
  if (op.kind === "error") {
    return (
      <tr className="border-t border-slate-100 bg-red-50/50">
        <td className="px-3 py-2 font-mono text-[12px] text-red-800">{op.target}</td>
        <td className="px-3 py-2 text-red-700" colSpan={2}>
          {op.detail}
        </td>
      </tr>
    );
  }
  if (op.kind === "add" || op.kind === "delete") {
    return (
      <tr className="border-t border-slate-100">
        <td className="px-3 py-2">
          <span className="font-mono text-[12px] text-[#1e3a5f]">{op.target}</span>
          <p className="text-slate-700">{op.label}</p>
        </td>
        <td className="px-3 py-2 text-slate-500">{op.kind === "add" ? "—" : "Présent"}</td>
        <td className="px-3 py-2 text-slate-800">{op.detail}</td>
      </tr>
    );
  }
  if (!op.fields.length) {
    return (
      <tr className="border-t border-slate-100">
        <td className="px-3 py-2 text-slate-600" colSpan={3}>
          {op.label} — aucun changement effectif
        </td>
      </tr>
    );
  }
  return (
    <>
      {op.fields.map((f, i) => (
        <tr key={`${op.target}-${f.field}-${i}`} className="border-t border-slate-100 align-top">
          <td className="px-3 py-2">
            {i === 0 ? (
              <>
                <span className="font-mono text-[12px] text-[#1e3a5f]">{op.target}</span>
                <p className="text-slate-700">{op.label}</p>
              </>
            ) : null}
            <p className="text-[11px] text-slate-400">{f.label}</p>
          </td>
          <td className="max-w-[12rem] px-3 py-2 text-slate-500">
            <span className="line-clamp-4 whitespace-pre-wrap break-words">{String(f.before ?? "—")}</span>
          </td>
          <td className="max-w-[12rem] px-3 py-2 font-medium text-slate-900">
            <span className="line-clamp-4 whitespace-pre-wrap break-words">{String(f.after ?? "—")}</span>
          </td>
        </tr>
      ))}
    </>
  );
}
