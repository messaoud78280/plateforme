"use client";

import { useEffect, useState } from "react";
import { FinanceMetric } from "@/components/dashboard/accueil-ui";

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
  const dossiers = data.aFacturer > 0 ? data.aFacturer : total;
  const hint =
    enRetard > 0
      ? `${enRetard} hors délai`
      : data.aFacturer > 0
        ? "Dossiers à préparer"
        : `${data.attention} action${data.attention > 1 ? "s" : ""}`;

  return (
    <div data-testid="accueil-facturation">
      <FinanceMetric
        label="À facturer"
        value={`${dossiers} dossier${dossiers > 1 ? "s" : ""}`}
        hint={hint}
        href="/dashboard/facturation"
      />
    </div>
  );
}
