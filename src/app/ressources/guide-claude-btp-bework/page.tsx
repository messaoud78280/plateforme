import { getTutoPageDescription, tutoPageMetadata } from "@/lib/seo-tuto-metadata";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const pagePath = "/ressources/guide-claude-btp-bework";
const pageUrl = absoluteUrl(pagePath);
const pdfPath = "/ressources/pdf/guide-claude-btp-bework.pdf";

export const metadata = tutoPageMetadata(pagePath);

const H1 = "Claude IA pour le Bâtiment & les Travaux Publics — 18 cas d’usage par métier";

const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: "Guides", href: "/ressources/guides" },
  { name: "Guide Claude IA BTP", href: pagePath },
] as const;

const METIERS = [
  "Dirigeant — Go / No-Go d’un AO, clauses à risque du CCAP, litige et DGD contesté",
  "Bureau d’études — analyse CCTP, mémoire technique, postes oubliés au DQE",
  "Conducteur de travaux — CR de chantier, prépa & points d’arrêt, levée des réserves",
  "Chargé(e) d’affaires — situations de travaux, avenants, relances et impayés",
  "Maîtrise d’œuvre — comparatif d’offres et RAO, ordres de service, suivi des observations",
  "RH BTP — offres d’emploi et tri des CV, accueil sécurité, entretiens professionnels",
] as const;

export default function GuideClaudeBtpBeWorkPage() {
  const description = getTutoPageDescription(pagePath);
  const webPageBread = buildWebPageAndBreadcrumbJsonLd({
    pagePath,
    h1: H1,
    description,
    breadcrumbItems: [...breadcrumbItems],
  });

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: H1,
    description,
    url: pageUrl,
    datePublished: "2026-07-15",
    author: { "@type": "Organization" as const, name: "BeWork", url: SITE_URL },
    publisher: {
      "@type": "Organization" as const,
      name: "BeWork",
      url: SITE_URL,
      logo: { "@type": "ImageObject" as const, url: absoluteUrl("/opengraph-image") },
    },
    inLanguage: "fr-FR",
    isAccessibleForFree: true,
    numberOfPages: 14,
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageBread) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <MarketingSiteHeader plainBg />

      <main className="mx-auto max-w-site px-4 pb-16 pt-10 sm:px-6 md:pb-20 md:pt-12">
        <nav className="mb-4 text-[0.6875rem] text-slate-700 sm:text-sm" aria-label="Fil d’Ariane">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {breadcrumbItems.map((item, idx) => (
              <li key={item.href} className="flex items-center gap-2">
                <Link href={item.href} className="hover:underline">
                  {item.name}
                </Link>
                {idx < breadcrumbItems.length - 1 ? <span aria-hidden className="text-slate-400">/</span> : null}
              </li>
            ))}
          </ol>
        </nav>

        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1d4ed8]">
            Guide PDF · 14 pages · Édition juillet 2026
          </p>
          <h1 className="font-heading mt-3 text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {H1}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">{description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href={pdfPath}
              download="BeWork-Guide-Claude-IA-BTP.pdf"
              className="rounded-lg bg-[#1d4ed8] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1e40af]"
            >
              Télécharger le guide (PDF)
            </a>
            <a
              href={pdfPath}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Ouvrir en plein écran
            </a>
            <CalendlyBookingLink className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Réserver un appel
            </CalendlyBookingLink>
          </div>
        </header>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8" aria-labelledby="sommaire-heading">
          <h2 id="sommaire-heading" className="text-xl font-semibold tracking-tight text-slate-900">
            Un guide par métier — 18 cas d’usage, 18 prompts
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-slate-600">
            Chaque poste a ses tâches chronophages : le guide donne l’avant / après et le prompt à copier pour chaque cas
            d’usage, plus les bases (Claude en 2026, Chat / Cowork / Office, Projets, connecteurs, skills, Dispatch) et les
            règles d’or — l’IA reste un copilote, vous validez et vous signez.
          </p>
          <ul className="mt-5 grid gap-2 text-[0.9375rem] leading-relaxed text-slate-800 sm:grid-cols-2">
            {METIERS.map((m) => (
              <li key={m} className="rounded-lg border border-slate-200/95 bg-slate-50/80 px-3 py-2.5">
                {m}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-3xl border border-slate-200 bg-slate-100/80 p-6 shadow-sm sm:p-10" aria-label="Aperçu PDF">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Voir le PDF original</h2>
          <p className="mt-3 w-full leading-relaxed text-slate-600">
            Aperçu intégré (mise en page d’origine). Utilisez la molette pour parcourir les pages, ou ouvrez en plein écran.
          </p>
          <div className="mx-auto mt-8 w-full max-w-none">
            <iframe
              src={`${pdfPath}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
              className="h-[650px] w-full rounded-2xl border border-slate-200 bg-white shadow-sm md:h-[900px]"
              title="Claude IA pour le Bâtiment & les TP — PDF BeWork"
            />
          </div>
        </section>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
