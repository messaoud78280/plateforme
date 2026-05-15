import { createPriceSource, deletePriceSource } from "@/app/dashboard/devis/actions";
import { SOURCE_TYPE_LABELS } from "@/lib/be-work-devis-labels";
import { formatDateFr } from "@/lib/be-work-devis-format";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { prisma } from "@/lib/prisma";

export default async function SourcesPage() {
  await requireBeWorkDevisSession();

  const sources = await prisma.priceSource.findMany({
    orderBy: [{ updatedAt: "desc" }],
    include: { _count: { select: { priceEntries: true } } },
  });

  return (
    <div className="space-y-6">
      <header className="px-1">
        <h1 className="font-heading text-xl font-bold text-slate-900 sm:text-2xl">Sources documentaires</h1>
        <p className="mt-1 text-sm text-slate-600">
          Référentiel des devis, BPU, DPGF et autres pièces servant à alimenter les prix observés.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-base font-bold text-slate-900">Ajouter une source</h2>
        <form action={createPriceSource} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="text-xs font-semibold uppercase text-slate-500">Nom *</label>
            <input name="name" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Type *</label>
            <select name="sourceType" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {Object.entries(SOURCE_TYPE_LABELS).map(([k, lab]) => (
                <option key={k} value={k}>
                  {lab}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Client</label>
            <input name="clientName" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Projet</label>
            <input name="projectName" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Localisation</label>
            <input name="projectLocation" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Département</label>
            <input name="department" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Date document</label>
            <input type="date" name="dateDocument" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="text-xs font-semibold uppercase text-slate-500">Notes</label>
            <textarea name="notes" rows={2} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <button type="submit" className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#152a45]">
              Enregistrer la source
            </button>
          </div>
        </form>
      </section>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[980px] w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Projet</th>
              <th className="px-4 py-3">Localisation</th>
              <th className="px-4 py-3">Département</th>
              <th className="px-4 py-3">Date document</th>
              <th className="px-4 py-3">Nb prix</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sources.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                  Aucune source enregistrée — utilisez le formulaire ci-dessus.
                </td>
              </tr>
            ) : (
              sources.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80">
                  <td className="max-w-[200px] truncate px-4 py-3 font-semibold text-slate-900" title={s.name}>
                    {s.name}
                  </td>
                  <td className="px-4 py-3">{SOURCE_TYPE_LABELS[s.sourceType]}</td>
                  <td className="max-w-[140px] truncate px-4 py-3">{s.clientName ?? "—"}</td>
                  <td className="max-w-[140px] truncate px-4 py-3">{s.projectName ?? "—"}</td>
                  <td className="max-w-[160px] truncate px-4 py-3">{s.projectLocation ?? "—"}</td>
                  <td className="px-4 py-3">{s.department ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3">{formatDateFr(s.dateDocument)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{s._count.priceEntries}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={deletePriceSource} className="inline">
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className="text-xs font-semibold text-red-700 hover:underline">
                        Supprimer
                      </button>
                    </form>
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
