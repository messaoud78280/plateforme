import Link from "next/link";
import {
  BW_BTN_PRIMARY,
  BW_BTN_SECONDARY,
  BW_SECTION_TIGHT,
} from "@/components/home/homeSectionStyles";
import { BwAtmosphere } from "@/components/home/BwAtmosphere";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

/** CTA final — phrase éditoriale, pas une grosse card vide. */
export function HomeFinalCta() {
  return (
    <section
      id="cta-final"
      className={BW_SECTION_TIGHT}
      aria-labelledby="final-cta-heading"
    >
      <BwAtmosphere variant="cta" />
      <div className="container-site relative z-[1]">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="final-cta-heading"
            className="font-display text-[2rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#0a0a0a] sm:text-[2.75rem] md:text-[3.25rem]"
          >
            Une idée.
            <br />
            Un projet.
            <br />
            <span className="text-[#2563eb]">Une nouvelle autonomie.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-slate-500">
            Vous venez avec une idée. Vous repartez en sachant comment commencer
            à la construire — sans savoir coder.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href="/contact#participer"
              className={BW_BTN_PRIMARY}
              {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-final-participer")}
            >
              Demander une place
              <span aria-hidden>→</span>
            </Link>
            <Link href="/#demonstrations" className={BW_BTN_SECONDARY}>
              Revoir les démonstrations
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
