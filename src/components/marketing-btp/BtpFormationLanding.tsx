import Link from "next/link";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BtpCtaBand } from "@/components/marketing-btp/BtpCtaBand";
import { BtpPageHero } from "@/components/marketing-btp/BtpPageHero";
import { BTP_FORMATION_PAGES } from "@/lib/bework-btp-services";
import { SITE_URL } from "@/lib/site";

type Props = {
  path: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  subtitle: string;
  bullets: readonly string[];
  audience?: string;
  showHubLinks?: boolean;
};

export function BtpFormationLanding({
  path,
  title,
  description,
  eyebrow,
  h1,
  subtitle,
  bullets,
  audience = "Salariés et entreprises du BTP — offre en développement",
  showHubLinks = true,
}: Props) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: `${SITE_URL}${path}`,
    isPartOf: { "@type": "WebSite", name: "BeWork", url: SITE_URL },
    about: {
      "@type": "Thing",
      name: "Formation professionnelle BTP",
    },
  };

  return (
    <div className="bw-btp-site min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketingSiteHeader />
      <main>
        <BtpPageHero
          eyebrow={eyebrow}
          title={h1}
          subtitle={subtitle}
          primaryHref="/demande-de-devis?besoin=autre"
          primaryLabel="Exprimer un besoin formation"
          secondaryHref="/formation-professionnelle-btp"
          secondaryLabel="Voir le hub formation"
          note={`${audience} • Aucune certification Qualiopi ou CPF affirmée ici`}
        />

        <section className="bw-btp-section" aria-labelledby="contenu-title">
          <div className="bw-btp-container max-w-3xl">
            <h2 id="contenu-title" className="font-bold">
              Orientation pédagogique.
            </h2>
            <p className="mt-3 text-base text-[var(--btp-muted)]">
              Contenu indicatif pour le référencement et la préparation de
              l’offre. Les programmes, dates et modalités seront précisés sur
              devis — sans inventer de sessions ouvertes ni de financements.
            </p>
            <ul className="bw-home-offer-list mt-8">
              {bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-8 text-sm text-[var(--btp-muted)]">
              BeWork privilégie les formations pratiques sur chantier,
              directement adaptées aux ouvrages, méthodes d’exécution et
              exigences des entreprises. La conduite de travaux et les équipes
              TP/VRD restent les offres commerciales prioritaires.
            </p>
          </div>
        </section>

        {showHubLinks ? (
          <section
            className="bw-btp-section bw-btp-section-alt"
            aria-labelledby="autres-formations-title"
          >
            <div className="bw-btp-container">
              <h2 id="autres-formations-title" className="font-bold">
                Autres pages formation.
              </h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {BTP_FORMATION_PAGES.filter((p) => p.path !== path).map((p) => (
                  <Link
                    key={p.path}
                    href={p.path}
                    className="bw-btp-card block transition hover:border-[var(--btp-border-strong)]"
                  >
                    <h3 className="font-bold">{p.title}</h3>
                    <p className="mt-2 text-base text-[var(--btp-muted)]">
                      {p.summary}
                    </p>
                  </Link>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/organisme-formation"
                  className="bw-btp-btn bw-btp-btn-secondary"
                >
                  Organisme de formation
                </Link>
                <Link
                  href="/conduite-de-travaux"
                  className="bw-btp-btn bw-btp-btn-secondary"
                >
                  Conduite de travaux
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        <BtpCtaBand
          title="Un besoin de formation sur chantier ?"
          subtitle="Décrivez le public, le métier et le contexte d’ouvrage. Nous revenons vers vous pour cadrer une proposition — sans engagement sur des certifications non vérifiées."
          ctaHref="/demande-de-devis?besoin=autre"
          ctaLabel="Exprimer un besoin formation"
        />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
