import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_SECTION } from "@/components/home/homeSectionStyles";

/** Évolution courte — pas une section institutionnelle. */
export function HomePlatformEvolution() {
  return (
    <section id="evolution" className={`${HOME_SECTION} bg-white`} aria-labelledby="evolution-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="evolution-heading"
          title={
            <>
              Vos usages évoluent.
              <span className="mt-2 block text-slate-500">Votre solution aussi.</span>
            </>
          }
          lead="Nous accompagnons vos équipes jusqu'à l'utilisation réelle au quotidien et faisons évoluer la solution selon vos retours et vos nouveaux besoins."
        />
      </div>
    </section>
  );
}
