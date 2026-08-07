"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import type { TaskStatus } from "@/types";
import {
  BC_STEPS,
  extractAmountHint,
  mapTaskStatusToBcStep,
  nextBcStatus,
  type BcStepKey,
} from "@/lib/demo-environment/bon-commande";

const ACTION_LABEL: Partial<Record<BcStepKey, string>> = {
  demande: "Soumettre à validation",
  a_valider: "Valider la commande",
  valide: "Marquer comme commandé",
  commande: "Passer en livraison",
  livraison: "Confirmer réception",
};

export function BonDeCommandeWorkflow({
  taskId,
  status,
  desiredDate,
  suppliers,
  description,
  canAdvance,
}: {
  taskId: string;
  status: TaskStatus;
  desiredDate?: Date | string | null;
  suppliers?: { name?: string; contact?: string }[] | null;
  description?: string | null;
  canAdvance?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = mapTaskStatusToBcStep(status);
  const currentIdx = BC_STEPS.findIndex((s) => s.key === current);
  const next = nextBcStatus(status);
  const actionLabel = ACTION_LABEL[current];
  const amountHint = extractAmountHint(description);

  const dateLabel = desiredDate
    ? new Date(desiredDate).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const late =
    desiredDate &&
    new Date(desiredDate) < new Date(new Date().setHours(0, 0, 0, 0)) &&
    status !== "COMPLETE";

  async function advance() {
    if (!next || !canAdvance) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/demo/bon-commande/${taskId}/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Impossible d’avancer le workflow.");
        return;
      }
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-bework-muted">
            Bon de commande
          </p>
          <h3 className="mt-1 text-base font-bold text-bework-ink">Suivi de la commande</h3>
        </div>
        {late ? (
          <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-800">
            Échéance dépassée
          </span>
        ) : null}
      </div>

      <ol className="mt-5 flex flex-wrap gap-2">
        {BC_STEPS.map((step, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <li key={step.key} className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-bold",
                  done && "bg-emerald-100 text-emerald-800",
                  active && "bg-bework-navy text-white",
                  !done && !active && "bg-slate-100 text-slate-500",
                )}
              >
                {step.label}
              </span>
              {i < BC_STEPS.length - 1 ? (
                <span className="hidden text-slate-300 sm:inline" aria-hidden>
                  →
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        {dateLabel ? (
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wide text-bework-muted">
              Date nécessaire
            </dt>
            <dd className="font-semibold text-slate-800">{dateLabel}</dd>
          </div>
        ) : null}
        {suppliers?.[0]?.name ? (
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wide text-bework-muted">
              Fournisseur
            </dt>
            <dd className="font-semibold text-slate-800">{suppliers[0].name}</dd>
          </div>
        ) : null}
        {amountHint ? (
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wide text-bework-muted">Montant</dt>
            <dd className="font-semibold text-slate-800">{amountHint}</dd>
          </div>
        ) : null}
      </dl>

      {canAdvance && next && actionLabel ? (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => void advance()}
            className="btn-cc-primary disabled:opacity-60"
          >
            {loading ? "Mise à jour…" : actionLabel}
          </button>
          <p className="text-xs text-bework-muted">Action de démonstration — données fictives uniquement.</p>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
