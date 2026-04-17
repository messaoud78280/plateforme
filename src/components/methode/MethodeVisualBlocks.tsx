import { Fragment, type ReactNode } from "react";

/** Icônes minimalistes 24×24, stroke cohérent */
function IconWrapper({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] text-[#1d4ed8] ${className}`}
      aria-hidden
    >
      {children}
    </span>
  );
}

/** Icône étape chaîne A→Z — pastille bleu métal */
function ChainIconWrapper({ children, compact }: { children: ReactNode; compact?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center bg-gradient-to-br from-white via-[#eff6ff] to-[#dbeafe] text-[#1d4ed8] shadow-[inset_0_2px_5px_rgba(255,255,255,0.95),inset_0_-3px_6px_rgba(29,78,216,0.07),0_4px_16px_rgba(37,99,235,0.18)] ring-1 ring-[#bfdbfe]/90 ${
        compact ? "h-9 w-9 rounded-lg" : "h-11 w-11 rounded-xl"
      }`}
      aria-hidden
    >
      {children}
    </span>
  );
}

function IconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconFile() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

function IconHardHat() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a8 8 0 1 0-16 0v2z" />
      <path d="M10 10h4" />
    </svg>
  );
}

function IconInvoice() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 7h10M7 11h6M7 15h4" />
    </svg>
  );
}

function IconWallet() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

const CHAIN_STEPS = [
  { label: "CLIENT", desc: "Demande, qualification, filtrage", Icon: IconUsers },
  { label: "DEVIS", desc: "Chiffrage rapide, envoi structuré", Icon: IconFile },
  { label: "CHANTIER", desc: "Organisation, suivi, coordination", Icon: IconHardHat },
  { label: "FACTURATION", desc: "Acomptes, situations, factures", Icon: IconInvoice },
  { label: "ENCAISSEMENT", desc: "Suivi paiements, relances", Icon: IconWallet },
] as const;

const SANS = [
  "Devis en retard",
  "Clients non suivis",
  "Administratif accumulé",
  "Stress",
  "Pertes de chantiers",
] as const;

const AVEC = [
  "Devis envoyés rapidement",
  "Suivi structuré",
  "Organisation claire",
  "Activité fluide",
  "Plus de chantiers signés",
] as const;

function IconXCircle({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconCheckCircle({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevronRole({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const VOUS_ROLES = ["Le terrain", "Les chantiers", "Les équipes"] as const;
const NOUS_ROLES = ["Organisation", "Administratif", "Suivi", "Structuration"] as const;

const TIMELINE = [
  { n: 1, title: "Analyse", phrase: "On comprend votre rythme et vos blocages." },
  { n: 2, title: "Mise en place", phrase: "Cadre, outils, forfait : tout est posé par écrit." },
  { n: 3, title: "Gestion quotidienne", phrase: "Devis, relances, dossiers — au niveau convenu." },
  { n: 4, title: "Optimisation", phrase: "On ajuste quand votre activité accélère." },
  { n: 5, title: "Résultat", phrase: "Moins de friction, plus de chantiers qui avancent." },
] as const;

const IMPACT_CARDS = [
  { title: "Plus de devis signés", Icon: IconFile },
  { title: "Meilleure organisation", Icon: IconInvoice },
  { title: "Moins d’oublis", Icon: IconHardHat },
  { title: "Meilleure trésorerie", Icon: IconWallet },
  { title: "Image professionnelle", Icon: IconUsers },
] as const;

const PRESENCE_ITEMS = [
  "Mise en valeur des réalisations",
  "Gestion des avis",
  "Réponse aux messages",
  "Image professionnelle",
] as const;

const metallicBlueFlowCard =
  "relative flex flex-col overflow-hidden rounded-xl border border-[#93c5fd]/55 bg-gradient-to-br from-[#eff6ff]/90 via-white to-[#f8fafc] text-center shadow-[0_10px_32px_-10px_rgba(37,99,235,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-[#60a5fa]/80 hover:shadow-[0_16px_40px_-12px_rgba(37,99,235,0.28)]";

const chainStepCardClass = `${metallicBlueFlowCard} p-4`;

/** Rangée desktop : padding réduit pour tenir dans le cadre sans scroll */
const chainStepCardDesktopClass = `${metallicBlueFlowCard} p-2 md:p-2.5`;

const impactCardClass = `${metallicBlueFlowCard} items-center gap-3 p-5 md:gap-4 md:p-6`;

/** Titres d’étapes (CLIENT, DEVIS…) : Geist + capitales + tracking, comme « Parcours », « Impact », etc. */
const chainPhaseTitleClass =
  "break-words font-sans text-[0.68rem] font-bold uppercase leading-[1.15] tracking-[0.16em] text-black antialiased sm:text-[0.72rem] sm:tracking-[0.18em] md:text-[0.75rem] md:tracking-[0.2em] lg:text-xs lg:tracking-[0.22em] xl:text-[0.8125rem]";

/** Titres sur la rangée desktop (colonnes étroites) */
const chainPhaseTitleDesktopClass =
  "break-words font-sans text-[0.625rem] font-bold uppercase leading-[1.1] tracking-[0.1em] text-black antialiased md:text-[0.65rem] md:tracking-[0.12em] lg:text-[0.7rem] lg:tracking-[0.14em] xl:text-[0.72rem]";

/** Numéros de la timeline : Geist tabulaire, même famille que le corps du site */
const timelineIndexClass =
  "font-sans text-[0.95rem] font-bold tabular-nums tracking-tight text-white";

export function ChainFlowSection() {
  return (
    <section id="flux" className="scroll-mt-24" aria-labelledby="flux-heading">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--metal-200)] bg-gradient-to-br from-[var(--metal-50)] via-white to-[var(--metal-100)] p-7 shadow-[var(--shadow-lg)] md:p-10">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/45 via-transparent to-[#2563eb]/[0.04]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-gradient-to-br from-sky-200/30 to-transparent blur-2xl"
            aria-hidden
          />

          <div className="relative">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#94a3b8]">Parcours</p>
            <h2
              id="flux-heading"
              className="mt-2 text-center font-sans text-[1.55rem] font-semibold leading-tight tracking-tight text-black md:text-3xl"
            >
              Un fonctionnement clair de A à Z
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-black md:text-base">
              De la première prise de contact jusqu’à l’encaissement — une chaîne maîtrisée.
            </p>

            {/* Mobile : vertical */}
            <div className="mx-auto mt-10 max-w-sm md:hidden">
              <ol className="space-y-0" role="list">
                {CHAIN_STEPS.map((step, i) => (
                  <li key={step.label}>
                    <div className={chainStepCardClass}>
                      <div
                        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-sky-300 via-[#2563eb] to-[#1d4ed8] shadow-[0_3px_16px_rgba(37,99,235,0.45)]"
                        aria-hidden
                      />
                      <div className="mx-auto w-fit pt-0.5">
                        <ChainIconWrapper>
                          <step.Icon />
                        </ChainIconWrapper>
                      </div>
                      <p className={`mt-3 ${chainPhaseTitleClass}`}>{step.label}</p>
                      <p className="mt-1 text-[11px] leading-snug text-black">{step.desc}</p>
                    </div>
                    {i < CHAIN_STEPS.length - 1 && (
                      <div className="flex justify-center py-2.5" aria-hidden>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#f8fafc] via-[#e2e8f0] to-[#cbd5e1] text-sm font-light text-black shadow-[inset_0_2px_4px_rgba(255,255,255,0.88),0_3px_10px_rgba(15,23,42,0.08)] ring-1 ring-white/80">
                          ↓
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </div>

            {/* Desktop : grille 5×1fr + flèches — tient dans le cadre sans débordement ni scroll */}
            <div className="mt-10 hidden w-full min-w-0 md:block">
              <div
                className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,auto)_minmax(0,1fr)_minmax(0,auto)_minmax(0,1fr)_minmax(0,auto)_minmax(0,1fr)_minmax(0,auto)_minmax(0,1fr)] items-stretch gap-x-0.5 md:gap-x-1"
                role="list"
              >
                {CHAIN_STEPS.map((step, i) => (
                  <Fragment key={step.label}>
                    <div className={`${chainStepCardDesktopClass} min-w-0`} role="listitem">
                      <div
                        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-sky-300 via-[#2563eb] to-[#1d4ed8] shadow-[0_3px_16px_rgba(37,99,235,0.45)]"
                        aria-hidden
                      />
                      <div className="mx-auto w-fit pt-0.5">
                        <ChainIconWrapper compact>
                          <step.Icon />
                        </ChainIconWrapper>
                      </div>
                      <p className={`mt-2 ${chainPhaseTitleDesktopClass}`}>{step.label}</p>
                      <p className="mt-1.5 text-[9px] leading-snug text-black lg:text-[10px]">
                        {step.desc}
                      </p>
                    </div>
                    {i < CHAIN_STEPS.length - 1 && (
                      <div className="flex items-center justify-center self-center px-0.5" aria-hidden>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#f8fafc] via-[#e2e8f0] to-[#cbd5e1] text-[10px] font-medium text-black shadow-[inset_0_1px_3px_rgba(255,255,255,0.9),0_2px_6px_rgba(15,23,42,0.06)] ring-1 ring-white/90 md:h-7 md:w-7 md:text-[11px]">
                          →
                        </span>
                      </div>
                    )}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function BeforeAfterSection() {
  return (
    <section id="comparaison" className="scroll-mt-24" aria-labelledby="comparaison-heading">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--metal-200)] bg-gradient-to-br from-[var(--metal-50)] via-white to-[var(--metal-100)] p-7 shadow-[var(--shadow-lg)] md:p-10">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/45 via-transparent to-[#2563eb]/[0.035]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-16 top-1/3 h-44 w-44 rounded-full bg-gradient-to-br from-rose-200/25 to-transparent blur-2xl"
            aria-hidden
          />

          <div className="relative">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#94a3b8]">Comparaison</p>
            <h2
              id="comparaison-heading"
              className="mt-2 text-center font-sans text-[1.55rem] font-semibold leading-tight tracking-tight text-black md:text-3xl"
            >
              Avant / après
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-black md:text-base">
              Le même métier. Une autre façon d’organiser l’administratif.
            </p>

            <div className="relative mt-12 grid gap-8 md:grid-cols-2 md:gap-6 lg:gap-10">
              <div
                className="pointer-events-none absolute left-1/2 top-[42%] z-10 hidden -translate-x-1/2 -translate-y-1/2 md:flex"
                aria-hidden
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#f8fafc] via-[#e2e8f0] to-[#cbd5e1] font-sans text-[11px] font-extrabold tracking-[0.2em] text-black shadow-[inset_0_2px_5px_rgba(255,255,255,0.9),inset_0_-3px_8px_rgba(15,23,42,0.12),0_6px_22px_rgba(15,23,42,0.12)] ring-2 ring-white ring-offset-2 ring-offset-[var(--metal-50)]">
                  VS
                </span>
              </div>

              {/* Sans organisation — tons rouge + liseré métal rosé */}
              <article className="group relative overflow-hidden rounded-2xl border border-[#fecaca]/90 bg-gradient-to-br from-[#fff1f2] via-white to-[#fef2f2] p-6 shadow-[0_12px_44px_-10px_rgba(185,28,28,0.18),inset_0_1px_0_rgba(255,255,255,0.85)] transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-[#f87171] hover:shadow-[0_20px_50px_-12px_rgba(185,28,28,0.28)] md:p-8">
                <div
                  className="absolute inset-x-0 top-0 z-[2] h-[3px] bg-[linear-gradient(90deg,#fff1f2_0%,#fecaca_24%,#dc2626_48%,#f87171_52%,#fecdd3_76%,#fef2f2_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_3px_18px_rgba(220,38,38,0.35)]"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-500/[0.04] via-transparent to-transparent"
                  aria-hidden
                />
                <header className="relative flex flex-wrap items-center gap-3 pt-0.5">
                  <span className="inline-flex items-center rounded-full bg-gradient-to-b from-[#fee2e2] to-[#fecaca] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#7f1d1d] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 ring-inset ring-[#fca5a5]/90">
                    Sans organisation
                  </span>
                  <span className="text-xs text-black">Aujourd’hui, sans cadre</span>
                </header>
                <ul className="relative mt-6 space-y-1" role="list">
                  {SANS.map((t) => (
                    <li
                      key={t}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-black transition-colors duration-200 md:text-[15px] ${
                        t === "Devis en retard"
                          ? "bg-[#fff1f2]/95 shadow-[inset_0_0_0_1px_rgba(254,202,202,0.75)] hover:bg-[#ffe4e6]/90"
                          : "hover:bg-[#fef2f2]/85"
                      }`}
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white via-[#fff1f2] to-[#fecdd3] text-[#b91c1c] shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),inset_0_-2px_5px_rgba(185,28,28,0.1),0_4px_12px_rgba(220,38,38,0.14)] ring-1 ring-[#fca5a5]/80 transition-transform duration-200 group-hover:scale-105"
                        aria-hidden
                      >
                        <IconXCircle className="opacity-95" />
                      </span>
                      <span className="font-medium leading-snug">{t}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <div className="flex justify-center py-1 md:hidden" aria-hidden>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#f8fafc] via-[#e2e8f0] to-[#cbd5e1] font-sans text-[10px] font-extrabold tracking-[0.2em] text-black shadow-[inset_0_2px_4px_rgba(255,255,255,0.85),0_4px_14px_rgba(15,23,42,0.1)] ring-2 ring-white">
                  VS
                </span>
              </div>

              {/* Avec BeWork — même logique que carte « Nous » */}
              <article className="group relative overflow-hidden rounded-2xl border border-[#93c5fd]/90 bg-gradient-to-br from-[#eff6ff] via-white to-[#f0f9ff] p-6 shadow-[0_12px_44px_-10px_rgba(37,99,235,0.22),inset_0_1px_0_rgba(255,255,255,0.85)] transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-[#60a5fa] hover:shadow-[0_20px_50px_-12px_rgba(37,99,235,0.32)] md:p-8">
                <div
                  className="absolute inset-x-0 top-0 z-[2] h-[3px] bg-gradient-to-r from-[#38bdf8] via-[#2563eb] to-[#1d4ed8] shadow-[0_4px_28px_rgba(37,99,235,0.55),inset_0_1px_0_rgba(255,255,255,0.45)]"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#3b82f6]/[0.06] via-transparent to-transparent"
                  aria-hidden
                />
                <header className="relative flex flex-wrap items-center gap-3 pt-0.5">
                  <span className="inline-flex items-center rounded-full bg-gradient-to-b from-[#dbeafe] to-[#bfdbfe] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#1e3a8a] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ring-1 ring-inset ring-[#93c5fd]/90">
                    Avec BeWork
                  </span>
                  <span className="text-xs text-black">Même activité, autre rythme</span>
                </header>
                <ul className="relative mt-6 space-y-1" role="list">
                  {AVEC.map((t) => (
                    <li
                      key={t}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-black transition-colors duration-200 hover:bg-[#eff6ff]/75 md:text-[15px]"
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white via-[#eff6ff] to-[#dbeafe] text-[#1d4ed8] shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),inset_0_-2px_5px_rgba(29,78,216,0.08),0_4px_12px_rgba(37,99,235,0.15)] ring-1 ring-[#bfdbfe]/90 transition-transform duration-200 group-hover:scale-105"
                        aria-hidden
                      >
                        <IconCheckCircle className="opacity-95" />
                      </span>
                      <span className="font-medium leading-snug">{t}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <p className="text-center font-sans text-sm font-semibold text-black md:col-span-2 md:-mt-2 md:text-base">
                Passez du désordre au pilotage — sans changer de métier.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function VousNousSection() {
  return (
    <section id="roles" className="scroll-mt-24" aria-labelledby="roles-heading">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--metal-200)] bg-gradient-to-br from-[var(--metal-50)] via-white to-[var(--metal-100)] p-7 shadow-[var(--shadow-lg)] md:p-10">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/45 via-transparent to-[#2563eb]/[0.035]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-20 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-gradient-to-br from-slate-200/35 to-transparent blur-2xl"
            aria-hidden
          />

          <div className="relative">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#94a3b8]">Rôles</p>
            <h2
              id="roles-heading"
              className="mt-2 text-center font-sans text-[1.55rem] font-semibold leading-tight tracking-tight text-black md:text-3xl"
            >
              Ce que vous faites / ce que nous faisons
            </h2>

            <div className="relative mt-12 grid gap-8 md:grid-cols-2 md:gap-6 lg:gap-10">
              <div
                className="pointer-events-none absolute left-1/2 top-[42%] z-10 hidden -translate-x-1/2 -translate-y-1/2 md:flex"
                aria-hidden
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#f8fafc] via-[#e2e8f0] to-[#cbd5e1] font-sans text-2xl font-semibold leading-none text-black shadow-[inset_0_2px_5px_rgba(255,255,255,0.9),inset_0_-3px_8px_rgba(15,23,42,0.12),0_6px_22px_rgba(15,23,42,0.12)] ring-2 ring-white ring-offset-2 ring-offset-[var(--metal-50)]">
                  +
                </span>
              </div>

              {/* Carte Vous — acier / chrome (surface métallique claire) */}
              <article className="group relative overflow-hidden rounded-2xl surface-metallic-light surface-metallic-light--soft p-6 transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 md:p-8">
                <div
                  className="absolute inset-x-0 top-0 z-[2] h-[3px] bg-[linear-gradient(90deg,#f8fafc_0%,#cbd5e1_22%,#64748b_48%,#94a3b8_52%,#e2e8f0_78%,#f1f5f9_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_2px_12px_rgba(100,116,139,0.25)]"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent"
                  aria-hidden
                />
                <header className="relative flex flex-wrap items-center gap-3 pt-0.5">
                  <span className="inline-flex items-center rounded-full bg-[#f1f5f9]/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] ring-1 ring-inset ring-[#cbd5e1]/80">
                    Vous
                  </span>
                  <span className="text-xs text-black">Cœur de métier &amp; exécution</span>
                </header>
                <ul className="relative mt-6 space-y-1" role="list">
                  {VOUS_ROLES.map((t) => (
                    <li
                      key={t}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-black transition-colors duration-200 hover:bg-white/45 md:text-[15px]"
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white via-[#f8fafc] to-[#d1d9e6] text-black shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(15,23,42,0.06),0_2px_6px_rgba(15,23,42,0.06)] ring-1 ring-[#94a3b8]/35 transition-transform duration-200 group-hover:scale-105"
                        aria-hidden
                      >
                        <IconChevronRole />
                      </span>
                      <span className="font-medium leading-snug">{t}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <div className="flex justify-center py-1 md:hidden" aria-hidden>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#f8fafc] via-[#e2e8f0] to-[#cbd5e1] font-sans text-xl font-semibold leading-none text-black shadow-[inset_0_2px_4px_rgba(255,255,255,0.85),0_4px_14px_rgba(15,23,42,0.1)] ring-2 ring-white">
                  +
                </span>
              </div>

              {/* Carte Nous — bleu lumineux + relief */}
              <article className="group relative overflow-hidden rounded-2xl border border-[#93c5fd]/90 bg-gradient-to-br from-[#eff6ff] via-white to-[#f0f9ff] p-6 shadow-[0_12px_44px_-10px_rgba(37,99,235,0.22),inset_0_1px_0_rgba(255,255,255,0.85)] transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-[#60a5fa] hover:shadow-[0_20px_50px_-12px_rgba(37,99,235,0.32)] md:p-8">
                <div
                  className="absolute inset-x-0 top-0 z-[2] h-[3px] bg-gradient-to-r from-[#38bdf8] via-[#2563eb] to-[#1d4ed8] shadow-[0_4px_28px_rgba(37,99,235,0.55),inset_0_1px_0_rgba(255,255,255,0.45)]"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#3b82f6]/[0.06] via-transparent to-transparent"
                  aria-hidden
                />
                <header className="relative flex flex-wrap items-center gap-3 pt-0.5">
                  <span className="inline-flex items-center rounded-full bg-gradient-to-b from-[#dbeafe] to-[#bfdbfe] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#1e3a8a] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ring-1 ring-inset ring-[#93c5fd]/90">
                    Nous
                  </span>
                  <span className="text-xs text-black">Structure, suivi &amp; administratif</span>
                </header>
                <ul className="relative mt-6 space-y-1" role="list">
                  {NOUS_ROLES.map((t) => (
                    <li
                      key={t}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-black transition-colors duration-200 md:text-[15px] ${
                        t === "Suivi"
                          ? "bg-[#eff6ff]/95 shadow-[inset_0_0_0_1px_rgba(191,219,254,0.7)] hover:bg-[#dbeafe]/90"
                          : "hover:bg-[#eff6ff]/75"
                      }`}
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white via-[#eff6ff] to-[#dbeafe] text-[#1d4ed8] shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),inset_0_-2px_5px_rgba(29,78,216,0.08),0_4px_12px_rgba(37,99,235,0.15)] ring-1 ring-[#bfdbfe]/90 transition-transform duration-200 group-hover:scale-105"
                        aria-hidden
                      >
                        <IconChevronRole />
                      </span>
                      <span className="font-medium leading-snug">{t}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <p className="text-center font-sans text-sm font-semibold text-black md:col-span-2 md:-mt-2 md:text-base">
                Chacun son rôle, tout devient plus fluide.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ShortTimelineSection() {
  return (
    <section id="methode" className="scroll-mt-24" aria-labelledby="methode-heading">
      <div className="relative overflow-hidden rounded-3xl border border-[var(--metal-200)] bg-gradient-to-br from-[var(--metal-50)] via-white to-[var(--metal-100)] p-7 shadow-[var(--shadow-lg)] md:p-10 md:pl-12">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-[#2563eb]/[0.04]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-slate-200/40 to-transparent blur-2xl"
          aria-hidden
        />

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#94a3b8]">Méthode</p>
          <h2
            id="methode-heading"
            className="mt-2 font-sans text-[1.65rem] font-semibold leading-tight tracking-tight text-black md:text-3xl"
          >
            Notre déroulé — en 5 temps
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-black md:text-base">
            Le forfait (Structure à Pilotage) se choisit à la mise en place — voir la grille plus bas.
          </p>

          <ol className="relative mx-auto mt-12 max-w-xl space-y-0 md:max-w-2xl">
            {TIMELINE.map((step, i) => (
              <li key={step.n} className="relative flex gap-5 pb-10 last:pb-0">
                {i < TIMELINE.length - 1 && (
                  <div
                    className="absolute left-[21px] top-[52px] hidden h-[calc(100%-2.75rem)] w-0.5 bg-gradient-to-b from-slate-300 via-slate-400/90 to-slate-300 shadow-[0_0_12px_rgba(148,163,184,0.35),inset_0_0_1px_rgba(255,255,255,0.6)] md:block"
                    aria-hidden
                  />
                )}
                <span
                  className={`relative z-[1] flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-200 via-[#2563eb] to-[#0c1e3d] shadow-[inset_0_2px_6px_rgba(255,255,255,0.55),inset_0_-4px_10px_rgba(0,0,0,0.35),0_8px_24px_rgba(29,78,216,0.38)] ring-2 ring-white/90 ${timelineIndexClass}`}
                >
                  {step.n}
                </span>
                <div className="min-w-0 flex-1 border-b border-[#e2e8f0]/70 pb-10 last:border-b-0 last:pb-0">
                  <p className="font-sans text-lg font-semibold tracking-tight text-black md:text-xl">
                    {step.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-black md:text-[15px]">{step.phrase}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function ImpactCardsSection() {
  return (
    <section id="impact" className="scroll-mt-24" aria-labelledby="impact-heading">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--metal-200)] bg-gradient-to-br from-[var(--metal-50)] via-white to-[var(--metal-100)] p-7 shadow-[var(--shadow-lg)] md:p-10">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/45 via-transparent to-[#2563eb]/[0.04]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-0 left-1/4 h-36 w-36 rounded-full bg-gradient-to-tr from-sky-200/25 to-transparent blur-2xl"
            aria-hidden
          />

          <div className="relative">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#94a3b8]">Impact</p>
            <h2
              id="impact-heading"
              className="mt-2 text-center font-sans text-[1.55rem] font-semibold leading-tight tracking-tight text-black md:text-3xl"
            >
              Un impact direct sur votre activité
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-black md:text-base">
              Ce que vous ressentez au quotidien sur le terrain.
            </p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5" role="list">
              {IMPACT_CARDS.map(({ title, Icon }) => (
                <li key={title} className={impactCardClass}>
                  <div
                    className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-sky-300 via-[#2563eb] to-[#1d4ed8] shadow-[0_3px_16px_rgba(37,99,235,0.45)]"
                    aria-hidden
                  />
                  <div className="relative flex flex-col items-center gap-3 pt-1 md:gap-4">
                    <ChainIconWrapper>
                      <Icon />
                    </ChainIconWrapper>
                    <p className="text-sm font-semibold leading-snug text-black md:text-[15px]">{title}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-10 text-center font-sans text-base font-semibold text-black md:text-lg">
              Un administratif bien géré, c’est plus de chiffre d’affaires.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PresenceBlockSection() {
  return (
    <section id="visibilite" className="scroll-mt-24" aria-labelledby="visibilite-heading">
      <div className="overflow-hidden rounded-2xl border border-[#c7d2fe] bg-gradient-to-br from-[#eef2ff] via-white to-[#eff6ff] p-6 shadow-sm transition-shadow duration-200 hover:shadow-md md:p-10">
        <h2 id="visibilite-heading" className="text-2xl font-bold tracking-tight text-black md:text-3xl">
          Plus visible, plus crédible
        </h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2" role="list">
          {PRESENCE_ITEMS.map((t) => (
            <li
              key={t}
              className="flex items-center gap-3 rounded-lg border border-white/60 bg-white/70 px-4 py-3 text-sm font-medium text-black shadow-sm"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1d4ed8]/10 text-xs font-bold text-[#1d4ed8]" aria-hidden>
                ✓
              </span>
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-8 border-t border-[#c7d2fe]/60 pt-6 text-center text-base font-semibold text-black">
          Vous devenez une référence locale.
        </p>
      </div>
    </section>
  );
}
