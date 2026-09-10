import Image from "next/image";
import Link from "next/link";
import {
  BW_BTN_PRIMARY,
  BW_SECTION,
} from "@/components/home/homeSectionStyles";
import { BwAtmosphere } from "@/components/home/BwAtmosphere";
import { BEWORK_SESSION_PRICE_EUR } from "@/lib/bework-formation";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

const BENEFITS = [
  { icon: "▣", label: "Démonstrations en direct" },
  { icon: "◎", label: "Petit groupe (8–12 personnes)" },
  { icon: "⚙", label: "Mise en pratique sur vos projets" },
  { icon: "✦", label: "Une méthode réutilisable" },
] as const;

/** Bloc bas maquette — photo + journée + tarif + CTA. */
export function HomeJourneeBlock() {
  return (
    <section id="journee" className={BW_SECTION} aria-labelledby="journee-home-heading">
      <BwAtmosphere variant="peach" />
      <div className="container-site relative">
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/90 shadow-[0_20px_56px_rgba(15,23,42,0.07)] backdrop-blur-sm lg:rounded-[2rem]">
          <div className="grid items-stretch lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)_auto]">
            {/* Photo */}
            <div className="relative min-h-[14rem] overflow-hidden sm:min-h-[16rem] lg:min-h-full">
              <Image
                src="/marketing/journee-bework.jpg"
                alt="Journée BeWork — formation pratique en petit groupe autour d’un écran"
                fill
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 34vw"
                priority={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/5" />
              <span className="absolute left-4 top-4 rounded-full border border-white/40 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#1d4ed8] backdrop-blur-sm">
                Journée pratique
              </span>
            </div>

            {/* Texte + bénéfices */}
            <div className="flex flex-col justify-center gap-6 px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
              <div>
                <h2
                  id="journee-home-heading"
                  className="font-display text-2xl font-extrabold tracking-tight text-[#2563eb] sm:text-3xl"
                >
                  La journée BeWork
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
                  Une expérience pratique et inspirante pour passer de vos idées
                  à des outils concrets avec l’IA.
                </p>
              </div>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                {BENEFITS.map((b) => (
                  <li key={b.label} className="text-center sm:text-left lg:text-center xl:text-left">
                    <span
                      className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-[#eff6ff] text-sm text-[#2563eb] sm:mx-0 lg:mx-auto xl:mx-0"
                      aria-hidden
                    >
                      {b.icon}
                    </span>
                    <p className="mt-2 text-[11px] font-semibold leading-snug text-slate-700 sm:text-xs">
                      {b.label}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Prix + CTA */}
            <div className="flex flex-col items-center justify-center gap-4 border-t border-slate-100 bg-[#f8fafc]/80 px-6 py-8 sm:px-8 lg:border-l lg:border-t-0 lg:px-10">
              <div className="text-center">
                <p className="font-display text-4xl font-extrabold tracking-tight text-[#0a0a0a] sm:text-5xl">
                  {BEWORK_SESSION_PRICE_EUR}&nbsp;€
                </p>
                <p className="mt-1 text-sm text-slate-500">/ participant</p>
              </div>
              <Link
                href="/contact#participer"
                className={`${BW_BTN_PRIMARY} w-full whitespace-nowrap sm:w-auto`}
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-journee-reserver")}
              >
                Réserver ma place
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
