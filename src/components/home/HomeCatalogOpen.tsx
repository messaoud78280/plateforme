import Link from "next/link";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_BTN_PRIMARY, HOME_SECTION } from "@/components/home/homeSectionStyles";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

/** Ouverture commerciale — pas un catalogue. */
export function HomeCatalogOpen() {
  return (
    <section id="ouverture" className={`${HOME_SECTION} bg-white`} aria-labelledby="catalog-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="catalog-heading"
          title="Ne cherchez pas votre solution dans un catalogue."
          lead="Expliquez-nous simplement ce qui vous fait perdre du temps, ce que vous aimeriez automatiser ou ce que vous aimeriez pouvoir faire."
        />
        <div className="mt-10 flex justify-center">
          <Link
            href="#besoin"
            className={HOME_BTN_PRIMARY}
            {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-catalog-besoin")}
          >
            Parler de mon besoin
          </Link>
        </div>
        <p className="mx-auto mt-8 max-w-xl text-center text-sm leading-relaxed text-slate-500">
          Votre besoin ne rentre pas dans une case&nbsp;? Nous étudions la solution. Nous partons de votre besoin, pas
          d&apos;un catalogue.
        </p>
      </div>
    </section>
  );
}
