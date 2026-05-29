"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  detectDuplicateGroupsBatch,
  mergeDuplicateGroup,
} from "@/app/dashboard/devis/library-cleanup-actions";
import type { DuplicateReviewGroup } from "@/lib/work-item-library-cleanup";

function formatPrice(v: number | null): string {
  if (v == null) return "—";
  return `${v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export function DuplicateReviewPanel() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [groups, setGroups] = useState<DuplicateReviewGroup[]>([]);
  const [cursorId, setCursorId] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [scanned, setScanned] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mergeProgress, setMergeProgress] = useState<string | null>(null);

  function scan(next = false) {
    setError(null);
    setMergeProgress(null);
    startTransition(async () => {
      const res = await detectDuplicateGroupsBatch({
        batchSize: 50,
        cursorId: next ? cursorId : undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setGroups((prev) => (next ? [...prev, ...res.groups] : res.groups));
      setScanned((prev) => (next ? prev + res.scanned : res.scanned));
      setHasMore(res.hasMore);
      setCursorId(res.nextCursorId ?? undefined);
      setMessage(`${res.groups.length} groupe(s) sur ce lot (${res.scanned} ouvrages scannés).`);
    });
  }

  async function mergeGroupPartByPart(group: DuplicateReviewGroup, dryRun: boolean) {
    const memberIds = group.members.map((m) => m.id);
    const total = memberIds.filter((id) => id !== group.recommendedCanonicalId).length;
    let offset = 0;
    let mergedTotal = 0;

    while (offset < total) {
      setMergeProgress(
        dryRun
          ? `Simulation ${Math.min(offset + 5, total)}/${total}…`
          : `Fusion en cours ${offset}/${total}…`,
      );

      const res = await mergeDuplicateGroup({
        canonicalId: group.recommendedCanonicalId,
        memberIds,
        dryRun,
        memberOffset: offset,
        chunkSize: 5,
      });

      if (!res.ok) {
        setError(res.error);
        setMergeProgress(null);
        return false;
      }

      mergedTotal += res.mergedCount;
      offset = res.nextOffset;

      if (res.done) break;
    }

    setMergeProgress(null);
    setMessage(
      dryRun
        ? `Simulation : ${mergedTotal} variante(s) dans ${group.recommendedCanonical.code}.`
        : `Fusion terminée : ${mergedTotal} variante(s) → ${group.recommendedCanonical.code}.`,
    );

    if (!dryRun) {
      setGroups((prev) => prev.filter((g) => g.groupKey !== group.groupKey));
      router.refresh();
    }

    return true;
  }

  function mergeGroup(group: DuplicateReviewGroup, dryRun: boolean) {
    setError(null);
    startTransition(async () => {
      await mergeGroupPartByPart(group, dryRun);
    });
  }

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-sky-950">
        Les fusions se font <strong>par tranches de 5 variantes</strong> pour éviter les blocages. La barre de progression
        s&apos;affiche pendant l&apos;opération.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => scan(false)}
          className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
        >
          {pending && groups.length === 0 ? "Analyse…" : "Détecter doublons (lot 1)"}
        </button>
        {hasMore ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => scan(true)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            Lot suivant
          </button>
        ) : null}
      </div>

      {mergeProgress ? (
        <p className="text-sm font-medium text-[#1d4ed8]" role="status">
          {mergeProgress}
        </p>
      ) : null}
      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
      {message ? <p className="text-sm font-medium text-emerald-800">{message}</p> : null}
      {scanned > 0 ? <p className="text-xs text-slate-500">{scanned} ouvrage(s) analysé(s) au total.</p> : null}

      {groups.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          Lancez la détection pour afficher les groupes de doublons probables (50 ouvrages par lot).
        </p>
      ) : (
        groups.map((g) => (
          <article key={g.groupKey} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {g.members.length} fiche(s) · {g.mergeMode} · {g.maxSimilarity} %
                </p>
                <p className="mt-1 font-mono text-xs text-slate-600">{g.normalizedKey.slice(0, 120)}…</p>
              </div>
              {g.autoMergeAllowed ? (
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-900">
                  Fusion auto possible
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">
                  Validation manuelle
                </span>
              )}
            </div>

            {g.autoMergeBlockReason ? (
              <p className="mt-2 text-xs text-amber-800">{g.autoMergeBlockReason}</p>
            ) : null}

            <p className="mt-3 text-sm font-semibold text-[#1d4ed8]">
              Conserver : {g.recommendedCanonical.code} — {g.recommendedCanonical.designation.slice(0, 100)}
              {g.recommendedCanonical.designation.length > 100 ? "…" : ""}
            </p>

            <ul className="mt-4 space-y-2">
              {g.members.map((m) => (
                <li
                  key={m.id}
                  className={`rounded-lg border px-3 py-2 text-sm ${m.id === g.recommendedCanonicalId ? "border-[#1d4ed8]/40 bg-[#eff6ff]" : "border-slate-100 bg-slate-50/50"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/dashboard/devis/bibliotheque/${m.id}`} className="font-mono text-xs text-[#1d4ed8] hover:underline">
                      {m.code}
                    </Link>
                    <span className="text-xs text-slate-500">
                      {m.familyCode ?? "DIV"} · {m.unit} · {m.priceStats.priceCount} prix · max {formatPrice(m.priceStats.maxHt)}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-800">
                    {m.designation.slice(0, 140)}
                    {m.designation.length > 140 ? "…" : ""}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => mergeGroup(g, true)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Simuler fusion
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!confirm(`Fusionner ${g.members.length - 1} variante(s) par tranches de 5 dans ${g.recommendedCanonical.code} ?`)) return;
                  mergeGroup(g, false);
                }}
                className="rounded-lg bg-[#1d4ed8] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1e40af] disabled:opacity-50"
              >
                Fusionner ce groupe (partie par partie)
              </button>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
