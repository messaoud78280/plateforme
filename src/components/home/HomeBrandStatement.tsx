import {
  HOME_BG_WHITE,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";

/** Phrase de marque + nuance crédible. */
export function HomeBrandStatement() {
  return (
    <section
      id="marque"
      className={`${HOME_SECTION} ${HOME_BG_WHITE}`}
      aria-labelledby="brand-statement-heading"
    >
      <div className="container-site">
        <div className="mx-auto max-w-4xl border-y border-slate-200 py-14 sm:py-20">
          <h2
            id="brand-statement-heading"
            className="font-display text-[1.85rem] font-extrabold leading-[1.1] tracking-[-0.04em] text-[#0a0a0a] sm:text-[2.5rem] md:text-[3.15rem]"
          >
            <span className="block text-slate-400">
              Le plus important
              <br />
              n’est plus seulement
              <br />
              de savoir écrire le code.
            </span>
            <span className="mt-6 block sm:mt-8">
              C’est aussi de savoir
              <br />
              <span className="text-[#1d4ed8]">ce que vous voulez construire.</span>
            </span>
          </h2>
          <p className="mt-10 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
            L’IA ne supprime pas la complexité de tous les projets. Elle permet
            cependant à des personnes non développeuses d’aller aujourd’hui
            beaucoup plus loin qu’auparavant.
          </p>
        </div>
      </div>
    </section>
  );
}
