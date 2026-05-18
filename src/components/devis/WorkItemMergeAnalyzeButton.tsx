"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { analyzeAndMergeWorkItemDuplicates } from "@/app/dashboard/devis/work-item-merge-actions";

type Props = {
  pendingProposals?: number;
};

export function WorkItemMergeAnalyzeButton({ pendingProposals = 0 }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function onAnalyze() {
    setFeedback(null);
    startTransition(async () => {
      const res = await analyzeAndMergeWorkItemDuplicates();
      if (!res.ok) {
        setFeedback({ kind: "err", text: res.error });
        return;
      }
      const s = res.summary;
      setFeedback({
        kind: "ok",
        text: `${s.analyzed} analysées · ${s.exactDuplicateGroups} groupes exacts · ${s.autoMergedCount} fusionnées · ${s.proposalsCreated} à vérifier`,
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
          onClick={onAnalyze}
          className="inline-flex rounded-xl border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-950 hover:bg-violet-100 disabled:opacity-60"
        >
          {pending ? "Analyse en cours…" : "Fusionner les doublons"}
        </button>
        {pendingProposals > 0 ? (
          <a
            href="/dashboard/devis/bibliotheque/fusions"
            className="inline-flex rounded-xl bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            {pendingProposals} fusion{pendingProposals > 1 ? "s" : ""} à vérifier
          </a>
        ) : null}
      </div>
      {feedback ? (
        <p
          className={`text-sm ${feedback.kind === "ok" ? "text-emerald-800" : "text-red-700"}`}
          role="status"
        >
          {feedback.text}
        </p>
      ) : null}
    </div>
  );
}
