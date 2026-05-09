import Link from "next/link";
import { GeoExternalisationFooterPills } from "@/components/layout/GeoExternalisationFooterPills";

/** Bandeau clair au-dessus du footer marketing (ressources + pays). */
export function MarketingSitePreFooter() {
  return (
    <section
      className="relative z-10 isolate border-t border-slate-200/80 bg-[#f9fafb] text-slate-900"
      aria-labelledby="prefooter-ressources"
    >
      <div className="mx-auto max-w-site px-5 py-12 sm:px-6 sm:py-14 lg:py-16">
        <div className="max-w-3xl">
          <h2 id="prefooter-ressources" className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.65rem]">
            Ressources &amp; bonnes pratiques
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-[1.05rem]">
            Tutoriels PDF, guides et hub ressources pour structurer l&apos;administratif chantier : relances et trésorerie, dossiers travaux et relation
            clients, sans perdre les équipes terrain.
          </p>
          <Link
            href="/ressources"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            Voir toutes les ressources
            <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h3 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">Externalisation administrative BTP par pays</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Contenus distincts selon votre marché : France, Belgique, Suisse romande et Luxembourg. Ouvrez la page qui correspond à votre zone d&apos;activité.
          </p>
          <div className="mt-6">
            <GeoExternalisationFooterPills />
          </div>
        </div>
      </div>
    </section>
  );
}
