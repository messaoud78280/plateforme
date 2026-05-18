import Link from "next/link";
import { ChantierResourceExtractionPanel } from "@/components/devis/ChantierResourceExtractionPanel";
import {
  fetchChantierResourceStats,
  fetchExtractionRun,
  fetchPendingGroupingProposals,
} from "@/app/dashboard/devis/ressources-chantier-actions";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";

type SearchParams = Promise<{ run?: string }>;

export default async function RessourcesChantierExtractionPage({ searchParams }: { searchParams: SearchParams }) {
  await requireBeWorkDevisSession();
  const sp = await searchParams;
  const runId = sp.run?.trim() || null;

  const [pendingProposals, stats, run] = await Promise.all([
    fetchPendingGroupingProposals(),
    fetchChantierResourceStats(),
    runId ? fetchExtractionRun(runId) : null,
  ]);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/devis/ressources-chantier" className="text-sm font-semibold text-[#1d4ed8] hover:underline">
        ← Ressources chantier
      </Link>
      <header className="px-1">
        <h1 className="font-heading text-2xl font-bold text-slate-900">Extraction bibliothèque → ressources</h1>
        <p className="mt-2 text-sm text-slate-600">
          {run
            ? `Dernier lot : ${run.workItemCount} ouvrages analysés · ${run.proposalCount} propositions générées · statut ${run.status}`
            : `${stats.pendingProposals} proposition${stats.pendingProposals !== 1 ? "s" : ""} en attente de validation.`}
        </p>
      </header>
      <ChantierResourceExtractionPanel
        runId={runId}
        runLabel={run?.label ?? null}
        pendingTotal={stats.pendingProposals}
        proposals={pendingProposals.map((p) => ({
          id: p.id,
          proposalType: p.proposalType,
          similarityScore: p.similarityScore,
          sourceLabel: p.sourceLabel,
          sourceSnippet: p.sourceSnippet,
          targetSiteResource: p.targetSiteResource,
          sourceWorkItem: p.sourceWorkItem,
          extractionRun: p.extractionRun,
        }))}
      />
    </div>
  );
}
