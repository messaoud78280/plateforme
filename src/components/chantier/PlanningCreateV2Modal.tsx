"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  RAW_AI_PLACEHOLDER,
  applyCopiedContext,
  buildCommitPayload,
  classifyPlanningV2Error,
  clearRawAiJson,
  detectWrongPlanningV2Paste,
  formatIssueLine,
  formatPredecessorEdge,
  initialPlanningV2UiState,
  invalidatePreview,
  staleUserMessage,
  summarizePreviewForConfirm,
  type PlanningV2IssueLike,
  type PlanningV2UiState,
} from "@/lib/schedule-domain/planning-v2-ui";

type PreviewOk = {
  ok: true;
  draftHash: string;
  sourceFingerprint: string;
  studyId: string;
  plan: {
    activities: Array<{
      id: string;
      name: string;
      kind: string;
      duration: { mode: string; days?: number };
      sourceLinks: Array<{ type: string; code?: string }>;
      predecessors: Array<{ activityId: string; relation: string; lagDays?: number }>;
      resourceRequirements?: { crewId?: string | null; crewSize?: number | null };
    }>;
  };
  calculated: {
    startDate: string | null;
    endDate: string | null;
    totalDurationDays: number;
    workActivities: number;
    waitActivities: number;
    controlActivities: number;
    activities: Array<{
      id: string;
      startDate: string | null;
      endDate: string | null;
      durationDays: number;
    }>;
  };
  stats: {
    inputActivities: number;
    normalizedActivities: number;
    validatedActivities: number;
    calculatedActivities: number;
    workActivities: number;
    waitActivities: number;
    totalDurationDays: number;
  };
  warnings?: PlanningV2IssueLike[];
  takeoffDirectory?: Record<string, string>;
};

/**
 * Planning V2 parallèle — bework_schedule_ai_v1.
 * N’utilise PAS planning-create legacy ni parseBeworkScheduleBundle.
 */
export function PlanningCreateV2Modal({
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
  const [ui, setUi] = useState<PlanningV2UiState>(() => ({
    ...initialPlanningV2UiState(),
    studyId: studyId ?? null,
  }));
  const [busy, setBusy] = useState(false);
  const [errorKind, setErrorKind] = useState<string | null>(null);
  const [errorLines, setErrorLines] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [successMeta, setSuccessMeta] = useState<{
    planId: string;
    href: string;
    taskCount: number;
    days: number;
    action: string;
  } | null>(null);

  const preview = ui.previewResult as PreviewOk | null;

  const showError = useCallback(
    (code: string | null | undefined, issues?: PlanningV2IssueLike[] | null, fallback?: string) => {
      const kind = classifyPlanningV2Error(code, issues);
      setErrorKind(kind);
      const stale = staleUserMessage(kind);
      if (stale) {
        setErrorLines([stale]);
        if (kind === "SOURCE_STALE" || kind === "PREVIEW_STALE") {
          setUi((s) => invalidatePreview(s));
        }
        return;
      }
      const lines =
        issues && issues.length
          ? issues.map(formatIssueLine)
          : [fallback ?? "Erreur"];
      setErrorLines(lines);
    },
    [],
  );

  const copyContext = useCallback(async () => {
    setBusy(true);
    setErrorKind(null);
    setErrorLines([]);
    try {
      const res = await fetch(`/api/projets/${projectId}/planning-v2/context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studyId: ui.studyId ?? studyId ?? null }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        showError(data?.code, null, data?.error ?? "Contexte indisponible");
        return;
      }
      // Clipboard uniquement — rawAiJson intact
      await navigator.clipboard.writeText(data.text as string);
      setUi((s) => {
        const next = applyCopiedContext(s, {
          text: data.text as string,
          sourcesFingerprint: data.sourcesFingerprint as string,
          studyId: (data.studyId as string) ?? s.studyId ?? "",
        });
        return { ...next, step: next.step === "context" ? "json" : next.step };
      });
      setToast("Contexte Planning V2 copié — collez ensuite le JSON bework_schedule_ai_v1");
      window.setTimeout(() => setToast(null), 4000);
    } catch (e) {
      showError(null, null, e instanceof Error ? e.message : "Copie impossible");
    } finally {
      setBusy(false);
    }
  }, [projectId, showError, studyId, ui.studyId]);

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      setUi((s) => ({
        ...s,
        rawAiJson: text,
        previewResult: null,
        draftHash: null,
        step: "json",
      }));
    } catch {
      showError(null, null, "Collage presse-papiers impossible — collez manuellement.");
    }
  }

  async function runPreview() {
    setBusy(true);
    setErrorKind(null);
    setErrorLines([]);
    try {
      const wrongPaste = detectWrongPlanningV2Paste(ui.rawAiJson);
      if (wrongPaste) {
        showError("CONTRACT_ERROR", null, wrongPaste);
        return;
      }
      const res = await fetch(`/api/projets/${projectId}/planning-v2/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw: ui.rawAiJson,
          sourcesFingerprint: ui.sourcesFingerprint,
          studyId: ui.studyId,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        showError(data?.code, data?.issues, data?.error ?? "Prévisualisation impossible");
        return;
      }
      setUi((s) => ({
        ...s,
        previewResult: data,
        draftHash: data.draftHash as string,
        sourcesFingerprint:
          (data.sourceFingerprint as string) ?? s.sourcesFingerprint,
        studyId: (data.studyId as string) ?? s.studyId,
        step: "preview",
        commitState: "idle",
      }));
    } catch (e) {
      showError("PARSE_ERROR", null, e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (!ui.draftHash || !ui.sourcesFingerprint || !preview) return;
    setBusy(true);
    setUi((s) => ({ ...s, commitState: "pending" }));
    setErrorKind(null);
    setErrorLines([]);
    try {
      const payload = buildCommitPayload({
        raw: ui.rawAiJson,
        draftHash: ui.draftHash,
        sourcesFingerprint: ui.sourcesFingerprint,
        studyId: ui.studyId,
      });
      const res = await fetch(`/api/projets/${projectId}/planning-v2/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        showError(data?.code, data?.issues, data?.error ?? "Création impossible");
        setUi((s) => ({ ...s, commitState: "error" }));
        return;
      }
      // idempotent = succès normal
      setSuccessMeta({
        planId: data.planId as string,
        href: data.href as string,
        taskCount: data.taskCount as number,
        days: Number(data.baseDurationWorkingDays ?? 0),
        action: (data.action as string) ?? "created",
      });
      setUi((s) => ({ ...s, commitState: "success", step: "success" }));
      onCreated?.(data.planId as string);
      router.refresh();
    } catch (e) {
      showError(null, null, e instanceof Error ? e.message : "Erreur");
      setUi((s) => ({ ...s, commitState: "error" }));
    } finally {
      setBusy(false);
    }
  }

  const calcById = new Map(
    (preview?.calculated.activities ?? []).map((a) => [a.id, a]),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 sm:items-center">
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        role="dialog"
        aria-labelledby="planning-v2-title"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700/80">
              Planning V2 · parallèle
            </p>
            <h2
              id="planning-v2-title"
              className="text-[1.05rem] font-semibold text-[#1e3a5f]"
            >
              Créer le planning (domaine V2)
            </h2>
            <p className="mt-0.5 text-[12.5px] text-slate-600">
              Contexte BeWork → ChatGPT → JSON <code className="text-[12px]">bework_schedule_ai_v1</code>{" "}
              → Preview serveur → Commit.
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

        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          <span className={ui.step !== "context" ? "text-[#1e3a5f]" : ""}>1. Contexte</span>
          <span>·</span>
          <span className={ui.step === "json" || ui.step === "preview" || ui.step === "success" ? "text-[#1e3a5f]" : ""}>
            2. JSON
          </span>
          <span>·</span>
          <span className={ui.step === "preview" || ui.step === "success" ? "text-[#1e3a5f]" : ""}>
            3. Preview
          </span>
          <span>·</span>
          <span className={ui.step === "success" ? "text-[#1e3a5f]" : ""}>4. Confirmation</span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {toast ? (
            <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-900">
              {toast}
            </p>
          ) : null}
          {errorLines.length ? (
            <div
              className="mb-3 space-y-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800"
              data-error-kind={errorKind ?? undefined}
            >
              {errorKind ? (
                <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                  {errorKind}
                </p>
              ) : null}
              {errorLines.map((line) => (
                <p key={line} className="whitespace-pre-line">
                  {line}
                </p>
              ))}
            </div>
          ) : null}

          {ui.step === "success" && successMeta ? (
            <div className="space-y-3">
              <p className="text-[15px] font-semibold text-emerald-900">Planning créé</p>
              <p className="text-[13px] text-slate-700">
                {successMeta.taskCount} activités · {successMeta.days} jours
                {successMeta.action === "idempotent" ? " (déjà enregistré — idempotent)" : ""}
              </p>
              <a
                href={successMeta.href}
                className="inline-flex text-[13px] font-semibold text-[#1e3a5f] hover:underline"
              >
                Voir le planning →
              </a>
            </div>
          ) : null}

          {ui.step !== "preview" && ui.step !== "success" ? (
            <div className="space-y-5">
              <section className="space-y-2">
                <h3 className="text-[13px] font-semibold text-[#1e3a5f]">
                  1. Préparer avec ChatGPT
                </h3>
                <p className="text-[13px] text-slate-600">
                  Copiez le contexte BeWork, envoyez-le à ChatGPT, puis revenez coller le planning
                  généré.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void copyContext()}
                  className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
                >
                  {busy && !ui.rawAiJson ? "Copie…" : "COPIER LE CONTEXTE"}
                </button>
                {ui.contextJson ? (
                  <p className="text-[11px] text-slate-500">
                    Contexte prêt ({Math.round(ui.contextJson.length / 1024)} ko) — presse-papiers
                    uniquement, zone JSON inchangée.
                  </p>
                ) : null}
              </section>

              <section className="space-y-2">
                <h3 className="text-[13px] font-semibold text-[#1e3a5f]">
                  2. Coller le planning généré
                </h3>
                <p className="text-[12.5px] text-slate-600">
                  Ne collez pas le contexte copié à l’étape 1. Collez uniquement la réponse
                  ChatGPT : <code className="text-[11px]">bework_schedule_ai_v1</code> avec{" "}
                  <code className="text-[11px]">activities</code>.
                </p>
                <textarea
                  value={ui.rawAiJson}
                  onChange={(e) =>
                    setUi((s) => ({
                      ...s,
                      rawAiJson: e.target.value,
                      previewResult: null,
                      draftHash: null,
                    }))
                  }
                  rows={14}
                  placeholder={RAW_AI_PLACEHOLDER}
                  spellCheck={false}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-[12px] text-slate-800"
                  data-testid="planning-v2-raw"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void pasteFromClipboard()}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12.5px] font-semibold text-[#1e3a5f]"
                  >
                    Coller
                  </button>
                  <button
                    type="button"
                    disabled={busy || !ui.rawAiJson}
                    onClick={() => setUi((s) => clearRawAiJson(s))}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12.5px] text-slate-700"
                  >
                    Effacer
                  </button>
                </div>
              </section>
            </div>
          ) : null}

          {ui.step === "preview" && preview ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-[12.5px] sm:grid-cols-4">
                <SummaryCard label="Activités" value={String(preview.stats.calculatedActivities)} />
                <SummaryCard
                  label="Durée"
                  value={`${preview.stats.totalDurationDays} j`}
                />
                <SummaryCard label="WORK" value={String(preview.calculated.workActivities)} />
                <SummaryCard label="WAIT" value={String(preview.calculated.waitActivities)} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[12.5px]">
                <SummaryCard label="CONTROL" value={String(preview.calculated.controlActivities)} />
                <SummaryCard
                  label="Début → Fin"
                  value={
                    preview.calculated.startDate && preview.calculated.endDate
                      ? `${preview.calculated.startDate} → ${preview.calculated.endDate}`
                      : "—"
                  }
                />
              </div>

              {preview.warnings?.length ? (
                <ul className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-900">
                  {preview.warnings.map((w) => (
                    <li key={`${w.code}-${w.path}`}>{formatIssueLine(w)}</li>
                  ))}
                </ul>
              ) : null}

              <p className="text-[13px] font-medium text-slate-800">
                {summarizePreviewForConfirm(preview.stats)}
              </p>

              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="min-w-full text-left text-[12px]">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-2 py-2">#</th>
                      <th className="px-2 py-2">Code</th>
                      <th className="px-2 py-2">Activité</th>
                      <th className="px-2 py-2">Type</th>
                      <th className="px-2 py-2">Durée</th>
                      <th className="px-2 py-2">Sources métré</th>
                      <th className="px-2 py-2">Prédécesseurs</th>
                      <th className="px-2 py-2">Équipe</th>
                      <th className="px-2 py-2">Début</th>
                      <th className="px-2 py-2">Fin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.plan.activities.map((act, idx) => {
                      const calc = calcById.get(act.id);
                      const isWait = act.kind === "WAIT";
                      const codes = act.sourceLinks
                        .filter((l) => l.type === "TAKEOFF_LINE" && l.code)
                        .map((l) => l.code!);
                      const duration =
                        act.duration.mode === "FIXED"
                          ? act.duration.days ?? calc?.durationDays
                          : calc?.durationDays;
                      return (
                        <tr
                          key={act.id}
                          className={cn(
                            "border-t border-slate-100",
                            isWait && "bg-slate-50/80 text-slate-600",
                          )}
                        >
                          <td className="px-2 py-2 tabular-nums text-slate-400">{idx + 1}</td>
                          <td className="px-2 py-2 font-mono text-[11px]">{act.id}</td>
                          <td className="px-2 py-2 font-medium text-slate-800">
                            {isWait ? `WAIT — ${act.name}` : act.name}
                          </td>
                          <td className="px-2 py-2">{act.kind}</td>
                          <td className="px-2 py-2 tabular-nums">
                            {duration != null ? `${duration} j` : "—"}
                          </td>
                          <td className="px-2 py-2">
                            {codes.length ? (
                              <ul className="space-y-0.5">
                                {codes.map((c) => (
                                  <li key={c}>
                                    <span className="font-mono text-[11px]">{c}</span>
                                    {preview.takeoffDirectory?.[c] ? (
                                      <span className="ml-1 text-slate-500">
                                        {preview.takeoffDirectory[c]}
                                      </span>
                                    ) : null}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-2 py-2">
                            {act.predecessors.length
                              ? act.predecessors
                                  .map((p) => formatPredecessorEdge(act.id, p))
                                  .join(" · ")
                              : "—"}
                          </td>
                          <td className="px-2 py-2">
                            {isWait
                              ? "—"
                              : act.resourceRequirements?.crewId
                                ? `${act.resourceRequirements.crewId}${
                                    act.resourceRequirements.crewSize
                                      ? ` ×${act.resourceRequirements.crewSize}`
                                      : ""
                                  }`
                                : "—"}
                          </td>
                          <td className="px-2 py-2 tabular-nums">{calc?.startDate ?? "—"}</td>
                          <td className="px-2 py-2 tabular-nums">{calc?.endDate ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>

        <footer className="space-y-2 border-t border-slate-100 px-4 py-3">
          {errorLines.length && (ui.step === "preview" || ui.commitState === "error") ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-800">
              {errorLines.map((line) => (
                <p key={`foot-${line}`} className="whitespace-pre-line">
                  {line}
                </p>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-end gap-2">
          {ui.step === "success" ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-[12.5px] font-semibold text-white"
            >
              Fermer
            </button>
          ) : ui.step === "preview" ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => setUi((s) => ({ ...s, step: "json" }))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12.5px] text-slate-700"
              >
                Retour
              </button>
              <button
                type="button"
                disabled={busy || ui.commitState === "pending" || !ui.draftHash}
                onClick={() => void commit()}
                className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
                data-testid="planning-v2-commit"
              >
                {ui.commitState === "pending" || busy ? "Création…" : "Créer le planning"}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={busy || !ui.rawAiJson.trim()}
              onClick={() => void runPreview()}
              className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
              data-testid="planning-v2-preview"
            >
              {busy ? "Calcul…" : "Prévisualiser"}
            </button>
          )}
          </div>
        </footer>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
      <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
      <p className="font-semibold text-slate-800">{value}</p>
    </div>
  );
}
