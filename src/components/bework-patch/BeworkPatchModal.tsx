"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardPaste,
  Eye,
  Loader2,
  ShieldAlert,
  X,
} from "lucide-react";
import type { BeworkPatchSection } from "@/lib/bework-patch/types";
import type { SectionPatchCapability } from "@/lib/bework-patch/capability";
import type { BeworkPatchAnalyzeResult } from "@/lib/bework-patch/analyze";
import type {
  AnalyzePatchImpactResult,
  DerivedChange,
  DirectChange,
} from "@/lib/bework-patch/impact/types";
import {
  fieldMetierLabel,
  mapPatchErrorToUser,
  sectionMetierLabel,
  syncModeUserHint,
  type UserFacingError,
} from "@/lib/bework-patch/ui-messages";
import {
  countAddLines,
  formatDisplayUnit,
  formatFormulaDisplay,
  formatQuantityWithUnit,
  isAddLineDirectChange,
  natureLabel,
  parseAddLineAfter,
  parseTechnicalNotes,
  provenanceBadgeLabel,
  roleBadgeLabel,
  summarizeAddLineLots,
  summarizeAddLineStats,
  type AddLinePreviewPayload,
} from "@/lib/bework-patch/add-line-preview";

type Props = {
  open: boolean;
  mode: "chatgpt" | "json";
  section: BeworkPatchSection;
  projectId?: string | null;
  entityId: string;
  version: number;
  capability: SectionPatchCapability;
  entityLabel?: string;
  onClose: () => void;
  onApplied: () => void;
  /** Indique que le contexte a déjà été copié depuis la barre d’outils. */
  contextAlreadyCopied?: boolean;
};

type Step = "paste" | "preview" | "confirm" | "success";

type CommitMeta = {
  fingerprint: string;
  eligibility:
    | {
        ok: true;
        mode:
          | "FULL_SYNC"
          | "SAFE_PARTIAL_SYNC"
          | "QUOTE_ONLY"
          | "PLANNING_ONLY"
          | "VISIT_ONLY"
          | "FOLLOW_UP_ONLY"
          | "REPORT_ONLY"
          | "NOTICE_ONLY";
        buttonLabel: string;
        warnings: string[];
      }
    | { ok: false; reason: string; code: string };
  versions: {
    study: number | null;
    quoteVersion: number | null;
    planRevision: number | null;
  };
};

type CommitSuccess = {
  syncMode: string;
  message: string;
  summary: {
    takeoffUpdated: boolean;
    quoteUpdated: boolean;
    planningUpdated: boolean;
    quoteProtected: boolean;
  };
  versionsAfter: {
    study: number | null;
    quoteVersion: number | null;
    planRevision: number | null;
  };
};

const STEPS = [
  { id: "context", label: "Contexte" },
  { id: "paste", label: "Modifications" },
  { id: "preview", label: "Vérification" },
  { id: "confirm", label: "Confirmation" },
] as const;

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") {
    return Number.isInteger(v)
      ? String(v)
      : v.toLocaleString("fr-FR", { maximumFractionDigits: 4 });
  }
  if (typeof v === "boolean") return v ? "Oui" : "Non";
  if (typeof v === "string") return v.trim() || "—";
  // Jamais de JSON brut dans la preview métier
  const line = parseAddLineAfter(v);
  if (line) return `${line.code} · ${line.designation}`;
  return "Détail structuré";
}

function consequenceLabel(d: DerivedChange): string {
  const section = sectionMetierLabel(
    d.section as BeworkPatchSection,
  );
  if (d.blocked) {
    return `${section} — élément protégé (non modifié automatiquement)`;
  }
  const after = formatValue(d.after);
  const field = fieldMetierLabel(d.field);
  if (d.reason && /contractuel|protég|écrasement|revalid|obsolète/i.test(d.reason)) {
    return `${section} — ${d.reason}`;
  }
  if (after !== "—" && formatValue(d.before) !== after) {
    return `${section} · ${d.label} — ${field} : ${formatValue(d.before)}${
      d.unit ? ` ${d.unit}` : ""
    } → ${after}${d.unit ? ` ${d.unit}` : ""}`;
  }
  return `${section} · ${d.label}${d.reason ? ` — ${d.reason}` : ""}`;
}

function groupDerivedBySection(items: DerivedChange[]) {
  const order = ["TAKEOFF", "QUOTE", "PLANNING"] as const;
  const map = new Map<string, DerivedChange[]>();
  for (const d of items) {
    const list = map.get(d.section) ?? [];
    list.push(d);
    map.set(d.section, list);
  }
  return order
    .filter((s) => map.has(s))
    .map((s) => ({ section: s, items: map.get(s)! }));
}

export function BeworkPatchModal({
  open,
  mode,
  section,
  projectId,
  entityId,
  version,
  capability,
  entityLabel,
  onClose,
  onApplied,
  contextAlreadyCopied = false,
}: Props) {
  const titleId = useId();
  const pasteRef = useRef<HTMLTextAreaElement>(null);
  const [step, setStep] = useState<Step>("paste");
  const [rawText, setRawText] = useState("");
  const [busy, setBusy] = useState<"analyze" | "commit" | null>(null);
  const [analysis, setAnalysis] = useState<BeworkPatchAnalyzeResult | null>(null);
  const [commitMeta, setCommitMeta] = useState<CommitMeta | null>(null);
  const [commitSuccess, setCommitSuccess] = useState<CommitSuccess | null>(null);
  const [userError, setUserError] = useState<UserFacingError | null>(null);
  const [techDetail, setTechDetail] = useState<string | null>(null);
  const [showTech, setShowTech] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const analyzingRef = useRef(false);
  const committingRef = useRef(false);
  const [existingLineCount, setExistingLineCount] = useState<number | null>(null);

  const sectionLabel = sectionMetierLabel(section);

  const reset = useCallback(() => {
    setStep("paste");
    setRawText("");
    setBusy(null);
    setAnalysis(null);
    setCommitMeta(null);
    setCommitSuccess(null);
    setUserError(null);
    setTechDetail(null);
    setShowTech(false);
    setShowRawJson(false);
    setExistingLineCount(null);
    analyzingRef.current = false;
    committingRef.current = false;
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    const t = window.setTimeout(() => pasteRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open, reset]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && busy !== "commit") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, busy]);

  const elig = commitMeta?.eligibility ?? null;
  const canCommit = Boolean(elig && elig.ok);
  const impact: AnalyzePatchImpactResult | null = analysis?.impact ?? null;

  const hasUnsupported = useMemo(() => {
    if (!analysis) return false;
    if (
      analysis.errors.some((e) =>
        /OPERATION_NOT_ALLOWED|UNSUPPORTED|INVALID_FIELD|EMPTY_OPERATIONS/i.test(
          e.code,
        ),
      )
    ) {
      return true;
    }
    if (elig && !elig.ok) {
      return /OPERATION_NOT_ALLOWED|UNSUPPORTED|EMPTY_OPERATIONS|INVALID_FIELD/i.test(
        elig.code,
      );
    }
    return false;
  }, [analysis, elig]);

  const activeStepIndex = useMemo(() => {
    if (step === "paste") return 1;
    if (step === "preview") return 2;
    if (step === "confirm" || step === "success") return 3;
    return 1;
  }, [step]);

  const directCount = impact?.directChanges.length ?? analysis?.directChanges.length ?? 0;
  const addLineCount = impact ? countAddLines(impact.directChanges) : 0;
  const consequenceGroups = impact ? groupDerivedBySection(impact.derivedChanges) : [];
  const consequenceCount =
    (impact?.derivedChanges.length ?? 0) + (impact?.protectedEntities.length ?? 0);

  const runAnalyze = useCallback(async () => {
    if (analyzingRef.current || busy) return;
    setUserError(null);
    setTechDetail(null);
    setShowTech(false);
    setCommitSuccess(null);
    setCommitMeta(null);

    const trimmed = rawText.trim();
    if (!trimmed) {
      setUserError(
        mapPatchErrorToUser({ code: "INVALID_JSON", section }),
      );
      setTechDetail("EMPTY_INPUT");
      return;
    }

    // Validation JSON locale avant requête
    try {
      JSON.parse(trimmed);
    } catch {
      setUserError(
        mapPatchErrorToUser({ code: "INVALID_JSON", section }),
      );
      setTechDetail("JSON.parse failed — INVALID_JSON");
      return;
    }

    analyzingRef.current = true;
    setBusy("analyze");
    try {
      const res = await fetch("/api/bework-patch/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw: trimmed,
          projectId,
          entityId,
          section,
          currentVersion: version,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const mapped = mapPatchErrorToUser({
          code: data?.code,
          serverMessage: data?.error,
          section,
        });
        setUserError(mapped);
        setTechDetail(
          [data?.code, data?.error].filter(Boolean).join(" — ") ||
            `HTTP ${res.status}`,
        );
        return;
      }
      setAnalysis(data.analysis as BeworkPatchAnalyzeResult);
      setCommitMeta((data.commit as CommitMeta) ?? null);
      const existing =
        typeof data?.meta?.existingLineCount === "number"
          ? data.meta.existingLineCount
          : null;
      setExistingLineCount(existing);
      setStep("preview");
    } catch (e) {
      setUserError(
        mapPatchErrorToUser({
          code: "SERVER_ERROR",
          serverMessage: e instanceof Error ? e.message : null,
          section,
        }),
      );
      setTechDetail(e instanceof Error ? e.message : "network error");
    } finally {
      analyzingRef.current = false;
      setBusy(null);
    }
  }, [busy, entityId, projectId, rawText, section, version]);

  const runCommit = useCallback(async () => {
    if (committingRef.current || busy) return;
    if (!elig || !elig.ok || !commitMeta) return;

    committingRef.current = true;
    setBusy("commit");
    setUserError(null);
    setTechDetail(null);
    try {
      const res = await fetch("/api/bework-patch/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw: rawText.trim(),
          projectId,
          previewFingerprint: commitMeta.fingerprint,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const mapped = mapPatchErrorToUser({
          code: data?.code,
          serverMessage: data?.error,
          section,
        });
        setUserError(mapped);
        setTechDetail(
          [data?.code, data?.error].filter(Boolean).join(" — ") ||
            `HTTP ${res.status}`,
        );
        if (data?.code === "PREVIEW_STALE" || data?.code === "VERSION_CONFLICT") {
          setStep("preview");
        }
        return;
      }
      setCommitSuccess({
        syncMode: data.syncMode,
        message: data.message,
        summary: data.summary,
        versionsAfter: data.versionsAfter,
      });
      setStep("success");
      // onApplied différé : l’utilisateur doit voir le succès avant refresh.
    } catch (e) {
      setUserError(
        mapPatchErrorToUser({
          code: "SERVER_ERROR",
          serverMessage: e instanceof Error ? e.message : null,
          section,
        }),
      );
      setTechDetail(e instanceof Error ? e.message : "network error");
    } finally {
      committingRef.current = false;
      setBusy(null);
    }
  }, [busy, commitMeta, elig, projectId, rawText, section]);

  const handleSuccessClose = useCallback(() => {
    onApplied();
    onClose();
  }, [onApplied, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              {mode === "chatgpt"
                ? "Modifications ChatGPT"
                : "Modifications par bloc"}
            </p>
            <h2
              id={titleId}
              className="truncate text-base font-semibold text-slate-900"
            >
              {sectionLabel}
              {entityLabel ? (
                <span className="font-normal text-slate-500">
                  {" "}
                  · {entityLabel}
                </span>
              ) : null}
            </h2>
          </div>
          <button
            type="button"
            onClick={busy === "commit" ? undefined : onClose}
            disabled={busy === "commit"}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {step !== "success" && (
          <nav
            className="flex gap-1 border-b border-slate-100 px-4 py-2.5 sm:px-5"
            aria-label="Étapes"
          >
            {STEPS.map((s, i) => {
              const done =
                i < activeStepIndex || (i === 0 && contextAlreadyCopied);
              const current = i === activeStepIndex;
              return (
                <div
                  key={s.id}
                  className={`flex flex-1 flex-col items-center gap-0.5 ${
                    current
                      ? "text-[#1e3a5f]"
                      : done
                        ? "text-emerald-700"
                        : "text-slate-400"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                      current
                        ? "bg-[#1e3a5f] text-white"
                        : done
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="hidden text-[10px] font-medium sm:block">
                    {s.label}
                  </span>
                </div>
              );
            })}
          </nav>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {capability.mode === "PREVIEW_ONLY" && capability.label ? (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              {capability.label}
            </div>
          ) : null}

          {userError && (
            <div
              className={`mb-4 rounded-xl border px-3 py-3 ${
                userError.action === "refresh"
                  ? "border-amber-200 bg-amber-50"
                  : "border-red-200 bg-red-50"
              }`}
              role="alert"
            >
              <p className="text-sm font-semibold text-slate-900">
                {userError.title}
              </p>
              <p className="mt-1 text-sm text-slate-700">{userError.message}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {userError.action === "reanalyze" && (
                  <button
                    type="button"
                    onClick={() => void runAnalyze()}
                    disabled={busy !== null}
                    className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#162d4a] disabled:opacity-50"
                  >
                    {userError.actionLabel}
                  </button>
                )}
                {userError.action === "refresh" && (
                  <button
                    type="button"
                    onClick={handleSuccessClose}
                    className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#162d4a]"
                  >
                    {userError.actionLabel}
                  </button>
                )}
                {userError.action === "retry_paste" && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserError(null);
                      setStep("paste");
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {userError.actionLabel}
                  </button>
                )}
                {techDetail && (
                  <button
                    type="button"
                    onClick={() => setShowTech((v) => !v)}
                    className="text-xs text-slate-500 underline"
                  >
                    {showTech
                      ? "Masquer le détail technique"
                      : "Voir le détail technique"}
                  </button>
                )}
              </div>
              {showTech && techDetail && (
                <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900/90 p-2 text-[11px] text-slate-100">
                  {techDetail}
                </pre>
              )}
            </div>
          )}

          {step === "paste" && (
            <div className="space-y-5">
              {mode === "chatgpt" ? (
                <>
                  <section className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <p className="text-sm font-semibold text-slate-900">
                      1 — Copier les informations du chantier
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      BeWork prépare les données utiles de cette section (
                      {sectionLabel}). Copiez-les puis utilisez-les dans votre
                      conversation ChatGPT.
                    </p>
                    {contextAlreadyCopied ? (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Contexte copié
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">
                        Utilisez le bouton « Copier le contexte pour ChatGPT »
                        dans la barre d’outils.
                      </p>
                    )}
                  </section>
                  <section>
                    <p className="text-sm font-semibold text-slate-900">
                      2 — Demander la modification à ChatGPT
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Expliquez à ChatGPT ce que vous souhaitez changer. ChatGPT
                      vous renverra un bloc de modifications compatible avec
                      BeWork.
                    </p>
                  </section>
                </>
              ) : (
                <p className="text-sm text-slate-600">
                  Collez un bloc de modifications compatible avec BeWork pour{" "}
                  {sectionLabel}.
                </p>
              )}

              <section>
                <label
                  htmlFor="bework-patch-paste"
                  className="text-sm font-semibold text-slate-900"
                >
                  {mode === "chatgpt"
                    ? "3 — Coller les modifications proposées"
                    : "Coller les modifications proposées"}
                </label>
                <textarea
                  id="bework-patch-paste"
                  ref={pasteRef}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={10}
                  spellCheck={false}
                  placeholder="Collez ici le bloc de modifications généré par ChatGPT…"
                  className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 placeholder:font-sans placeholder:text-slate-400 focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
                />
              </section>
            </div>
          )}

          {step === "preview" && analysis && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Modifications proposées
                </h3>
                <p className="mt-0.5 text-sm text-slate-500">
                  Aucune modification n’est appliquée à cette étape.
                </p>
                {addLineCount > 0 ? (
                  <p className="mt-1 text-sm font-medium text-[#1e3a5f]">
                    {addLineCount} ligne
                    {addLineCount > 1 ? "s" : ""} seront ajoutées si vous
                    confirmez.
                    {existingLineCount != null
                      ? ` · ${existingLineCount} ligne${
                          existingLineCount > 1 ? "s" : ""
                        } existante${
                          existingLineCount > 1 ? "s" : ""
                        } conservée${existingLineCount > 1 ? "s" : ""}.`
                      : ""}
                  </p>
                ) : null}
              </div>

              {impact && addLineCount > 0 ? (
                <AddLinesLotSummary
                  changes={impact.directChanges}
                  existingLineCount={existingLineCount}
                />
              ) : null}

              <DirectChangesBlock
                impact={impact}
                fallback={analysis.directChanges}
              />

              {section === "PLANNING" && impact ? (
                <PlanningPreviewSummary impact={impact} />
              ) : null}

              {(consequenceCount > 0 ||
                (analysis.potentialImpacts?.length ?? 0) > 0) && (
                <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                  <h4 className="text-sm font-semibold text-amber-950">
                    Conséquences sur le chantier
                  </h4>
                  <p className="mt-1 text-xs text-amber-900/80">
                    Cette modification peut rendre certaines données liées
                    obsolètes.
                  </p>

                  {consequenceGroups.map(({ section: s, items }) => (
                    <div key={s} className="mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/70">
                        {sectionMetierLabel(s as BeworkPatchSection)}
                      </p>
                      <ul className="mt-1.5 space-y-1.5">
                        {items.map((d, i) => (
                          <li
                            key={`${s}-${i}`}
                            className="rounded-lg border border-amber-100 bg-white/80 px-2.5 py-2 text-sm text-slate-800"
                          >
                            {consequenceLabel(d)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {impact?.protectedEntities?.length ? (
                    <ul className="mt-3 space-y-1.5">
                      {impact.protectedEntities.map((p, i) => (
                        <li
                          key={`p-${i}`}
                          className="flex items-start gap-2 text-sm text-slate-700"
                        >
                          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                          <span>
                            <span className="font-medium">
                              {sectionMetierLabel(
                                p.section as BeworkPatchSection,
                              )}{" "}
                              · {p.label}
                            </span>
                            {" — "}
                            {p.reason}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {!impact && analysis.potentialImpacts.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm text-amber-950">
                      {analysis.potentialImpacts.map((p, i) => (
                        <li key={i}>
                          {p.label} — {p.detail}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {(hasUnsupported ||
                (analysis.errors.length > 0 && !canCommit)) && (
                <section className="rounded-xl border border-red-200 bg-red-50/60 p-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-red-900">
                    <AlertTriangle className="h-4 w-4" />
                    Modifications non applicables automatiquement
                  </h4>
                  <p className="mt-1 text-sm text-red-800">
                    Cette proposition contient une modification que BeWork ne
                    peut pas encore appliquer automatiquement. Aucune
                    modification n’a été effectuée.
                  </p>
                  <ul className="mt-2 space-y-1">
                    {analysis.errors.map((e, i) => (
                      <li key={i} className="text-sm text-red-900">
                        {e.message}
                      </li>
                    ))}
                    {elig && !elig.ok && (
                      <li className="text-sm text-red-900">{elig.reason}</li>
                    )}
                  </ul>
                </section>
              )}

              {elig && elig.ok && elig.warnings.length > 0 && (
                <ul className="space-y-1 text-xs text-slate-500">
                  {elig.warnings.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              )}

              {elig && elig.ok && (
                <p className="text-xs text-slate-500">
                  {syncModeUserHint(elig.mode)}
                </p>
              )}

              <button
                type="button"
                onClick={() => setShowRawJson((v) => !v)}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
              >
                {showRawJson ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
                Afficher le JSON
              </button>
              {showRawJson && (
                <pre className="max-h-40 overflow-auto rounded-lg bg-slate-900 p-2 text-[10px] text-slate-200">
                  {rawText}
                </pre>
              )}
            </div>
          )}

          {step === "confirm" && canCommit && elig && elig.ok && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Vérifier avant d’appliquer
                </h3>
                <p className="mt-2 text-sm text-slate-700">
                  {directCount === 1
                    ? "1 modification sera appliquée."
                    : `${directCount} modifications seront appliquées.`}
                </p>
                {consequenceCount > 0 && (
                  <p className="mt-1 text-sm text-amber-900">
                    {consequenceCount === 1
                      ? "1 élément lié nécessitera une attention (revalidation ou mise à jour)."
                      : `${consequenceCount} éléments liés nécessiteront une attention (revalidation ou mise à jour).`}
                  </p>
                )}
                <p className="mt-3 text-xs text-slate-500">
                  {syncModeUserHint(elig.mode)} Un historique est conservé ; il
                  n’y a pas d’annulation automatique depuis cette fenêtre.
                </p>
              </div>
            </div>
          )}

          {step === "success" && commitSuccess && (
            <div className="space-y-4 py-2 text-center sm:text-left">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 sm:mx-0">
                <CheckCircle2 className="h-7 w-7 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Modifications appliquées
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {commitSuccess.message}
                </p>
              </div>
              <ul className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700">
                {commitSuccess.summary.takeoffUpdated && (
                  <li>
                    Métré / quantitatif mis à jour
                    {commitSuccess.versionsAfter.study != null
                      ? ` (v${commitSuccess.versionsAfter.study})`
                      : ""}
                  </li>
                )}
                {commitSuccess.summary.quoteProtected ? (
                  <li className="text-amber-900">
                    Devis : contractuel conservé — à revalider si besoin
                  </li>
                ) : commitSuccess.summary.quoteUpdated ? (
                  <li>
                    Devis mis à jour
                    {commitSuccess.versionsAfter.quoteVersion != null
                      ? ` (v${commitSuccess.versionsAfter.quoteVersion})`
                      : ""}
                  </li>
                ) : null}
                {commitSuccess.summary.planningUpdated && (
                  <li>
                    Planning chantier mis à jour
                    {commitSuccess.versionsAfter.planRevision != null
                      ? ` (rév. ${commitSuccess.versionsAfter.planRevision})`
                      : ""}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-5">
          {step === "paste" && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void runAnalyze()}
                disabled={!rawText.trim() || busy !== null}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162d4a] disabled:opacity-50"
              >
                {busy === "analyze" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyse des modifications…
                  </>
                ) : (
                  <>
                    <ClipboardPaste className="h-4 w-4" />
                    Analyser les modifications
                  </>
                )}
              </button>
            </>
          )}

          {step === "preview" && (
            <>
              <button
                type="button"
                onClick={() => {
                  setStep("paste");
                  setUserError(null);
                }}
                disabled={busy !== null}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={() => setStep("confirm")}
                disabled={!canCommit || busy !== null}
                title={
                  !canCommit
                    ? "Certaines modifications ne peuvent pas être appliquées automatiquement"
                    : undefined
                }
                className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162d4a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Eye className="h-4 w-4" />
                Continuer vers la confirmation
              </button>
            </>
          )}

          {step === "confirm" && (
            <>
              <button
                type="button"
                onClick={() => setStep("preview")}
                disabled={busy === "commit"}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void runCommit()}
                disabled={!canCommit || busy !== null}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === "commit" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Application des modifications…
                  </>
                ) : (
                  "Appliquer les modifications"
                )}
              </button>
            </>
          )}

          {step === "success" && (
            <button
              type="button"
              onClick={handleSuccessClose}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162d4a]"
            >
              Voir les données mises à jour
            </button>
          )}
        </div>

        {busy === "analyze" && (
          <p className="sr-only" aria-live="polite">
            Analyse des modifications en cours. Aucune modification n’est
            appliquée à cette étape.
          </p>
        )}
        {busy === "commit" && (
          <p className="sr-only" aria-live="polite">
            Application des modifications en cours.
          </p>
        )}
      </div>
    </div>
  );
}

/** Synthèse métier Planning — pas de JSON brut. */
function PlanningPreviewSummary({
  impact,
}: {
  impact: AnalyzePatchImpactResult;
}) {
  const tasks = new Set<string>();
  const durations: string[] = [];
  const crews: string[] = [];
  const deps: string[] = [];
  let endBefore: unknown = undefined;
  let endAfter: unknown = undefined;

  for (const c of impact.directChanges) {
    if (c.label) tasks.add(c.label);
    const f = (c.field ?? "").toLowerCase();
    if (f.includes("duration")) {
      durations.push(
        `${c.label} : ${formatValue(c.before)} → ${formatValue(c.after)}${c.unit ? ` ${c.unit}` : ""}`,
      );
    }
    if (f.includes("crew") || f.includes("effectif")) {
      crews.push(
        `${c.label} : ${formatValue(c.before)} → ${formatValue(c.after)}`,
      );
    }
    if (f.includes("depend")) {
      deps.push(`${c.label} : ${formatValue(c.after)}`);
    }
  }
  for (const d of impact.derivedChanges) {
    if (d.label) tasks.add(d.label);
    if (d.field === "duration_days") {
      durations.push(
        `${d.label} : ${formatValue(d.before)} → ${formatValue(d.after)} j`,
      );
    }
    if (d.field === "end_date") {
      endBefore = d.before;
      endAfter = d.after;
    }
    if (d.field === "base_duration_working_days") {
      durations.push(
        `Durée chantier : ${formatValue(d.before)} → ${formatValue(d.after)} j`,
      );
    }
  }

  if (
    tasks.size === 0 &&
    durations.length === 0 &&
    crews.length === 0 &&
    deps.length === 0 &&
    endBefore === undefined
  ) {
    return null;
  }

  return (
    <section className="rounded-xl border border-[#1e3a5f]/15 bg-[#1e3a5f]/[0.03] p-3">
      <h4 className="text-sm font-semibold text-[#1e3a5f]">
        Impact planning
      </h4>
      <dl className="mt-2 space-y-2 text-sm text-slate-700">
        {tasks.size > 0 ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tâches concernées
            </dt>
            <dd className="mt-0.5">{tasks.size} intervention{tasks.size > 1 ? "s" : ""}</dd>
          </div>
        ) : null}
        {durations.length > 0 ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Durées changées
            </dt>
            <dd className="mt-0.5 space-y-0.5">
              {durations.slice(0, 8).map((l) => (
                <p key={l}>{l}</p>
              ))}
            </dd>
          </div>
        ) : null}
        {crews.length > 0 ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Équipes changées
            </dt>
            <dd className="mt-0.5 space-y-0.5">
              {crews.slice(0, 8).map((l) => (
                <p key={l}>{l}</p>
              ))}
            </dd>
          </div>
        ) : null}
        {deps.length > 0 ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Dépendances changées
            </dt>
            <dd className="mt-0.5 space-y-0.5">
              {deps.slice(0, 8).map((l) => (
                <p key={l}>{l}</p>
              ))}
            </dd>
          </div>
        ) : null}
        {endBefore !== undefined || endAfter !== undefined ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Impact sur fin chantier
            </dt>
            <dd className="mt-0.5">
              {formatValue(endBefore)} → {formatValue(endAfter)}
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}

function AddLinesLotSummary({
  changes,
  existingLineCount,
}: {
  changes: DirectChange[];
  existingLineCount: number | null;
}) {
  const total = countAddLines(changes);
  const lots = summarizeAddLineLots(changes);
  const stats = summarizeAddLineStats(changes);
  if (total === 0) return null;
  return (
    <section className="rounded-xl border border-[#1e3a5f]/15 bg-[#1e3a5f]/[0.03] p-3">
      <h4 className="text-sm font-semibold text-[#1e3a5f]">
        {total} ligne{total > 1 ? "s" : ""} à ajouter
        {existingLineCount != null
          ? ` · ${existingLineCount} existante${
              existingLineCount > 1 ? "s" : ""
            } conservée${existingLineCount > 1 ? "s" : ""}`
          : ""}
      </h4>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <SummaryChip label="Devis" value={stats.quote} />
        <SummaryChip label="Indicateurs" value={stats.indicator} />
        <SummaryChip label="Hypothèses" value={stats.hypothesis} />
        <SummaryChip label="Calculées" value={stats.calculated} />
      </div>
      {lots.length > 0 ? (
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Répartition par lots
          </p>
          <ul className="mt-1.5 space-y-1 text-sm text-slate-700">
            {lots.map((l) => (
              <li
                key={l.lot}
                className="flex items-center justify-between gap-3 rounded-md bg-white/70 px-2 py-1"
              >
                <span className="min-w-0 truncate font-medium text-slate-800">
                  {l.lot}
                </span>
                <span className="shrink-0 tabular-nums text-[#1e3a5f]">
                  {l.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function SummaryChip({ label, value }: { label: string; value: number }) {
  if (!value) return null;
  return (
    <span className="rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
      {label} : {value}
    </span>
  );
}

function AddLinePreviewCard({ change }: { change: DirectChange }) {
  const [open, setOpen] = useState(false);
  const line = parseAddLineAfter(change.after);
  if (!line) {
    return (
      <li className="rounded-lg border border-red-100 bg-red-50/60 p-2.5 text-sm text-red-800">
        Ajout de ligne illisible — payload line manquant.
      </li>
    );
  }

  const qty = formatQuantityWithUnit(line.declared_quantity, line.unit);
  const formula = formatFormulaDisplay(line.formula);
  const notes = parseTechnicalNotes(line.notes, {
    formula: line.formula,
    quantity: line.declared_quantity,
    unit: line.unit,
  });
  const hasDetail =
    Boolean(notes?.controls.length) ||
    Boolean(notes?.reserves.length) ||
    Boolean(notes?.other) ||
    (!notes && Boolean(line.notes)) ||
    Boolean(line.description && line.description.length > 180);

  return (
    <li className="rounded-xl border border-emerald-100 bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-800">
            Ajout de ligne
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Avant : <span className="font-medium text-slate-700">Ligne inexistante</span>
          </p>
        </div>
        <AddLineBadges line={line} />
      </div>

      <dl className="mt-3 grid gap-2.5 sm:grid-cols-2">
        <Field label="Code" value={line.code} strong />
        <Field label="Lot" value={line.lot} strong />
        <div className="sm:col-span-2">
          <Field label="Désignation" value={line.designation} strong />
        </div>
        {line.description ? (
          <div className="sm:col-span-2">
            <Field
              label="Description"
              value={
                open
                  ? line.description
                  : line.description.length > 180
                    ? `${line.description.slice(0, 180)}…`
                    : line.description
              }
            />
          </div>
        ) : null}
        <Field label="Quantité" value={qty ?? `— ${formatDisplayUnit(line.unit)}`} strong />
        {formula ? <Field label="Formule" value={formula} mono /> : null}
        {line.provenance ? (
          <Field
            label="Provenance"
            value={provenanceBadgeLabel(line.provenance) ?? line.provenance}
          />
        ) : null}
        {line.role ? (
          <Field label="Rôle" value={roleBadgeLabel(line.role) ?? line.role} />
        ) : null}
        {line.nature ? (
          <Field label="Nature" value={natureLabel(line.nature) ?? line.nature} />
        ) : null}
      </dl>

      {(notes?.metre || notes?.references.length) ? (
        <div className="mt-3 space-y-2 rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-2 text-[12.5px] leading-relaxed text-slate-700">
          {notes?.metre ? <NotesBlock title="Métré" body={notes.metre} /> : null}
          {notes?.references.length ? (
            <NotesBlock title="Références" items={notes.references} />
          ) : null}
        </div>
      ) : null}

      {hasDetail ? (
        <div className="mt-3 border-t border-slate-100 pt-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1e3a5f]"
          >
            {open ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            Voir contrôles / réserves
          </button>
          {open ? (
            <div className="mt-2 space-y-2.5 rounded-lg bg-slate-50 px-2.5 py-2 text-[12.5px] leading-relaxed text-slate-700">
              {notes?.controls.length ? (
                <NotesBlock title="Contrôles" items={notes.controls} />
              ) : null}
              {notes?.reserves.length ? (
                <NotesBlock title="Réserves" items={notes.reserves} />
              ) : null}
              {notes?.other ? (
                <NotesBlock title="Notes" body={notes.other} />
              ) : null}
              {!notes && line.notes ? (
                <NotesBlock title="Notes techniques / CCTP" body={line.notes} />
              ) : null}
              {line.description && line.description.length > 180 ? (
                <NotesBlock title="Description complète" body={line.description} />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function Field({
  label,
  value,
  strong,
  mono,
}: {
  label: string;
  value: string;
  strong?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd
        className={`mt-0.5 whitespace-pre-wrap text-[13.5px] text-slate-800 ${
          strong ? "font-semibold" : ""
        } ${mono ? "font-mono text-[12.5px]" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function NotesBlock({
  title,
  body,
  items,
}: {
  title: string;
  body?: string;
  items?: string[];
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      {body ? <p className="mt-0.5 whitespace-pre-wrap">{body}</p> : null}
      {items?.length ? (
        <ul className="mt-0.5 list-disc space-y-0.5 pl-4">
          {items.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function AddLineBadges({ line }: { line: AddLinePreviewPayload }) {
  const badges: Array<{ text: string; tone: string }> = [
    { text: "AJOUT", tone: "bg-emerald-50 text-emerald-900 ring-emerald-200" },
  ];
  const prov = provenanceBadgeLabel(line.provenance);
  if (prov) {
    badges.push({
      text: prov,
      tone: "bg-violet-50 text-violet-900 ring-violet-200",
    });
  }
  const role = roleBadgeLabel(line.role);
  if (role) {
    badges.push({
      text: role,
      tone:
        line.role === "indicator"
          ? "bg-sky-50 text-sky-900 ring-sky-200"
          : "bg-slate-50 text-slate-800 ring-slate-200",
    });
  }
  if (line.formula) {
    badges.push({
      text: "CALCULÉ",
      tone: "bg-amber-50 text-amber-950 ring-amber-200",
    });
  }
  return (
    <div className="flex flex-wrap justify-end gap-1">
      {badges.map((b) => (
        <span
          key={b.text}
          className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${b.tone}`}
        >
          {b.text}
        </span>
      ))}
    </div>
  );
}

function DirectChangesBlock({
  impact,
  fallback,
}: {
  impact: AnalyzePatchImpactResult | null;
  fallback: BeworkPatchAnalyzeResult["directChanges"];
}) {
  const changes: DirectChange[] = impact?.directChanges ?? [];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3">
      <h4 className="text-sm font-semibold text-slate-900">
        Modifications demandées
      </h4>
      {changes.length === 0 && fallback.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          Aucun changement direct détecté.
        </p>
      ) : changes.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {changes.map((c, i) =>
            isAddLineDirectChange(c) ? (
              <AddLinePreviewCard
                key={`${c.entityType}-${c.entityId}-${c.field}-${i}`}
                change={c}
              />
            ) : (
              <li
                key={`${c.entityType}-${c.entityId}-${c.field}-${i}`}
                className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5"
              >
                <p className="text-xs font-medium text-slate-500">
                  {c.label}
                  <span className="text-slate-300"> · </span>
                  {fieldMetierLabel(c.field)}
                </p>
                <div className="mt-1.5 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                  <span className="rounded bg-white px-2 py-1 text-sm text-slate-600 line-through decoration-slate-300 sm:max-w-[45%] sm:truncate">
                    {formatValue(c.before)}
                    {c.unit && typeof c.after !== "object"
                      ? ` ${formatDisplayUnit(c.unit)}`
                      : ""}
                  </span>
                  <span className="hidden text-slate-400 sm:inline" aria-hidden>
                    →
                  </span>
                  <span className="text-xs font-medium text-slate-400 sm:hidden">
                    Après
                  </span>
                  <span
                    className={`rounded px-2 py-1 text-sm font-medium sm:max-w-[45%] sm:truncate ${
                      c.protectionStatus === "BLOCKED"
                        ? "bg-red-50 text-red-900"
                        : c.protectionStatus === "OVERRIDE_OK"
                          ? "bg-amber-50 text-amber-950"
                          : "bg-emerald-50 text-emerald-900"
                    }`}
                  >
                    {typeof c.after === "object" && c.after !== null
                      ? formatValue(c.after)
                      : `${formatValue(c.after)}${
                          c.unit ? ` ${formatDisplayUnit(c.unit)}` : ""
                        }`}
                  </span>
                </div>
                {(c.currentProvenanceLabel || c.proposalProvenanceLabel) && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    {c.currentProvenanceLabel
                      ? `Source actuelle : ${c.currentProvenanceLabel}`
                      : null}
                    {c.currentProvenanceLabel && c.proposalProvenanceLabel
                      ? " · "
                      : null}
                    {c.proposalProvenanceLabel
                      ? `Proposition : ${c.proposalProvenanceLabel}`
                      : null}
                  </p>
                )}
                {c.protectionStatus === "BLOCKED" && c.protectionMessage ? (
                  <p className="mt-1.5 text-xs font-medium text-red-700">
                    ⛔ Modification bloquée — {c.protectionMessage}
                  </p>
                ) : null}
                {c.protectionStatus === "OVERRIDE_OK" && c.protectionMessage ? (
                  <p className="mt-1.5 text-xs font-medium text-amber-800">
                    {c.protectionMessage}
                  </p>
                ) : null}
              </li>
            ),
          )}
        </ul>
      ) : (
        <ul className="mt-3 space-y-2">
          {fallback.map((c, i) => (
            <li
              key={i}
              className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 text-sm text-slate-700"
            >
              <p className="font-medium text-slate-900">{c.targetSummary}</p>
              <p className="mt-0.5 text-slate-600">{c.changesSummary}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export { sectionMetierLabel };
