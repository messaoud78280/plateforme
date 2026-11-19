import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BtpPageHero } from "@/components/marketing-btp/BtpPageHero";
import "@/components/marketing-btp/btp-marketing.css";
import { BTP_SEO_PAGES } from "@/lib/bework-btp-services";
import {
  breadcrumbJsonLd,
  buildMarketingPageMetadata,
} from "@/lib/seo-formation-pages";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const seo = BTP_SEO_PAGES.contact;
const pageUrl = absoluteUrl(seo.path);

export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  description: seo.description,
});

const contactJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ContactPage",
      "@id": `${pageUrl}#contact-page`,
      url: pageUrl,
      name: `${seo.title} | BeWork`,
      inLanguage: "fr-FR",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      description: seo.description,
      mainEntity: { "@id": `${SITE_URL}/#organization` },
    },
    breadcrumbJsonLd([
      { name: "Accueil", path: "/" },
      { name: "Contact", path: "/contact" },
    ]),
  ],
};

export default function ContactPage() {
  return (
    <div className="bw-btp-site min-h-screen min-w-0 overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />
      <MarketingSiteHeader plainBg />
      <main>
        <BtpPageHero
          eyebrow="CONTACT"
          title="Parlons de votre besoin opérationnel."
          subtitle="Pour une proposition précise, utilisez le formulaire de devis. Pour une question courte, écrivez-nous via le parcours ci-dessous."
          primaryHref="/demande-de-devis"
          primaryLabel="Demander un devis"
        />

        <section className="bw-btp-section bw-btp-section-alt">
          <div className="bw-btp-container grid gap-6 md:grid-cols-2">
            <article className="bw-btp-card">
              <h2 className="text-xl font-bold">Demande de devis</h2>
              <p className="mt-3 text-base leading-relaxed text-[var(--btp-muted)]">
                Le parcours recommandé pour décrire un chantier, une mission de
                conduite de travaux ou une étude de marché.
              </p>
              <Link href="/demande-de-devis" className="bw-btp-btn bw-btp-btn-primary mt-6">
                Ouvrir le formulaire
              </Link>
            </article>
            <article className="bw-btp-card">
              <h2 className="text-xl font-bold">Formation professionnelle BTP</h2>
              <p className="mt-3 text-base leading-relaxed text-[var(--btp-muted)]">
                Besoin de formation terrain pour conducteurs, chefs d’équipe ou
                compagnons ? Utilisez le formulaire dédié — sans affirmation
                Qualiopi ou CPF.
              </p>
              <Link
                href="/formation-professionnelle-btp#demande-formation"
                className="bw-btp-btn bw-btp-btn-secondary-dark mt-6"
              >
                Exprimer un besoin formation
              </Link>
            </article>
          </div>
          <div className="bw-btp-container mt-8">
            <p className="text-base text-[var(--btp-muted)]">
              Zone d’intervention prioritaire : Yvelines et Île-de-France —
              autres zones étudiées selon la mission.
            </p>
          </div>
        </section>
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
