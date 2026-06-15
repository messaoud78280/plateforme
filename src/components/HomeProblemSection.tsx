import type { JSX } from "react";
import { BlueprintCotationProblemMarks } from "@/components/home/BlueprintCotationDecor";

const BEWORK_BLUE = "#2563eb";
const BEWORK_BLUE_SOFT = "#eff6ff";
const TEXT_PRIMARY = "#0F172A";
const RED_SOFT = "#dc2626";
const RED_BG = "#fef2f2";
const CARD_BORDER = "#E5EAF2";

/** Section « Le problème » — homepage, sous le hero (maquette métallique + tableau). */
export function HomeProblemSection() {
  const fontSans = "var(--font-inter),ui-sans-serif,system-ui,sans-serif";

  const tableRows: {
    problem: string;
    consequence: string;
    ProblemIcon: () => JSX.Element;
    ConsequenceIcon: () => JSX.Element;
  }[] = [
    {
      problem: "DCE et chiffrages à traiter en urgence",
      consequence: "Marge et délais AO compromis",
      ProblemIcon: () => <IconUserWave className="h-[22px] w-[22px]" />,
      ConsequenceIcon: IconEuroTrendDown,
    },
    {
      problem: "Délais contractuels et validations MOE",
      consequence: "Situations et paiements bloqués",
      ProblemIcon: IconFolderClock,
      ConsequenceIcon: IconSad,
    },
    {
      problem: "Marchés publics et pièces à suivre",
      consequence: "Pénalités et dossiers incomplets",
      ProblemIcon: IconTasksPileUp,
      ConsequenceIcon: IconFolderClock,
    },
    {
      problem: "DOE, réserves et facturation en retard",
      consequence: "Clôture et trésorerie fragilisées",
      ProblemIcon: IconTrackingOff,
      ConsequenceIcon: IconEuroTrendDown,
    },
  ];

  return (
    <section
      id="probleme"
      className="relative z-[1] overflow-visible bg-transparent pt-[70px] pb-10 md:pb-12"
      style={{ fontFamily: fontSans }}
    >
      <BlueprintCotationProblemMarks />
      <div className="container-site relative z-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.38fr_0.62fr] lg:gap-16">
        {/* Colonne gauche */}
        <div className="min-w-0">
          <p className="text-sm font-bold tracking-[0.18em] md:text-base" style={{ color: BEWORK_BLUE }}>
            LE&nbsp;PROBLÈME
          </p>
          <div className="mt-3 h-[3px] w-12 rounded-full" style={{ backgroundColor: BEWORK_BLUE }} />

          <h2
            className="mt-8 font-normal tracking-[-0.02em] text-[clamp(1.125rem,calc(1.02rem+0.95vw),1.5rem)] leading-[1.28]"
            style={{ color: TEXT_PRIMARY }}
          >
            Entre le terrain et le bureau,
            <br />
            <span style={{ color: BEWORK_BLUE }}>la marge se joue aussi sur les dossiers.</span>
          </h2>

          <div className="mt-6 h-[2px] w-16 rounded-full bg-slate-300/90" />

          <p className="mt-6 text-lg font-medium leading-[1.55] text-slate-800 md:text-xl">
            Les entreprises BTP perdent du temps et de la rentabilité sur les DCE à analyser, les devis et chiffrages à
            préparer, les pièces administratives à produire, les marchés publics à suivre, les relances MOE / MOA /
            fournisseurs, les réserves, le DOE, la facturation Chorus Pro et les pénalités contractuelles.
          </p>

          <ul className="mt-8 divide-y divide-slate-200">
            <li className="flex items-center gap-5 py-4 first:pt-0">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: BEWORK_BLUE_SOFT, color: BEWORK_BLUE }}
                aria-hidden
              >
                <IconFolderMini className="h-[22px] w-[22px]" />
              </span>
              <p className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>
                Appels d&apos;offres &amp; <span style={{ color: BEWORK_BLUE }}>mémoires techniques</span>
              </p>
            </li>
            <li className="flex items-center gap-5 py-4">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: BEWORK_BLUE_SOFT, color: BEWORK_BLUE }}
                aria-hidden
              >
                <IconClockMini className="h-[22px] w-[22px]" />
              </span>
              <p className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>
                Délais contractuels &amp; <span style={{ color: BEWORK_BLUE }}>validations</span>
              </p>
            </li>
            <li className="flex items-center gap-5 py-4 pb-0 last:border-b-0">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: BEWORK_BLUE_SOFT, color: BEWORK_BLUE }}
                aria-hidden
              >
                <IconUserWave className="h-[22px] w-[22px]" />
              </span>
              <p className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>
                Suivi marché, DOE &amp; <span style={{ color: BEWORK_BLUE }}>facturation</span>
              </p>
            </li>
          </ul>

          <div
            className="mt-10 flex flex-col gap-5 rounded-[18px] bg-white/90 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.07)] sm:flex-row sm:items-center"
            style={{
              border: `1px solid ${CARD_BORDER}`,
            }}
          >
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[22px] font-bold"
              style={{ border: `2px solid ${RED_SOFT}`, color: RED_SOFT }}
              aria-hidden
            >
              !
            </div>
            <p className="text-xl font-extrabold leading-snug" style={{ color: TEXT_PRIMARY }}>
              Résultat : conducteurs et chargés d&apos;affaires saturés, dossiers incomplets, situations bloquées, pénalités
              évitables et une traçabilité qui se perd dès que le volume augmente.
            </p>
          </div>
        </div>

        {/* Colonne droite — desktop tableau */}
        <div
          className="hidden min-w-0 rounded-[22px] bg-white lg:block lg:p-8"
          style={{
            border: `1px solid ${CARD_BORDER}`,
            boxShadow: "0 20px 52px rgba(15,23,42,0.09)",
          }}
        >
          <div className="grid grid-cols-[1fr_72px_1fr] items-center border-b border-slate-300 pb-4 text-sm font-extrabold uppercase tracking-[0.06em]">
            <span style={{ color: TEXT_PRIMARY }}>Problème</span>
            <span />
            <span className="text-right" style={{ color: RED_SOFT }}>
              Conséquence
            </span>
          </div>

          {tableRows.map((row) => (
            <div
              key={row.problem}
              className="grid grid-cols-[52px_minmax(0,1fr)_52px_minmax(0,1fr)_52px] items-center gap-x-3 border-b border-slate-200 py-5 last:border-b-0"
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100"
                style={{ color: BEWORK_BLUE }}
                aria-hidden
              >
                <row.ProblemIcon />
              </div>
              <p className="text-base font-semibold leading-snug" style={{ color: TEXT_PRIMARY }}>
                {row.problem}
              </p>
              <div className="text-center text-xl font-light" style={{ color: RED_SOFT }} aria-hidden>
                →
              </div>
              <p className="text-base font-semibold leading-snug" style={{ color: TEXT_PRIMARY }}>
                {row.consequence}
              </p>
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: RED_BG, color: RED_SOFT }}
                aria-hidden
              >
                <row.ConsequenceIcon />
              </div>
            </div>
          ))}
        </div>

        {/* Mobile / tablette — cartes empilées */}
        <div
          className="space-y-3 rounded-[22px] border bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.09)] lg:hidden"
          style={{ borderColor: CARD_BORDER }}
        >
          <div className="grid grid-cols-2 gap-2 border-b border-slate-300 pb-3 text-xs font-extrabold uppercase tracking-[0.08em] sm:text-sm">
            <span style={{ color: TEXT_PRIMARY }}>Problème</span>
            <span className="text-right" style={{ color: RED_SOFT }}>
              Conséquence
            </span>
          </div>
          {tableRows.map((row) => (
            <div
              key={`m-${row.problem}`}
              className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-[#fafbfc]/80 px-3.5 py-3.5"
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100"
                  style={{ color: BEWORK_BLUE }}
                  aria-hidden
                >
                  <row.ProblemIcon />
                </div>
                <p className="text-base font-semibold leading-snug" style={{ color: TEXT_PRIMARY }}>
                  {row.problem}
                </p>
              </div>
              <div className="flex items-center gap-2.5 border-t border-slate-100 pt-3">
                <span className="text-lg font-light" style={{ color: RED_SOFT }} aria-hidden>
                  →
                </span>
                <p className="min-w-0 flex-1 text-[15px] font-semibold leading-snug" style={{ color: TEXT_PRIMARY }}>
                  {row.consequence}
                </p>
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: RED_BG, color: RED_SOFT }}
                  aria-hidden
                >
                  <row.ConsequenceIcon />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function IconClockMini({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <circle cx="12" cy="12" r="9" strokeLinecap="round" />
      <path d="M12 7v6l5 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconFolderMini({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M3 18V9a2 2 0 012-2h4l2 3h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconUserWave({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <circle cx="10" cy="8" r="3.5" strokeLinecap="round" />
      <path d="M3 21c1.62-7 22-17 26-17" strokeLinecap="round" />
      <path d="M16 13a10 10 0 019 13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Traits épais + formes simples pour lisibilité à ~20px */
const TABLE_ICON_SW = 2;

/** Devis + relance : feuille + flèche circulaire */
function IconQuoteRelance() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={TABLE_ICON_SW} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3h7l3 3v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path strokeLinecap="round" d="M9 9h5M9 12h4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 15.5a3.5 3.5 0 1 0 2.8 4.6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.5 17.25 19.75 17.75" />
    </svg>
  );
}

/** Maison + croix (chantiers perdus) */
function IconConstructionLost() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={TABLE_ICON_SW} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5.25 7.25 10.25 16.75 10.25z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.75 10.5V19h8.5v-8.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19v-4.25h4V19" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.6 13.05 15.4 17.95M15.4 13.05 8.6 17.95" />
    </svg>
  );
}

/** Dossier + horloge (retards admin) */
function IconFolderClock() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={TABLE_ICON_SW} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 10h6l1.75 2.25h7.75a1.75 1.75 0 0 1 1.75 1.75v7a1.75 1.75 0 0 1-1.75 1.75H5a1.75 1.75 0 0 1-1.75-1.75v-8A1.25 1.25 0 0 1 5 10z" />
      <circle cx={16} cy={16.75} r={3.75} strokeLinecap="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 15.1v2.15l1.35 1" />
    </svg>
  );
}

/** Trois plaques empilées (tâches qui s’accumulent) */
function IconTasksPileUp() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={TABLE_ICON_SW} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 16.75h13a1 1 0 0 0 1-1v-1.25h-15v1.25a1 1 0 0 0 1 1z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.25 13.75h11.5a1 1 0 0 0 1-1v-1.25h-13.5v1.25a1 1 0 0 0 1 1z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 10.75h10a1 1 0 0 0 1-1V8.75H6v1a1 1 0 0 0 1 1z" />
    </svg>
  );
}

/** Éclair franc (stress / surcharge) — plus lisible qu’une flamme au petit format */
function IconFlameOverload() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={TABLE_ICON_SW} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 2l-2.25 9.75H7.5L12 14l-1.5 8 5.25-9.75H16L13 2z"
      />
    </svg>
  );
}

/** Clients insatisfaits — visage clair */
function IconSad() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={TABLE_ICON_SW} aria-hidden>
      <circle cx={12} cy={12} r={9} strokeLinecap="round" />
      <circle cx={9} cy={10} r={1.25} fill="currentColor" stroke="none" />
      <circle cx={15} cy={10} r={1.25} fill="currentColor" stroke="none" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.75 17C10 14.85 13.98 14.82 15.25 17" />
    </svg>
  );
}

/** Repère barré — manque de suivi */
function IconTrackingOff() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={TABLE_ICON_SW} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20.75s6.75-7 6.75-10.75a6.75 6.75 0 1 0-13.5 0C5.25 13.75 12 20.75 12 20.75z"
      />
      <circle cx={12} cy={9.75} r={2} strokeLinecap="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 20 14-14" />
    </svg>
  );
}

/** € barres + flèche bas (perte de CA) */
function IconEuroTrendDown() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={TABLE_ICON_SW} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.5 9a6 6 0 1 1-11.42 3.92" />
      <path strokeLinecap="round" d="M7 13.85h11M7 15.6h11" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 17.85v5M13.35 21.85l5.95-4.42" />
    </svg>
  );
}
