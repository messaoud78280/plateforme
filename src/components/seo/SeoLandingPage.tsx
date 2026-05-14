import type { ReactNode } from "react";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";

type SeoLandingPageProps = {
  /** Résumé pour le JSON-LD WebPage (aligné sur la meta description) */
  description: string;
  h1: string;
  intro: ReactNode;
  children: ReactNode;
  /** Fil d’Ariane + JSON-LD WebPage / BreadcrumbList (dernier segment = page courante) */
  breadcrumbItems?: { name: string; href: string }[];
};

export function SeoLandingPage({ description, h1, intro, children, breadcrumbItems }: SeoLandingPageProps) {
  const lastPath = breadcrumbItems?.length ? breadcrumbItems[breadcrumbItems.length - 1]?.href : undefined;
  const structuredData =
    breadcrumbItems?.length && lastPath
      ? buildWebPageAndBreadcrumbJsonLd({
          pagePath: lastPath,
          h1,
          description,
          breadcrumbItems,
        })
      : null;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {structuredData ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      ) : null}
      <MarketingSiteHeader plainBg />

      <main className="px-6 py-16 md:py-24">
        <article className="mx-auto max-w-3xl">
          {breadcrumbItems?.length ? (
            <nav className="mb-6 text-base text-black" aria-label="Fil d’Ariane">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {breadcrumbItems.map((item, i) => (
                  <li key={`${item.href}-${item.name}`} className="flex items-center gap-2">
                    {i > 0 ? <span aria-hidden className="text-black/40">/</span> : null}
                    {i < breadcrumbItems.length - 1 ? (
                      <Link href={item.href} className="font-medium text-black hover:text-[#1d4ed8]">
                        {item.name}
                      </Link>
                    ) : (
                      <span className="font-medium text-black">{item.name}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
          <h1 className="font-heading text-3xl font-bold tracking-tight text-black md:text-[2.35rem] md:leading-tight">{h1}</h1>
          <p className="mt-6 text-xl leading-relaxed text-black">{intro}</p>
          <div className="mt-12 prose prose-slate prose-lg max-w-none prose-headings:text-black prose-p:text-black prose-li:text-black prose-strong:text-black prose-p:text-[1.0625rem] prose-p:leading-[1.75] prose-p:mb-5 prose-li:my-2 prose-li:leading-relaxed prose-ul:my-4 prose-ol:my-4 prose-h2:mt-14 prose-h2:scroll-mt-28 prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-3 prose-h2:text-[1.5rem] prose-h2:font-bold prose-h2:leading-snug prose-h2:first:mt-0 md:prose-h2:text-[1.625rem] prose-h3:mt-8 prose-h3:text-[1.1875rem] prose-h3:font-bold md:prose-h3:text-xl">
            {children}
          </div>
          <div className="mt-14 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="font-heading text-[1.35rem] font-bold leading-snug text-black md:text-2xl">Passer à l’action</h2>
            <p className="mt-3 text-base leading-relaxed text-slate-700">
              BeWork intervient pour artisans, conducteurs de travaux et dirigeants BTP en France, Belgique, Suisse et Luxembourg — forfaits TTC cadrés
              par volume. Connexion requise pour confier une tâche depuis l’espace client.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] items-center justify-center rounded-xl bg-[#1d4ed8] px-5 py-3 text-base font-semibold text-white shadow-md shadow-[#1d4ed8]/20 transition hover:bg-[#1e40af]">
                Réserver un appel
              </CalendlyBookingLink>
              <Link
                href="/ressources"
                className="inline-flex min-h-[3rem] items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-5 py-3 text-base font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                Découvrir les ressources
              </Link>
              <Link
                href="/dashboard/nouvelle-demande"
                className="inline-flex min-h-[3rem] items-center justify-center rounded-xl border-2 border-[#1d4ed8]/25 bg-[#eff6ff] px-5 py-3 text-base font-semibold text-[#1e3a8a] transition hover:bg-[#dbeafe]"
              >
                Confier une tâche
              </Link>
              <Link
                href="/notre-facon-de-travailler"
                className="inline-flex min-h-[3rem] items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-5 py-3 text-base font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                Voir le Process BeWork
              </Link>
            </div>
            <p className="mt-5 text-sm text-slate-600">
              <Link href="/tarifs" className="font-semibold text-[#1d4ed8] underline underline-offset-2 hover:text-[#1e40af]">
                Consulter les forfaits
              </Link>
              {" · "}
              <Link href="/inscription" className="font-semibold text-[#1d4ed8] underline underline-offset-2 hover:text-[#1e40af]">
                Accès client
              </Link>
            </p>
          </div>
        </article>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
