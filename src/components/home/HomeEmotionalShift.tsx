import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import {
  HOME_BG_SOFT,
  HOME_CONTENT,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";

/** Section émotionnelle — le rapport à l’ordinateur et aux outils. */
export function HomeEmotionalShift() {
  return (
    <section
      id="changement"
      className={`${HOME_SECTION} ${HOME_BG_SOFT}`}
      aria-labelledby="emotional-shift-heading"
    >
      <div className="container-site">
        <HomeSectionHeader
          id="emotional-shift-heading"
          eyebrow="Ce qui change"
          title={
            <>
              Votre ordinateur n’est plus seulement
              <span className="mt-2 block text-slate-500">un outil de consommation.</span>
            </>
          }
          lead="Mails, tableurs, documents, réseaux : la plupart du temps, on utilise le numérique. BeWork vous invite à autre chose — créer ce qui vous manque."
        />

        <div className={`${HOME_CONTENT} mx-auto max-w-3xl`}>
          <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="grid gap-0 sm:grid-cols-2">
              <div className="border-b border-slate-100 p-7 sm:border-b-0 sm:border-r sm:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Avant
                </p>
                <p className="font-display mt-3 text-xl font-bold tracking-tight text-slate-500">
                  Consommer des outils
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  S’adapter à ce qui existe déjà. Attendre qu’un logiciel « fasse à peu près »
                  ce dont on a besoin. Dépendre d’autres pour chaque nouvelle idée.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#eff6ff] to-[#f5f3ff] p-7 sm:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2563eb]">
                  Après
                </p>
                <p className="font-display mt-3 text-xl font-bold tracking-tight text-[#0a0a0a]">
                  Construire vos outils
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Partir de votre besoin. Prototyper. Améliorer. Garder la main sur ce que
                  vous créez — même si vous n’êtes pas développeur.
                </p>
              </div>
            </div>
          </div>

          <p className="mx-auto mt-8 max-w-xl text-center text-sm leading-relaxed text-slate-500 sm:mt-10">
            Ce n’est pas magique. C’est une compétence nouvelle :{" "}
            <span className="font-semibold text-[#0a0a0a]">
              savoir dialoguer avec l’intelligence artificielle pour faire émerger un projet
              réel.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
