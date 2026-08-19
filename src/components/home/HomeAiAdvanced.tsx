import { HOME_SECTION } from "@/components/home/homeSectionStyles";

const CAPABILITIES = [
  {
    label: "Analyse documentaire",
    desc: "Lire, synthétiser et extraire les informations utiles depuis vos documents BTP.",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
    icon: (
      <svg aria-hidden viewBox="0 0 20 20" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="2" width="14" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 7h6M7 10h6M7 13h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Recherche intelligente",
    desc: "Retrouver n'importe quelle information dans vos dossiers, sans connaître l'emplacement exact.",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    icon: (
      <svg aria-hidden viewBox="0 0 20 20" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8.5" cy="8.5" r="5" strokeLinecap="round" />
        <path d="M17 17l-3.5-3.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Assistants spécialisés",
    desc: "Assistants IA dédiés à vos métiers BTP : devis, comptes rendus, CCTP, DOE.",
    color: "#0d9488",
    bg: "#f0fdfa",
    border: "#99f6e4",
    icon: (
      <svg aria-hidden viewBox="0 0 20 20" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5">
        <path d="M10 2a6 6 0 0 1 6 6c0 2.4-1.4 4.5-3.5 5.5l-.5 2.5h-4l-.5-2.5A6.002 6.002 0 0 1 10 2Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7.5 16.5h5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Automatisations complexes",
    desc: "Workflows avancés sur mesure pour vos processus les plus spécifiques.",
    color: "#ea580c",
    bg: "#fff7ed",
    border: "#fed7aa",
    icon: (
      <svg aria-hidden viewBox="0 0 20 20" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5">
        <path d="M5 10h10M13 7l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="4" cy="10" r="2" />
      </svg>
    ),
  },
  {
    label: "Applications métier",
    desc: "Outils spécifiques que les logiciels standards ne couvrent pas dans votre activité.",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
    icon: (
      <svg aria-hidden viewBox="0 0 20 20" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="16" height="13" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 17h6" strokeLinecap="round" />
        <path d="M10 13v4" strokeLinecap="round" />
        <path d="M6 7h8M6 10h5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Traitement de données",
    desc: "Exploiter vos données chantier, financières et opérationnelles pour des décisions éclairées.",
    color: "#4f46e5",
    bg: "#eef2ff",
    border: "#c7d2fe",
    icon: (
      <svg aria-hidden viewBox="0 0 20 20" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 14l4-4 3 3 3-5 4 3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="2" y="2" width="16" height="16" rx="2" />
      </svg>
    ),
  },
] as const;

export function HomeAiAdvanced() {
  return (
    <section id="solutions-avancees" className={`${HOME_SECTION} bg-[#f8fafc]`} aria-labelledby="ai-heading">
      <div className="container-site">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7c3aed]">
              Solutions sur mesure
            </p>
            <h2
              id="ai-heading"
              className="font-display mt-3 text-balance text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#0a0a0a] sm:text-[2.25rem] md:text-[2.75rem]"
            >
              Et si votre besoin va plus loin&nbsp;?
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Certaines entreprises ont des besoins qu&apos;aucun logiciel standard ne couvre.{" "}
              <strong className="font-semibold text-[#0a0a0a]">BeWork peut développer les outils spécifiques dont vous avez besoin.</strong>
            </p>
          </div>

          {/* Grille de capacités avec SVG icons */}
          <div className="mt-10 grid gap-3 sm:mt-12 sm:grid-cols-2 md:grid-cols-3">
            {CAPABILITIES.map((cap) => (
              <div
                key={cap.label}
                className="bework-sheen group flex gap-4 overflow-hidden rounded-2xl border bg-white px-5 py-5 shadow-[0_1px_4px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(15,23,42,0.10)]"
                style={{ borderColor: cap.border }}
              >
                {/* Icône colorée */}
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform duration-200 group-hover:scale-105"
                  style={{ background: cap.bg, color: cap.color }}
                >
                  {cap.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#0a0a0a]">{cap.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{cap.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Message clé — bloc sombre */}
          <div className="mt-8 bework-sheen overflow-hidden rounded-3xl sm:mt-10">
            <div className="relative bg-gradient-to-br from-[#0f1e3a] via-[#1a2e52] to-[#1e3a5f] px-8 py-10 text-center sm:px-12 sm:py-12">
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(124,58,237,0.25) 0%, transparent 65%)" }}
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(ellipse 50% 40% at 80% 100%, rgba(37,99,235,0.15) 0%, transparent 65%)" }}
                aria-hidden
              />
              <div className="relative">
                <p className="font-display text-xl font-extrabold tracking-tight text-white sm:text-2xl md:text-3xl">
                  Vous imaginez. Nous étudions comment le construire.
                </p>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
                  Nous utilisons la technologie adaptée au problème à résoudre.{" "}
                  <strong className="font-semibold text-white/80">
                    L&apos;IA n&apos;est pas le produit. C&apos;est l&apos;un des outils que nous pouvons utiliser pour construire la bonne solution.
                  </strong>
                </p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  {[
                    { label: "Sur mesure", color: "#c4b5fd" },
                    { label: "Valeur opérationnelle", color: "#93c5fd" },
                    { label: "Technologie adaptée", color: "#6ee7b7" },
                  ].map((tag) => (
                    <span
                      key={tag.label}
                      className="rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em]"
                      style={{ borderColor: `${tag.color}40`, background: `${tag.color}15`, color: tag.color }}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
