import Link from "next/link";
import { HomeClientSpacePreview } from "@/components/HomeClientSpacePreview";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

const HERO_POINTS = [
  "Utilisée par vos équipes",
  "Configurée pour votre organisation",
  "IA spécialisée BTP",
  "Maintenue et évolutive",
] as const;

/** Hero — plateforme interne ; BeWork = éditeur / intégrateur. */
export function HomePlatformHero() {
  return (
    <section id="hero" className="relative overflow-x-clip bg-white px-6 pb-16 pt-10 md:pb-20 md:pt-14 lg:pb-24 lg:pt-16">
      <div className="container-site">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,1fr)] lg:gap-16">
          <div className="text-center lg:text-left">
            <p className="mx-auto inline-flex items-center rounded-full border border-[#1d4ed8]/25 bg-[#eff6ff] px-4 py-1.5 text-sm font-semibold text-[#1d4ed8] lg:mx-0">
              Éditeur de plateforme métier BTP
            </p>

            <h1 className="font-display mx-auto mt-6 max-w-[40rem] text-balance text-[clamp(1.85rem,calc(1rem+3.4vw),3rem)] font-extrabold leading-[1.04] tracking-[-0.025em] text-[#0f172a] lg:mx-0">
              La plateforme interne intelligente de votre entreprise du BTP
            </h1>

            <p className="mx-auto mt-5 max-w-[36rem] text-lg leading-relaxed text-slate-700 lg:mx-0 lg:text-xl">
              BeWork conçoit une plateforme adaptée à votre organisation pour centraliser vos équipes, analyser vos
              marchés, exploiter vos documents et piloter vos opérations avec des outils d&apos;intelligence artificielle
              spécialisés.
            </p>

            <p className="mx-auto mt-4 max-w-[36rem] text-base font-medium leading-snug text-slate-800 lg:mx-0">
              Vos collaborateurs l&apos;utilisent au quotidien. BeWork la sécurise, la maintient et la fait évoluer avec
              vos besoins.
            </p>

            <div className="mx-auto mt-7 flex max-w-[36rem] flex-col gap-3 sm:flex-row sm:justify-center lg:mx-0 lg:justify-start">
              <Link
                href="/contact#formulaire"
                className="inline-flex h-[3.25rem] items-center justify-center rounded-2xl bg-[#1d4ed8] px-6 text-base font-semibold text-white shadow-md transition hover:bg-[#1e40af]"
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-hero-demo")}
              >
                Demander une démonstration personnalisée
              </Link>
              <Link
                href="#plateforme"
                className="inline-flex h-[3.25rem] items-center justify-center rounded-2xl border-2 border-slate-200 bg-white px-6 text-base font-semibold text-[#1d4ed8] shadow-sm transition hover:border-[#1d4ed8]/40 hover:bg-[#eff6ff]"
              >
                Découvrir le fonctionnement
              </Link>
            </div>

            <ul className="mx-auto mt-8 grid max-w-[34rem] grid-cols-2 gap-x-5 gap-y-2.5 lg:mx-0 lg:max-w-none" aria-label="Atouts BeWork">
              {HERO_POINTS.map((label) => (
                <li key={label} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d4ed8]" aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <HomeClientSpacePreview className="mx-auto max-w-md" />
            <p className="mt-3 text-center text-xs text-slate-500 lg:text-left">
              Aperçu illustratif de l&apos;espace entreprise — modules selon configuration.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
