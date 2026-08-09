import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { PilotageSubNav } from "@/components/pilotage/PilotageSubNav";
import { DEFAULT_MILESTONES, PILOTAGE_LIST_PATH } from "@/lib/pilotage/constants";
import { requirePilotageSession } from "@/lib/pilotage/access";
import {
  MARKET_TEMPLATES,
  PILOTAGE_TEMPLATES,
  templateItemCount,
} from "@/lib/pilotage/templates";

export const dynamic = "force-dynamic";

export default async function PilotageModelesPage() {
  await requirePilotageSession();

  return (
    <div className="space-y-6">
      <BackLink href={PILOTAGE_LIST_PATH}>Portefeuille</BackLink>
      <PilotageSubNav />
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Bibliothèque de modèles</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Modèles de lots et de marchés pour accélérer la mise en route. Les éléments issus d’un modèle restent « À
          vérifier » jusqu’à validation humaine.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Modèles de lots ({PILOTAGE_TEMPLATES.length})</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {PILOTAGE_TEMPLATES.map((t) => (
            <article key={t.id} className="pilotage-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700/80">{t.category}</p>
                  <h3 className="text-base font-bold text-slate-900">{t.label}</h3>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
                  Actif
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                v{t.version} · {templateItemCount(t)} éléments · {DEFAULT_MILESTONES.length} jalons types
              </p>
              <ul className="mt-3 space-y-1 text-xs text-slate-600">
                <li>{t.obligations.length} obligations</li>
                <li>{t.requiredDocuments.length} documents</li>
                <li>{t.doeItems.length} éléments DOE</li>
                <li>{t.actions.length} actions · {t.plans.length} plans</li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`${PILOTAGE_LIST_PATH}/nouveau?modele=${t.id}`}
                  className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Appliquer au chantier
                </Link>
                <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500">
                  Aperçu catalogue
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Modèles de marchés</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {MARKET_TEMPLATES.map((t) => (
            <article key={t.id} className="pilotage-card p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t.category}</p>
              <h3 className="text-base font-bold text-slate-900">{t.label}</h3>
              <p className="mt-2 text-xs text-slate-500">{t.items} éléments types · structure à compléter</p>
              <p className="mt-3 text-xs text-amber-800">
                Disponible progressivement — appliquez d’abord un modèle de lot à la création.
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
