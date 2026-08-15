"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SnapshotLite = {
  attention: number;
  aFacturer: number;
  enRetard?: number;
  aSurveiller?: number;
};

/** Bandeau Accueil — uniquement si action facturation réelle. */
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

  const enRetard = data.enRetard ?? 0;
  const aSurveiller = data.aSurveiller ?? 0;

  let detail: string;
  if (enRetard > 0) {
    detail = `${enRetard} préparation${enRetard > 1 ? "s" : ""} hors délai.`;
  } else if (aSurveiller > 0) {
    detail = `${aSurveiller} dossier${aSurveiller > 1 ? "s" : ""} à surveiller.`;
  } else if (data.aFacturer > 0) {
    detail = `${data.aFacturer} besoin${data.aFacturer > 1 ? "s" : ""} opérationnel${data.aFacturer > 1 ? "s" : ""} à préparer — pas encore des factures.`;
  } else {
    detail = `${data.attention} action${data.attention > 1 ? "s" : ""} de facturation.`;
  }

  return (
    <section
      className="rounded-2xl border border-[#1e3a5f]/15 bg-white p-4 shadow-sm sm:p-5"
      data-testid="accueil-facturation"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#1e3a5f]">
          À facturer
          <span className="ml-2.5 tabular-nums text-slate-900">
            {data.aFacturer > 0
              ? `${data.aFacturer} dossier${data.aFacturer > 1 ? "s" : ""}`
              : `${total} à traiter`}
          </span>
        </h2>
        <Link
          href="/dashboard/facturation"
          className="text-xs font-semibold text-[#1d4ed8] hover:underline"
        >
          Voir →
        </Link>
      </div>
      <p className="mt-2 text-sm text-slate-600">{detail}</p>
    </section>
  );
}
