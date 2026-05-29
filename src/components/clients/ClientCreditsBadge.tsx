"use client";

import { useEffect, useState } from "react";

type CreditsData = {
  monthlyActionsTotal: number;
  monthlyActionsUsed: number;
  remaining: number;
  expiryLabel?: string | null;
};

type Props = {
  clientId: string;
  compact?: boolean;
  className?: string;
};

export function ClientCreditsBadge({ clientId, compact = false, className = "" }: Props) {
  const [data, setData] = useState<CreditsData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    fetch(`/api/clients/${clientId}/credits`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json: CreditsData) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (error || !data) {
    if (compact) return null;
    return (
      <div className={`rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 ${className}`}>
        Crédits client : à vérifier
      </div>
    );
  }

  const low = data.remaining <= 3 && data.monthlyActionsTotal > 0;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
          low ? "bg-amber-100 text-amber-900" : "bg-blue-50 text-blue-800"
        } ${className}`}
        title={data.expiryLabel ? `Validité : ${data.expiryLabel}` : undefined}
      >
        {data.remaining} crédit{data.remaining > 1 ? "s" : ""} restant{data.remaining > 1 ? "s" : ""}
        <span className="text-slate-500 font-normal">/ {data.monthlyActionsTotal}</span>
      </span>
    );
  }

  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        low ? "border-amber-200 bg-amber-50/80" : "border-blue-100 bg-blue-50/50"
      } ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Crédits client</p>
      <div className="mt-2 flex flex-wrap gap-4 text-sm">
        <span>
          <span className="font-bold text-[#1d4ed8]">{data.remaining}</span>
          <span className="text-slate-600"> restants</span>
        </span>
        <span className="text-slate-500">
          {data.monthlyActionsUsed} utilisés / {data.monthlyActionsTotal} total
        </span>
      </div>
      {data.expiryLabel ? (
        <p className="mt-1 text-xs text-slate-500">{data.expiryLabel}</p>
      ) : null}
    </div>
  );
}
