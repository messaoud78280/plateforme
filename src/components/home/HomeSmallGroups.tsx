import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import {
  HOME_BG_WHITE,
  HOME_CARD,
  HOME_CONTENT,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";

const POINTS = [
  {
    title: "De la place pour vos questions",
    text: "Vous n’êtes pas un numéro dans une salle. Chaque participant peut poser ses questions et avancer sur son propre besoin.",
  },
  {
    title: "Un rythme adapté",
    text: "On prend le temps d’installer l’environnement, de comprendre, puis de pratiquer — sans précipitation inutile.",
  },
  {
    title: "Un accompagnement réel",
    text: "Pendant la journée, vous n’êtes pas laissé seul face à un écran. L’objectif est que chacun reparte avec quelque chose de concret.",
  },
] as const;

/** Format petit groupe — pas un amphithéâtre. */
export function HomeSmallGroups() {
  return (
    <section
      id="petit-groupe"
      className={`${HOME_SECTION} ${HOME_BG_WHITE}`}
      aria-labelledby="small-groups-heading"
    >
      <div className="container-site">
        <HomeSectionHeader
          id="small-groups-heading"
          eyebrow="Format"
          title="Pas un amphithéâtre."
          lead="BeWork, c’est une formation en petit groupe. Assez de place pour comprendre, expérimenter et poser les questions qui comptent vraiment pour vous."
        />

        <div
          className={`${HOME_CONTENT} mx-auto grid max-w-5xl gap-4 sm:grid-cols-3`}
        >
          {POINTS.map((point) => (
            <article key={point.title} className={`${HOME_CARD} p-6 sm:p-7`}>
              <h3 className="font-display text-lg font-bold tracking-tight text-[#0a0a0a]">
                {point.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{point.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
