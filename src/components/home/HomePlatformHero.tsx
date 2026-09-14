import Link from "next/link";
import { BwAtmosphere } from "@/components/home/BwAtmosphere";
import { HomeHeroCollage } from "@/components/home/HomeHeroCollage";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";
import styles from "./HomePlatformHero.module.css";

const TRUST = [
  {
    title: "Une pratique concrète",
    subtitle: "Vous manipulez",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    ),
  },
  {
    title: "Un accompagnement direct",
    subtitle: "En petit groupe",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    ),
  },
  {
    title: "Une première création",
    subtitle: "Dès le Jour 1",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
      />
    ),
  },
] as const;

/** Hero — slogan officiel + parcours 7 h / 14 h (maquette). */
export function HomePlatformHero() {
  return (
    <section
      id="hero"
      className="relative scroll-mt-28 overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <BwAtmosphere variant="hero" />

      <div className="container-site relative z-[1] pb-12 pt-10 sm:pb-16 sm:pt-12 lg:pb-20 lg:pt-14">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-10 xl:gap-14">
          <div className="max-w-xl lg:max-w-none">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">
              Formation progressive
            </p>

            <h1 id="hero-heading" className={`mt-4 sm:mt-5 ${styles.slogan}`}>
              <span className={styles.line1}>Sans savoir coder.</span>
              <span className={styles.line2}>Créez ce que vous imaginez.</span>
            </h1>

            <p className="mt-6 max-w-lg font-display text-[1.15rem] font-bold leading-snug tracking-[-0.03em] text-[#1a1f2a] sm:mt-7 sm:text-[1.3rem] md:text-[1.4rem]">
              En 1 ou 2 journées, apprenez à créer avec l’IA.
            </p>

            <p className="mt-2 max-w-lg text-[0.95rem] font-medium leading-snug text-[#42526B] sm:text-base">
              Sites, applications, outils métiers : sans savoir coder.
            </p>

            <ul className="mt-5 max-w-lg space-y-2.5 text-[0.95rem] leading-snug text-[#64748b] sm:mt-6 sm:text-[1rem]">
              <li>
                <span className="font-bold text-[#0B0D12]">1 journée (7&nbsp;h)</span>
                {" — "}
                apprendre à commencer et lancer un premier projet.
              </li>
              <li>
                <span className="font-bold text-[#0B0D12]">2 journées (14&nbsp;h)</span>
                {" — "}
                approfondir et construire plus loin.
              </li>
            </ul>

            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-stretch">
              <Link
                href="/formation"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#275BE8] px-6 text-[0.95rem] font-semibold text-white shadow-[0_12px_28px_rgba(39,91,232,0.32)] transition hover:bg-[#1d4ed8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#275BE8]"
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-hero-formation")}
              >
                Découvrir la formation
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/formation#programme"
                className="inline-flex min-h-12 flex-col items-center justify-center rounded-full border border-[#c5d0e6] bg-white/80 px-6 py-2 text-center transition hover:border-[#275BE8]/45 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#275BE8] sm:items-start sm:text-left"
              >
                <span className="text-[0.95rem] font-semibold text-[#0B0D12]">
                  Voir le programme
                </span>
                <span className="text-xs font-medium text-[#64748b]">
                  7&nbsp;h ou 14&nbsp;h selon votre besoin
                </span>
              </Link>
            </div>

            <p className="mt-5 max-w-lg text-[0.92rem] leading-relaxed text-[#42526B] sm:mt-6 sm:text-base">
              Aucun prérequis en programmation. Vous partez de zéro et repartez avec une
              méthode, un environnement prêt et une première création fonctionnelle.
            </p>
          </div>

          <HomeHeroCollage />
        </div>

        <ul className="mt-14 grid gap-6 pt-2 sm:mt-16 sm:grid-cols-3 sm:gap-8">
          {TRUST.map((item) => (
            <li key={item.title} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eff6ff] text-[#275BE8]">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {item.icon}
                </svg>
              </span>
              <div>
                <p className="text-sm font-bold text-[#0B0D12]">{item.title}</p>
                <p className="mt-0.5 text-sm text-[#64748b]">{item.subtitle}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
