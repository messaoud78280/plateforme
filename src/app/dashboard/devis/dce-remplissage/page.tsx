import Link from "next/link";
import { DcePricingFillPanel } from "@/components/devis/DcePricingFillPanel";
import { WorkItemCatalogBar } from "@/components/devis/WorkItemCatalogBar";
import { listDceFillSessions } from "@/app/dashboard/devis/dce-fill-actions";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { listWorkItemCatalogs, resolveActiveWorkItemCatalogId } from "@/lib/work-item-catalog";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Alert";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableRow,
  DataTableTd,
  DataTableTh,
} from "@/components/ui/DataTable";

export default async function DceRemplissagePage() {
  await requireBeWorkDevisSession();
  const [catalogs, activeCatalogId, sessions] = await Promise.all([
    listWorkItemCatalogs(),
    resolveActiveWorkItemCatalogId(),
    listDceFillSessions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marchés publics"
        title="Remplir BPU / DPGF depuis un DCE"
        description="Extraction des lignes du dossier de consultation, rapprochement avec la bibliothèque active, puis export vers vos documents de chiffrage. Les anciennes bibliothèques restent disponibles sans mélange de codes."
        actions={
          <Link href="/dashboard/devis/bibliotheque" className="btn-cc-secondary">
            ← Bibliothèque
          </Link>
        }
      />

      <WorkItemCatalogBar catalogs={catalogs} activeCatalogId={activeCatalogId} />

      <DcePricingFillPanel />

      <Card hover={false} className="!p-0 overflow-hidden">
        <div className="border-b border-[color:var(--cc-chrome-border)] px-5 py-4">
          <CardHeader title="Sessions récentes" className="mb-0" />
        </div>
        {sessions.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Aucune extraction" description="Aucune extraction pour ce catalogue." />
          </div>
        ) : (
          <DataTable minWidth="640px" className="!rounded-none !border-0 !shadow-none">
            <DataTableHead>
              <DataTableTh>Titre</DataTableTh>
              <DataTableTh>Type</DataTableTh>
              <DataTableTh>Lignes</DataTableTh>
              <DataTableTh>Rapprochées</DataTableTh>
              <DataTableTh>Statut</DataTableTh>
              <DataTableTh>Fichier</DataTableTh>
            </DataTableHead>
            <DataTableBody>
              {sessions.map((s) => (
                <DataTableRow key={s.id}>
                  <DataTableTd>
                    <span className="font-semibold text-bework-ink">{s.title}</span>
                  </DataTableTd>
                  <DataTableTd>
                    <span className="text-xs uppercase text-bework-muted">{s.targetDocType}</span>
                  </DataTableTd>
                  <DataTableTd>
                    <span className="tabular-nums">{s.lineCount}</span>
                  </DataTableTd>
                  <DataTableTd>
                    <span className="tabular-nums text-bework-ok">{s.matchedCount}</span>
                  </DataTableTd>
                  <DataTableTd>
                    <Badge>{s.status}</Badge>
                  </DataTableTd>
                  <DataTableTd>
                    <span className="text-xs text-bework-muted">{s.dceFileName ?? "—"}</span>
                  </DataTableTd>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </Card>

      <Alert tone="info" title="Parcours recommandé">
        <ol className="mt-1 list-decimal space-y-1 pl-5">
          <li>
            Sélectionner <strong>Artiprix BeWork 2026</strong> (bibliothèque vide ou import Artiprix).
          </li>
          <li>Importer vos ouvrages Artiprix (collage structuré) avec codification dès l&apos;import.</li>
          <li>Extraire le DPGF/BPU du DCE ici et vérifier les rapprochements.</li>
          <li>
            Créer le devis / document dans <strong>Documents</strong> en s&apos;appuyant sur cette bibliothèque.
          </li>
        </ol>
      </Alert>
    </div>
  );
}
