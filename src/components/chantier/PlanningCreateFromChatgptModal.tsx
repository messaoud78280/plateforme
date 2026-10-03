"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import type {
  PlanningCreatePreviewResult,
  PlanningCreatePreviewTask,
} from "@/lib/bework-context/adapt-planning-create";

/**
 * CREATE planning — BeWork ↔ ChatGPT ↔ BeWork.
 * Preview computeSchedule obligatoire avant « Créer le planning ».
 */
export function PlanningCreateFromChatgptModal({
  projectId,
  studyId,
  onClose,
  onCreated,
}: {
  projectId: string;
  studyId?: string | null;
  onClose: () => void;
  onCreated?: (planId: string) => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"context" | "json" | "preview">("context");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sourcesFingerprint, setSourcesFingerprint] = useState<string | null>(null);
  const [resolvedStudyId, setResolvedStudyId] = useState<string | null>(studyId ?? null);
  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState<PlanningCreatePreviewResult | null>(null);
  const [allowDuplicate, setAllowDuplicate] = useState(false);

  const copyContext = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projets/${projectId}/planning-create/context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studyId: studyId ?? null }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (data?.code === "PLAN_ALREADY_EXISTS") {
          throw new Error(
            "Un planning existe déjà — utilisez « Modifier avec ChatGPT » depuis le Gantt.",
          );
        }
        if (data?.code === "STUDY_REQUIRED") {
          throw new Error("Préparez d’abord le métré avant le planning.");
        }
        throw new Error(data?.error ?? "Contexte indisponible");
      }
      await navigator.clipboard.writeText(data.text);
      setSourcesFingerprint(data.sourcesFingerprint ?? null);
      setResolvedStudyId(data.studyId ?? studyId ?? null);
      setToast("Contexte CREATE planning copié — discutez l’organisation, puis collez le JSON");
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
    try {
      if (!sourcesFingerprint) await copyContext();
      const res = await fetch(`/api/projets/${projectId}/planning-create/preview`, {
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
      setPreview(data as PlanningCreatePreviewResult);
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
    if (preview.errors.length) {
      setError(preview.errors[0] ?? "Planning incohérent");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projets/${projectId}/planning-create/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw,
          sourcesFingerprint,
          studyId: resolvedStudyId,
          allowDuplicate,
        }),
      });
      const data = await res.json().catch(() => null);
      if (data?.code === "PREVIEW_STALE") {
        setSourcesFingerprint(data.sourcesFingerprint ?? null);
        setStep("json");
        throw new Error(data.error);
      }
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? "Création impossible");
      }
      onCreated?.(data.planId as string);
      onClose();
      router.push(data.href as string);
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
        aria-labelledby="planning-create-title"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Planning · CREATE
            </p>
            <h2
              id="planning-create-title"
              className="text-[1.05rem] font-semibold text-[#1e3a5f]"
            >
              Préparer le planning avec ChatGPT
            </h2>
            <p className="mt-0.5 text-[12.5px] text-slate-600">
              ChatGPT propose · BeWork calcule · vous validez. Quantités issues du métré.
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
                Discutez ordre, équipes, rendements, WAIT et dépendances dans ChatGPT. Collez
                ensuite uniquement le JSON{" "}
                <code className="text-[12px]">bework_schedule_bundle_v1</code>.
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void copyContext()}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12.5px] font-semibold text-[#1e3a5f]"
              >
                {busy && step === "context" ? "Copie…" : "Recopier le contexte"}
              </button>
              <textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                rows={12}
                placeholder='{ "format": "bework_schedule_bundle_v1", ... }'
                className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-[12px] text-slate-800"
              />
            </div>
          ) : preview ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-[12.5px] sm:grid-cols-4">
                <SummaryCard label="Tâches" value={String(preview.tasks.length)} />
                <SummaryCard label="Dépendances" value={String(preview.dependencyCount)} />
                <SummaryCard label="Équipes" value={String(preview.crewCount)} />
                <SummaryCard
                  label="Durée"
                  value={`${preview.baseDurationWorkingDays.toLocaleString("fr-FR")} j ouvrés`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[12.5px]">
                <SummaryCard
                  label="Hypothèses"
                  value={String(preview.assumptionCount)}
                  warn={preview.assumptionCount > 0}
                />
                <SummaryCard
                  label="À confirmer"
                  value={String(preview.toConfirmCount)}
                  warn={preview.toConfirmCount > 0}
                />
              </div>

              {preview.warnings.length ? (
                <ul className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-900">
                  {preview.warnings.map((w) => (
                    <li key={w}>⚠ {w}</li>
                  ))}
                </ul>
              ) : null}

              {preview.errors.length ? (
                <ul className="space-y-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-900">
                  {preview.errors.map((w) => (
                    <li key={w}>✖ {w}</li>
                  ))}
                </ul>
              ) : null}

              {preview.alreadyImported ? (
                <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[12.5px]">
                  <input
                    type="checkbox"
                    checked={allowDuplicate}
                    onChange={(e) => setAllowDuplicate(e.target.checked)}
                  />
                  Ce JSON a déjà créé un planning. Forcer une copie
                </label>
              ) : null}

              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                {preview.tasks.map((t) => (
                  <TaskRow key={t.stepId} task={t} />
                ))}
              </ul>
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
                  Boolean(preview?.errors.length) ||
                  (Boolean(preview?.alreadyImported) && !allowDuplicate)
                }
                onClick={() => void commit()}
                className={cn(
                  "rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-[12.5px] font-semibold text-white",
                  "disabled:opacity-50",
                )}
              >
                {busy ? "Création…" : "Créer le planning"}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={busy || !raw.trim()}
              onClick={() => void runPreview()}
              className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Calcul…" : "Prévisualiser"}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-2.5 py-2",
        warn ? "border-amber-100 bg-amber-50/80" : "border-slate-100 bg-slate-50",
      )}
    >
      <p
        className={cn(
          "text-[10px] font-bold uppercase",
          warn ? "text-amber-700" : "text-slate-400",
        )}
      >
        {label}
      </p>
      <p className={cn("font-semibold", warn ? "text-amber-900" : "text-slate-800")}>
        {value}
      </p>
    </div>
  );
}

function TaskRow({ task }: { task: PlanningCreatePreviewTask }) {
  return (
    <li className="px-3 py-2.5 text-[12.5px]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold text-slate-800">
          {task.name}
          <span className="ml-2 text-[11px] font-medium text-slate-500">
            {task.kindLabel}
            {task.lot ? ` · ${task.lot}` : ""}
          </span>
        </span>
        <span className="tabular-nums text-slate-600">
          {task.durationDays.toLocaleString("fr-FR")} j
          {task.startDate && task.endDate
            ? ` · ${task.startDate} → ${task.endDate}`
            : ""}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px] text-slate-600">
        {task.quantity != null ? (
          <span>
            Qté {task.quantity.toLocaleString("fr-FR")} {task.quantityUnit ?? ""}
            {task.takeoffIds.length ? ` · métré ${task.takeoffIds.join(", ")}` : ""}
          </span>
        ) : null}
        {task.crewLabel ? <span>Équipe : {task.crewLabel}</span> : null}
        {task.rateLabel && task.rateValue != null ? (
          <span>
            Rendement : {task.rateValue.toLocaleString("fr-FR")} ({task.rateLabel})
          </span>
        ) : null}
        {task.dependsOn.length ? (
          <span>
            Dépend de :{" "}
            {task.dependsOn.map((d) => `${d.stepId} (${d.type})`).join(", ")}
          </span>
        ) : null}
      </div>
      {task.assumptionFlags.length ? (
        <p className="mt-1 text-[11px] font-semibold text-amber-800">
          {task.assumptionFlags.join(" · ")}
        </p>
      ) : null}
    </li>
  );
}
