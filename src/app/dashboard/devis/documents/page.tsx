import Link from "next/link";
import { listQuoteDocuments } from "@/app/dashboard/devis/quote-actions";
import { QuoteSchemaMissingCallout } from "@/components/devis/QuoteSchemaMissingCallout";
import { QUOTE_DOCUMENT_STATUS_LABELS, QUOTE_DOCUMENT_TYPE_LABELS } from "@/lib/be-work-devis-quote-labels";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableRow,
  DataTableTd,
  DataTableTh,
} from "@/components/ui/DataTable";

type SearchParams = Promise<{ project?: string }>;

export default async function DevisDocumentsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireBeWorkDevisSession();
  const sp = await searchParams;
  const projectId = sp.project?.trim() || undefined;

  let quoteSchemaOk = true;
  let docs: Awaited<ReturnType<typeof listQuoteDocuments>> = [];
  try {
    docs = await listQuoteDocuments(projectId);
  } catch {
    quoteSchemaOk = false;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Chiffrage"
        title="Documents"
        description="Devis estimatifs, DPGF de consultation, comparatifs et autres documents liés aux projets."
        actions={
          quoteSchemaOk ? (
            <Link href="/dashboard/devis/creer" className="btn-cc-primary">
              Créer un devis
            </Link>
          ) : null
        }
      />

      {projectId ? (
        <p className="text-xs text-bework-muted">
          Filtre actif sur un projet.{" "}
          <Link href="/dashboard/devis/documents" className="font-semibold text-bework-navy hover:underline">
            Afficher tous les documents
          </Link>
        </p>
      ) : null}

      {!quoteSchemaOk ? <QuoteSchemaMissingCallout /> : null}

      {quoteSchemaOk ? (
        docs.length === 0 ? (
          <EmptyState
            title="Aucun document"
            description="Créez un devis pour démarrer le chiffrage de ce chantier."
            actionHref="/dashboard/devis/creer"
            actionLabel="Créer un devis"
          />
        ) : (
          <DataTable minWidth="900px">
            <DataTableHead>
              <DataTableTh>N°</DataTableTh>
              <DataTableTh>Titre</DataTableTh>
              <DataTableTh>Type</DataTableTh>
              <DataTableTh>Statut</DataTableTh>
              <DataTableTh>Client / projet</DataTableTh>
              <DataTableTh>Émission</DataTableTh>
              <DataTableTh>Actions</DataTableTh>
            </DataTableHead>
            <DataTableBody>
              {docs.map((d) => (
                <DataTableRow key={d.id}>
                  <DataTableTd>
                    <span className="font-mono text-xs text-bework-ink">{d.documentNumber}</span>
                  </DataTableTd>
                  <DataTableTd>
                    <span className="font-semibold text-bework-ink">{d.title}</span>
                  </DataTableTd>
                  <DataTableTd>{QUOTE_DOCUMENT_TYPE_LABELS[d.documentType]}</DataTableTd>
                  <DataTableTd>
                    <Badge>{QUOTE_DOCUMENT_STATUS_LABELS[d.status]}</Badge>
                  </DataTableTd>
                  <DataTableTd>
                    {d.project.clientName}
                    <span className="block text-xs text-bework-muted">{d.project.projectName}</span>
                  </DataTableTd>
                  <DataTableTd>
                    <span className="whitespace-nowrap text-bework-muted">
                      {new Date(d.issueDate).toLocaleDateString("fr-FR")}
                    </span>
                  </DataTableTd>
                  <DataTableTd>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <Link
                        href={`/dashboard/devis/documents/${d.id}/modifier`}
                        className="text-bework-navy hover:underline"
                      >
                        Modifier
                      </Link>
                      <Link href={`/dashboard/devis/documents/${d.id}`} className="text-bework-muted hover:underline">
                        Fiche
                      </Link>
                      <a
                        href={`/dashboard/devis/documents/${d.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-bework-muted hover:underline"
                      >
                        PDF
                      </a>
                    </div>
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
