import Link from "next/link";
import { FormationInterestForm } from "@/components/contact/FormationInterestForm";
import { BwAtmosphere } from "@/components/home/BwAtmosphere";
import {
  HOME_BG_SOFT,
  HOME_BG_WHITE,
  HOME_BTN_PRIMARY,
  HOME_BTN_SECONDARY,
  HOME_CARD,
  HOME_EYEBROW,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";
import {
  TRAINING_OFFERS,
  type TrainingOfferId,
} from "@/lib/bework-formation";

const PREPARATION_POINTS = [
  {
    title: "Aucun prérequis en programmation",
    text: "La formation est conçue pour les débutants et les non-développeurs.",
  },
  {
    title: "Votre ordinateur suffit",
    text: "Vous recevrez les informations pratiques nécessaires avant la session.",
  },
  {
    title: "Une idée est bienvenue, pas obligatoire",
    text: "Vous pouvez venir avec un projet, un besoin métier ou simplement l’envie d’apprendre.",
  },
] as const;

/** Page de conversion dédiée : choix du parcours, demande de place et prochaines étapes. */
export function ParticiperPageContent({
  initialOfferId,
}: {
  initialOfferId?: TrainingOfferId;
}) {
  return (
    <>
      <section className={`${HOME_SECTION} ${HOME_BG_WHITE} relative overflow-hidden`}>
        <BwAtmosphere variant="hero" />
        <div
          className="pointer-events-none absolute -left-20 top-8 h-72 w-72 rounded-full bg-[rgba(39,91,232,0.10)] blur-3xl"
          aria-hidden
        />
        <div className="container-site relative z-[1]">
          <div className="mx-auto max-w-3xl text-center">
            <p className={HOME_EYEBROW}>Participer à une session</p>
            <h1 className="mt-5 font-display text-[2.15rem] font-extrabold leading-[1.05] tracking-[-0.045em] text-[#0a0a0a] sm:text-[3rem] md:text-[3.65rem]">
              Demandez une place.
              <br />
              <span className="text-[#1d4ed8]">Parlez-nous de votre projet.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Choisissez le parcours de 7&nbsp;h ou 14&nbsp;h, puis indiquez-nous
              simplement ce que vous aimeriez créer. Nous vous recontactons pour
              vous proposer une date et confirmer les modalités.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3 text-sm font-semibold">
              <span className="rounded-full border border-[#2563eb]/20 bg-[#eff6ff] px-4 py-2 text-[#1d4ed8]">
                {TRAINING_OFFERS.essential.hours}&nbsp;h · {TRAINING_OFFERS.essential.price}&nbsp;€
              </span>
              <span className="rounded-full border border-[#2563eb]/20 bg-[#eff6ff] px-4 py-2 text-[#1d4ed8]">
                {TRAINING_OFFERS.complete.hours}&nbsp;h · {TRAINING_OFFERS.complete.price}&nbsp;€
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-600">
                Présentiel ou visio
              </span>
            </div>

            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <a href="#participer" className={HOME_BTN_PRIMARY}>
                Remplir la demande
              </a>
              <Link href="/formation#programme" className={HOME_BTN_SECONDARY}>
                Consulter le programme
              </Link>
            </div>
            <p className="mt-5 text-sm text-slate-500">
              Cette demande n’est pas une inscription définitive.
            </p>
          </div>
        </div>
      </section>

      <section
        id="participer"
        className={`${HOME_SECTION} ${HOME_BG_SOFT} scroll-mt-28`}
        aria-labelledby="form-heading"
      >
        <div className="container-site">
          <div className="mx-auto max-w-2xl text-center">
            <p className={`${HOME_EYEBROW} text-[#1d4ed8]`}>Demande de place</p>
            <h2
              id="form-heading"
              className="mt-4 font-display text-[1.85rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#0a0a0a] sm:text-[2.5rem]"
            >
              Quelques informations suffisent.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Nous vous répondons avec une proposition adaptée au parcours choisi.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.06)] sm:mt-12 sm:p-8 md:p-10">
            <FormationInterestForm initialOfferId={initialOfferId} />
          </div>
        </div>
      </section>

      <section
        className={`${HOME_SECTION} ${HOME_BG_WHITE}`}
        aria-labelledby="avant-demande-heading"
      >
        <div className="container-site">
          <div className="mx-auto max-w-3xl text-center">
            <p className={HOME_EYEBROW}>Avant votre demande</p>
            <h2
              id="avant-demande-heading"
              className="mt-4 font-display text-[1.85rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#0a0a0a] sm:text-[2.5rem]"
            >
              Vous pouvez commencer simplement.
            </h2>
          </div>

          <ul className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
            {PREPARATION_POINTS.map((point) => (
              <li key={point.title} className={`${HOME_CARD} p-6`}>
                <h3 className="font-display text-lg font-extrabold text-[#0a0a0a]">
                  {point.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{point.text}</p>
              </li>
            ))}
          </ul>

          <nav
            aria-label="Informations utiles avant de participer"
            className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-semibold text-[#1d4ed8]"
          >
            <Link href="/tarifs" className="underline-offset-4 hover:underline">
              Comparer les parcours et tarifs
            </Link>
            <Link href="/faq" className="underline-offset-4 hover:underline">
              Lire les réponses pratiques
            </Link>
            <Link href="/demonstrations" className="underline-offset-4 hover:underline">
              Explorer les démonstrations
            </Link>
          </nav>
        </div>
      </section>
    </>
  );
}
