import Link from "next/link";
import { listQuoteProjectsTable } from "@/app/dashboard/devis/quote-actions";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";

export default async function DevisProjetsPage() {
  await requireBeWorkDevisSession();
  const projects = await listQuoteProjectsTable();

  return (
    <div className="space-y-6 px-1">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1e3a5f]/80">Clients</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Projets</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Regroupez vos documents de chiffrage par chantier ou dossier client.
          </p>
        </div>
        <Link
          href="/dashboard/devis/projets/nouveau"
          className="inline-flex w-fit items-center rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#152a45]"
        >
          Nouveau projet
        </Link>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[640px] w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="border-b border-slate-200 px-4 py-3">Client</th>
              <th className="border-b border-slate-200 px-4 py-3">Projet</th>
              <th className="border-b border-slate-200 px-4 py-3">Documents</th>
              <th className="border-b border-slate-200 px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                  Aucun projet.{" "}
                  <Link href="/dashboard/devis/projets/nouveau" className="font-semibold text-[#1e3a5f] hover:underline">
                    Créer un projet
                  </Link>
                </td>
              </tr>
            ) : (
              projects.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-medium text-slate-900">{p.clientName}</td>
                  <td className="px-4 py-3 text-slate-700">{p.projectName}</td>
                  <td className="px-4 py-3 text-slate-600">{p._count.documents}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/devis/documents?project=${p.id}`}
                      className="font-semibold text-[#1e3a5f] hover:underline"
                    >
                      Voir les documents
                    </Link>
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
