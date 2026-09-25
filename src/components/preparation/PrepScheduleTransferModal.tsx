"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatQty } from "@/lib/preparation/units";
import type { SchedulePreview } from "@/lib/preparation/schedule/transfer";

type Props = {
  studyId: string;
  open: boolean;
  onClose: () => void;
};

function newKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `prep-sched-${crypto.randomUUID()}`;
  }
  return `prep-sched-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function PrepScheduleTransferModal({ studyId, open, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<SchedulePreview | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [quoteId, setQuoteId] = useState<string>("");
  const [idempotencyKey, setIdempotencyKey] = useState(newKey);
  const [step, setStep] = useState<"existing" | "preview" | "done">("preview");
  const [createdHref, setCreatedHref] = useState<string | null>(null);
  const [forceCreate, setForceCreate] = useState(false);

  const reset = useCallback(() => {
    setBusy(false);
    setError(null);
    setPreview(null);
    setSelected(new Set());
    setQuoteId("");
    setIdempotencyKey(newKey());
    setStep("preview");
    setCreatedHref(null);
    setForceCreate(false);
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose, reset]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      setError(null);
      try {
        const q = quoteId ? `?quoteId=${encodeURIComponent(quoteId)}` : "";
        const res = await fetch(`/api/prep-studies/${studyId}/schedule-preview${q}`);
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? "Prévisualisation impossible");
        if (cancelled) return;
        const p = data as SchedulePreview;
        setPreview(p);
        setSelected(new Set(p.tasks.filter((t) => t.selectedByDefault).map((t) => t.stepId)));
        if (p.existingPlans.length && !forceCreate) setStep("existing");
        else setStep("preview");
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, studyId, quoteId, forceCreate]);

  async function commit() {
    if (!selected.size || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/prep-studies/${studyId}/schedule-commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedStepIds: [...selected],
          idempotencyKey,
          quoteId: quoteId || null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Enregistrement impossible");
      setCreatedHref(data.href);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-[1.1rem] font-semibold text-[#1e3a5f]">
              Générer un planning de chantier
            </h2>
            {preview ? (
              <p className="mt-0.5 text-[13px] text-slate-500">
                {preview.studyTitle} · {preview.projectTitle}
                {preview.baseDurationWorkingDays != null
                  ? ` · Durée de base ${preview.baseDurationWorkingDays} j ouvrés`
                  : ""}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-full px-2 py-1 text-[13px] text-slate-500 hover:bg-slate-100"
          >
            Fermer
          </button>
        </header>

        {preview?.watermark ? (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-2 text-[12px] font-medium text-amber-900">
            {preview.watermark} — planning prévisionnel de démonstration, non contractuel.
          </div>
        ) : null}

        {error ? (
          <div className="mx-5 mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
            {error}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {busy && !preview ? (
            <p className="text-[13px] text-slate-500">Calcul du planning…</p>
          ) : null}

          {step === "existing" && preview ? (
            <div className="space-y-4">
              <p className="text-[13px] text-slate-700">
                Un planning existe déjà pour cette étude. Ouvrez-le, ou créez-en un autre
                explicitement.
              </p>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {preview.existingPlans.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                    <div>
                      <p className="font-medium text-[#1e3a5f]">{p.title}</p>
                      <p className="text-[12px] text-slate-500">
                        {p.revisionKind} · {p.status}
                        {p.baseDurationWorkingDays != null
                          ? ` · ${p.baseDurationWorkingDays} j`
                          : ""}
                      </p>
                    </div>
                    <Link
                      href={p.href}
                      className="rounded-full bg-[#1e3a5f] px-3 py-1.5 text-[12px] font-medium text-white"
                    >
                      Ouvrir
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => {
                  setForceCreate(true);
                  setIdempotencyKey(newKey());
                  setStep("preview");
                }}
                className="rounded-full border border-[#1e3a5f]/30 px-4 py-2 text-[13px] font-medium text-[#1e3a5f]"
              >
                Créer un autre planning
              </button>
            </div>
          ) : null}

          {step === "preview" && preview ? (
            <div className="space-y-4">
              {preview.quoteOptions.length ? (
                <label className="block text-[13px]">
                  <span className="font-medium text-slate-700">Devis de référence (facultatif)</span>
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px]"
                    value={quoteId}
                    onChange={(e) => setQuoteId(e.target.value)}
                  >
                    <option value="">Aucun — planning sans montants</option>
                    {preview.quoteOptions.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.number} — {q.subject}
                        {q.isDemonstration ? " (démo)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
                  Aucun devis lié à cette étude — vous pourrez en associer un plus tard.
                </p>
              )}

              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-[#1e3a5f]/10 bg-white px-3 py-2">
                  <p className="text-[11px] text-slate-500">Démarrage</p>
                  <p className="font-semibold text-[#1e3a5f]">{preview.startDate ?? "—"}</p>
                </div>
                <div className="rounded-xl border border-[#1e3a5f]/10 bg-white px-3 py-2">
                  <p className="text-[11px] text-slate-500">Durée de base</p>
                  <p className="font-semibold text-[#1e3a5f]">
                    {preview.baseDurationWorkingDays ?? "—"} j ouvrés
                  </p>
                </div>
                <div className="rounded-xl border border-[#1e3a5f]/10 bg-white px-3 py-2">
                  <p className="text-[11px] text-slate-500">Fin de base</p>
                  <p className="font-semibold text-[#1e3a5f]">{preview.baseEndDate ?? "—"}</p>
                </div>
              </div>

              {preview.warnings.length ? (
                <details className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
                  <summary>{preview.warnings.length} avertissement(s)</summary>
                  <ul className="mt-1 list-disc pl-4">
                    {preview.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </details>
              ) : null}

              <ul className="space-y-1.5">
                {preview.tasks.map((t) => {
                  const checked = selected.has(t.stepId);
                  return (
                    <li
                      key={t.stepId}
                      className={cn(
                        "rounded-xl border px-3 py-2",
                        t.conditional && "border-dashed border-slate-300 bg-slate-50/80",
                        t.holdPoint && "border-amber-300",
                        checked && !t.conditional && "border-[#1e3a5f]/25 bg-[#1e3a5f]/[0.03]",
                      )}
                    >
                      <label className="flex cursor-pointer gap-3">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={checked}
                          onChange={() => {
                            setSelected((prev) => {
                              const n = new Set(prev);
                              if (n.has(t.stepId)) n.delete(t.stepId);
                              else n.add(t.stepId);
                              return n;
                            });
                          }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline gap-x-2">
                            <span className="font-mono text-[11px] text-slate-500">{t.stepId}</span>
                            <span className="text-[13px] font-medium text-slate-900">{t.name}</span>
                            <span className="text-[11px] text-slate-500">{t.kindLabel}</span>
                            {t.holdPoint ? (
                              <span className="rounded bg-amber-100 px-1.5 text-[10px] font-medium text-amber-800">
                                Point d&apos;arrêt
                              </span>
                            ) : null}
                            {t.conditional ? (
                              <span className="rounded bg-slate-200 px-1.5 text-[10px] font-medium text-slate-700">
                                Conditionnel
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-0.5 block text-[12px] text-slate-600">
                            {t.durationDays} j {t.durationCalendar === "calendar" ? "calendaires" : "ouvrés"}
                            {" · "}
                            {t.startDate} → {t.endDate}
                            {t.quantity != null
                              ? ` · ${formatQty(t.quantity)} ${t.quantityUnit ?? ""}`
                              : ""}
                            {t.rateValue != null
                              ? ` · ${t.rateValue} ${t.rateUnit} (${t.ratePerLabel})`
                              : ""}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-slate-500">
                            Équipe : {t.crewLabel} · Engins : {t.equipmentLabel}
                            {t.dependsOn.length
                              ? ` · Après ${t.dependsOn.map((d) => `${d.stepId}(${d.type})`).join(", ")}`
                              : ""}
                          </span>
                          {t.sellHt != null ? (
                            <span className="mt-0.5 block text-[11px] text-[#1e3a5f]">
                              Vente HT liée : {t.sellHt.toFixed(2)} €
                              {t.costHt != null ? ` · Déboursé : ${t.costHt.toFixed(2)} €` : ""}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {step === "done" ? (
            <div className="space-y-3 text-[13px] text-slate-700">
              <p>Planning enregistré. Aucun événement Agenda n&apos;a été créé automatiquement.</p>
              {createdHref ? (
                <Link
                  href={createdHref}
                  className="inline-flex rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white"
                >
                  Ouvrir le planning
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        {step === "preview" && preview ? (
          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-5 py-3">
            <p className="text-[12px] text-slate-500">{selected.size} intervention(s)</p>
            <div className="flex gap-2">
              {preview.existingPlans.length ? (
                <button
                  type="button"
                  onClick={() => {
                    setForceCreate(false);
                    setStep("existing");
                  }}
                  className="rounded-full px-3 py-2 text-[13px] text-slate-600"
                >
                  Retour
                </button>
              ) : null}
              <button
                type="button"
                disabled={busy || selected.size === 0}
                onClick={() => void commit()}
                className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-40"
              >
                {busy ? "Enregistrement…" : "Enregistrer le planning"}
              </button>
            </div>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
