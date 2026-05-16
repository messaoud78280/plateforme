import Link from "next/link";
import { createQuoteProject } from "@/app/dashboard/devis/quote-actions";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";

export default async function NouveauProjetPage() {
  await requireBeWorkDevisSession();

  return (
    <div className="mx-auto max-w-xl space-y-6 px-1">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1e3a5f]/80">Projets</p>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Nouveau projet client</h1>
        <p className="mt-1 text-sm text-slate-600">Les champs optionnels peuvent être complétés plus tard dans l&apos;éditeur.</p>
      </header>

      <form action={createQuoteProject} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="clientName">
            Nom du client *
          </label>
          <input id="clientName" name="clientName" required className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="projectName">
            Intitulé du projet *
          </label>
          <input id="projectName" name="projectName" required className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="clientEmail">
              E-mail
            </label>
            <input id="clientEmail" name="clientEmail" type="email" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="clientPhone">
              Téléphone
            </label>
            <input id="clientPhone" name="clientPhone" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="projectAddress">
            Adresse chantier
          </label>
          <input id="projectAddress" name="projectAddress" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="projectCity">
              Ville
            </label>
            <input id="projectCity" name="projectCity" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="projectDepartment">
              Département
            </label>
            <input id="projectDepartment" name="projectDepartment" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="projectType">
            Type de projet
          </label>
          <input id="projectType" name="projectType" placeholder="Maison individuelle, extension…" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="notes">
            Notes internes
          </label>
          <textarea id="notes" name="notes" rows={3} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" className="rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#152a45]">
            Enregistrer
          </button>
          <Link href="/dashboard/devis/projets" className="inline-flex items-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
