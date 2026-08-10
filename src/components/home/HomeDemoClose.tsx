import Link from "next/link";
import { ProspectContactForm } from "@/components/contact/ProspectContactForm";
import { HOME_BTN_SECONDARY } from "@/components/home/homeSectionStyles";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

/** Clôture — parcours besoin principal. */
export function HomeDemoClose() {
  return (
    <section
      id="besoin"
      className="scroll-mt-24 border-t border-slate-100 bg-[#fafafa] py-16 sm:py-20 md:py-28"
      aria-labelledby="besoin-heading"
    >
      <div className="container-site">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="besoin-heading"
            className="font-display text-balance text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#0a0a0a] sm:text-[2.25rem] md:text-[2.75rem]"
          >
            Parlez-nous de votre idée.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-600 sm:mt-6 sm:text-base">
            Vous n&apos;avez pas besoin de savoir quelle technologie utiliser. Décrivez ce que vous voulez améliorer,
            automatiser ou créer — nous étudions la solution.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-10 lg:mt-14 lg:grid-cols-5 lg:gap-14">
          <div className="lg:col-span-2">
            <p className="font-display text-xl font-extrabold tracking-tight text-[#0a0a0a]">
              Plateformes métier.
              <br />
              Solutions IA.
              <br />
              Expertise BTP.
            </p>
            <p className="mt-5 text-sm leading-relaxed text-slate-500">
              BeWork — La technologie construite autour de votre entreprise.
            </p>
            <div className="mt-8">
              <Link
                href="#plateforme"
                className={HOME_BTN_SECONDARY}
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-final-plateforme")}
              >
                Voir la plateforme BeWork
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
