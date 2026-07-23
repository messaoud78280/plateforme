import type { JSX } from "react";

const BLUE = "#2563eb";
const TEXT_DARK = "#111827";

type CardConfig = {
  title: string;
  bullets: string[];
  footerTitle: string;
  footerSub: string;
  Icon: () => JSX.Element;
  FooterIcon: () => JSX.Element;
  stripe: string;
  blob: string;
  wash: string;
  iconWrap: string;
  checkClass: string;
  footerBg: string;
  footerIconWrap: string;
  footerTitleClass: string;
};

const CARDS: CardConfig[] = [
  {
    title: "Appels d'offres & candidatures",
    bullets: [
      "Lecture et classement du DCE",
      "Pièces, conformité et échéances",
      "Structuration du mémoire technique",
      "Préparation du dossier avant votre validation",
    ],
    footerTitle: "Renfort candidature",
    footerSub: "Vous validez prix, choix techniques et dépôt.",
    Icon: IconClipboardChecks,
    FooterIcon: IconShieldMini,
    stripe: "from-[#1e40af] via-[#2563eb] to-[#3b82f6]",
    blob: "bg-blue-600",
    wash: "from-blue-50/[0.78]",
    iconWrap: "bg-gradient-to-br from-blue-50 to-blue-100/85 text-blue-700 ring-2 ring-blue-200/75",
    checkClass: "text-blue-600",
    footerBg: "bg-gradient-to-br from-blue-50 via-blue-50/95 to-blue-100/45 ring-1 ring-blue-200/50",
    footerIconWrap: "bg-white/95 text-blue-600 shadow-sm shadow-blue-900/6 ring-2 ring-blue-100/80",
    footerTitleClass: "text-[#1d4ed8]",
  },
  {
    title: "Organisation de la réponse",
    bullets: [
      "Centralisation des données et justificatifs",
      "Trames et cohérence documentaire",
      "Suivi des informations manquantes",
      "Assistance dirigeants, CA, métreurs, CT",
    ],
    footerTitle: "Dossier structuré",
    footerSub: "BeWork prépare ; votre entreprise décide.",
    Icon: IconPeopleCoord,
    FooterIcon: IconTruckMini,
    stripe: "from-[#2563eb] via-[#3b82f6] to-[#60a5fa]",
    blob: "bg-blue-500",
    wash: "from-blue-50/[0.7]",
    iconWrap: "bg-gradient-to-br from-blue-50 to-blue-100/70 text-blue-600 ring-2 ring-blue-100/90",
    checkClass: "text-blue-600",
    footerBg: "bg-gradient-to-br from-blue-50/98 via-blue-50/90 to-blue-100/35 ring-1 ring-blue-200/48",
    footerIconWrap: "bg-white/95 text-blue-600 shadow-sm shadow-blue-900/6 ring-2 ring-blue-100/85",
    footerTitleClass: "text-[#1d4ed8]",
  },
  {
    title: "Suivi administratif après attribution",
    bullets: [
      "Échéances, OS et documents de démarrage",
      "Situations, Chorus Pro et relances",
      "CR, réserves et suivi documentaire",
      "DOE et clôture administrative",
    ],
    footerTitle: "Suivi de marché",
    footerSub: "Sans remplacer l’exécution technique chantier.",
    Icon: IconEuroDocument,
    FooterIcon: IconBarsUp,
    stripe: "from-[#3b82f6] via-[#60a5fa] to-[#93c5fd]",
    blob: "bg-blue-400",
    wash: "from-blue-50/[0.62]",
    iconWrap: "bg-gradient-to-br from-blue-50 to-blue-100/75 text-blue-600 ring-2 ring-blue-100/80",
    checkClass: "text-blue-600",
    footerBg: "bg-gradient-to-br from-blue-50/95 via-blue-100/25 to-blue-50/50 ring-1 ring-blue-200/42",
    footerIconWrap: "bg-white/95 text-blue-600 shadow-sm shadow-blue-900/6 ring-2 ring-blue-100/75",
    footerTitleClass: "text-[#1d4ed8]",
  },
];

/** Section « La solution BeWork » — sous Problème, continu hero/métallique parent */
export function HomeSolutionSection() {
  const sans = "var(--font-inter),ui-sans-serif,system-ui,sans-serif";

  return (
    <section
      id="solution-bework"
      className="relative bg-transparent pt-6 pb-8 md:pt-8 md:pb-10 lg:pt-10 lg:pb-12"
      style={{ fontFamily: sans }}
      aria-labelledby="solution-bework-heading"
    >
      <div className="container-site relative z-[1]">
        <header className="mx-auto mb-14 max-w-3xl text-center md:mb-16">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] md:text-base" style={{ color: BLUE }}>
            LA&nbsp;SOLUTION&nbsp;BEWORK
          </p>
          <div className="mx-auto mt-2 h-[3px] w-12 rounded-full" style={{ backgroundColor: BLUE }} />

          <h2
            id="solution-bework-heading"
            className="mt-5 text-[clamp(1.875rem,calc(1rem+3.8vw),3rem)] font-bold leading-[1.08] tracking-[-0.025em]"
            style={{ color: TEXT_DARK }}
          >
            <span style={{ color: BLUE }}>BeWork</span> renforce vos équipes, ponctuellement ou régulièrement, sur les
            appels d&apos;offres et le suivi des marchés.
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-lg leading-relaxed text-slate-800 md:text-xl">
            En renfort de vos équipes, de la préparation de la candidature au suivi administratif du marché — avec
            validation humaine sur tout ce qui engage. BeWork ne garantit pas l&apos;attribution d&apos;un marché.
          </p>
        </header>

        <div className="mx-auto grid max-w-[1200px] gap-7 md:grid-cols-3 md:gap-8 lg:gap-10">
          {CARDS.map((card) => (
            <article
              key={card.title}
              className="bework-solution-card group/sol relative flex flex-col items-center overflow-hidden rounded-[18px] border border-slate-200/90 bg-white p-7 text-center shadow-[0_14px_40px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.02] transition-[transform,box-shadow,border-color] duration-300 ease-out will-change-transform motion-safe:hover:-translate-y-1 motion-safe:hover:border-slate-300/90 motion-safe:hover:shadow-[0_22px_52px_rgba(15,23,42,0.1)] motion-reduce:transition-none md:p-8"
            >
              <span
                className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${card.wash} to-transparent`}
                aria-hidden
              />
              <div
                className={`pointer-events-none absolute -right-12 -top-12 h-[8rem] w-[8rem] rounded-full ${card.blob} opacity-[0.1] blur-3xl transition-opacity duration-300 group-hover/sol:opacity-[0.17]`}
                aria-hidden
              />
              <div
                className={`pointer-events-none absolute -bottom-14 -left-10 h-[5.5rem] w-[5.5rem] rounded-full ${card.blob} opacity-[0.065] blur-3xl transition-opacity duration-300 group-hover/sol:opacity-[0.11]`}
                aria-hidden
              />
              <div
                className={`pointer-events-none absolute inset-x-6 top-0 h-[3px] rounded-b-full bg-gradient-to-r opacity-95 ${card.stripe}`}
                aria-hidden
              />
              <div
                className={`pointer-events-none absolute inset-x-6 bottom-0 h-[2px] rounded-t-full bg-gradient-to-r opacity-0 transition-opacity duration-300 motion-safe:group-hover/sol:opacity-[0.88] ${card.stripe}`}
                aria-hidden
              />

              <div className="bework-solution-card-icon relative mb-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl">
                <span
                  className={`flex h-full w-full items-center justify-center rounded-2xl shadow-sm shadow-slate-900/[0.04] motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover/sol:scale-105 ${card.iconWrap}`}
                >
                  <card.Icon />
                </span>
              </div>

              <h3 className="relative mb-5 text-xl font-semibold tracking-tight text-slate-900">{card.title}</h3>

              <div className="relative mb-6 flex w-full flex-1 justify-center">
                <ul
                  className="inline-flex min-h-0 flex-col gap-2.5 text-left text-base leading-snug text-slate-800"
                >
                  {card.bullets.map((item) => (
                    <li
                      key={item}
                      className="flex max-w-[19rem] items-start gap-3 rounded-lg px-1.5 py-1 transition-[background-color,box-shadow] duration-200 motion-safe:hover:bg-slate-50/95 motion-safe:hover:ring-1 motion-safe:hover:ring-slate-100/80"
                    >
                      <span
                        className={`mt-0.5 shrink-0 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover/sol:scale-105 ${card.checkClass}`}
                        aria-hidden
                      >
                        <IconCheck />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className={`relative mt-auto flex w-full flex-col items-center gap-3 rounded-xl p-4 transition-[transform,box-shadow] duration-300 motion-safe:group-hover/sol:shadow-md motion-safe:group-hover/sol:shadow-slate-900/[0.06] sm:flex-row sm:justify-center sm:gap-4 sm:p-[18px] ${card.footerBg}`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 motion-safe:group-hover/sol:scale-105 motion-safe:group-hover/sol:rotate-[-3deg] ${card.footerIconWrap}`}
                >
                  <card.FooterIcon />
                </span>
                <div className="min-w-0 text-center sm:text-left">
                  <p className={`text-base font-semibold ${card.footerTitleClass}`}>{card.footerTitle}</p>
                  <p className="mt-1 text-sm leading-snug text-slate-700">{card.footerSub}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="mx-auto mt-12 max-w-3xl rounded-xl border border-slate-200/90 bg-white/90 px-5 py-4 text-center text-base leading-relaxed text-slate-800 shadow-sm md:px-6 md:py-5 md:text-[1.05rem]">
          BeWork ne remplace pas le conducteur de travaux&nbsp;: nous l&apos;aidons à sécuriser les dossiers, les délais, les
          preuves, la facturation et les obligations administratives qui conditionnent la rentabilité du chantier.
        </p>
      </div>
    </section>
  );
}

function IconCheck() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconEuroDocument() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3h9l4 4v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v4h4" />
      <path strokeLinecap="round" d="M8.5 12.5h11M8.5 15h11" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 8.85a5.5 5.5 0 0 1-10.25 4.82" />
    </svg>
  );
}

function IconClipboardChecks() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconPeopleCoord() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <circle cx={9} cy={8} r={2.5} strokeLinecap="round" />
      <circle cx={15} cy={7} r={2.35} strokeLinecap="round" />
      <circle cx={12} cy={9.85} r={2.15} strokeLinecap="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c.35-6.5 4.25-10 11-10s10.65 3.5 11 10" />
    </svg>
  );
}

function IconBarsUp() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 20V10M12 20V4M18 20v-6" />
    </svg>
  );
}

function IconShieldMini() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V6l-8-4-8 4v6c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconTruckMini() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 17h8v-9h-8M2 17h16v-5H2zM14 17a2 2 0 1 1 4 0M2 17a3 3 0 1 1 6 0" />
    </svg>
  );
}
