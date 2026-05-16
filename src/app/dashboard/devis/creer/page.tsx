import Link from "next/link";
import { createQuoteDocumentWizard, listQuoteProjectsForSelect } from "@/app/dashboard/devis/quote-actions";
import { QUOTE_DOCUMENT_TYPE_LABELS } from "@/lib/be-work-devis-quote-labels";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";

export default async function CreerDevisPage() {
  await requireBeWorkDevisSession();
  const projects = await listQuoteProjectsForSelect();

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-1">
      <header className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1e3a5f]/80">Assistant</p>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Créer un devis</h1>
        <p className="text-sm leading-relaxed text-slate-600">
          Choisissez un projet client, le type de document, puis créez le brouillon. Vous serez redirigé vers
          l&apos;éditeur pour ajouter les lignes et générer le PDF.
        </p>
      </header>

      <ol className="space-y-6 text-sm">
        <li className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wide text-[#1e3a5f]">Étape 1</span>
          <h2 className="mt-1 font-heading text-lg font-bold text-slate-900">Projet client</h2>
          <p className="mt-1 text-slate-600">
            Sélectionnez un projet existant ou{" "}
            <Link href="/dashboard/devis/projets/nouveau" className="font-semibold text-[#1e3a5f] underline-offset-2 hover:underline">
              créez-en un nouveau
            </Link>
            .
          </p>
        </li>
        <li className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wide text-[#1e3a5f]">Étape 2</span>
          <h2 className="mt-1 font-heading text-lg font-bold text-slate-900">Type & titre</h2>
          <p className="mt-1 text-slate-600">Par défaut : devis estimatif. Ajustez selon le contexte.</p>
        </li>
        <li className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wide text-[#1e3a5f]">Étape 3</span>
          <h2 className="mt-1 font-heading text-lg font-bold text-slate-900">Création</h2>
          <p className="mt-1 text-slate-600">Le document est créé en brouillon avec une réserve légale adaptée au type.</p>
        </li>
      </ol>

      <form action={createQuoteDocumentWizard} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="projectId" className="block text-xs font-bold uppercase tracking-wide text-slate-500">
            Projet
          </label>
          <select
            id="projectId"
            name="projectId"
            required
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              — Choisir un projet —
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.clientName} — {p.projectName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="documentType" className="block text-xs font-bold uppercase tracking-wide text-slate-500">
            Type de document
          </label>
          <select
            id="documentType"
            name="documentType"
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            defaultValue="devis_estimatif"
          >
            {(Object.keys(QUOTE_DOCUMENT_TYPE_LABELS) as (keyof typeof QUOTE_DOCUMENT_TYPE_LABELS)[]).map((k) => (
              <option key={k} value={k}>
                {QUOTE_DOCUMENT_TYPE_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wide text-slate-500">
            Titre du document
          </label>
          <input
            id="title"
            name="title"
            required
            placeholder="Ex. Estimation gros œuvre — Lot 01"
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="issueDate" className="block text-xs font-bold uppercase tracking-wide text-slate-500">
              Date d&apos;émission
            </label>
            <input
              id="issueDate"
              name="issueDate"
              type="date"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="validityDate" className="block text-xs font-bold uppercase tracking-wide text-slate-500">
              Date de validité (optionnel)
            </label>
            <input id="validityDate" name="validityDate" type="date" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" className="rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#152a45]">
            Créer le document
          </button>
          <Link
            href="/dashboard/devis/projets"
            className="inline-flex items-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Gérer les projets
          </Link>
        </div>
      </form>
    </div>
  );
}
