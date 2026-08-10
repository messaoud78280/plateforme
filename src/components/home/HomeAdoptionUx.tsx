import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_BG_SOFT, HOME_SECTION } from "@/components/home/homeSectionStyles";

const FLOW = ["Concevoir", "Déployer", "Former", "Adopter"] as const;

/** Simplicité d'usage + adoption — section courte. */
export function HomeAdoptionUx() {
  return (
    <section id="adoption" className={`${HOME_SECTION} ${HOME_BG_SOFT}`} aria-labelledby="adoption-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="adoption-heading"
          title="Pensée pour être utilisée."
          lead="Une solution IA n'est utile que si vos équipes l'adoptent."
        />

        <p className="mx-auto mt-8 max-w-2xl text-center text-base leading-relaxed text-slate-600 sm:text-lg">
          Nous concevons des outils simples et intuitifs, puis accompagnons vos collaborateurs jusqu&apos;à leur
          utilisation réelle au quotidien.
        </p>

        <p className="mx-auto mt-6 max-w-xl text-center text-sm font-medium text-slate-500">
          Puissante derrière. Simple devant.
        </p>

        <ol className="mx-auto mt-12 flex max-w-2xl flex-wrap items-center justify-center gap-2 sm:gap-3">
          {FLOW.map((step, i) => (
            <li key={step} className="flex items-center gap-2 sm:gap-3">
              <span className="font-display text-base font-extrabold tracking-tight text-[#0a0a0a] sm:text-lg">
                {step}
              </span>
              {i < FLOW.length - 1 ? (
                <span className="text-slate-300" aria-hidden>
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>

        <p className="mx-auto mt-10 max-w-xl text-center text-sm leading-relaxed text-slate-500">
          La technologie s&apos;adapte aux équipes, pas l&apos;inverse. Vos usages évoluent. Votre solution aussi.
        </p>
      </div>
    </section>
  );
}
