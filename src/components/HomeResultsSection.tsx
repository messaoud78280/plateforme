import type { JSX } from "react";

const RESULTS: { title: string; body: string; Icon: () => JSX.Element }[] = [
  {
    title: "Du temps terrain retrouvé",
    body: "Le conducteur se concentre sur les équipes, la qualité, les délais et les décisions.",
    Icon: IconHardHat,
  },
  {
    title: "Moins de soirées administratives",
    body: "Les comptes rendus, tableaux et relances sont préparés au fil de l’eau.",
    Icon: IconMoon,
  },
  {
    title: "Des dossiers mieux suivis",
    body: "Les pièces attendues, les versions disponibles et les échéances sont plus faciles à retrouver.",
    Icon: IconFolderCheck,
  },
  {
    title: "Une facturation mieux préparée",
    body: "Les situations et leurs justificatifs sont organisés avant la date limite.",
    Icon: IconInvoice,
  },
  {
    title: "Une clôture mieux anticipée",
    body: "Les réserves et le DOE sont suivis avant qu’ils deviennent une urgence.",
    Icon: IconArchiveCheck,
  },
];

/** Section « résultats » — bénéfices concrets, sans chiffre non vérifié. */
export function HomeResultsSection() {
  return (
    <section id="resultats" className="relative bg-transparent px-6 py-14 md:py-20 lg:py-24" style={{ scrollMarginTop: "6rem" }}>
      <div className="container-site">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-balance text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.02em] text-[#0f172a] md:text-[2.25rem]">
            Ce que BeWork rend à votre équipe
          </h2>
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
          {RESULTS.map((r) => (
            <article key={r.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eff6ff] text-[#1d4ed8]" aria-hidden>
                <r.Icon />
              </span>
              <h3 className="mt-4 text-[0.9375rem] font-bold leading-snug text-[#0f172a]">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{r.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function IconHardHat() {
  return (
    <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 18a8 8 0 1 1 16 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 18h20M12 10V6" />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" />
    </svg>
  );
}

function IconFolderCheck() {
  return (
    <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 18V8a2 2 0 0 1 2-2h4l2 3h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9.5 14 1.75 1.75L15 12" />
    </svg>
  );
}

function IconInvoice() {
  return (
    <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3h9l4 4v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path strokeLinecap="round" d="M8.5 12.5h9M8.5 15.5h9" />
    </svg>
  );
}

function IconArchiveCheck() {
  return (
    <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16a1 1 0 0 1 1 1v2H3V5a1 1 0 0 1 1-1Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v12a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9.5 13 1.75 1.75L15 11" />
    </svg>
  );
}
