import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_BG_WHITE, HOME_CONTENT, HOME_SECTION } from "@/components/home/homeSectionStyles";

const EXAMPLES = [
  "Création d’un nouveau rôle ou d’un circuit de validation",
  "Ajout d’un tableau de bord ou d’un modèle de document",
  "Activation d’un module métier",
  "Amélioration d’un assistant IA",
  "Adaptation à une nouvelle activité",
  "Connexion avec un outil de l’entreprise",
  "Évolution des règles de classement",
  "Renforcement des contrôles et notifications",
] as const;

/** Évolution continue de la plateforme avec l’entreprise. */
export function HomePlatformEvolution() {
  return (
    <section id="evolution" className={`${HOME_SECTION} ${HOME_BG_WHITE}`} aria-labelledby="evolution-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="evolution-heading"
          eyebrow="Évolution continue"
          title="Une plateforme qui évolue avec votre entreprise"
          lead={
            <>
              <p>
                Vos méthodes, vos équipes et vos besoins évoluent. BeWork accompagne votre plateforme dans la durée
                afin d&apos;ajuster les workflows, renforcer les outils existants, activer de nouveaux modules et
                intégrer de nouveaux usages d&apos;intelligence artificielle.
              </p>
              <p className="mt-3 text-sm font-semibold text-[#1d4ed8]">
                La plateforme n&apos;est pas figée au jour de son installation.
              </p>
            </>
          }
        />
        <ul className={`${HOME_CONTENT} mx-auto grid max-w-4xl gap-3 sm:grid-cols-2`}>
          {EXAMPLES.map((ex) => (
            <li
              key={ex}
              className="flex gap-2.5 rounded-xl border border-slate-200/90 bg-[#f8fafc] px-4 py-3 text-sm text-slate-800"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d4ed8]" aria-hidden />
              {ex}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
