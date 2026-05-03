import type { JSX } from "react";

const BLUE = "#2563eb";
const BLUE_SOFT = "#eff6ff";
const TEXT_DARK = "#111827";
const TEXT_MUTED = "#6b7280";
const BORDER = "#e5e7eb";

const CARDS: {
  title: string;
  bullets: string[];
  footerTitle: string;
  footerSub: string;
  Icon: () => JSX.Element;
  FooterIcon: () => JSX.Element;
}[] = [
  {
    title: "Gestion des devis & relances",
    bullets: ["Relance automatique des devis", "Suivi des réponses clients", "Facturation claire et rapide"],
    footerTitle: "+ de devis signés",
    footerSub: "Plus d’opportunités, plus de CA.",
    Icon: IconEuroDocument,
    FooterIcon: IconBarsUp,
  },
  {
    title: "Suivi administratif chantier",
    bullets: ["DICT, autorisations, dossiers", "Documents toujours à jour", "Aucun oubli administratif"],
    footerTitle: "0 retard administratif",
    footerSub: "Conformité et sérénité garanties.",
    Icon: IconClipboardChecks,
    FooterIcon: IconShieldMini,
  },
  {
    title: "Coordination & organisation",
    bullets: ["Commandes fournisseurs", "Planning équipes", "Suivi des livraisons"],
    footerTitle: "Chantiers fluides",
    footerSub: "Tout est au bon endroit, au bon moment.",
    Icon: IconPeopleCoord,
    FooterIcon: IconTruckMini,
  },
];

/** Section « La solution BeWork » — sous Problème, continu hero/métallique parent */
export function HomeSolutionSection() {
  const sans = 'var(--font-inter),var(--font-geist-sans),system-ui,sans-serif';

  return (
    <section
      id="solution-bework"
      className="relative bg-transparent pt-10 pb-8 md:pt-14 md:pb-10 lg:pt-16 lg:pb-12"
      style={{ fontFamily: sans }}
      aria-labelledby="solution-bework-heading"
    >
      <div className="container-site relative z-[1]">
        <header className="mx-auto mb-14 max-w-3xl text-center md:mb-16">
          <p className="text-[13px] font-semibold uppercase tracking-[0.2em]" style={{ color: BLUE }}>
            LA&nbsp;SOLUTION&nbsp;BEWORK
          </p>
          <div className="mx-auto mt-3 h-[3px] w-12 rounded-full" style={{ backgroundColor: BLUE }} />

          <h2 id="solution-bework-heading" className="mt-8 text-[clamp(1.875rem,calc(1rem+3.8vw),3rem)] font-bold leading-[1.08] tracking-[-0.025em]" style={{ color: TEXT_DARK }}>
            <span style={{ color: BLUE }}>BeWork</span> prend le relais.
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed md:text-lg" style={{ color: TEXT_MUTED }}>
            Vous avancez sur vos chantiers. On sécurise tout le reste.
          </p>
        </header>

        <div className="mx-auto grid max-w-[1200px] gap-8 md:grid-cols-3 md:gap-8 lg:gap-10">
          {CARDS.map((card) => (
            <article
              key={card.title}
              className="flex flex-col items-center rounded-[18px] border bg-white p-7 text-center shadow-[0_14px_40px_rgba(15,23,42,0.045)] md:p-8"
              style={{ borderColor: BORDER }}
            >
              <div className="mb-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                <card.Icon />
              </div>

              <h3 className="mb-5 text-xl font-semibold tracking-tight text-slate-900">{card.title}</h3>

              <ul className="mx-auto mb-6 flex w-full max-w-[17.5rem] flex-1 flex-col gap-3 text-left text-[15px] leading-snug md:max-w-[19rem]" style={{ color: TEXT_MUTED }}>
                {card.bullets.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-0.5 shrink-0 text-[#2563eb]" aria-hidden>
                      <IconCheck />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div
                className="mt-auto flex w-full gap-4 rounded-xl p-4 text-left md:p-[18px]"
                style={{ backgroundColor: BLUE_SOFT }}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/90 text-[#2563eb] shadow-sm shadow-blue-900/5 ring-1 ring-blue-100">
                  <card.FooterIcon />
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-[#1d4ed8]">{card.footerTitle}</p>
                  <p className="mt-1 text-[13px] leading-snug text-slate-600">{card.footerSub}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
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

