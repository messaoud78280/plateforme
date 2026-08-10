import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_CONTENT, HOME_SECTION } from "@/components/home/homeSectionStyles";

const LAYERS = [
  "Socle BeWork",
  "Modules",
  "Rôles",
  "Processus",
  "Automatisations",
  "IA",
  "Adaptations métier",
] as const;

/** Socle + configuration = votre environnement. */
export function HomeCoreAdaptation() {
  return (
    <section id="socle" className={`${HOME_SECTION} bg-white`} aria-labelledby="core-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="core-heading"
          eyebrow="Plateforme BeWork"
          title={
            <>
              Pas votre entreprise qui s&apos;adapte au logiciel.
              <span className="mt-2 block text-slate-500">Le logiciel qui s&apos;adapte à votre entreprise.</span>
            </>
          }
          lead="Exemple concret : un socle commun, configuré selon vos métiers, vos équipes et votre organisation."
        />

        <div className={`${HOME_CONTENT} mx-auto max-w-xl`}>
          <ul className="text-center">
            {LAYERS.map((layer, i) => (
              <li key={layer}>
                <p className="font-display text-lg font-extrabold tracking-tight text-[#0a0a0a] sm:text-xl">{layer}</p>
                {i < LAYERS.length - 1 ? (
                  <p className="py-2 text-sm font-medium text-slate-300" aria-hidden>
                    +
                  </p>
                ) : null}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-center gap-3 py-2" aria-hidden>
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-sm font-semibold text-slate-400">=</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="mt-2 rounded-2xl border border-[#0a0a0a] bg-[#0a0a0a] px-6 py-7 text-center sm:py-9">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">Résultat</p>
            <p className="font-display mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Votre environnement
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
