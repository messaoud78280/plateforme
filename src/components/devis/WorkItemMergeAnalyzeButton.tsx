"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { analyzeAndMergeWorkItemDuplicatesBatch } from "@/app/dashboard/devis/work-item-merge-actions";

type Props = {
  pendingProposals?: number;
};

export function WorkItemMergeAnalyzeButton({ pendingProposals = 0 }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [cursorId, setCursorId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  function runBatch(next = false) {
    setFeedback(null);
    startTransition(async () => {
      const res = await analyzeAndMergeWorkItemDuplicatesBatch({
        cursorId: next ? cursorId ?? undefined : undefined,
      });
      if (!res.ok) {
        setFeedback({ kind: "err", text: res.error });
        return;
      }
      const p = res.progress;
      setCursorId(p.nextCursorId);
      setHasMore(p.hasMore);
      setFeedback({
        kind: "ok",
        text: `Lot : ${p.analyzed} analysées · ${p.autoMergedCount} fusionnée(s) · ${p.proposalsCreated} proposition(s) · ${p.hasMore ? "encore des lots" : "terminé"}`,
      });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => runBatch(false)}
          className="inline-flex rounded-xl border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-950 hover:bg-violet-100 disabled:opacity-60"
        >
          {pending ? "Analyse en cours…" : hasMore ? "Relancer lot 1" : "Analyser doublons (lot 1)"}
        </button>
        {hasMore ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => runBatch(true)}
            className="inline-flex rounded-xl border border-violet-400 bg-white px-4 py-2 text-sm font-semibold text-violet-900 hover:bg-violet-50 disabled:opacity-60"
          >
            Lot suivant
          </button>
        ) : null}
        <Link
          href="/dashboard/devis/bibliotheque/nettoyage/doublons"
          className="inline-flex rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Contrôle manuel
        </Link>
        {pendingProposals > 0 ? (
          <Link
            href="/dashboard/devis/bibliotheque/fusions"
            className="inline-flex rounded-xl bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            {pendingProposals} fusion{pendingProposals > 1 ? "s" : ""} à vérifier
          </Link>
        ) : null}
      </div>
      {feedback ? (
        <p className={`text-sm ${feedback.kind === "ok" ? "text-emerald-800" : "text-red-700"}`} role="status">
          {feedback.text}
        </p>
      ) : (
        <p className="text-xs text-slate-500">80 ouvrages max par lot · 2 fusions auto max · pas de traitement global.</p>
      )}
    </div>
  );
}
