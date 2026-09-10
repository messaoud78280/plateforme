import {
  BW_EYEBROW,
  BW_SECTION,
} from "@/components/home/homeSectionStyles";
import { BwAtmosphere } from "@/components/home/BwAtmosphere";

/** Transition éditoriale après le hero — pas une grosse card blanche. */
export function HomeEditorialQuestion() {
  return (
    <section
      id="possibilites"
      className={BW_SECTION}
      aria-labelledby="question-home-heading"
    >
      <BwAtmosphere variant="soft" />
      <div className="container-site relative">
        <div className="mx-auto max-w-4xl text-center">
          <p className={BW_EYEBROW}>Une idée peut prendre beaucoup de formes</p>
          <h2
            id="question-home-heading"
            className="mt-5 font-display text-[2.4rem] font-extrabold leading-[1.02] tracking-[-0.045em] text-[#0a0a0a] sm:text-[3.25rem] md:text-[4rem] lg:text-[4.5rem]"
          >
            Et vous,
            <br />
            qu’est-ce que
            <br />
            <span className="text-[#2563eb]">vous créeriez&nbsp;?</span>
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-slate-500 sm:text-lg">
            Un outil pour votre métier. Une application pour vos clients. Ou
            quelque chose qui n’existe pas encore.
          </p>
        </div>
      </div>
    </section>
  );
}
