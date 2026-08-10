import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_BG_SOFT, HOME_CONTENT, HOME_SECTION } from "@/components/home/homeSectionStyles";

const INPUTS = [
  "Un problème",
  "Une idée",
  "Un processus",
  "Une tâche répétitive",
  "Des documents",
  "Des données",
] as const;

const OUTPUTS = [
  "Solution IA",
  "Application métier",
  "Agent IA",
  "Automatisation",
  "Intégration",
  "Plateforme",
] as const;

/** Signature : Entrées → BeWork → Solutions. */
export function HomeNeedSignature() {
  return (
    <section id="signature" className={`${HOME_SECTION} ${HOME_BG_SOFT}`} aria-labelledby="signature-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="signature-heading"
          title={
            <>
              Vous connaissez votre métier.
              <span className="mt-2 block text-slate-500">Nous construisons l&apos;IA autour.</span>
            </>
          }
        />

        <div className={`${HOME_CONTENT} mx-auto grid max-w-4xl gap-10 sm:gap-12 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-8`}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Entrées</p>
            <ul className="mt-4 space-y-3">
              {INPUTS.map((item) => (
                <li key={item} className="font-display text-lg font-bold tracking-tight text-[#0a0a0a] sm:text-xl">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 py-2">
            <span className="hidden text-slate-300 md:block" aria-hidden>
              ↓
            </span>
            <div className="rounded-2xl bg-[#0a0a0a] px-8 py-5 text-center">
              <p className="font-display text-xl font-extrabold tracking-tight text-white sm:text-2xl">BeWork</p>
            </div>
            <span className="text-slate-300" aria-hidden>
              ↓
            </span>
          </div>

          <div className="md:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Solutions</p>
            <ul className="mt-4 space-y-3">
              {OUTPUTS.map((item) => (
                <li key={item} className="font-display text-lg font-bold tracking-tight text-[#0a0a0a] sm:text-xl">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
