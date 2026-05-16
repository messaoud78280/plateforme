import Link from "next/link";
import { notFound } from "next/navigation";
import { updateQuoteDocumentMeta } from "@/app/dashboard/devis/quote-actions";
import type { QuoteLineDraft } from "@/app/dashboard/devis/quote-actions";
import { QuoteDocumentEditor } from "@/components/devis/QuoteDocumentEditor";
import { QUOTE_DOCUMENT_STATUS_LABELS, QUOTE_DOCUMENT_TYPE_LABELS } from "@/lib/be-work-devis-quote-labels";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { prisma } from "@/lib/prisma";
import type { QuoteLine } from "@prisma/client";

type PageProps = { params: Promise<{ id: string }> };

function inputDate(d: Date) {
  return new Date(d).toISOString().slice(0, 10);
}

function lineToDraft(l: QuoteLine): QuoteLineDraft {
  return {
    id: l.id,
    workItemId: l.workItemId,
    lot: l.lot,
    family: l.family,
    code: l.code,
    title: l.title,
    description: l.description,
    unit: l.unit,
    quantity: l.quantity.toString(),
    unitPriceHT: l.unitPriceHT.toString(),
    vatRate: l.vatRate.toString(),
    includedItems: l.includedItems,
    excludedItems: l.excludedItems,
    vigilancePoints: l.vigilancePoints,
    sortOrder: l.sortOrder,
  };
}

export default async function ModifierQuoteDocumentPage({ params }: PageProps) {
  await requireBeWorkDevisSession();
  const { id } = await params;
  const doc = await prisma.quoteDocument.findUnique({
    where: { id },
    include: {
      project: true,
      lines: { orderBy: [{ sortOrder: "asc" }, { lot: "asc" }] },
    },
  });
  if (!doc) notFound();

  const lineDrafts = doc.lines.map(lineToDraft);
  const defaultVat = doc.globalVatRate.toString();

  return (
    <div className="space-y-10 px-1">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1e3a5f]/80">Éditeur</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">{doc.title}</h1>
          <p className="mt-1 font-mono text-xs text-slate-500">{doc.documentNumber}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/devis/documents/${doc.id}`}
            className="inline-flex rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Fiche
          </Link>
          <a
            href={`/dashboard/devis/documents/${doc.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            PDF
          </a>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-slate-900">Projet & client</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Client</dt>
            <dd className="mt-0.5 text-slate-900">{doc.project.clientName}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Projet</dt>
            <dd className="mt-0.5 text-slate-900">{doc.project.projectName}</dd>
          </div>
          {doc.project.clientEmail ? (
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">E-mail</dt>
              <dd className="mt-0.5 text-slate-900">{doc.project.clientEmail}</dd>
            </div>
          ) : null}
          {doc.project.clientPhone ? (
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Téléphone</dt>
              <dd className="mt-0.5 text-slate-900">{doc.project.clientPhone}</dd>
            </div>
          ) : null}
          {doc.project.projectAddress ? (
            <div className="sm:col-span-2">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Adresse</dt>
              <dd className="mt-0.5 text-slate-900">
                {doc.project.projectAddress}
                {doc.project.projectCity ? `, ${doc.project.projectCity}` : ""}
                {doc.project.projectDepartment ? ` (${doc.project.projectDepartment})` : ""}
              </dd>
            </div>
          ) : null}
          {doc.project.projectType ? (
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Type</dt>
              <dd className="mt-0.5 text-slate-900">{doc.project.projectType}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-slate-900">En-tête du document</h2>
        <p className="mt-1 text-sm text-slate-600">
          Enregistrez les informations générales ici ; les lignes et totaux détaillés sont gérés dans le tableau ci-dessous.
        </p>
        <form action={updateQuoteDocumentMeta} className="mt-6 space-y-4">
          <input type="hidden" name="id" value={doc.id} />
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="title">
              Titre
            </label>
            <input id="title" name="title" required defaultValue={doc.title} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="documentType">
                Type de document
              </label>
              <select
                id="documentType"
                name="documentType"
                defaultValue={doc.documentType}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              >
                {(Object.keys(QUOTE_DOCUMENT_TYPE_LABELS) as (keyof typeof QUOTE_DOCUMENT_TYPE_LABELS)[]).map((k) => (
                  <option key={k} value={k}>
                    {QUOTE_DOCUMENT_TYPE_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="status">
                Statut
              </label>
              <select id="status" name="status" defaultValue={doc.status} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                {(Object.keys(QUOTE_DOCUMENT_STATUS_LABELS) as (keyof typeof QUOTE_DOCUMENT_STATUS_LABELS)[]).map((k) => (
                  <option key={k} value={k}>
                    {QUOTE_DOCUMENT_STATUS_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="issueDate">
                Date d&apos;émission
              </label>
              <input
                id="issueDate"
                name="issueDate"
                type="date"
                defaultValue={inputDate(new Date(doc.issueDate))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="validityDate">
                Date de validité
              </label>
              <input
                id="validityDate"
                name="validityDate"
                type="date"
                defaultValue={doc.validityDate ? inputDate(new Date(doc.validityDate)) : ""}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="globalVatRate">
                TVA globale par défaut (%)
              </label>
              <input
                id="globalVatRate"
                name="globalVatRate"
                defaultValue={defaultVat}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="notesClient">
              Notes client (PDF)
            </label>
            <textarea
              id="notesClient"
              name="notesClient"
              rows={3}
              defaultValue={doc.notesClient ?? ""}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="internalNotes">
              Notes internes
            </label>
            <textarea
              id="internalNotes"
              name="internalNotes"
              rows={2}
              defaultValue={doc.internalNotes ?? ""}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="legalDisclaimer">
              Mentions / réserve
            </label>
            <textarea
              id="legalDisclaimer"
              name="legalDisclaimer"
              rows={4}
              defaultValue={doc.legalDisclaimer ?? ""}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </div>
          <button type="submit" className="rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#152a45]">
            Enregistrer l&apos;en-tête
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900">Lignes du document</h2>
            <p className="text-sm text-slate-600">
              Totaux enregistrés (base) : HT {doc.subtotalHT.toString()} € · TVA {doc.totalVat.toString()} € · TTC{" "}
              {doc.totalTTC.toString()} € — mis à jour après enregistrement des lignes.
            </p>
          </div>
        </div>
        <QuoteDocumentEditor documentId={doc.id} initialLines={lineDrafts} defaultVatRate={defaultVat} />
      </section>
    </div>
  );
}
