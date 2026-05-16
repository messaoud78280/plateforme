import Link from "next/link";
import { listQuoteDocuments } from "@/app/dashboard/devis/quote-actions";
import { QUOTE_DOCUMENT_STATUS_LABELS, QUOTE_DOCUMENT_TYPE_LABELS } from "@/lib/be-work-devis-quote-labels";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";

type SearchParams = Promise<{ project?: string }>;

export default async function DevisDocumentsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireBeWorkDevisSession();
  const sp = await searchParams;
  const projectId = sp.project?.trim() || undefined;
  const docs = await listQuoteDocuments(projectId);

  return (
    <div className="space-y-6 px-1">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1e3a5f]/80">Chiffrage</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Documents</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Devis estimatifs, DPGF de consultation, comparatifs et autres documents liés aux projets.
          </p>
          {projectId ? (
            <p className="mt-2 text-xs text-slate-500">
              Filtre actif sur un projet.{" "}
              <Link href="/dashboard/devis/documents" className="font-semibold text-[#1e3a5f] hover:underline">
                Afficher tous les documents
              </Link>
            </p>
          ) : null}
        </div>
        <Link
          href="/dashboard/devis/creer"
          className="inline-flex w-fit items-center rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#152a45]"
        >
          Créer un devis
        </Link>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[900px] w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="border-b border-slate-200 px-4 py-3">N°</th>
              <th className="border-b border-slate-200 px-4 py-3">Titre</th>
              <th className="border-b border-slate-200 px-4 py-3">Type</th>
              <th className="border-b border-slate-200 px-4 py-3">Statut</th>
              <th className="border-b border-slate-200 px-4 py-3">Client / projet</th>
              <th className="border-b border-slate-200 px-4 py-3">Émission</th>
              <th className="border-b border-slate-200 px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  Aucun document.{" "}
                  <Link href="/dashboard/devis/creer" className="font-semibold text-[#1e3a5f] hover:underline">
                    Créer un devis
                  </Link>
                </td>
              </tr>
            ) : (
              docs.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-800">{d.documentNumber}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{d.title}</td>
                  <td className="px-4 py-3 text-slate-600">{QUOTE_DOCUMENT_TYPE_LABELS[d.documentType]}</td>
                  <td className="px-4 py-3 text-slate-600">{QUOTE_DOCUMENT_STATUS_LABELS[d.status]}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {d.project.clientName}
                    <span className="block text-xs text-slate-500">{d.project.projectName}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {new Date(d.issueDate).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/dashboard/devis/documents/${d.id}/modifier`} className="font-semibold text-[#1e3a5f] hover:underline">
                        Modifier
                      </Link>
                      <Link href={`/dashboard/devis/documents/${d.id}`} className="text-slate-600 hover:underline">
                        Fiche
                      </Link>
                      <a
                        href={`/dashboard/devis/documents/${d.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-600 hover:underline"
                      >
                        PDF
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
