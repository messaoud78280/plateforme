import Link from "next/link";
import { listQuoteProjectsTable } from "@/app/dashboard/devis/quote-actions";
import { QuoteSchemaMissingCallout } from "@/components/devis/QuoteSchemaMissingCallout";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableRow,
  DataTableTd,
  DataTableTh,
} from "@/components/ui/DataTable";

export default async function DevisProjetsPage() {
  await requireBeWorkDevisSession();

  let quoteSchemaOk = true;
  let projects: Awaited<ReturnType<typeof listQuoteProjectsTable>> = [];
  try {
    projects = await listQuoteProjectsTable();
  } catch {
    quoteSchemaOk = false;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Clients"
        title="Projets"
        description="Regroupez vos documents de chiffrage par chantier ou dossier client."
        actions={
          quoteSchemaOk ? (
            <Link href="/dashboard/devis/projets/nouveau" className="btn-cc-primary">
              Nouveau projet
            </Link>
          ) : null
        }
      />

      {!quoteSchemaOk ? <QuoteSchemaMissingCallout /> : null}

      {quoteSchemaOk ? (
        projects.length === 0 ? (
          <EmptyState
            title="Aucun projet"
            description="Créez un projet pour organiser devis et documents par chantier."
            actionHref="/dashboard/devis/projets/nouveau"
            actionLabel="Créer un projet"
          />
        ) : (
          <DataTable minWidth="640px">
            <DataTableHead>
              <DataTableTh>Client</DataTableTh>
              <DataTableTh>Projet</DataTableTh>
              <DataTableTh>Documents</DataTableTh>
              <DataTableTh>Actions</DataTableTh>
            </DataTableHead>
            <DataTableBody>
              {projects.map((p) => (
                <DataTableRow key={p.id}>
                  <DataTableTd>
                    <span className="font-semibold text-bework-ink">{p.clientName}</span>
                  </DataTableTd>
                  <DataTableTd>{p.projectName}</DataTableTd>
                  <DataTableTd>
                    <span className="tabular-nums">{p._count.documents}</span>
                  </DataTableTd>
                  <DataTableTd>
                    <Link
                      href={`/dashboard/devis/documents?project=${p.id}`}
                      className="text-xs font-semibold text-bework-navy hover:underline"
                    >
                      Voir les documents
                    </Link>
                  </DataTableTd>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )
      ) : null}
    </div>
  );
}
