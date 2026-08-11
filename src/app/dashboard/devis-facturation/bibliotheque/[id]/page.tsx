import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { WorkItemEditor } from "@/components/commercial/WorkItemEditor";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { getWorkItem } from "@/lib/commercial/library";

export const dynamic = "force-dynamic";

export default async function BibliothequeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireCommercialSession(
    "/dashboard/devis-facturation/bibliotheque",
  );
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;

  const { id } = await params;
  const workItem = await getWorkItem(orgId, id);
  if (!workItem) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/devis-facturation/bibliotheque"
          className="text-xs font-semibold text-slate-500 hover:text-[#1e3a5f]"
        >
          ← Bibliothèque
        </Link>
        <PageHeader
          className="mt-2"
          eyebrow="Devis & Facturation · Référentiel"
          title={workItem.name}
          description={
            workItem.reference
              ? `Réf. ${workItem.reference} · ${workItem.kind === "COMPOSITE" ? "Composite" : "Simple"}`
              : workItem.kind === "COMPOSITE"
                ? "Ouvrage composite"
                : "Ouvrage simple"
          }
        />
      </div>
      <WorkItemEditor workItemId={id} />
    </div>
  );
}
