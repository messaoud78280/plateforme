import Link from "next/link";
import {
  HOME_BTN_GROUP,
  HOME_BTN_PRIMARY,
  HOME_BTN_SECONDARY,
} from "@/components/home/homeSectionStyles";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

const HIGHLIGHTS = [
  "Formation pratique en une journée",
  "Débutants acceptés",
  "Petit groupe, accompagnement réel",
  "Méthode réutilisable après la session",
] as const;

/** CTA final homepage — formation IA création. */
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
            Prochaine étape
          </p>
          <h2
            id="besoin-heading"
            className="font-display mt-3 text-balance text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#0a0a0a] sm:text-[2.25rem] md:text-[2.75rem]"
          >
            Votre prochaine idée mérite peut-être d&apos;être construite.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-600 sm:mt-6 sm:text-base">
            Une journée pour comprendre, pratiquer et repartir avec une méthode.
            Pas besoin de savoir coder — seulement d&apos;avoir envie de créer.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-10 lg:mt-14 lg:grid-cols-5 lg:gap-14">
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-[#bfdbfe] bg-gradient-to-b from-[#eff6ff] to-[#f5f3ff] p-6">
              <p className="font-display text-xl font-extrabold tracking-tight text-[#0f1e3a]">
                Comprendre.
                <br />
                Construire.
                <br />
                Continuer.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Sites, applications, outils internes : ce que vous imaginez peut
                devenir un premier projet — avec une méthode claire.
              </p>

              <ul className="mt-5 space-y-2">
                {HIGHLIGHTS.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-slate-700">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563eb]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="relative scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:col-span-3">
            <p className="font-display text-xl font-extrabold tracking-tight text-[#0a0a0a] sm:text-2xl">
              Prêt à participer&nbsp;?
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Indiquez votre intérêt pour une session, ou explorez d&apos;abord ce
              qu&apos;il est possible de créer.
            </p>

            <div className={`mt-7 ${HOME_BTN_GROUP}`}>
              <Link
                href="/contact#participer"
                className={HOME_BTN_PRIMARY}
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-final-participer")}
              >
                Participer à une session
              </Link>
              <Link
                href="/demonstrations"
                className={HOME_BTN_SECONDARY}
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-final-demos")}
              >
                Voir les démonstrations
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
