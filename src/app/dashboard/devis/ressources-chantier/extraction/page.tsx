import Link from "next/link";
import { ChantierResourceExtractionPanel } from "@/components/devis/ChantierResourceExtractionPanel";
import { fetchExtractionRun } from "@/app/dashboard/devis/ressources-chantier-actions";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";

type SearchParams = Promise<{ run?: string }>;

export default async function RessourcesChantierExtractionPage({ searchParams }: { searchParams: SearchParams }) {
  await requireBeWorkDevisSession();
  const sp = await searchParams;
  const runId = sp.run?.trim() || null;

  const run = runId ? await fetchExtractionRun(runId) : null;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/devis/ressources-chantier" className="text-sm font-semibold text-[#1d4ed8] hover:underline">
        ← Ressources chantier
      </Link>
      <header className="px-1">
        <h1 className="font-heading text-2xl font-bold text-slate-900">Extraction bibliothèque → ressources</h1>
        <p className="mt-2 text-sm text-slate-600">
          {run
            ? `${run.workItemCount} ouvrages analysés · ${run.proposalCount} propositions · statut ${run.status}`
            : "Lancez une analyse pour prévisualiser les regroupements."}
        </p>
      </header>
      <ChantierResourceExtractionPanel
        runId={runId}
        proposals={
          run?.proposals.map((p) => ({
            id: p.id,
            proposalType: p.proposalType,
            similarityScore: p.similarityScore,
            sourceLabel: p.sourceLabel,
            sourceSnippet: p.sourceSnippet,
            targetSiteResource: p.targetSiteResource,
            sourceWorkItem: p.sourceWorkItem,
          })) ?? []
        }
      />
    </div>
  );
}
