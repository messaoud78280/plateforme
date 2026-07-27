import type { JSX } from "react";

const PHASES: {
  id: string;
  eyebrow: string;
  title: string;
  missions: string[];
  result: string;
  Icon: () => JSX.Element;
}[] = [
  {
    id: "avant-chantier",
    eyebrow: "Avant le chantier",
    title: "Préparer sans désorganiser l’équipe",
    missions: [
      "Analyse et classement du DCE",
      "Candidatures",
      "Mémoire technique",
      "Consultations",
      "Planning",
      "Documents de démarrage",
    ],
    result: "L’équipe conserve les prix, les choix techniques et la préparation réelle des travaux.",
    Icon: IconClipboard,
  },
  {
    id: "pendant-chantier",
    eyebrow: "Pendant le chantier",
    title: "Tenir les dossiers pendant que le conducteur tient le terrain",
    missions: [
      "Comptes rendus",
      "Tableaux d’actions",
      "Relances",
      "Fiches techniques",
      "Situations",
      "Suivi documentaire",
    ],
    result: "Les dossiers avancent régulièrement au lieu d’être traités uniquement dans l’urgence.",
    Icon: IconHardHat,
  },
  {
    id: "fin-chantier",
    eyebrow: "Fin du chantier",
    title: "Clôturer sans laisser les dossiers s’accumuler",
    missions: ["Réserves", "Récupération des documents", "Préparation du DOE", "Facturation", "Relances", "Archivage"],
    result: "La clôture est mieux préparée et les pièces manquantes sont suivies plus tôt.",
    Icon: IconCheckShield,
  },
];

/** Section « avant / pendant / après » — un renfort à chaque moment où la charge augmente. */
export function HomeLifecycleSection() {
  return (
    <section id="renfort-chaque-moment" className="relative bg-transparent px-6 py-14 md:py-20 lg:py-24" style={{ scrollMarginTop: "6rem" }}>
      <div className="container-site">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-balance text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.02em] text-[#0f172a] md:text-[2.25rem]">
            Un renfort à chaque moment où la charge augmente
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-700 md:text-lg">
            Confiez une mission précise, un chantier ou une partie régulière de votre suivi.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl gap-5 lg:grid-cols-3">
          {PHASES.map((phase) => (
            <article key={phase.id} id={phase.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eff6ff] text-[#1d4ed8]" aria-hidden>
                <phase.Icon />
              </span>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-[#1d4ed8]">{phase.eyebrow}</p>
              <h3 className="mt-1.5 text-lg font-bold leading-snug text-[#0f172a]">{phase.title}</h3>
              <ul className="mt-4 flex-1 space-y-1.5">
                {phase.missions.map((m) => (
                  <li key={m} className="flex items-start gap-2 text-sm leading-snug text-slate-700">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" aria-hidden />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-slate-100 pt-4 text-sm font-medium leading-snug text-slate-800">
                {phase.result}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function IconClipboard() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
    </svg>
  );
}

function IconHardHat() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 18a8 8 0 1 1 16 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 18h20M12 10V6" />
    </svg>
  );
}

function IconCheckShield() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V6l-8-4-8 4v6c0 6 8 10 8 10Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
    </svg>
  );
}
