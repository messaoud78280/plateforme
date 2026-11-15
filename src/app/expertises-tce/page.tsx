import type { Metadata } from "next";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { BtpCtaBand } from "@/components/marketing-btp/BtpCtaBand";
import { BtpPageHero } from "@/components/marketing-btp/BtpPageHero";
import "@/components/marketing-btp/btp-marketing.css";
import { BTP_EXPERTISE_FAMILIES, BTP_SEO_PAGES } from "@/lib/bework-btp-services";
import { buildMarketingPageMetadata } from "@/lib/seo-formation-pages";

const seo = BTP_SEO_PAGES.expertises;
export const metadata: Metadata = buildMarketingPageMetadata({
  path: seo.path,
  title: seo.title,
  description: seo.description,
});

export default function ExpertisesTcePage() {
  return (
    <div className="bw-btp-site min-h-screen">
      <MarketingSiteHeader />
      <main>
        <BtpPageHero
          eyebrow="INGÉNIERIE — EXPERTISES TCE"
          title="Une vision globale des travaux, tous corps d’état."
          subtitle="Complément à la conduite de travaux : préparation, organisation et coordination des opérations TCE pour faciliter l’enchaînement des lots. Les expertises mobilisées sont précisées avant engagement contractuel."
          primaryHref="/demande-de-devis?besoin=pilotage_tce"
          primaryLabel="Demander un pilotage TCE"
          secondaryHref="/ingenierie-et-marches-btp"
          secondaryLabel="Voir l’ingénierie & marchés"
        />

        <section className="bw-btp-section bw-btp-section-alt">
          <div className="bw-btp-container">
            <p className="max-w-3xl text-base leading-relaxed text-[var(--btp-muted)]">
              Les familles ci-dessous décrivent des domaines d’intervention et
              de coordination possibles. Elles ne constituent pas l’affirmation
              de disposer immédiatement de spécialistes internes dans chaque
              spécialité. Les expertises mobilisées et les qualifications
              réglementées sont précisées avant engagement contractuel.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {BTP_EXPERTISE_FAMILIES.map((family) => (
                <article key={family.id} id={family.id} className="bw-btp-card">
                  <h2 className="text-xl font-bold">{family.title}</h2>
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {family.items.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-base text-[var(--btp-muted)]"
                      >
                        <span className="text-[var(--btp-copper)]" aria-hidden>
                          •
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <BtpCtaBand
          title="Un chantier multi-lots à coordonner ?"
          ctaHref="/demande-de-devis?besoin=pilotage_tce"
          ctaLabel="Confier le pilotage TCE"
        />
      </main>
      <MarketingSiteFooter />
    </div>
  );
}
