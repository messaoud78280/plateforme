import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BtpCtaBand } from "@/components/marketing-btp/BtpCtaBand";
import { BtpPageHero } from "@/components/marketing-btp/BtpPageHero";
import "@/components/marketing-btp/btp-marketing.css";
import { BTP_SEO_PAGES } from "@/lib/bework-btp-services";
import { buildMarketingPageMetadata } from "@/lib/seo-formation-pages";
import { SITE_URL } from "@/lib/site";

const seo = BTP_SEO_PAGES.organismeFormation;
export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  description: seo.description,
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: seo.title,
  description: seo.description,
  url: `${SITE_URL}${seo.path}`,
  isPartOf: { "@type": "WebSite", name: "BeWork", url: SITE_URL },
};

export default function OrganismeFormationPage() {
  return (
    <div className="bw-btp-site min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketingSiteHeader />
      <main>
        <BtpPageHero
          eyebrow="ORGANISME DE FORMATION"
          title="Présentation de l’activité formation BeWork."
          subtitle="BeWork prépare une offre de formation professionnelle BTP orientée chantier. Cette page présente l’intention pédagogique — sans afficher de certification Qualiopi, d’éligibilité CPF ou de financement non vérifié pour la structure concernée."
          primaryHref="/demande-de-devis?besoin=autre"
          primaryLabel="Exprimer un besoin formation"
          secondaryHref="/formation-professionnelle-btp"
          secondaryLabel="Voir le hub formation"
          note="Transparence commerciale • Aucune certification inventée"
        />

        <section className="bw-btp-section" aria-labelledby="mission-title">
          <div className="bw-btp-container max-w-3xl">
            <h2 id="mission-title" className="font-bold">
              Intention pédagogique.
            </h2>
            <p className="mt-4 text-base text-[var(--btp-muted)]">
              L’objectif est de transmettre des compétences opérationnelles aux
              salariés du BTP : conduite de travaux, encadrement de chantier,
              chefs d’équipe TP/VRD et compagnons — en privilégiant les
              formations pratiques sur les ouvrages.
            </p>
            <ul className="bw-home-offer-list mt-8">
              <li>Formations adaptées aux méthodes d’exécution</li>
              <li>Ancrage terrain et exigences des entreprises</li>
              <li>Programmes précisés après étude du besoin</li>
              <li>Activation commerciale progressive</li>
            </ul>
            <p className="mt-8 text-sm text-[var(--btp-muted)]">
              Les éventuelles certifications, agréments ou financements publics
              ne sont mentionnés que lorsqu’ils sont vérifiés et documentés pour
              l’entité concernée. En l’absence de preuve publiée ici, aucune
              affirmation Qualiopi ou CPF n’est faite.
            </p>
          </div>
        </section>

        <section className="bw-btp-section bw-btp-section-alt">
          <div className="bw-btp-container">
            <h2 className="font-bold">Liens utiles</h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/formation-professionnelle-btp"
                className="bw-btp-btn bw-btp-btn-secondary"
              >
                Hub formation BTP
              </Link>
              <Link
                href="/conduite-de-travaux"
                className="bw-btp-btn bw-btp-btn-secondary"
              >
                Conduite de travaux
              </Link>
              <Link
                href="/equipes-tp-vrd"
                className="bw-btp-btn bw-btp-btn-secondary"
              >
                Équipes TP/VRD
              </Link>
              <Link href="/mentions-legales" className="bw-btp-btn bw-btp-btn-secondary">
                Mentions légales
              </Link>
            </div>
          </div>
        </section>

        <BtpCtaBand
          title="Une question sur la formation BeWork ?"
          subtitle="Décrivez votre besoin. Nous précisons le cadre sans engagement sur des labels non vérifiés."
          ctaHref="/formation-professionnelle-btp#demande-formation"
          ctaLabel="Exprimer un besoin formation"
        />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
