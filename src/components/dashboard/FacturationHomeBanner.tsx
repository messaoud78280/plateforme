"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SnapshotLite = {
  attention: number;
  aFacturer: number;
};

/** Bandeau Accueil — uniquement si anomalies facturation. */
export function FacturationHomeBanner() {
  const [data, setData] = useState<SnapshotLite | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/facturation/summary", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as SnapshotLite;
        if (!cancelled) setData(json);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) return null;
  const total = Math.max(data.attention, data.aFacturer);
  if (total <= 0) return null;

  return (
    <section
      className="rounded-2xl border border-[#1e3a5f]/15 bg-white p-4 shadow-sm sm:p-5"
      data-testid="accueil-facturation"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#1e3a5f]">
          Facturation
          <span className="ml-2.5 tabular-nums text-slate-900">
            {total} élément{total > 1 ? "s" : ""} à traiter
          </span>
        </h2>
        <Link
          href="/dashboard/facturation"
          className="text-xs font-semibold text-[#1d4ed8] hover:underline"
        >
          Voir →
        </Link>
      </div>
      {data.attention > 0 ? (
        <p className="mt-2 text-sm text-slate-600">
          {data.attention} oubli{data.attention > 1 ? "s" : ""} de facturation détecté
          {data.attention > 1 ? "s" : ""}.
        </p>
      ) : (
        <p className="mt-2 text-sm text-slate-600">
          {data.aFacturer} dossier{data.aFacturer > 1 ? "s" : ""} en étape facturation.
        </p>
      )}
    </section>
  );
}
