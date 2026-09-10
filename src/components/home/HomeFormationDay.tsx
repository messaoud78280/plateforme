import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import {
  HOME_BG_WHITE,
  HOME_CARD,
  HOME_CONTENT,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";
import { FORMATION_DAY_STEPS } from "@/lib/bework-formation";

/** Parcours d’une journée de formation. */
export function HomeFormationDay() {
  return (
    <section
      id="journee"
      className={`${HOME_SECTION} ${HOME_BG_WHITE}`}
      aria-labelledby="formation-day-heading"
    >
      <div className="container-site">
        <HomeSectionHeader
          id="formation-day-heading"
          eyebrow="La journée"
          title="Une journée pour changer votre façon de créer"
          lead="Six étapes progressives. Vous passez de la compréhension à la pratique, puis vous repartez avec une méthode réutilisable."
        />

        <ol
          className={`${HOME_CONTENT} mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3`}
        >
          {FORMATION_DAY_STEPS.map((step, index) => (
            <li key={step.title} className={`${HOME_CARD} relative p-6 sm:p-7`}>
              <span className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-[#2563eb]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display mt-3 text-lg font-bold tracking-tight text-[#0a0a0a]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
