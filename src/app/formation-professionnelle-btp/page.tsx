import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BtpCtaBand } from "@/components/marketing-btp/BtpCtaBand";
import { BtpPageHero } from "@/components/marketing-btp/BtpPageHero";
import "@/components/marketing-btp/btp-marketing.css";
import { BTP_FORMATION_PAGES, BTP_SEO_PAGES } from "@/lib/bework-btp-services";
import { buildMarketingPageMetadata } from "@/lib/seo-formation-pages";
import { SITE_URL } from "@/lib/site";

const seo = BTP_SEO_PAGES.formationHub;
export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  description: seo.description,
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: seo.title,
  description: seo.description,
  url: `${SITE_URL}${seo.path}`,
  isPartOf: { "@type": "WebSite", name: "BeWork", url: SITE_URL },
};

export default function FormationProfessionnelleBtpPage() {
  return (
    <div className="bw-btp-site min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketingSiteHeader />
      <main>
        <BtpPageHero
          eyebrow="FORMATION PROFESSIONNELLE BTP — EN DÉVELOPPEMENT"
          title="Formations pratiques sur chantier pour les entreprises du BTP."
          subtitle="BeWork prépare une offre de formation professionnelle orientée terrain : conducteurs de travaux, chefs de chantier, chefs d’équipe TP/VRD et compagnons. Priorité aux formations adaptées aux ouvrages et aux modes opératoires. Activation commerciale progressive — sans Qualiopi ni CPF affirmés ici."
          primaryHref="/demande-de-devis?besoin=autre"
          primaryLabel="Exprimer un besoin formation"
          secondaryHref="/organisme-formation"
          secondaryLabel="Organisme de formation"
          note="Silo SEO prêt • Offre commerciale progressive • Yvelines & Île-de-France"
        />

        <section className="bw-btp-section" aria-labelledby="parcours-title">
          <div className="bw-btp-container">
            <h2 id="parcours-title" className="font-bold">
              Parcours envisagés.
            </h2>
            <p className="mt-3 max-w-3xl text-base text-[var(--btp-muted)]">
              Pages préparées pour le référencement. Contenu et modalités seront
              précisés sur devis — sans inventer de catalogue de sessions.
            </p>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {BTP_FORMATION_PAGES.filter(
                (p) => p.path !== "/formation-professionnelle-btp",
              ).map((p) => (
                <Link
                  key={p.path}
                  href={p.path}
                  className="bw-btp-card block transition hover:border-[var(--btp-border-strong)]"
                >
                  <h3 className="font-bold">{p.title}</h3>
                  <p className="mt-3 text-base text-[var(--btp-muted)]">
                    {p.summary}
                  </p>
                  <span className="mt-4 inline-block text-base font-semibold text-[var(--btp-accent)]">
                    Consulter →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bw-btp-section bw-btp-section-alt">
          <div className="bw-btp-container max-w-3xl">
            <h2 className="font-bold">Hiérarchie commerciale BeWork</h2>
            <p className="mt-4 text-base text-[var(--btp-muted)]">
              La formation vient ensuite. Les offres prioritaires restent la{" "}
              <Link
                href="/conduite-de-travaux"
                className="font-semibold text-[var(--btp-accent)] hover:underline"
              >
                conduite de travaux externalisée
              </Link>{" "}
              et les{" "}
              <Link
                href="/equipes-tp-vrd"
                className="font-semibold text-[var(--btp-accent)] hover:underline"
              >
                équipes TP/VRD en régie
              </Link>
              .
            </p>
          </div>
        </section>

        <BtpCtaBand
          title="Préparer une formation pour vos équipes ?"
          subtitle="Indiquez le métier, le niveau et le contexte chantier. Nous cadrons une proposition sans affirmer de financements non vérifiés."
          ctaHref="/demande-de-devis?besoin=autre"
          ctaLabel="Exprimer un besoin formation"
        />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
