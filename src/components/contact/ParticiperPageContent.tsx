import Link from "next/link";
import { FormationInterestForm } from "@/components/contact/FormationInterestForm";
import { BwAtmosphere } from "@/components/home/BwAtmosphere";
import {
  HOME_BG_SOFT,
  HOME_BG_WHITE,
  HOME_BTN_PRIMARY,
  HOME_BTN_SECONDARY,
  HOME_CARD,
  HOME_CONTENT,
  HOME_EYEBROW,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";
import { BEWORK_SESSION_PRICE_EUR } from "@/lib/bework-formation";

const LEARN_BLOCKS = [
  {
    title: "Transformer une idée en projet",
    text: "Apprendre à partir d’un besoin simple et à le transformer progressivement en site, application ou outil numérique.",
  },
  {
    title: "Guider l’IA",
    text: "Comprendre comment présenter correctement ce que vous voulez obtenir, préciser vos demandes et faire évoluer le résultat.",
  },
  {
    title: "Tester et corriger",
    text: "Apprendre à vérifier ce qui fonctionne, identifier ce qui ne va pas et demander les bonnes corrections.",
  },
  {
    title: "Continuer seul",
    text: "Repartir avec une méthode de travail que vous pourrez réutiliser après la formation pour poursuivre vos propres projets.",
  },
] as const;

const SCHEDULE = [
  {
    time: "09:00",
    title: "Comprendre les nouvelles possibilités",
    text: "Ce que l’intelligence artificielle permet aujourd’hui de créer, ce qu’elle fait bien, ses limites et comment l’utiliser intelligemment.",
  },
  {
    time: "10:00",
    title: "Préparer son environnement",
    text: "Nous préparons ensemble l’environnement nécessaire pour que vous puissiez commencer à créer directement sur votre propre ordinateur.",
  },
  {
    time: "11:00",
    title: "Créer un premier projet",
    text: "Nous partons d’une idée simple et la transformons progressivement en un véritable projet numérique.",
  },
  {
    time: "12:30",
    title: "Pause",
    text: "Temps de respiration avant la suite de la journée.",
  },
  {
    time: "13:30",
    title: "Passer du simple site à l’outil interactif",
    text: "Découvrez comment une idée peut évoluer vers quelque chose de plus complet : réservation, espace client, tableau de bord, suivi ou autre logique métier.",
  },
  {
    time: "15:00",
    title: "Apprendre à faire évoluer un projet",
    text: "Modifier une interface, ajouter une fonctionnalité, corriger un problème et améliorer progressivement le résultat.",
  },
  {
    time: "16:00",
    title: "Votre propre idée",
    text: "Nous vous aidons à réfléchir à la façon dont cette méthode pourrait s’appliquer à votre activité ou à votre projet.",
  },
  {
    time: "17:00",
    title: "Repartir avec une méthode",
    text: "Vous repartez avec une vision claire des étapes à suivre pour continuer à expérimenter et construire après la journée.",
  },
] as const;

const OUTCOMES = [
  "transformer une idée en projet numérique structuré",
  "expliquer correctement à une IA ce que vous voulez construire",
  "démarrer la création d’un site ou d’un outil",
  "demander des modifications de manière efficace",
  "tester le résultat",
  "identifier les problèmes",
  "demander des corrections",
  "améliorer progressivement une interface",
  "comprendre la logique générale d’une application",
  "poursuivre votre projet après la formation",
] as const;

const IDEA_CARDS = [
  {
    title: "Site professionnel",
    text: "Présenter une activité et récupérer des demandes.",
    highlight: false,
  },
  {
    title: "Système de réservation",
    text: "Permettre à des clients de choisir une prestation ou un créneau.",
    highlight: false,
  },
  {
    title: "Outil de suivi",
    text: "Organiser clients, prospects, dossiers ou interventions.",
    highlight: false,
  },
  {
    title: "Espace client",
    text: "Centraliser informations, documents et suivi.",
    highlight: false,
  },
  {
    title: "Agenda",
    text: "Organiser rendez-vous, tâches ou interventions.",
    highlight: false,
  },
  {
    title: "Tableau de bord",
    text: "Visualiser les informations importantes de son activité.",
    highlight: false,
  },
  {
    title: "Application métier",
    text: "Imaginer un outil adapté à une façon de travailler spécifique.",
    highlight: false,
  },
  {
    title: "Et surtout : votre propre idée.",
    text: "Le projet qui compte vraiment, c’est celui que vous imaginez pour votre activité.",
    highlight: true,
  },
] as const;

const AUDIENCE = [
  "vous avez des idées mais aucune connaissance en programmation",
  "vous êtes entrepreneur, artisan, indépendant ou dirigeant",
  "vous souhaitez comprendre ce que l’IA peut réellement vous permettre de créer",
  "vous avez un projet que vous ne saviez pas comment démarrer",
  "vous voulez devenir plus autonome",
  "vous êtes simplement curieux de découvrir cette nouvelle façon de travailler",
] as const;

const INCLUDES = [
  "une journée complète de formation",
  "accompagnement en petit groupe",
  "préparation de votre environnement de travail",
  "démonstrations en direct",
  "exercices pratiques",
  "travail directement sur votre ordinateur",
  "découverte de plusieurs types de projets",
  "accompagnement sur vos questions",
  "réflexion autour de votre propre idée",
  "méthode de travail réutilisable après la journée",
] as const;

/** Contenu long — présentation de la journée puis formulaire. */
export function ParticiperPageContent() {
  return (
    <>
      {/* 1. Intro */}
      <section className={`${HOME_SECTION} ${HOME_BG_WHITE} relative overflow-hidden border-b border-[rgba(45,75,130,0.08)]`}>
        <BwAtmosphere variant="hero" />
        <div
          className="pointer-events-none absolute -left-20 top-8 h-72 w-72 rounded-full bg-[rgba(39,91,232,0.10)] blur-3xl"
          aria-hidden
        />
        <div className="container-site relative z-[1]">
          <div className="max-w-3xl">
            <p className={HOME_EYEBROW}>La journée BeWork</p>
            <h1 className="mt-5 font-display text-[2.15rem] font-extrabold leading-[1.05] tracking-[-0.045em] text-[#0a0a0a] sm:text-[3rem] md:text-[3.65rem]">
              Une journée pour passer
              <br />
              <span className="text-[#1d4ed8]">de l’idée à la construction.</span>
            </h1>
            <div className="mt-7 max-w-2xl space-y-4 text-base leading-relaxed text-slate-600 sm:mt-8 sm:text-lg">
              <p>
                Vous avez déjà imaginé un site, une application ou un outil qui
                pourrait vous être utile, mais vous ne savez pas coder&nbsp;?
              </p>
              <p>
                Pendant une journée, BeWork vous montre comment utiliser
                l’intelligence artificielle pour commencer à transformer vos
                idées en projets numériques concrets.
              </p>
            </div>
            <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.16em] text-[#1d4ed8]">
              Aucune connaissance en programmation n’est nécessaire.
            </p>
            <p className="mt-5 font-display text-xl font-extrabold tracking-tight text-[#0a0a0a] sm:text-2xl">
              {BEWORK_SESSION_PRICE_EUR}&nbsp;€{" "}
              <span className="text-base font-semibold text-slate-500">
                / participant
              </span>
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#participer" className={HOME_BTN_PRIMARY}>
                Demander une place
              </a>
              <a href="#deroulement" className={HOME_BTN_SECONDARY}>
                Voir le déroulement
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Ce que vous venez apprendre */}
      <section
        className={`${HOME_SECTION} ${HOME_BG_SOFT}`}
        aria-labelledby="apprendre-heading"
      >
        <div className="container-site">
          <div className="max-w-3xl">
            <p className={HOME_EYEBROW}>Ce que vous venez apprendre</p>
            <h2
              id="apprendre-heading"
              className="mt-4 font-display text-[1.85rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#0a0a0a] sm:text-[2.5rem]"
            >
              Cette journée n’est pas
              <br />
              un cours de programmation.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              L’objectif est de vous apprendre une nouvelle manière de créer :
              partir d’une idée, la structurer, la faire prendre forme, la tester
              et la faire évoluer avec l’aide de l’intelligence artificielle.
            </p>
          </div>
          <div
            className={`${HOME_CONTENT} grid gap-4 sm:grid-cols-2 lg:gap-5`}
          >
            {LEARN_BLOCKS.map((block, i) => (
              <article
                key={block.title}
                className={`${HOME_CARD} p-6 sm:p-7 ${
                  i === 1 || i === 2 ? "sm:translate-y-2" : ""
                }`}
              >
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-xl font-extrabold tracking-tight text-[#0a0a0a]">
                  {block.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                  {block.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Journée concrète */}
      <section
        className={`${HOME_SECTION} ${HOME_BG_WHITE}`}
        aria-labelledby="concrete-heading"
      >
        <div className="container-site">
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-gradient-to-b from-[#0b1526] via-[#0f1e3a] to-[#111827] px-6 py-14 text-center sm:px-10 sm:py-16">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              aria-hidden
              style={{
                maskImage:
                  "radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 80%)",
              }}
            />
            <div className="relative">
            <h2
              id="concrete-heading"
              className="font-display text-[1.85rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-white sm:text-[2.75rem] md:text-[3.25rem]"
            >
              <span className="block text-white/45">Pas une journée à écouter.</span>
              <span className="mt-2 block text-[#93c5fd]">Une journée à créer.</span>
            </h2>
            <div className="mx-auto mt-8 max-w-xl space-y-3 text-base leading-relaxed text-white/70 sm:text-lg">
              <p>Vous venez avec votre ordinateur.</p>
              <p>Nous avançons ensemble, étape par étape.</p>
              <p>Vous regardez, vous essayez, vous manipulez et vous construisez.</p>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Timeline */}
      <section
        id="deroulement"
        className={`${HOME_SECTION} ${HOME_BG_SOFT} scroll-mt-28`}
        aria-labelledby="timeline-heading"
      >
        <div className="container-site">
          <div className="max-w-3xl">
            <p className={HOME_EYEBROW}>Déroulement indicatif</p>
            <h2
              id="timeline-heading"
              className="mt-4 font-display text-[1.85rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#0a0a0a] sm:text-[2.5rem]"
            >
              Comment se passe
              <br />
              <span className="text-[#1d4ed8]">la journée.</span>
            </h2>
          </div>

          <ol className={`${HOME_CONTENT} relative mx-auto max-w-3xl`}>
            <div
              className="pointer-events-none absolute bottom-4 left-[1.15rem] top-4 w-px bg-gradient-to-b from-[#2563eb]/40 via-slate-200 to-transparent sm:left-[1.35rem]"
              aria-hidden
            />
            {SCHEDULE.map((step, i) => (
              <li key={step.time} className="relative flex gap-5 pb-10 last:pb-0 sm:gap-7">
                <div className="relative z-10 flex shrink-0 flex-col items-center">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#2563eb]/25 bg-white text-[11px] font-bold text-[#1d4ed8] shadow-sm sm:h-10 sm:w-10">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="min-w-0 flex-1 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#1d4ed8]">
                    {step.time}
                  </p>
                  <h3 className="mt-2 font-display text-lg font-extrabold tracking-tight text-[#0a0a0a] sm:text-xl">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mx-auto mt-8 max-w-3xl text-center text-xs text-slate-500 sm:text-sm">
            Programme susceptible d’être adapté au rythme du groupe.
          </p>
        </div>
      </section>

      {/* 5. À la fin */}
      <section
        className={`${HOME_SECTION} ${HOME_BG_WHITE}`}
        aria-labelledby="fin-heading"
      >
        <div className="container-site">
          <div className="max-w-3xl">
            <p className={HOME_EYEBROW}>À la fin de la journée</p>
            <h2
              id="fin-heading"
              className="mt-4 font-display text-[1.85rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#0a0a0a] sm:text-[2.5rem] md:text-[3rem]"
            >
              Vous ne regarderez plus
              <br />
              une idée de la même façon.
            </h2>
            <div className="mt-6 max-w-2xl space-y-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              <p>Vous ne repartirez pas développeur.</p>
              <p>
                Vous repartirez avec quelque chose de beaucoup plus utile pour
                commencer&nbsp;: la capacité de transformer une idée en projet et
                de savoir comment continuer.
              </p>
            </div>
          </div>

          <div className={`${HOME_CONTENT} mx-auto max-w-3xl`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
              À la fin de la journée, vous saurez
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {OUTCOMES.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-[#fafafa] px-4 py-3 text-sm text-slate-700"
                >
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563eb]"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 6. Formes d’idées */}
      <section
        className={`${HOME_SECTION} ${HOME_BG_SOFT}`}
        aria-labelledby="formes-heading"
      >
        <div className="container-site">
          <div className="max-w-3xl">
            <p className={HOME_EYEBROW}>Exemples</p>
            <h2
              id="formes-heading"
              className="mt-4 font-display text-[1.85rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#0a0a0a] sm:text-[2.5rem]"
            >
              Vos idées peuvent prendre
              <br />
              <span className="text-[#1d4ed8]">beaucoup de formes.</span>
            </h2>
          </div>
          <div
            className={`${HOME_CONTENT} grid gap-4 sm:grid-cols-2 lg:grid-cols-3`}
          >
            {IDEA_CARDS.map((card) => (
              <article
                key={card.title}
                className={`rounded-2xl border p-5 sm:p-6 ${
                  card.highlight
                    ? "border-[#2563eb]/35 bg-[#eff6ff] shadow-[0_8px_28px_rgba(37,99,235,0.08)] sm:col-span-2 lg:col-span-3"
                    : "border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                }`}
              >
                <h3
                  className={`font-display font-extrabold tracking-tight ${
                    card.highlight
                      ? "text-xl text-[#1d4ed8] sm:text-2xl"
                      : "text-base text-[#0a0a0a] sm:text-lg"
                  }`}
                >
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {card.text}
                </p>
              </article>
            ))}
          </div>
          <p className="mt-8 text-center">
            <Link
              href="/demonstrations"
              className="text-sm font-semibold text-[#1d4ed8] underline-offset-2 hover:underline"
            >
              Explorer les démonstrations →
            </Link>
          </p>
        </div>
      </section>

      {/* 7. Pour qui */}
      <section
        className={`${HOME_SECTION} ${HOME_BG_WHITE}`}
        aria-labelledby="pour-qui-heading"
      >
        <div className="container-site">
          <div className="mx-auto max-w-3xl">
            <p className={HOME_EYEBROW}>Pour qui</p>
            <h2
              id="pour-qui-heading"
              className="mt-4 font-display text-[1.85rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#0a0a0a] sm:text-[2.5rem]"
            >
              Cette journée est faite
              <br />
              pour vous si…
            </h2>
            <ul className="mt-8 space-y-3">
              {AUDIENCE.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-3 text-base leading-relaxed text-slate-700 sm:text-lg"
                >
                  <span
                    className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563eb]"
                    aria-hidden
                  />
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-10 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Pas besoin d’être particulièrement à l’aise en informatique.
              <br />
              <span className="font-semibold text-[#0a0a0a]">
                Il faut surtout avoir envie d’apprendre et d’essayer.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* 8. Tarif */}
      <section
        id="tarif-journee"
        className={`${HOME_SECTION} ${HOME_BG_SOFT}`}
        aria-labelledby="tarif-journee-heading"
      >
        <div className="container-site">
          <div className="bw-surface-tarif relative mx-auto max-w-3xl overflow-hidden rounded-[1.75rem] px-6 py-12 sm:px-10 sm:py-14">
            <div className="relative text-center">
              <p className={HOME_EYEBROW}>Une formule simple</p>
              <h2
                id="tarif-journee-heading"
                className="mt-4 font-display text-[1.85rem] font-extrabold tracking-tight text-[#0a0a0a] sm:text-[2.5rem]"
              >
                La journée BeWork
              </h2>
              <p className="mt-8 font-display text-5xl font-extrabold tracking-tight text-[#0a0a0a] sm:text-6xl">
                {BEWORK_SESSION_PRICE_EUR}&nbsp;€
              </p>
              <p className="mt-2 text-sm font-medium uppercase tracking-[0.14em] text-slate-500">
                Par participant
              </p>
            </div>

            <div className="relative mt-12">
              <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Ce qui est compris
              </p>
              <ul className="mx-auto mt-6 max-w-lg space-y-3">
                {INCLUDES.map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-3 text-sm leading-relaxed text-slate-700 sm:text-[15px]"
                  >
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563eb]"
                      aria-hidden
                    />
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[#1d4ed8]">
                Aucun prérequis en programmation.
              </p>
              <p className="mx-auto mt-8 max-w-md text-center font-display text-xl font-extrabold leading-snug tracking-tight text-[#0a0a0a] sm:text-2xl">
                Vous venez avec vos idées.
                <br />
                Vous repartez en sachant comment
                <br />
                commencer à les construire.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Objectif réaliste */}
      <section
        className={`${HOME_SECTION} ${HOME_BG_WHITE}`}
        aria-labelledby="realiste-heading"
      >
        <div className="container-site">
          <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-[#fafafa] px-6 py-10 sm:px-10">
            <p className={HOME_EYEBROW}>Transparence</p>
            <h2
              id="realiste-heading"
              className="mt-3 font-display text-2xl font-extrabold tracking-tight text-[#0a0a0a] sm:text-3xl"
            >
              Un objectif réaliste
            </h2>
            <div className="mt-5 space-y-4 text-base leading-relaxed text-slate-600">
              <p>
                Une journée ne transforme pas quelqu’un en développeur et ne
                permet pas de maîtriser tous les projets numériques.
              </p>
              <p>
                L’objectif de BeWork est différent&nbsp;: vous donner les bases,
                la méthode et les bons réflexes pour commencer à créer avec l’IA
                et continuer ensuite à progresser par vous-même.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Formulaire */}
      <section
        id="participer"
        className={`${HOME_SECTION} ${HOME_BG_SOFT} scroll-mt-28`}
        aria-labelledby="form-heading"
      >
        <div className="container-site">
          <div className="mx-auto max-w-2xl text-center">
            <p className={`${HOME_EYEBROW} text-[#1d4ed8]`}>Envie d’essayer&nbsp;?</p>
            <h2
              id="form-heading"
              className="mt-4 font-display text-[1.85rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#0a0a0a] sm:text-[2.5rem]"
            >
              Participez à une prochaine
              <br />
              journée BeWork.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Indiquez-nous simplement qui vous êtes et ce que vous aimeriez
              créer. Nous vous recontactons pour vous proposer une prochaine date
              et vous expliquer les modalités.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.06)] sm:mt-12 sm:p-8 md:p-10">
            <h3 className="font-display text-xl font-extrabold tracking-tight text-[#0a0a0a]">
              Demander une place
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Quelques informations suffisent pour un premier contact.
            </p>
            <div className="mt-8">
              <FormationInterestForm />
            </div>
          </div>

          <p className="mt-10 text-center text-sm text-slate-500">
            <Link href="/faq" className="font-medium text-slate-700 underline-offset-2 hover:underline">
              Lire la FAQ
            </Link>
            {" · "}
            <Link href="/" className="font-medium text-[#1d4ed8] underline-offset-2 hover:underline">
              Retour à l’accueil
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
