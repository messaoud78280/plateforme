import type { ReactNode } from "react";

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

export function ChainFlowSection() {
  return (
    <section id="flux" className="scroll-mt-24" aria-labelledby="flux-heading">
      <h2 id="flux-heading" className="text-center text-2xl font-bold tracking-tight text-[#0f172a] md:text-3xl">
        Un fonctionnement clair de A à Z
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-[#64748b] md:text-base">
        De la première prise de contact jusqu’à l’encaissement — une chaîne maîtrisée.
      </p>

      {/* Mobile : vertical */}
      <div className="mx-auto mt-10 max-w-sm md:hidden">
        <ol className="space-y-0" role="list">
          {CHAIN_STEPS.map((step, i) => (
            <li key={step.label}>
              <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 text-center shadow-sm transition-shadow duration-200 hover:shadow-md">
                <div className="mx-auto w-fit">
                  <IconWrapper>
                    <step.Icon />
                  </IconWrapper>
                </div>
                <p className="mt-3 text-xs font-bold tracking-wide text-[#0f172a]">{step.label}</p>
                <p className="mt-1 text-[11px] leading-snug text-[#64748b]">{step.desc}</p>
              </div>
              {i < CHAIN_STEPS.length - 1 && (
                <div className="flex justify-center py-2 text-lg text-[#94a3b8]" aria-hidden>
                  ↓
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* Desktop : horizontal scroll si besoin, sinon flex */}
      <div className="mt-10 hidden md:block">
        <div className="flex flex-wrap items-stretch justify-center gap-2 lg:gap-3 xl:flex-nowrap">
          {CHAIN_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-stretch">
              <div className="flex w-[140px] flex-col rounded-xl border border-[#e2e8f0] bg-white/95 p-4 text-center shadow-sm transition-all duration-200 hover:border-[#bfdbfe] hover:shadow-md lg:w-[150px]">
                <div className="mx-auto">
                  <IconWrapper>
                    <step.Icon />
                  </IconWrapper>
                </div>
                <p className="mt-3 text-xs font-bold tracking-wide text-[#0f172a]">{step.label}</p>
                <p className="mt-2 text-[11px] leading-snug text-[#64748b]">{step.desc}</p>
              </div>
              {i < CHAIN_STEPS.length - 1 && (
                <div className="flex w-8 shrink-0 items-center justify-center lg:w-10" aria-hidden>
                  <span className="text-xl font-light text-[#94a3b8]">→</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BeforeAfterSection() {
  return (
    <section id="comparaison" className="scroll-mt-24" aria-labelledby="comparaison-heading">
      <h2 id="comparaison-heading" className="text-center text-2xl font-bold tracking-tight text-[#0f172a] md:text-3xl">
        Avant / après
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm text-[#64748b]">
        Le même métier. Une autre façon d’organiser l’administratif.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8">
        <div className="rounded-2xl border-2 border-[#fecaca] bg-gradient-to-b from-[#fef2f2] to-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md md:p-8">
          <p className="text-sm font-bold uppercase tracking-wide text-[#b91c1c]">Sans organisation</p>
          <ul className="mt-5 space-y-3" role="list">
            {SANS.map((t) => (
              <li key={t} className="flex items-start gap-3 text-sm text-[#334155]">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#fee2e2] text-xs font-bold text-[#b91c1c]" aria-hidden>
                  ×
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border-2 border-[#93c5fd] bg-gradient-to-b from-[#eff6ff] to-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md md:p-8">
          <p className="text-sm font-bold uppercase tracking-wide text-[#1d4ed8]">Avec BeWork</p>
          <ul className="mt-5 space-y-3" role="list">
            {AVEC.map((t) => (
              <li key={t} className="flex items-start gap-3 text-sm text-[#334155]">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-[10px] font-bold text-[#1d4ed8]" aria-hidden>
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function VousNousSection() {
  return (
    <section id="roles" className="scroll-mt-24" aria-labelledby="roles-heading">
      <h2 id="roles-heading" className="text-center text-2xl font-bold tracking-tight text-[#0f172a] md:text-3xl">
        Ce que vous faites / ce que nous faisons
      </h2>
      <div className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8">
        <div className="rounded-2xl border border-[#e2e8f0] bg-white/90 p-6 shadow-sm transition-all duration-200 hover:border-[#cbd5e1] hover:shadow-md md:p-8">
          <p className="text-lg font-bold text-[#0f172a]">Vous</p>
          <ul className="mt-4 space-y-2 text-sm font-medium text-[#334155]" role="list">
            <li className="flex gap-2">
              <span className="text-[#1d4ed8]" aria-hidden>
                ▸
              </span>
              Le terrain
            </li>
            <li className="flex gap-2">
              <span className="text-[#1d4ed8]" aria-hidden>
                ▸
              </span>
              Les chantiers
            </li>
            <li className="flex gap-2">
              <span className="text-[#1d4ed8]" aria-hidden>
                ▸
              </span>
              Les équipes
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-[#bfdbfe] bg-[#f8fafc] p-6 shadow-sm transition-all duration-200 hover:border-[#93c5fd] hover:shadow-md md:p-8">
          <p className="text-lg font-bold text-[#1d4ed8]">Nous</p>
          <ul className="mt-4 space-y-2 text-sm font-medium text-[#334155]" role="list">
            {["Organisation", "Administratif", "Suivi", "Structuration"].map((t) => (
              <li key={t} className="flex gap-2">
                <span className="text-[#1d4ed8]" aria-hidden>
                  ▸
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-8 text-center text-base font-semibold text-[#0f172a]">
        Chacun son rôle, tout devient plus fluide.
      </p>
    </section>
  );
}

export function ShortTimelineSection() {
  return (
    <section id="methode" className="scroll-mt-24" aria-labelledby="methode-heading">
      <h2 id="methode-heading" className="text-2xl font-bold tracking-tight text-[#0f172a] md:text-3xl">
        Notre déroulé — en 5 temps
      </h2>
      <p className="mt-3 max-w-2xl text-sm text-[#64748b] md:text-base">
        Le forfait (Structure à Pilotage) se choisit à la mise en place — voir la grille plus bas.
      </p>
      <ol className="relative mx-auto mt-10 max-w-xl space-y-0 md:max-w-2xl">
        {TIMELINE.map((step, i) => (
          <li key={step.n} className="relative flex gap-4 pb-8 last:pb-0">
            {i < TIMELINE.length - 1 && (
              <div
                className="absolute left-[17px] top-10 hidden h-[calc(100%-2rem)] w-px bg-[#e2e8f0] md:block"
                aria-hidden
              />
            )}
            <span className="relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1d4ed8] text-sm font-bold text-white shadow-sm">
              {step.n}
            </span>
            <div className="min-w-0 border-b border-[#f1f5f9] pb-8 last:border-b-0 last:pb-0">
              <p className="font-semibold text-[#0f172a]">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-[#334155]">{step.phrase}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function ImpactCardsSection() {
  return (
    <section id="impact" className="scroll-mt-24" aria-labelledby="impact-heading">
      <h2 id="impact-heading" className="text-center text-2xl font-bold tracking-tight text-[#0f172a] md:text-3xl">
        Un impact direct sur votre activité
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm text-[#64748b]">
        Ce que vous ressentez au quotidien sur le terrain.
      </p>
      <ul
        className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
        role="list"
      >
        {IMPACT_CARDS.map(({ title, Icon }) => (
          <li
            key={title}
            className="flex flex-col items-center rounded-xl border border-[#e2e8f0] bg-white/95 p-5 text-center shadow-sm transition-all duration-200 hover:border-[#bfdbfe] hover:shadow-md"
          >
            <IconWrapper className="mb-3">
              <Icon />
            </IconWrapper>
            <p className="text-sm font-semibold leading-snug text-[#0f172a]">{title}</p>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-center text-base font-bold text-[#0f172a] md:text-lg">
        Un administratif bien géré, c’est plus de chiffre d’affaires.
      </p>
    </section>
  );
}

export function PresenceBlockSection() {
  return (
    <section id="visibilite" className="scroll-mt-24" aria-labelledby="visibilite-heading">
      <div className="overflow-hidden rounded-2xl border border-[#c7d2fe] bg-gradient-to-br from-[#eef2ff] via-white to-[#eff6ff] p-6 shadow-sm transition-shadow duration-200 hover:shadow-md md:p-10">
        <h2 id="visibilite-heading" className="text-2xl font-bold tracking-tight text-[#0f172a] md:text-3xl">
          Plus visible, plus crédible
        </h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2" role="list">
          {PRESENCE_ITEMS.map((t) => (
            <li
              key={t}
              className="flex items-center gap-3 rounded-lg border border-white/60 bg-white/70 px-4 py-3 text-sm font-medium text-[#334155] shadow-sm"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1d4ed8]/10 text-xs font-bold text-[#1d4ed8]" aria-hidden>
                ✓
              </span>
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-8 border-t border-[#c7d2fe]/60 pt-6 text-center text-base font-semibold text-[#0f172a]">
          Vous devenez une référence locale.
        </p>
      </div>
    </section>
  );
}
