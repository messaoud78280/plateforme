"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { BeworkPatchSection } from "@/lib/bework-patch/types";
import type { SectionPatchCapability } from "@/lib/bework-patch/capability";
import type { BeworkPatchAnalyzeResult } from "@/lib/bework-patch/analyze";
import type { AnalyzePatchImpactResult } from "@/lib/bework-patch/impact/types";

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

type Step = "paste" | "result" | "confirm" | "success" | "failure";

type CommitMeta = {
  fingerprint: string;
  eligibility:
    | {
        ok: true;
        mode: "FULL_SYNC" | "SAFE_PARTIAL_SYNC" | "QUOTE_ONLY" | "PLANNING_ONLY" | "VISIT_ONLY" | "FOLLOW_UP_ONLY" | "REPORT_ONLY";
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
}: Props) {
  const [step, setStep] = useState<Step>("paste");
  const [rawText, setRawText] = useState("");
  const [busy, setBusy] = useState(false);
  const [analysis, setAnalysis] = useState<BeworkPatchAnalyzeResult | null>(null);
  const [commitMeta, setCommitMeta] = useState<CommitMeta | null>(null);
  const [commitSuccess, setCommitSuccess] = useState<CommitSuccess | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStep("paste");
    setRawText("");
    setAnalysis(null);
    setCommitMeta(null);
    setCommitSuccess(null);
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
    setCommitMeta(null);
    setCommitSuccess(null);
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
      setCommitMeta((data.commit as CommitMeta) ?? null);
      setStep("result");
    } catch {
      setBanner("Erreur réseau lors de l’analyse.");
      setStep("failure");
    } finally {
      setBusy(false);
    }
  }

  async function confirmCommit() {
    if (!commitMeta?.eligibility || !("ok" in commitMeta.eligibility) || !commitMeta.eligibility.ok) {
      return;
    }
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch("/api/bework-patch/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw: rawText,
          projectId,
          previewFingerprint: commitMeta.fingerprint,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setBanner(
          data?.error ??
            "Synchronisation annulée. Aucune donnée n’a été modifiée.",
        );
        setStep("failure");
        return;
      }
      setCommitSuccess({
        syncMode: data.syncMode,
        message: data.message,
        summary: data.summary,
        versionsAfter: data.versionsAfter,
      });
      setStep("success");
      onApplied();
    } catch {
      setBanner("Synchronisation annulée. Aucune donnée n’a été modifiée.");
      setStep("failure");
    } finally {
      setBusy(false);
    }
  }

  const title =
    mode === "chatgpt" ? "Modifier avec ChatGPT" : "Modifier par bloc JSON";
  const elig = commitMeta?.eligibility;

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
          {capability.mode === "PREVIEW_ONLY" && capability.label && !elig?.ok ? (
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
              <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-[12.5px] text-sky-950">
                Analyse Impact Engine — fingerprint recalculé au commit.
              </div>

              {analysis.errors.length ? (
                <IssueBlock
                  title="Erreurs"
                  tone="error"
                  items={analysis.errors.map((e) => `${e.code} — ${e.message}`)}
                />
              ) : null}
              {analysis.warnings.length ? (
                <IssueBlock
                  title="Avertissements"
                  tone="warn"
                  items={analysis.warnings.map((w) => `${w.code} — ${w.message}`)}
                />
              ) : null}

              {analysis.impact ? (
                <ImpactPreview impact={analysis.impact} />
              ) : (
                <p className="text-[13px] text-slate-500">
                  Impact Engine non disponible pour cette section.
                </p>
              )}

              {elig && !elig.ok ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-950">
                  Commit indisponible : {elig.reason}
                </div>
              ) : null}
              {elig && elig.ok && elig.warnings.length ? (
                <IssueBlock title="Avant commit" tone="warn" items={elig.warnings} />
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
                {elig && elig.ok ? (
                  <button
                    type="button"
                    className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
                    disabled={busy}
                    onClick={() => setStep("confirm")}
                  >
                    {elig.buttonLabel}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-medium text-slate-400"
                    disabled
                    title={elig && !elig.ok ? elig.reason : "Commit non disponible"}
                  >
                    Appliquer et synchroniser
                  </button>
                )}
              </div>
            </>
          ) : null}

          {step === "confirm" && elig && elig.ok ? (
            <>
              <div className="rounded-xl border border-[#1e3a5f]/20 bg-[#1e3a5f]/5 px-4 py-3">
                <h3 className="text-[14px] font-semibold text-[#1e3a5f]">
                  Vous allez modifier
                </h3>
                <ul className="mt-2 space-y-1 text-[13px] text-slate-700">
                  {analysis?.impact?.directChanges.map((d, i) => (
                    <li key={i}>
                      {d.label} : {fmtVal(d.before)} → {fmtVal(d.after)}
                      {d.unit ? ` ${d.unit}` : ""}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[12.5px] text-slate-600">
                  Mode : <strong>{elig.mode}</strong> — opération appliquée en une
                  transaction.
                </p>
                {elig.mode === "SAFE_PARTIAL_SYNC" ? (
                  <p className="mt-2 text-[12.5px] font-medium text-amber-900">
                    Ce n’est pas une synchronisation totale : les éléments protégés
                    restent intacts.
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-[13px]"
                  disabled={busy}
                  onClick={() => setStep("result")}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
                  disabled={busy}
                  onClick={() => void confirmCommit()}
                >
                  {busy ? "Application…" : "Confirmer"}
                </button>
              </div>
            </>
          ) : null}

          {step === "success" && commitSuccess ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-900">
                {commitSuccess.message}
              </div>
              <ul className="space-y-1 text-[13px] text-slate-700">
                <li>
                  Métré {commitSuccess.summary.takeoffUpdated ? "✓" : "—"}
                  {commitSuccess.versionsAfter.study != null
                    ? ` · v${commitSuccess.versionsAfter.study}`
                    : ""}
                </li>
                <li>
                  Devis{" "}
                  {commitSuccess.summary.quoteProtected
                    ? "contractuel conservé ⚠"
                    : commitSuccess.summary.quoteUpdated
                      ? "✓"
                      : "—"}
                  {commitSuccess.versionsAfter.quoteVersion != null
                    ? ` · v${commitSuccess.versionsAfter.quoteVersion}`
                    : ""}
                </li>
                <li>
                  Planning {commitSuccess.summary.planningUpdated ? "✓" : "—"}
                  {commitSuccess.versionsAfter.planRevision != null
                    ? ` · rev ${commitSuccess.versionsAfter.planRevision}`
                    : ""}
                </li>
              </ul>
              <button
                type="button"
                className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-[13px] font-semibold text-white"
                onClick={onClose}
              >
                Fermer
              </button>
            </div>
          ) : null}

          {step === "failure" ? (
            <div className="space-y-3">
              <p className="text-[13px] text-red-700">
                {banner ?? "Synchronisation annulée. Aucune donnée n’a été modifiée."}
              </p>
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

function fmtVal(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "number") {
    return Number.isInteger(v)
      ? String(v)
      : v.toLocaleString("fr-FR", { maximumFractionDigits: 4 });
  }
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function certaintyBadge(c: string) {
  const map: Record<string, string> = {
    CERTAIN: "bg-emerald-100 text-emerald-900",
    PARTIAL: "bg-amber-100 text-amber-950",
    POTENTIAL: "bg-orange-100 text-orange-950",
    NONE: "bg-slate-100 text-slate-600",
  };
  return map[c] ?? "bg-slate-100 text-slate-700";
}

function ImpactPreview({ impact }: { impact: AnalyzePatchImpactResult }) {
  const takeoff = impact.derivedChanges.filter((d) => d.section === "TAKEOFF");
  const quote = impact.derivedChanges.filter((d) => d.section === "QUOTE");
  const planning = impact.derivedChanges.filter((d) => d.section === "PLANNING");
  const cr = impact.canonicalResolution;

  return (
    <div className="space-y-3">
      <Section title="Modification demandée">
        {impact.directChanges.length === 0 ? (
          <p className="text-[12.5px] text-slate-500">Aucune</p>
        ) : (
          <ul className="space-y-1.5 text-[12.5px]">
            {impact.directChanges.map((d, i) => (
              <li key={i} className="font-mono text-emerald-900">
                <span className="font-sans font-semibold text-slate-800">
                  {d.label}
                </span>{" "}
                {fmtVal(d.before)}
                {d.unit ? ` ${d.unit}` : ""} → {fmtVal(d.after)}
                {d.unit ? ` ${d.unit}` : ""}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Donnée canonique">
        <p className="text-[12.5px] text-slate-700">
          Résolution :{" "}
          <span
            className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${certaintyBadge(
              cr.status === "EXACT"
                ? "CERTAIN"
                : cr.status === "PARTIAL"
                  ? "PARTIAL"
                  : "NONE",
            )}`}
          >
            {cr.status}
          </span>
          {cr.resolved_to ? ` · ${cr.resolved_to}` : ""}
          {cr.parameter_key ? ` · ${cr.parameter_key}` : ""}
          {cr.study_line_code ? ` · ${cr.study_line_code}` : ""}
        </p>
        {cr.note ? (
          <p className="mt-1 text-[12px] text-amber-900">{cr.note}</p>
        ) : null}
      </Section>

      {takeoff.length ? (
        <Section title="Recalculs métré">
          <DerivedList items={takeoff} />
        </Section>
      ) : null}
      {quote.length ? (
        <Section title="Devis impacté">
          <DerivedList items={quote} />
        </Section>
      ) : null}
      {planning.length ? (
        <Section title="Planning impacté">
          <DerivedList items={planning} />
        </Section>
      ) : null}

      <Section title="Protégés">
        {impact.protectedEntities.length === 0 ? (
          <p className="text-[12.5px] text-slate-500">aucun</p>
        ) : (
          <ul className="space-y-1 text-[12.5px] text-red-900">
            {impact.protectedEntities.map((p, i) => (
              <li key={i}>
                <strong>{p.label}</strong> — {p.reason}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function DerivedList({
  items,
}: {
  items: AnalyzePatchImpactResult["derivedChanges"];
}) {
  return (
    <ul className="space-y-1.5 text-[12.5px]">
      {items.map((d, i) => (
        <li key={i} className="flex flex-wrap items-baseline gap-2">
          <span className="font-semibold text-slate-800">{d.label}</span>
          <span className="font-mono text-emerald-900">
            {d.field}: {fmtVal(d.before)}
            {d.unit ? ` ${d.unit}` : ""} → {fmtVal(d.after)}
            {d.unit ? ` ${d.unit}` : ""}
          </span>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${certaintyBadge(d.certainty)}`}
          >
            {d.certainty}
          </span>
          {d.blocked ? (
            <span className="text-[11px] font-medium text-amber-800">bloqué</span>
          ) : null}
        </li>
      ))}
    </ul>
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
