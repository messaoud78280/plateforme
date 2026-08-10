import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_BG_SOFT, HOME_SECTION } from "@/components/home/homeSectionStyles";

/** Différence éditeur classique vs BeWork — sans dénigrement. */
export function HomeDifference() {
  return (
    <section id="difference" className={`${HOME_SECTION} ${HOME_BG_SOFT}`} aria-labelledby="diff-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="diff-heading"
          title={
            <>
              Montrez-nous comment vous travaillez.
              <span className="mt-2 block text-slate-500">Construisons la technologie autour.</span>
            </>
          }
          lead="Vous n'avez pas besoin de connaître les technologies. Expliquez votre besoin : nous étudions la faisabilité, les données, la sécurité et la meilleure architecture."
        />
        <p className="mx-auto mt-10 max-w-xl text-center text-sm leading-relaxed text-slate-500">
          Vous avez déjà vos outils&nbsp;? Nous pouvons aussi étudier comment ajouter l&apos;intelligence qui leur
          manque — au cas par cas.
        </p>
      </div>
    </section>
  );
}
