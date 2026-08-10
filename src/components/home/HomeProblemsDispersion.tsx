import type { CSSProperties } from "react";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_BG_SOFT, HOME_CONTENT, HOME_SECTION } from "@/components/home/homeSectionStyles";

const TOOLS = [
  { label: "Email", hx: "-7rem", hy: "-3.5rem", delay: "0ms" },
  { label: "WhatsApp", hx: "8rem", hy: "-4rem", delay: "80ms" },
  { label: "Excel", hx: "-9rem", hy: "1rem", delay: "140ms" },
  { label: "PDF", hx: "9.5rem", hy: "0.5rem", delay: "200ms" },
  { label: "Plans", hx: "-6rem", hy: "4.5rem", delay: "260ms" },
  { label: "Drive", hx: "7rem", hy: "4.2rem", delay: "320ms" },
  { label: "ERP", hx: "0", hy: "6.5rem", delay: "380ms" },
] as const;

/** Scène : outils dispersés → BeWork. */
export function HomeProblemsDispersion() {
  return (
    <section id="problemes" className={`${HOME_SECTION} ${HOME_BG_SOFT}`} aria-labelledby="problems-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="problems-heading"
          title={
            <>
              Vos outils existent déjà.
              <span className="mt-2 block text-slate-500">Le problème, c&apos;est qu&apos;ils ne travaillent pas ensemble.</span>
            </>
          }
          lead="L'information revient là où le travail se fait."
        />

        <div className={`${HOME_CONTENT} relative mx-auto max-w-3xl`}>
          {/* Mobile : rangée d'outils puis centre */}
          <ul className="mb-8 flex flex-wrap justify-center gap-2 sm:hidden" aria-label="Outils dispersés">
            {TOOLS.map((t) => (
              <li
                key={t.label}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                {t.label}
              </li>
            ))}
          </ul>

          <div className="relative flex min-h-[18rem] items-center justify-center sm:min-h-[26rem]">
            <ul className="pointer-events-none absolute inset-0 hidden items-center justify-center sm:flex" aria-hidden>
              {TOOLS.map((t) => (
                <li
                  key={t.label}
                  className="home-tool-chip absolute rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
                  style={
                    {
                      ["--hx" as string]: t.hx,
                      ["--hy" as string]: t.hy,
                      transform: `translate(${t.hx}, ${t.hy})`,
                      animationDelay: t.delay,
                    } as CSSProperties
                  }
                >
                  {t.label}
                </li>
              ))}
            </ul>

            <div className="relative z-10 rounded-2xl border border-slate-200 bg-white px-8 py-6 text-center shadow-[0_24px_48px_-28px_rgba(10,10,10,0.35)] sm:px-12 sm:py-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Environnement</p>
              <p className="font-display mt-2 text-2xl font-extrabold tracking-tight text-[#0a0a0a] sm:text-3xl">
                BeWork
              </p>
              <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-slate-600">
                Un seul endroit pour retrouver l&apos;information, communiquer et faire avancer les opérations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
