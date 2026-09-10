import Link from "next/link";
import {
  HOME_BG_WHITE,
  HOME_BTN_GROUP,
  HOME_BTN_PRIMARY,
  HOME_BTN_SECONDARY,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";
import { BEWORK_SESSION_PRICE_EUR } from "@/lib/bework-formation";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

/** Clôture — relancer l’envie puis l’action. */
export function HomeDemoClose() {
  return (
    <section
      id="participer"
      className={`${HOME_SECTION} ${HOME_BG_WHITE}`}
      aria-labelledby="close-heading"
    >
      <div className="container-site">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="close-heading"
            className="font-display text-[2rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#0a0a0a] sm:text-[2.75rem] md:text-[3.25rem]"
          >
            Une idée peut désormais
            <br />
            <span className="text-[#1d4ed8]">aller beaucoup plus loin.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Ne vous contentez plus d’utiliser les outils des autres. Imaginez
            les vôtres — et apprenez à les construire.
          </p>
          <div className={`mx-auto mt-10 ${HOME_BTN_GROUP} justify-center`}>
            <Link
              href="/contact#participer"
              className={HOME_BTN_PRIMARY}
              {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-close-participer")}
            >
              Participer — {BEWORK_SESSION_PRICE_EUR}&nbsp;€
            </Link>
            <Link href="/#demonstrations" className={HOME_BTN_SECONDARY}>
              Revoir les démonstrations
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
