"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { displayUnit, formatQty } from "@/lib/preparation/units";
import type { PrepQuoteDiff, PrepQuotePreview } from "@/lib/preparation/quote-bridge/transfer";

type Props = {
  studyId: string;
  open: boolean;
  onClose: () => void;
};

type Step = "existing" | "select" | "done" | "diffs";

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `prep-quote-${crypto.randomUUID()}`;
  }
  return `prep-quote-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function PrepQuoteTransferModal({ studyId, open, onClose }: Props) {
  const [step, setStep] = useState<Step>("select");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PrepQuotePreview | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const [createdHref, setCreatedHref] = useState<string | null>(null);
  const [createdNumber, setCreatedNumber] = useState<string | null>(null);
  const [diffs, setDiffs] = useState<PrepQuoteDiff[]>([]);
  const [forceCreate, setForceCreate] = useState(false);

  const reset = useCallback(() => {
    setStep("select");
    setBusy(false);
    setError(null);
    setPreview(null);
    setSelected(new Set());
    setIdempotencyKey(newIdempotencyKey());
    setCreatedHref(null);
    setCreatedNumber(null);
    setDiffs([]);
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
        const res = await fetch(`/api/prep-studies/${studyId}/quote-preview`);
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? "Prévisualisation impossible");
        if (cancelled) return;
        const p = data as PrepQuotePreview;
        setPreview(p);
        setSelected(new Set(p.transferable.filter((l) => l.selectedByDefault).map((l) => l.code)));
        if (p.existingQuotes.length > 0 && !forceCreate) {
          setStep("existing");
        } else {
          setStep("select");
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, studyId, forceCreate]);

  const selectedCount = selected.size;
  const transferableByLot = useMemo(() => {
    if (!preview) return [];
    const map = new Map<string, typeof preview.transferable>();
    for (const line of preview.transferable) {
      const key = `${line.lot} — ${line.lotLabel}`;
      const list = map.get(key) ?? [];
      list.push(line);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [preview]);

  async function loadDiffs(quoteId?: string) {
    setBusy(true);
    setError(null);
    try {
      const q = quoteId ? `?quoteId=${encodeURIComponent(quoteId)}` : "";
      const res = await fetch(`/api/prep-studies/${studyId}/quote-diffs${q}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Écarts indisponibles");
      setDiffs(data.diffs ?? []);
      setStep("diffs");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (!selectedCount || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/prep-studies/${studyId}/quote-commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedCodes: [...selected],
          idempotencyKey,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Création du devis impossible");
      setCreatedHref(data.href);
      setCreatedNumber(data.quoteNumber);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function applySync(
    linkId: string,
    fields: {
      applyQuantity?: boolean;
      applyDesignation?: boolean;
      applyUnit?: boolean;
      applyDescription?: boolean;
    },
  ) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/prep-studies/${studyId}/quote-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId, ...fields }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Mise à jour impossible");
      await loadDiffs();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prep-quote-title"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 id="prep-quote-title" className="text-[1.1rem] font-semibold text-[#1e3a5f]">
              Générer un devis depuis ce métré
            </h2>
            {preview ? (
              <p className="mt-0.5 truncate text-[13px] text-slate-500">
                {preview.studyTitle} · {preview.projectTitle}
                {preview.isDemonstration ? " · Démonstration" : ""}
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
            {preview.watermark} — brouillon chiffrable, sans envoi client ni facturation.
          </div>
        ) : null}

        {error ? (
          <div className="mx-5 mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
            {error}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {busy && !preview ? (
            <p className="text-[13px] text-slate-500">Chargement de la prévisualisation…</p>
          ) : null}

          {step === "existing" && preview ? (
            <div className="space-y-4">
              <p className="text-[13px] text-slate-700">
                Un ou plusieurs devis existent déjà pour cette étude. Ouvrez-en un, ou créez-en un
                autre explicitement.
              </p>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {preview.existingQuotes.map((q) => (
                  <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="font-medium text-[#1e3a5f]">
                        {q.number}
                        {q.isDemonstration ? (
                          <span className="ml-2 text-[11px] font-normal text-amber-700">Démo</span>
                        ) : null}
                      </p>
                      <p className="truncate text-[12px] text-slate-500">
                        {q.subject} · {q.status}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void loadDiffs(q.id)}
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-[12px]"
                      >
                        Écarts métré
                      </button>
                      <Link
                        href={q.href}
                        className="rounded-full bg-[#1e3a5f] px-3 py-1.5 text-[12px] font-medium text-white"
                      >
                        Ouvrir
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setForceCreate(true);
                  setIdempotencyKey(newIdempotencyKey());
                  setStep("select");
                }}
                className="rounded-full border border-[#1e3a5f]/30 px-4 py-2 text-[13px] font-medium text-[#1e3a5f]"
              >
                Créer un autre devis
              </button>
            </div>
          ) : null}

          {step === "select" && preview ? (
            <div className="space-y-4">
              <p className="text-[13px] text-slate-600">
                Prestations cochées par défaut. Décochez les postes à exclure. Les indicateurs
                techniques ne sont jamais facturés.
              </p>
              {transferableByLot.map(([lot, lines]) => (
                <div key={lot}>
                  <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                    {lot}
                  </p>
                  <ul className="space-y-1.5">
                    {lines.map((line) => {
                      const checked = selected.has(line.code);
                      return (
                        <li
                          key={line.code}
                          className={cn(
                            "rounded-xl border px-3 py-2",
                            checked ? "border-[#1e3a5f]/25 bg-[#1e3a5f]/[0.03]" : "border-slate-200",
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
                                  if (n.has(line.code)) n.delete(line.code);
                                  else n.add(line.code);
                                  return n;
                                });
                              }}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                <span className="font-mono text-[11px] text-slate-500">{line.code}</span>
                                <span className="text-[13px] font-medium text-slate-900">
                                  {line.designation}
                                </span>
                                <span className="text-[12px] tabular-nums text-slate-600">
                                  {formatQty(line.quantity)} {displayUnit(line.unit)}
                                </span>
                              </span>
                              <span className="mt-0.5 block text-[11px] text-slate-500">
                                {line.roleLabel} · {line.statusLabel}
                              </span>
                              {line.descriptionPreview ? (
                                <span className="mt-1 block whitespace-pre-wrap text-[11px] leading-snug text-slate-600">
                                  {line.descriptionPreview}
                                  {line.descriptionPreview.length >= 400 ? "…" : ""}
                                </span>
                              ) : null}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}

              {preview.excluded.length ? (
                <details className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <summary className="cursor-pointer text-[12px] font-medium text-slate-600">
                    Non transférés ({preview.excluded.length}) — indicateurs / bloqués
                  </summary>
                  <ul className="mt-2 space-y-1 text-[12px] text-slate-600">
                    {preview.excluded.map((l) => (
                      <li key={l.code}>
                        <span className="font-mono">{l.code}</span> — {l.designation}
                        {l.blockedReason ? ` · ${l.blockedReason}` : ` · ${l.roleLabel}`}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>
          ) : null}

          {step === "done" ? (
            <div className="space-y-3 text-[13px] text-slate-700">
              <p>
                Devis <span className="font-semibold text-[#1e3a5f]">{createdNumber}</span> créé.
                Prix unitaires à 0 € HT — chiffrage dans le module Devis.
              </p>
              {createdHref ? (
                <Link
                  href={createdHref}
                  className="inline-flex rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white"
                >
                  Ouvrir le devis
                </Link>
              ) : null}
            </div>
          ) : null}

          {step === "diffs" ? (
            <div className="space-y-3">
              <p className="text-[13px] text-slate-600">
                Écarts détectés entre le métré et le devis. Aucune mise à jour automatique — choisissez
                ligne par ligne.
              </p>
              {diffs.length === 0 ? (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-900">
                  Aucun écart — quantités, désignations et unités alignées.
                </p>
              ) : (
                <ul className="space-y-2">
                  {diffs.map((d) => (
                    <li key={d.linkId} className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2.5">
                      <p className="text-[13px] font-medium text-[#1e3a5f]">
                        {d.studyLineCode} · {d.quoteNumber}
                      </p>
                      <ul className="mt-1 space-y-1 text-[12px] text-slate-700">
                        {d.fields.map((f) => (
                          <li key={f.field}>
                            <span className="font-medium">{f.label}</span> : {String(f.before)} →{" "}
                            {String(f.after)}
                            {f.financialImpactHt != null ? (
                              <span className="text-amber-800">
                                {" "}
                                (incidence {f.financialImpactHt >= 0 ? "+" : ""}
                                {f.financialImpactHt.toFixed(2)} € HT)
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {d.fields.some((f) => f.field === "quantity") ? (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void applySync(d.linkId, { applyQuantity: true })}
                              className="rounded-full bg-[#1e3a5f] px-3 py-1.5 text-[11px] font-medium text-white"
                            >
                              Mettre à jour la quantité
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => {
                                setDiffs((prev) => prev.filter((x) => x.linkId !== d.linkId));
                              }}
                              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px]"
                            >
                              Conserver la quantité actuelle
                            </button>
                          </>
                        ) : null}
                        {d.fields.some((f) => f.field === "designation") ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void applySync(d.linkId, { applyDesignation: true })}
                            className="rounded-full border border-[#1e3a5f]/30 px-3 py-1.5 text-[11px] text-[#1e3a5f]"
                          >
                            Maj désignation
                          </button>
                        ) : null}
                        {d.fields.some((f) => f.field === "unit") ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void applySync(d.linkId, { applyUnit: true })}
                            className="rounded-full border border-[#1e3a5f]/30 px-3 py-1.5 text-[11px] text-[#1e3a5f]"
                          >
                            Maj unité
                          </button>
                        ) : null}
                        {d.fields.some((f) => f.field === "description") ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void applySync(d.linkId, { applyDescription: true })}
                            className="rounded-full border border-[#1e3a5f]/30 px-3 py-1.5 text-[11px] text-[#1e3a5f]"
                          >
                            Maj description
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => setStep(preview?.existingQuotes.length ? "existing" : "select")}
                className="text-[12px] text-slate-500 underline"
              >
                Retour
              </button>
            </div>
          ) : null}
        </div>

        {step === "select" && preview ? (
          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-5 py-3">
            <p className="text-[12px] text-slate-500">
              {selectedCount} prestation(s) · PU à 0 € HT à l&apos;arrivée
            </p>
            <div className="flex gap-2">
              {preview.existingQuotes.length ? (
                <button
                  type="button"
                  disabled={busy}
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
                disabled={busy || selectedCount === 0}
                onClick={() => void commit()}
                className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-40"
              >
                {busy ? "Création…" : "Créer le brouillon de devis"}
              </button>
            </div>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
