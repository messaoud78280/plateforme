"use client";

import { useState, type JSX } from "react";

const BLUE = "#2563eb";
const fontSans = "var(--font-inter), var(--font-geist-sans), system-ui, sans-serif";

const STEPS: {
  n: number;
  title: string;
  body: string;
  Icon: () => JSX.Element;
}[] = [
  {
    n: 1,
    title: "Vous déposez votre demande",
    body: "Décrivez votre besoin en quelques clics : devis, dossier, relance ou coordination.",
    Icon: IconInbox,
  },
  {
    n: 2,
    title: "Votre référent analyse et attribue",
    body: "Il qualifie la demande et la confie au profil le plus adapté à votre contexte BTP.",
    Icon: IconUserLink,
  },
  {
    n: 3,
    title: "Le Beworker traite la mission",
    body: "Rédaction, relances, classement et suivi : l’équipe exécute dans le cadre de votre forfait.",
    Icon: IconBriefcase,
  },
  {
    n: 4,
    title: "Vous validez avant envoi",
    body: "Les éléments sensibles passent par votre relecture avant envoi au client ou au fournisseur.",
    Icon: IconCheckCircle,
  },
  {
    n: 5,
    title: "Suivi et décompte des crédits",
    body: "Statuts visibles à chaque étape et transparence sur la consommation de vos crédits.",
    Icon: IconChart,
  },
];

const TABS = ["Demandes", "Échanges", "Documents"] as const;

/** Section « Comment ça marche en détail » — landing premium, sous Solution */
export function HomeHowItWorksDetailSection() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Demandes");

  return (
    <section
      id="comment-ca-marche"
      className="relative scroll-mt-24 bg-transparent pt-10 pb-20 md:pt-12 md:pb-24 lg:pt-14 lg:pb-28"
      style={{ fontFamily: fontSans, scrollMarginTop: "6rem" }}
      aria-labelledby="how-detail-heading"
    >
      <div className="container-site relative z-[1]">
        <header className="mx-auto mb-16 max-w-3xl text-center md:mb-20">
          <h2
            id="how-detail-heading"
            className="text-[13px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: BLUE }}
          >
            Comment ça marche en détail
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-slate-600 md:mt-6 md:text-lg">
            De la demande à la livraison, BeWork structure, suit et sécurise chaque étape pour vous faire gagner du temps.
          </p>
        </header>

        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Timeline */}
          <div className="relative pl-0">
            <div className="absolute left-5 top-3 bottom-3 w-px bg-gradient-to-b from-slate-200 via-slate-200 to-slate-200/30" aria-hidden />

            <ol className="relative space-y-6 md:space-y-8">
              {STEPS.map((s) => (
                <li key={s.n} className="flex gap-3.5">
                  <div
                    className="relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm shadow-blue-900/12"
                    style={{ backgroundColor: BLUE }}
                  >
                    {s.n}
                  </div>
                  <div className="min-w-0 flex-1 pt-px">
                    <div className="flex items-start gap-2">
                      <span className="mt-px shrink-0 [&_svg]:h-[17px] [&_svg]:w-[17px]" style={{ color: BLUE }} aria-hidden>
                        <s.Icon />
                      </span>
                      <h3 className="text-[15px] font-semibold leading-snug text-slate-900 md:text-base">{s.title}</h3>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 md:text-[14px]">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Mockup */}
          <div className="rounded-[14px] border border-slate-200/90 bg-white/95 p-4 shadow-[0_18px_48px_-12px_rgba(15,23,42,0.1)] ring-1 ring-slate-100 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <span className="text-lg font-bold tracking-[-0.04em] text-[#0f172a] md:text-xl lg:text-[1.35rem] lg:tracking-[-0.045em]">
                Be<span style={{ color: BLUE }}>Work</span>
              </span>
              <nav className="flex gap-0.5 rounded-lg bg-slate-100/90 p-0.5" aria-label="Zones de l’espace client">
                {TABS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors md:text-[12px] ${
                      tab === t ? "bg-white text-slate-900 shadow-sm shadow-slate-900/6" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </nav>
            </div>

            <div className="mt-3.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3 md:p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[13px] font-semibold leading-snug text-slate-900 md:text-sm">Mémoire technique — AO Mairie</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500 md:text-[12px]">
                    Dossier ouvert le 12 avr. · Réf. MT-2026-084
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide md:text-[11px]"
                  style={{ backgroundColor: "#dbeafe", color: "#1d4ed8" }}
                >
                  En cours
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5" aria-hidden>
                <span className="rounded-md border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-medium text-emerald-800 md:text-[11px]">
                  Validé
                </span>
                <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 md:text-[11px]">
                  Terminé
                </span>
              </div>
            </div>

            <ul className="mt-3.5 space-y-1.5 text-[12px] md:text-[13px] [&_svg]:h-4 [&_svg]:w-4">
              <li className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-2.5 py-2">
                <span className="text-slate-700">Demande créée</span>
                <span className="text-emerald-600" aria-label="Fait">
                  <IconCheckSmall />
                </span>
              </li>
              <li className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-2.5 py-2">
                <span className="text-slate-700">Attribuée au Beworker</span>
                <span className="text-emerald-600" aria-label="Fait">
                  <IconCheckSmall />
                </span>
              </li>
              <li className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 px-2.5 py-2">
                <span className="font-medium text-slate-800">Rédaction & relecture</span>
                <span className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" aria-label="En cours" />
              </li>
            </ul>

            <div className="mt-4 rounded-[10px] border border-slate-100 bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 md:text-[11px]">Avancement forfait</p>
              <div className="mt-1.5 flex items-baseline justify-between gap-2">
                <span className="text-xl font-bold tabular-nums text-slate-900 md:text-2xl">42</span>
                <span className="text-[11px] text-slate-500 md:text-xs">/ 185 crédits utilisés</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[22.7%] rounded-full" style={{ backgroundColor: BLUE }} />
              </div>
            </div>

            <p className="mt-3 text-center text-[11px] text-slate-400 md:text-[12px]">Aperçu illustratif de l’espace client</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function IconInbox() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 12h-6l-2 3H10l-2-3H2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

function IconUserLink() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx={9} cy={7} r={4} strokeLinecap="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 11h-4M20 9v4" />
    </svg>
  );
}

function IconBriefcase() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}

function IconCheckCircle() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} aria-hidden>
      <circle cx={12} cy={12} r={9} />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m7 12 4-4 4 8 5-10" />
    </svg>
  );
}

function IconCheckSmall() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
    </svg>
  );
}
