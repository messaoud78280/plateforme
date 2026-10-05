"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import type { PrepImportPreview } from "@/lib/preparation/service";
import type { PrepIssue } from "@/lib/preparation/types";
import { displayUnit, formatQty } from "@/lib/preparation/units";
import { ProvenanceBadge } from "@/components/preparation/prep-ui";
import { summarizePrepPreviewFailure } from "@/lib/preparation/preview-error";

type ProvenanceSummary = {
  measure: number;
  plan: number;
  manual: number;
  calculation: number;
  hypothesis: number;
  toConfirm: number;
  lines: number;
  params: number;
};

type InteractionMode = "CREATE" | "MODIFY";

/**
 * CREATE / MODIFY métré — BeWork ↔ ChatGPT ↔ BeWork.
 * Si un métré CURRENT existe, le contexte est MODIFY (version réelle).
 * Preview CREATE obligatoire avant « Créer le métré ».
 */
export function TakeoffCreateFromChatgptModal({
  projectId,
  visitId,
  onClose,
  onCreated,
}: {
  projectId: string;
  visitId?: string | null;
  onClose: () => void;
  onCreated?: (studyId: string) => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"context" | "json" | "preview">("context");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorIssues, setErrorIssues] = useState<PrepIssue[]>([]);
  const [showIssueDetails, setShowIssueDetails] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [sourcesFingerprint, setSourcesFingerprint] = useState<string | null>(null);
  const [resolvedVisitId, setResolvedVisitId] = useState<string | null>(visitId ?? null);
  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState<PrepImportPreview | null>(null);
  const [summary, setSummary] = useState<ProvenanceSummary | null>(null);
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const [mode, setMode] = useState<InteractionMode>("CREATE");
  const [errorPhase, setErrorPhase] = useState<"preview" | "commit" | null>(null);
  const [modifyMeta, setModifyMeta] = useState<{
    studyId: string;
    version: number;
    status: string;
  } | null>(null);

  const copyContext = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projets/${projectId}/takeoff-create/context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId: visitId ?? null }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? "Contexte indisponible");
      }
      await navigator.clipboard.writeText(data.text);
      const interactionMode =
        data.interactionMode === "MODIFY" || data.context?.interaction_mode === "MODIFY"
          ? "MODIFY"
          : "CREATE";
      setMode(interactionMode);
      if (interactionMode === "MODIFY") {
        const studyId = String(data.studyId ?? data.context?.target?.id ?? "");
        const version = Number(data.version ?? data.context?.target?.version ?? 0);
        const status = String(
          data.context?.data?.takeoff?.status ??
            data.context?.versions?.current_takeoff?.status ??
            "CURRENT",
        );
        setModifyMeta({ studyId, version, status });
        setToast(
          `Contexte MODIFY copié — Métré v${version} ${status}. Collez-le dans ChatGPT.`,
        );
        setStep("context");
      } else {
        setModifyMeta(null);
        setSourcesFingerprint(data.sourcesFingerprint ?? null);
        setResolvedVisitId(data.context?.visit?.id ?? visitId ?? null);
        setToast("Contexte CREATE copié — discutez avec ChatGPT, puis collez le JSON");
        setStep("json");
      }
      window.setTimeout(() => setToast(null), 4500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Copie impossible");
    } finally {
      setBusy(false);
    }
  }, [projectId, visitId]);

  useEffect(() => {
    void copyContext();
  }, [copyContext]);

  async function runPreview() {
    setBusy(true);
    setError(null);
    setErrorPhase(null);
    setErrorIssues([]);
    setShowIssueDetails(false);
    setPreview(null);
    setSummary(null);
    try {
      let fp = sourcesFingerprint;
      if (!fp) {
        const resCtx = await fetch(`/api/projets/${projectId}/takeoff-create/context`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitId: visitId ?? null }),
        });
        const ctx = await resCtx.json().catch(() => null);
        if (!resCtx.ok) {
          throw new Error(ctx?.error ?? "Contexte indisponible");
        }
        if (ctx.interactionMode === "MODIFY") {
          throw new Error(
            "Un métré existe déjà — utilisez « Modifier avec ChatGPT » depuis l’étude.",
          );
        }
        fp = ctx.sourcesFingerprint ?? null;
        setSourcesFingerprint(fp);
        setResolvedVisitId(ctx.context?.visit?.id ?? visitId ?? null);
      }
      const res = await fetch(`/api/projets/${projectId}/takeoff-create/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw,
          sourcesFingerprint: fp,
          visitId: resolvedVisitId,
        }),
      });
      const data = await res.json().catch(() => null);
      if (data?.code === "PREVIEW_STALE") {
        setSourcesFingerprint(data.sourcesFingerprint ?? null);
        throw new Error(data.error ?? data.message ?? "Contexte obsolète");
      }
      if (!res.ok || !data?.ok) {
        const issues = Array.isArray(data?.issues) ? (data.issues as PrepIssue[]) : [];
        setErrorIssues(issues);
        const summary = summarizePrepPreviewFailure({
          error: data?.error ?? data?.message,
          issues,
          code: data?.code,
        });
        throw new Error(summary.details || summary.title || "Prévisualisation impossible");
      }
      setPreview(data.preview as PrepImportPreview);
      setSummary(data.provenanceSummary as ProvenanceSummary);
      setSourcesFingerprint(data.sourcesFingerprint ?? fp);
      setStep("preview");
    } catch (e) {
      setErrorPhase("preview");
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (!preview || !sourcesFingerprint) return;
    setBusy(true);
    setError(null);
    setErrorPhase(null);
    try {
      const res = await fetch(`/api/projets/${projectId}/takeoff-create/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw,
          sourcesFingerprint,
          visitId: resolvedVisitId,
          allowDuplicate,
        }),
      });
      const data = await res.json().catch(() => null);
      if (data?.code === "PREVIEW_STALE") {
        setSourcesFingerprint(data.sourcesFingerprint ?? null);
        setStep("json");
        setErrorPhase("commit");
        throw new Error(data.error);
      }
      if (data?.code === "STUDY_ALREADY_EXISTS" && data?.studyId) {
        setErrorPhase("commit");
        throw new Error(
          data.error ??
            "Un métré existe déjà — ouvrez-le pour « Modifier avec ChatGPT ».",
        );
      }
      if (!res.ok || !data?.ok) {
        if (res.status === 409 && !allowDuplicate) {
          setAllowDuplicate(true);
          setErrorPhase("commit");
          throw new Error(
            data?.error ??
              "Ce JSON a déjà été importé. Cochez pour forcer une copie, ou annulez.",
          );
        }
        setErrorPhase("commit");
        throw new Error(data?.error ?? "Création impossible");
      }
      const studyId = data.studyId as string;
      onCreated?.(studyId);
      onClose();
      router.push(`/dashboard/visites-metres/etudes/${studyId}`);
      router.refresh();
    } catch (e) {
      setErrorPhase((prev) => prev ?? "commit");
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const isModify = mode === "MODIFY";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 sm:items-center">
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        role="dialog"
        aria-labelledby="takeoff-create-title"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Métré · {isModify ? "MODIFY" : "CREATE"}
              {modifyMeta ? ` · v${modifyMeta.version} ${modifyMeta.status}` : ""}
            </p>
            <h2
              id="takeoff-create-title"
              className="text-[1.05rem] font-semibold text-[#1e3a5f]"
            >
              {isModify
                ? "Contexte métré courant pour ChatGPT"
                : "Préparer le métré avec ChatGPT"}
            </h2>
            <p className="mt-0.5 text-[12.5px] text-slate-600">
              {isModify
                ? "Le métré CURRENT est exposé avec son id et sa version — ChatGPT produit un bework_patch_v1."
                : "ChatGPT propose · BeWork contrôle · vous validez. Aucune mesure inventée."}
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

        {!isModify ? (
          <div className="flex gap-2 border-b border-slate-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <span className={step === "context" || step === "json" || step === "preview" ? "text-[#1e3a5f]" : ""}>
              1. Contexte
            </span>
            <span>·</span>
            <span className={step === "json" || step === "preview" ? "text-[#1e3a5f]" : ""}>
              2. JSON
            </span>
            <span>·</span>
            <span className={step === "preview" ? "text-[#1e3a5f]" : ""}>3. Preview</span>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {toast ? (
            <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-900">
              {toast}
            </p>
          ) : null}
          {error ? (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
              <p className="font-semibold">
                {errorPhase === "commit"
                  ? "Création du métré impossible"
                  : "Prévisualisation impossible"}
              </p>
              {errorIssues.length > 0 ? (
                <>
                  <ul className="mt-2 list-none space-y-2">
                    {(showIssueDetails ? errorIssues : errorIssues.slice(0, 5)).map((iss, idx) => (
                      <li key={`${iss.path}-${idx}`} className="rounded-md bg-white/60 px-2 py-1.5">
                        <p className="font-medium text-red-900">
                          Champ : {iss.path || "—"}
                          {iss.severity === "warn" ? " (avertissement)" : ""}
                        </p>
                        <p className="whitespace-pre-wrap text-red-800">{iss.message}</p>
                      </li>
                    ))}
                  </ul>
                  {errorIssues.length > 5 ? (
                    <button
                      type="button"
                      className="mt-2 text-[12px] font-semibold underline"
                      onClick={() => setShowIssueDetails((v) => !v)}
                    >
                      {showIssueDetails
                        ? "Masquer les détails"
                        : `Voir les détails (+${errorIssues.length - 5})`}
                    </button>
                  ) : null}
                </>
              ) : (
                <p className="mt-1 whitespace-pre-wrap">{error}</p>
              )}
            </div>
          ) : null}

          {isModify && modifyMeta ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-[13px] text-slate-700">
                <p className="font-semibold text-slate-900">
                  Métré v{modifyMeta.version} · {modifyMeta.status}
                </p>
                <p className="mt-1 text-[12.5px]">
                  Le contexte ChatGPT contient l’id réel (
                  <code className="text-[11px]">{modifyMeta.studyId}</code>
                  ), la version courante, et le bloc <code className="text-[11px]">versions</code>{" "}
                  (écart devis / planning si présent).
                </p>
                <ol className="mt-2 list-decimal space-y-0.5 pl-4 text-[12.5px]">
                  <li>Contexte MODIFY déjà copié dans le presse-papiers.</li>
                  <li>Discutez avec ChatGPT — il produit un <code>bework_patch_v1</code>.</li>
                  <li>
                    Appliquez le patch depuis la page métré (« Modifier avec ChatGPT »).
                  </li>
                </ol>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void copyContext()}
                  className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
                >
                  {busy ? "…" : "Recopier le contexte"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(
                      `/dashboard/visites-metres/etudes/${modifyMeta.studyId}`,
                    );
                  }}
                  className="rounded-lg border border-[#1e3a5f]/30 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#1e3a5f]"
                >
                  Ouvrir le métré
                </button>
              </div>
            </div>
          ) : null}

          {!isModify && step !== "preview" ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-[13px] text-slate-700">
                <p className="font-semibold text-slate-900">Discussion métier</p>
                <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-[12.5px]">
                  <li>Contexte CREATE copié (visite + plan facultatif).</li>
                  <li>Discutez avec ChatGPT — répondez aux questions (profondeurs, choix…).</li>
                  <li>Quand c’est prêt, ChatGPT produit un JSON <code>bework_prep_bundle_v1</code>.</li>
                  <li>Collez-le ici → prévisualisez → créez le métré.</li>
                </ol>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void copyContext()}
                  className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
                >
                  {busy ? "…" : "Recopier le contexte"}
                </button>
              </div>
              <label className="block text-[12px] font-semibold text-slate-600">
                JSON ChatGPT ({`bework_prep_bundle_v1`})
                <textarea
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                  rows={12}
                  spellCheck={false}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-[12px] text-slate-800"
                  placeholder='{"format":"bework_prep_bundle_v1", ...}'
                />
              </label>
            </div>
          ) : null}

          {!isModify && step === "preview" && preview && summary ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  { label: "Mesures terrain", n: summary.measure },
                  { label: "Données plan", n: summary.plan },
                  { label: "Saisies manuelles", n: summary.manual },
                  { label: "Calculs", n: summary.calculation },
                  { label: "Hypothèses", n: summary.hypothesis },
                  { label: "À confirmer", n: summary.toConfirm },
                ].map((c) => (
                  <div
                    key={c.label}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-2"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {c.label}
                    </p>
                    <p className="text-[1.1rem] font-bold tabular-nums text-[#1e3a5f]">
                      {c.n}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-[12.5px] text-slate-600">
                {summary.params} paramètres · {summary.lines} lignes — aucune écriture tant que
                vous n’avez pas confirmé.
              </p>
              {preview.duplicate ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-950">
                  Ce JSON a déjà été importé ({preview.duplicate.title}). Cochez pour forcer une
                  copie.
                  <label className="mt-1 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={allowDuplicate}
                      onChange={(e) => setAllowDuplicate(e.target.checked)}
                    />
                    Créer une copie quand même
                  </label>
                </p>
              ) : null}
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-100 p-2">
                {preview.params.slice(0, 40).map((p) => (
                  <div
                    key={p.key}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md px-2 py-1 text-[12.5px] hover:bg-slate-50"
                  >
                    <span className="font-medium text-slate-800">{p.label || p.key}</span>
                    <span className="flex items-center gap-2 tabular-nums text-slate-700">
                      {p.value != null ? `${formatQty(p.value)} ${displayUnit(p.unit)}` : "À confirmer"}
                      <ProvenanceBadge provenance={p.provenance} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 px-4 py-3">
          {isModify ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12.5px] text-slate-700"
            >
              Fermer
            </button>
          ) : step === "preview" ? (
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
                disabled={busy || (Boolean(preview?.duplicate) && !allowDuplicate)}
                onClick={() => void commit()}
                className={cn(
                  "rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-[12.5px] font-semibold text-white",
                  "disabled:opacity-50",
                )}
              >
                {busy ? "Création…" : "Créer le métré"}
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
