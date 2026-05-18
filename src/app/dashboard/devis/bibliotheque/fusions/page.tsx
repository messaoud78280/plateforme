import Link from "next/link";
import { WorkItemMergeProposalsPanel } from "@/components/devis/WorkItemMergeProposalsPanel";
import { WorkItemMergeAnalyzeButton } from "@/components/devis/WorkItemMergeAnalyzeButton";
import {
  fetchPendingWorkItemMergeProposals,
  fetchWorkItemMergeStats,
} from "@/app/dashboard/devis/work-item-merge-actions";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";

export default async function BibliothequeFusionsPage() {
  await requireBeWorkDevisSession();
  const [proposals, stats] = await Promise.all([
    fetchPendingWorkItemMergeProposals(),
    fetchWorkItemMergeStats(),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/devis/bibliotheque" className="text-sm font-semibold text-[#1d4ed8] hover:underline">
        ← Bibliothèque ouvrages
      </Link>
      <header className="px-1">
        <h1 className="font-heading text-2xl font-bold text-slate-900">Propositions de fusion à vérifier</h1>
        <p className="mt-2 text-sm text-slate-600">
          {stats.pendingProposals} en attente · {stats.canonicalCards} fiches fusionnées ·{" "}
          {stats.mergedVariants} variantes regroupées (aucune suppression).
        </p>
      </header>
      <WorkItemMergeAnalyzeButton pendingProposals={stats.pendingProposals} />
      <WorkItemMergeProposalsPanel
        proposals={proposals.map((p) => ({
          id: p.id,
          canonicalDesignation: p.canonicalDesignation,
          similarityScore: p.similarityScore,
          mergeMode: p.mergeMode,
          matchReasons: p.matchReasons,
          members: p.members.map((m) => ({
            id: m.id,
            workItemId: m.workItemId,
            isCanonical: m.isCanonical,
            designation: m.designation,
            workItem: m.workItem,
          })),
        }))}
      />
    </div>
  );
}
