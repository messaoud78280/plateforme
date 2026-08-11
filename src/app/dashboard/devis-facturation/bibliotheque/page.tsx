import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { listWorkItems } from "@/lib/commercial/library";
import { CreateWorkItemButton } from "@/components/commercial/CreateWorkItemButton";
import {
  WorkItemsLibraryClient,
  type LibraryWorkItemRow,
} from "@/components/commercial/WorkItemsLibraryClient";

export const dynamic = "force-dynamic";

export default async function BibliothequePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: string }>;
}) {
  const session = await requireCommercialSession(
    "/dashboard/devis-facturation/bibliotheque",
  );
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;

  const { q, view: viewParam } = await searchParams;
  const query = q?.trim() || undefined;
  const view = viewParam === "archived" ? "archived" : "active";
  const items = await listWorkItems(orgId, {
    q: query,
    take: 200,
    active: view === "active",
  });

  const rows: LibraryWorkItemRow[] = items.map((w) => ({
    id: w.id,
    name: w.name,
    reference: w.reference,
    saleUnit: w.saleUnit,
    unitCostHt: w.unitCostHt,
    unitSellHt: w.unitSellHt,
    marginPercent: w.marginPercent,
    kind: w.kind,
    isActive: w.isActive,
    needsPriceRecalc: w.needsPriceRecalc,
    quoteLineCount: w.quoteLineCount,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          eyebrow="Devis & Facturation · Référentiel"
          title="Bibliothèque"
          description="Ouvrages prêts à chiffrer — accélèrent le devis, jamais obligatoires."
        />
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/commercial/library/work-items?format=csv"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </a>
          <CreateWorkItemButton />
        </div>
      </div>

      <form method="get" className="flex flex-wrap gap-2">
        {view === "archived" ? <input type="hidden" name="view" value="archived" /> : null}
        <input
          name="q"
          defaultValue={query ?? ""}
          placeholder="Rechercher (nom, réf., famille…)"
          className="min-w-[14rem] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-bold text-white"
        >
          Rechercher
        </button>
        {query ? (
          <Link
            href={
              view === "archived"
                ? "/dashboard/devis-facturation/bibliotheque?view=archived"
                : "/dashboard/devis-facturation/bibliotheque"
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
          >
            Effacer
          </Link>
        ) : null}
      </form>

      <WorkItemsLibraryClient initialItems={rows} view={view} query={query} />
    </div>
  );
}
