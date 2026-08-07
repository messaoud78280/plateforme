import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_BG_WHITE, HOME_CONTENT, HOME_SECTION } from "@/components/home/homeSectionStyles";

const PILLARS = [
  "Équipes et rôles",
  "Chantiers et affaires",
  "Documents et photos",
  "Messages et validations",
  "Tâches et échéances",
  "Marchés et analyses",
  "Outils IA métier",
  "Tableaux de bord",
] as const;

/** Solution — environnement unique. */
export function HomeUnifiedEnvironment() {
  return (
    <section id="plateforme" className={`${HOME_SECTION} ${HOME_BG_WHITE}`} aria-labelledby="solution-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="solution-heading"
          eyebrow="Plateforme"
          title="Un environnement unique pour organiser toute votre activité"
          lead="BeWork relie l'information à un chantier, une affaire ou un responsable — au lieu de la disperser entre plusieurs outils."
        />
        <ul className={`${HOME_CONTENT} mx-auto grid max-w-4xl gap-3 sm:grid-cols-2 md:grid-cols-4`}>
          {PILLARS.map((label) => (
            <li
              key={label}
              className="rounded-xl border border-[#1d4ed8]/15 bg-[#eff6ff]/40 px-4 py-3.5 text-center text-sm font-semibold text-[#0f172a] transition hover:border-[#1d4ed8]/30 hover:bg-[#eff6ff]"
            >
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
