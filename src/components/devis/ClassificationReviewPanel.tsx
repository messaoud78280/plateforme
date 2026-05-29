"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { reviewClassificationProposal } from "@/app/dashboard/devis/library-cleanup-actions";
import { getBeWorkFamilyLabel } from "@/lib/bework-devis-family-codes";

export type ClassificationProposalRow = {
  id: string;
  confidence: string;
  matchReason: string;
  currentFamilyCode: string | null;
  currentLot: string | null;
  proposedFamilyCode: string;
  proposedLot: string | null;
  proposedFamily: string | null;
  workItem: {
    id: string;
    code: string;
    title: string;
    lot: string;
    familyCode: string | null;
    unit: string;
  };
};

const CONFIDENCE_STYLE: Record<string, string> = {
  haute: "bg-emerald-100 text-emerald-900",
  moyenne: "bg-amber-100 text-amber-900",
  faible: "bg-slate-100 text-slate-700",
};

export function ClassificationReviewPanel({ proposals }: { proposals: ClassificationProposalRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function review(proposalId: string, action: "approve" | "reject" | "ignore") {
    setError(null);
    startTransition(async () => {
      const res = await reviewClassificationProposal({ proposalId, action });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  if (proposals.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        Aucune proposition en attente. Lancez « Analyser classifications » depuis la page nettoyage.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
      {proposals.map((p) => (
        <article key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs text-slate-500">{p.workItem.code}</p>
              <h3 className="mt-1 font-semibold text-slate-900">{p.workItem.title}</h3>
              <p className="mt-1 text-xs text-slate-500">Unité : {p.workItem.unit}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${CONFIDENCE_STYLE[p.confidence] ?? CONFIDENCE_STYLE.faible}`}>
              {p.confidence}
            </span>
          </div>

          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Famille actuelle</dt>
              <dd>
                {p.currentFamilyCode ?? p.workItem.familyCode ?? "—"} · {p.currentLot ?? p.workItem.lot}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Famille proposée</dt>
              <dd className="font-medium text-[#1d4ed8]">
                {p.proposedFamilyCode} · {p.proposedFamily ?? getBeWorkFamilyLabel(p.proposedFamilyCode)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase text-slate-500">Raison</dt>
              <dd className="text-slate-700">{p.matchReason}</dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => review(p.id, "approve")}
              className="rounded-lg bg-[#1d4ed8] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1e40af] disabled:opacity-50"
            >
              Accepter
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => review(p.id, "reject")}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Refuser
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => review(p.id, "ignore")}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
            >
              Ignorer
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
