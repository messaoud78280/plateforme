import Link from "next/link";
import { redirect } from "next/navigation";
import type { SiteResourceType } from "@prisma/client";
import { CHANTIER_RESOURCE_TAXONOMY, CHANTIER_RESOURCE_TYPE_LABELS } from "@/lib/chantier-resources/taxonomy";
import { createManualSiteResource } from "@/app/dashboard/devis/ressources-chantier-actions";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";

export default async function NouvelleRessourceChantierPage() {
  await requireBeWorkDevisSession();

  async function action(formData: FormData) {
    "use server";
    const res = await createManualSiteResource(formData);
    if (res.ok) redirect(`/dashboard/devis/ressources-chantier/${res.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/dashboard/devis/ressources-chantier" className="text-sm font-semibold text-[#1d4ed8] hover:underline">
        ← Ressources chantier
      </Link>
      <h1 className="font-heading text-2xl font-bold text-slate-900">Nouvelle ressource chantier</h1>
      <form action={action} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block text-sm">
          <span className="font-medium">Nom court</span>
          <input name="shortName" required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Désignation complète</span>
          <textarea name="fullDescription" required rows={4} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Type</span>
          <select name="resourceType" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2">
            {(Object.keys(CHANTIER_RESOURCE_TYPE_LABELS) as SiteResourceType[]).map((t) => (
              <option key={t} value={t}>
                {CHANTIER_RESOURCE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium">Famille (clé)</span>
          <select name="family" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" defaultValue="divers-materiaux">
            {CHANTIER_RESOURCE_TAXONOMY.materiaux.map((f) => (
              <option key={f.family} value={f.family}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium">Unité</span>
          <input name="orderUnit" defaultValue="u" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
        </label>
        <button type="submit" className="rounded-xl bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white">
          Créer la fiche
        </button>
      </form>
    </div>
  );
}
