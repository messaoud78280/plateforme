import Link from "next/link";
import { notFound } from "next/navigation";
import { QUOTE_DOCUMENT_STATUS_LABELS, QUOTE_DOCUMENT_TYPE_LABELS } from "@/lib/be-work-devis-quote-labels";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { isMissingQuoteSchemaError } from "@/lib/be-work-devis-prisma-guard";
import { prisma } from "@/lib/prisma";
import { QuoteSchemaMissingCallout } from "@/components/devis/QuoteSchemaMissingCallout";

type PageProps = { params: Promise<{ id: string }> };

export default async function QuoteDocumentFichePage({ params }: PageProps) {
  await requireBeWorkDevisSession();
  const { id } = await params;
  let doc;
  try {
    doc = await prisma.quoteDocument.findUnique({
      where: { id },
      include: { project: true },
    });
  } catch (e) {
    if (isMissingQuoteSchemaError(e)) {
      return (
        <div className="mx-auto max-w-3xl space-y-6 px-1">
          <QuoteSchemaMissingCallout />
          <Link href="/dashboard/devis/documents" className="inline-flex text-sm font-semibold text-[#1e3a5f] hover:underline">
            Retour à la liste des documents
          </Link>
        </div>
      );
    }
    throw e;
  }
  if (!doc) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-1">
      <header className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1e3a5f]/80">Document</p>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">{doc.title}</h1>
        <p className="font-mono text-sm text-slate-600">{doc.documentNumber}</p>
      </header>

      <dl className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-sm shadow-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Type</dt>
          <dd className="mt-1 text-slate-900">{QUOTE_DOCUMENT_TYPE_LABELS[doc.documentType]}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Statut</dt>
          <dd className="mt-1 text-slate-900">{QUOTE_DOCUMENT_STATUS_LABELS[doc.status]}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Émission</dt>
          <dd className="mt-1 text-slate-900">{new Date(doc.issueDate).toLocaleDateString("fr-FR")}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Validité</dt>
          <dd className="mt-1 text-slate-900">
            {doc.validityDate ? new Date(doc.validityDate).toLocaleDateString("fr-FR") : "—"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Client</dt>
          <dd className="mt-1 text-slate-900">{doc.project.clientName}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Projet</dt>
          <dd className="mt-1 text-slate-900">{doc.project.projectName}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Total HT</dt>
          <dd className="mt-1 font-semibold text-slate-900">{doc.subtotalHT.toString()} €</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Total TTC</dt>
          <dd className="mt-1 font-semibold text-[#1e3a5f]">{doc.totalTTC.toString()} €</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/dashboard/devis/documents/${doc.id}/modifier`}
          className="inline-flex rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#152a45]"
        >
          Modifier
        </Link>
        <a
          href={`/dashboard/devis/documents/${doc.id}/pdf`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Télécharger le PDF
        </a>
        <Link href="/dashboard/devis/documents" className="inline-flex rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:underline">
          Retour à la liste
        </Link>
      </div>
    </div>
  );
}
