"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  approveWorkItemMergeProposal,
  rejectWorkItemMergeProposal,
} from "@/app/dashboard/devis/work-item-merge-actions";

export type MergeProposalRow = {
  id: string;
  canonicalDesignation: string;
  similarityScore: number;
  mergeMode: string;
  matchReasons: unknown;
  members: {
    id: string;
    workItemId: string;
    isCanonical: boolean;
    designation: string;
    workItem: { id: string; code: string; title: string; lot: string; unit: string };
  }[];
};

export function WorkItemMergeProposalsPanel({ proposals }: { proposals: MergeProposalRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  if (proposals.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
        Aucune proposition de fusion en attente. Lancez « Fusionner les doublons » depuis la bibliothèque.
      </p>
    );
  }

  function onApprove(id: string) {
    setFeedback(null);
    startTransition(async () => {
      const res = await approveWorkItemMergeProposal(id);
      if (res.ok) {
        setFeedback(
          res.mergedCount === 1
            ? "1 proposition fusionnée"
            : `${res.mergedCount} variantes regroupées`,
        );
        router.refresh();
      } else setFeedback(res.error);
    });
  }

  function onReject(id: string) {
    setFeedback(null);
    startTransition(async () => {
      await rejectWorkItemMergeProposal(id);
      setFeedback("Proposition refusée");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {feedback ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
          {feedback}
        </p>
      ) : null}
      {proposals.map((p) => (
        <article key={p.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Fiche principale proposée</p>
              <h2 className="mt-1 font-semibold text-slate-900">{p.canonicalDesignation}</h2>
              <p className="mt-1 text-sm text-slate-600">
                Score {p.similarityScore} % · {p.members.length} lignes · mode {p.mergeMode}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => onApprove(p.id)}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                Accepter la fusion
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => onReject(p.id)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                Refuser
              </button>
            </div>
          </div>
          <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
            {p.members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  {m.isCanonical ? (
                    <span className="mr-2 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violet-800">
                      Canonique
                    </span>
                  ) : null}
                  {m.designation}
                </span>
                <Link
                  href={`/dashboard/devis/bibliotheque/${m.workItemId}`}
                  className="font-mono text-xs text-[#1d4ed8] hover:underline"
                >
                  {m.workItem.code}
                </Link>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

