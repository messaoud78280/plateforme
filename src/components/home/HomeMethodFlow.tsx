import { HOME_SECTION } from "@/components/home/homeSectionStyles";

const STEPS = [
  {
    num: "01",
    title: "Comprendre",
    text: "Votre organisation, vos métiers, vos équipes et vos logiciels.",
    color: "#2563eb",
    light: "#eff6ff",
    border: "#bfdbfe",
  },
  {
    num: "02",
    title: "Concevoir",
    text: "Votre plateforme, vos modules et vos processus.",
    color: "#4f46e5",
    light: "#eef2ff",
    border: "#c7d2fe",
  },
  {
    num: "03",
    title: "Connecter",
    text: "Étudier les possibilités d'intégration avec votre environnement existant.",
    color: "#7c3aed",
    light: "#f5f3ff",
    border: "#ddd6fe",
  },
  {
    num: "04",
    title: "Construire",
    text: "Développer votre environnement BeWork.",
    color: "#ea580c",
    light: "#fff7ed",
    border: "#fed7aa",
  },
  {
    num: "05",
    title: "Déployer",
    text: "Mettre la solution en place dans votre entreprise.",
    color: "#d97706",
    light: "#fffbeb",
    border: "#fde68a",
  },
  {
    num: "06",
    title: "Former",
    text: "Former réellement les collaborateurs jusqu'à l'utilisation quotidienne.",
    color: "#059669",
    light: "#ecfdf5",
    border: "#a7f3d0",
  },
  {
    num: "07",
    title: "Faire évoluer",
    text: "Faire évoluer la plateforme avec votre entreprise.",
    color: "#0d9488",
    light: "#f0fdfa",
    border: "#99f6e4",
  },
] as const;

export function HomeMethodFlow() {
  return (
    <section id="approche" className={`${HOME_SECTION} bg-white`} aria-labelledby="method-heading">
      <div className="container-site">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Notre méthode
          </p>
          <h2
            id="method-heading"
            className="font-display mt-3 text-balance text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#0a0a0a] sm:text-[2.25rem] md:text-[2.75rem]"
          >
            Nous ne livrons pas simplement un logiciel.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-600">
            Nous accompagnons vos équipes jusqu&apos;à son utilisation réelle au quotidien.
          </p>
        </div>

        {/* Timeline */}
        <div className="mx-auto mt-12 max-w-2xl sm:mt-14 md:mt-16">
          <ol className="relative">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative flex gap-5 pb-6 last:pb-0">
                {/* Ligne verticale */}
                {i < STEPS.length - 1 && (
                  <span
                    className="absolute left-[1.375rem] top-11 bottom-0 w-0.5 rounded-full"
                    style={{ background: `linear-gradient(to bottom, ${s.color}60, ${STEPS[i + 1]!.color}40)` }}
                    aria-hidden
                  />
                )}
                {/* Cercle numéroté */}
                <div
                  className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white text-xs font-extrabold shadow-sm"
                  style={{ background: s.color }}
                >
                  {s.num}
                </div>
                {/* Carte contenu */}
                <div
                  className="mb-1 flex-1 rounded-xl border px-5 py-4"
                  style={{ borderColor: s.border, background: s.light }}
                >
                  <p
                    className="font-display text-base font-extrabold tracking-tight"
                    style={{ color: s.color }}
                  >
                    {s.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
