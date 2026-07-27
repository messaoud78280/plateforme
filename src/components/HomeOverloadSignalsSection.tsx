import type { JSX } from "react";

const BLUE = "#2563eb";

const SIGNALS: { title: string; body: string; Icon: () => JSX.Element }[] = [
  {
    title: "Plusieurs chantiers en parallèle",
    body: "Comptes rendus, documents et relances s’accumulent entre deux réunions.",
    Icon: IconLayers,
  },
  {
    title: "Un conducteur surchargé",
    body: "Les journées se passent sur le terrain et les dossiers sont traités le soir.",
    Icon: IconClock,
  },
  {
    title: "Un démarrage à préparer",
    body: "Planning, sous-traitants, fiches techniques et documents doivent être organisés avant l’intervention.",
    Icon: IconFlag,
  },
  {
    title: "Plusieurs appels d’offres",
    body: "Les candidatures et les mémoires doivent avancer pendant que les chantiers continuent.",
    Icon: IconFolder,
  },
  {
    title: "Des situations bloquées",
    body: "Les justificatifs manquent et la facturation risque d’être retardée.",
    Icon: IconAlert,
  },
  {
    title: "Un DOE à clôturer",
    body: "Le chantier est terminé, mais les documents continuent de mobiliser l’équipe.",
    Icon: IconArchive,
  },
];

/** Section « surcharge » — reconnaissance immédiate du problème, sans jargon AO. */
export function HomeOverloadSignalsSection() {
  return (
    <section id="surcharge" className="relative bg-transparent px-6 py-14 md:py-20 lg:py-24" style={{ scrollMarginTop: "6rem" }}>
      <div className="container-site">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-balance text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.02em] text-[#0f172a] md:text-[2.25rem]">
            Votre équipe travaux commence à saturer&nbsp;?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-700 md:text-lg">
            Le besoin de renfort apparaît lorsqu&apos;un conducteur récupère un chantier supplémentaire, qu&apos;un
            démarrage approche ou que les dossiers commencent déjà à prendre du retard.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {SIGNALS.map((signal) => (
            <article
              key={signal.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:p-6"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eff6ff]"
                style={{ color: BLUE }}
                aria-hidden
              >
                <signal.Icon />
              </span>
              <h3 className="mt-4 text-base font-bold leading-snug text-[#0f172a]">{signal.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{signal.body}</p>
            </article>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-base font-medium leading-relaxed text-slate-800">
          Votre conducteur conserve les décisions, les équipes et le pilotage. BeWork fait avancer une partie du
          travail qui l&apos;empêche de se concentrer sur le terrain.
        </p>
      </div>
    </section>
  );
}

function IconLayers() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 13 9 5 9-5" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v6l4 2" />
    </svg>
  );
}

function IconFlag() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 21V4m0 1 13 2-6 5-7 1" />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 18V8a2 2 0 0 1 2-2h4l2 3h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4M12 17h.01M10.3 3.9 2.7 17a1.6 1.6 0 0 0 1.4 2.4h15.8a1.6 1.6 0 0 0 1.4-2.4L13.7 3.9a1.6 1.6 0 0 0-2.8 0Z" />
    </svg>
  );
}

function IconArchive() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M4 7v12a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7M9 12h6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16a1 1 0 0 1 1 1v2H3V5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}
