import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { getWorkItem, listLibraryHistory } from "@/lib/commercial/library";
import {
  WorkItemDetailView,
  type WorkItemDetailData,
} from "@/components/commercial/library/WorkItemDetailView";

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
  const [workItem, history] = await Promise.all([
    getWorkItem(orgId, id),
    listLibraryHistory(orgId, id, 40),
  ]);
  if (!workItem) notFound();

  const detail: WorkItemDetailData = {
    id: workItem.id,
    name: workItem.name,
    reference: workItem.reference,
    family: workItem.family,
    subFamily: workItem.subFamily,
    saleUnit: workItem.saleUnit,
    kind: workItem.kind,
    sellMode: workItem.sellMode,
    unitCostHt: workItem.unitCostHt,
    unitSellHt: workItem.unitSellHt,
    marginPercent: workItem.marginPercent,
    costKnown: Boolean(workItem.costKnown),
    isFavorite: workItem.isFavorite,
    isActive: workItem.isActive,
    needsPriceRecalc: workItem.needsPriceRecalc,
    description: workItem.description,
    shortDescription: workItem.shortDescription,
    internalNotes: workItem.internalNotes,
    implementationTips: workItem.implementationTips,
    vigilancePoints: workItem.vigilancePoints,
    updatedAt: workItem.updatedAt,
    createdAt: workItem.createdAt,
    quoteLineCount: workItem.quoteLineCount,
    componentCount: workItem.componentCount,
    attachmentCount: workItem.attachmentCount,
    variantCount: workItem.variantCount,
    parent: workItem.parent,
    variants: workItem.variants,
    attachments: workItem.attachments.map((a) => ({
      id: a.id,
      name: a.name,
      category: a.category,
      mimeType: a.mimeType,
      isPrimary: a.isPrimary,
      clientVisible: a.clientVisible,
      caption: a.caption,
    })),
    notes: workItem.notes.map((n) => ({
      id: n.id,
      kind: n.kind,
      body: n.body,
      createdAt: n.createdAt,
      createdBy: n.createdBy,
    })),
    history: history.map((h) => ({
      id: h.id,
      label: h.label,
      detail: h.detail,
      createdAt: h.createdAt,
      actor: h.actor,
    })),
    createdBy: workItem.createdBy,
  };

  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Link
            href="/dashboard/documents?universe=ouvrages"
            className="text-xs font-semibold text-slate-500"
          >
            ← Bibliothèque
          </Link>
          <p className="text-sm text-slate-500">Chargement de la fiche…</p>
        </div>
      }
    >
      <WorkItemDetailView item={detail} />
    </Suspense>
  );
}
