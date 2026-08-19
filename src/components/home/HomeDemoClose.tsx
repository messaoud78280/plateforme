import Link from "next/link";
import { ProspectContactForm } from "@/components/contact/ProspectContactForm";
import { HOME_BTN_SECONDARY } from "@/components/home/homeSectionStyles";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

export function HomeDemoClose() {
  return (
    <section
      id="besoin"
      className="scroll-mt-24 bg-gradient-to-b from-[#fafafa] to-white py-16 sm:py-20 md:py-28"
      aria-labelledby="besoin-heading"
    >
      <div className="container-site">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
            Parlons de votre entreprise
          </p>
          <h2
            id="besoin-heading"
            className="font-display mt-3 text-balance text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#0a0a0a] sm:text-[2.25rem] md:text-[2.75rem]"
          >
            Montrez-nous comment votre entreprise fonctionne.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-600 sm:mt-6 sm:text-base">
            Vous n&apos;avez pas besoin de savoir quelle technologie utiliser. Expliquez-nous simplement comment vous
            travaillez aujourd&apos;hui, les outils que vous utilisez et ce que vous aimeriez améliorer.{" "}
            <strong className="font-semibold text-[#0a0a0a]">
              Nous étudierons comment construire l&apos;environnement adapté.
            </strong>
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-10 lg:mt-14 lg:grid-cols-5 lg:gap-14">
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-[#bfdbfe] bg-gradient-to-b from-[#eff6ff] to-[#f5f3ff] p-6">
              <p className="font-display text-xl font-extrabold tracking-tight text-[#0f1e3a]">
                Construire.
                <br />
                Connecter.
                <br />
                Automatiser.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Une solution sur mesure pensée pour le BTP, adaptée à votre organisation et à vos équipes.
              </p>

              <ul className="mt-5 space-y-2">
                {["Plateforme métier sur mesure", "Connexion logiciels existants", "Automatisations métier", "Formation et accompagnement", "Évolution continue"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-slate-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2563eb] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4">
              <Link
                href="#plateforme"
                className={HOME_BTN_SECONDARY}
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-final-plateforme")}
              >
                Voir BeWork en action
              </Link>
            </div>
          </div>

          <div
            id="formulaire"
            className="relative scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:col-span-3"
          >
            <ProspectContactForm source="homepage_besoin_ia" variant="idea" />
          </div>
        </div>
      </div>
    </section>
  );
}
