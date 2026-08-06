import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_BG_WHITE, HOME_CARD_SOFT, HOME_CONTENT, HOME_SECTION } from "@/components/home/homeSectionStyles";

const STEPS = [
  {
    title: "Diagnostic de votre fonctionnement",
    text: "Circulation de l’information, outils actuels, responsabilités, documents, validations et besoins de pilotage.",
  },
  {
    title: "Sélection des modules et workflows",
    text: "Choix des briques utiles à votre organisation, sans surcharge inutile.",
  },
  {
    title: "Configuration et outils IA",
    text: "Personnalisation des droits, formulaires, tableaux de bord et assistants métier.",
  },
  {
    title: "Déploiement et amélioration continue",
    text: "Mise en service, formation des équipes et ajustements selon le terrain.",
  },
] as const;

/** Méthode de déploiement en 4 étapes. */
export function HomeDeploySteps() {
  return (
    <section id="methode" className={`${HOME_SECTION} ${HOME_BG_WHITE}`} aria-labelledby="method-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="method-heading"
          eyebrow="Déploiement"
          title="Une plateforme construite autour de votre organisation"
        />
        <ol className={`${HOME_CONTENT} mx-auto grid max-w-5xl gap-5 md:grid-cols-2 lg:grid-cols-4`}>
          {STEPS.map((step, i) => (
            <li key={step.title} className={`${HOME_CARD_SOFT} bg-[#f8fafc] p-5`}>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1d4ed8] text-sm font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-3 text-base font-bold text-[#0f172a]">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
