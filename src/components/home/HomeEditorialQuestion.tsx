import {
  BW_EYEBROW,
  BW_SECTION,
} from "@/components/home/homeSectionStyles";
import { BwAtmosphere } from "@/components/home/BwAtmosphere";

/**
 * Transition éditoriale après le hero —
 * promesse journée + accessibilité, sans card.
 */
export function HomeEditorialQuestion() {
  return (
    <section
      id="possibilites"
      className={BW_SECTION}
      aria-labelledby="question-home-heading"
    >
      <BwAtmosphere variant="hero" />
      <div className="container-site relative z-[1]">
        <div className="max-w-5xl">
          <p
            className={`${BW_EYEBROW} motion-safe:animate-[home-fade-up_0.7s_ease-out_both]`}
          >
            Une journée
          </p>

          <h2
            id="question-home-heading"
            className="mt-5 font-display text-[2.15rem] font-extrabold uppercase leading-[1.02] tracking-[-0.045em] text-[#0B0D12] motion-safe:animate-[home-fade-up_0.75s_ease-out_both] sm:text-[3rem] md:text-[3.75rem] lg:text-[4.5rem]"
          >
            <span className="block">En une journée,</span>
            <span className="mt-1 block">apprenez à créer</span>
            <span className="mt-1 block text-[#275BE8]">sans savoir coder.</span>
          </h2>

          <p className="mt-8 max-w-2xl text-base leading-relaxed text-[#42526B] motion-safe:animate-[home-fade-up_0.8s_ease-out_both] sm:mt-10 sm:text-lg md:text-[1.2rem] md:leading-relaxed">
            Aucune connaissance particulière en informatique n’est nécessaire.
            Nous vous transmettons les outils, les bons réflexes et les astuces
            pour transformer vos idées en sites, applications et outils
            numériques.
          </p>

          <p className="mt-6 max-w-xl font-display text-lg font-extrabold leading-snug tracking-tight text-[#0B0D12] motion-safe:animate-[home-fade-up_0.85s_ease-out_both] sm:mt-8 sm:text-xl md:text-2xl">
            Vous partez de zéro.
            <br />
            Vous repartez en sachant comment commencer.
          </p>
        </div>
      </div>
    </section>
  );
}
