import Link from "next/link";
import { HOME_BTN_GROUP, HOME_BTN_PRIMARY, HOME_BTN_SECONDARY } from "@/components/home/homeSectionStyles";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

/** Hero — concepteur de solutions IA, plateforme en lien discret. */
export function HomePlatformHero() {
  return (
    <section id="hero" className="relative overflow-x-clip bg-white pb-16 pt-10 sm:pb-20 sm:pt-14 md:pb-24 md:pt-16">
      <div className="container-site">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-display text-balance text-sm font-extrabold uppercase tracking-[0.12em] text-[#0a0a0a] sm:text-base md:text-lg lg:text-xl">
            BeWork — Solutions IA sur mesure pour le BTP
          </p>

          <h1 className="font-display mx-auto mt-6 max-w-[22ch] text-balance text-[2.125rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#0a0a0a] sm:mt-8 sm:max-w-none sm:text-[3.25rem] md:text-[3.75rem] lg:text-[4.1rem]">
            <span className="block">Imaginez ce que l&apos;IA pourrait faire</span>
            <span className="block">pour votre entreprise.</span>
            <span className="mt-2 block text-slate-500 sm:mt-3">Nous le construisons.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-[1rem] leading-relaxed text-slate-600 sm:mt-8 sm:text-lg">
            BeWork conçoit des solutions IA autour de vos métiers, vos méthodes de travail et vos outils :
            applications, automatisations, assistants intelligents, analyse documentaire, intégrations et
            plateformes métier.
          </p>

          <div className={`mx-auto mt-8 max-w-md sm:mt-10 sm:max-w-none ${HOME_BTN_GROUP} sm:justify-center`}>
            <Link
              href="#besoin"
              className={HOME_BTN_PRIMARY}
              {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-hero-besoin")}
            >
              Parler de mon besoin
            </Link>
            <Link
              href="#solutions"
              className={HOME_BTN_SECONDARY}
              {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-hero-solutions")}
            >
              Découvrir ce que nous pouvons créer
            </Link>
          </div>

          <p className="mt-6">
            <Link
              href="#plateforme"
              className="text-sm font-medium text-slate-500 underline-offset-4 transition hover:text-[#0a0a0a] hover:underline"
            >
              Voir la plateforme BeWork →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
