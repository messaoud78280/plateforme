import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_BG_MUTED, HOME_CARD, HOME_CONTENT, HOME_SECTION } from "@/components/home/homeSectionStyles";

const PROBLEMS = [
  {
    title: "Informations dispersées",
    text: "Emails, messages, appels et dossiers partagés : chacun possède une partie de l’information, mais personne n’en a une vision complète.",
    icon: "scatter" as const,
  },
  {
    title: "Documents et marchés complexes",
    text: "CCTP, CCAP, plans, comptes rendus et pièces financières sont difficiles à croiser, analyser et retrouver.",
    icon: "docs" as const,
  },
  {
    title: "Rupture entre bureau et chantier",
    text: "Les décisions, validations et changements ne circulent pas toujours clairement entre les équipes.",
    icon: "bridge" as const,
  },
  {
    title: "Pilotage insuffisant",
    text: "Les tâches, échéances, risques et blocages ne remontent pas dans une synthèse claire pour la direction.",
    icon: "radar" as const,
  },
] as const;

/** Difficultés terrain — quatre problèmes structurants. */
export function HomeProblemsDispersion() {
  return (
    <section id="problemes" className={`${HOME_SECTION} ${HOME_BG_MUTED}`} aria-labelledby="problems-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="problems-heading"
          title={
            <>
              Vos équipes avancent.
              <span className="mt-1 block text-slate-600">L&apos;information reste dispersée.</span>
            </>
          }
          lead="Emails, documents, messages et décisions sont répartis entre plusieurs outils. BeWork les réunit dans un environnement unique."
        />

        <ul className={`${HOME_CONTENT} mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:gap-6`}>
          {PROBLEMS.map((p) => (
            <li key={p.title} className={`group ${HOME_CARD} p-4 hover:-translate-y-0.5 sm:p-6 md:p-7`}>
              <div className="flex items-start gap-3 sm:gap-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#1d4ed8]/15 bg-[#eff6ff] text-[#1d4ed8] transition group-hover:bg-[#dbeafe] sm:h-11 sm:w-11"
                  aria-hidden
                >
                  <ProblemIcon id={p.icon} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold tracking-tight text-[#0f172a]">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem] md:leading-relaxed">
                    {p.text}
                  </p>
                </div>
              </div>
              <div
                className="mt-5 h-0.5 w-10 rounded-full bg-[#1d4ed8]/30 transition group-hover:w-14 group-hover:bg-[#1d4ed8]/55"
                aria-hidden
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ProblemIcon({ id }: { id: (typeof PROBLEMS)[number]["icon"] }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none" as const };
  switch (id) {
    case "scatter":
      return (
        <svg {...common} aria-hidden>
          <circle cx="6" cy="7" r="2" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="17" cy="6" r="2" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="8" cy="17" r="2" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="18" cy="16" r="2" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M8 8.5 15.5 7M8.8 15.5 16.2 14.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeDasharray="2 3"
          />
        </svg>
      );
    case "docs":
      return (
        <svg {...common} aria-hidden>
          <path
            d="M8 4h7l4 4v12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.55"
            strokeLinejoin="round"
          />
          <path d="M15 4v4h4M10 12h6M10 16h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M5 8v11a1 1 0 0 0 1 1h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
        </svg>
      );
    case "bridge":
      return (
        <svg {...common} aria-hidden>
          <path d="M4 17h16M7 17V10M17 17V10" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
          <path d="M5 10h14" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
          <path
            d="M9.5 10 12 7.5 14.5 10"
            stroke="currentColor"
            strokeWidth="1.45"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="7" cy="19.5" r="1.25" fill="currentColor" />
          <circle cx="17" cy="19.5" r="1.25" fill="currentColor" />
        </svg>
      );
    case "radar":
      return (
        <svg {...common} aria-hidden>
          <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.55" />
          <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />
          <path d="M12 12 17 7.5" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
          <circle cx="12" cy="12" r="1.35" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}
