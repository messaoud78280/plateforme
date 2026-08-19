import { HOME_SECTION } from "@/components/home/homeSectionStyles";

const PROBLEMS = [
  {
    text: "Nous ressaisissons les mêmes informations dans plusieurs logiciels.",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  {
    text: "Nos documents sont éparpillés entre emails, serveurs et applications.",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
  },
  {
    text: "Nos logiciels ne communiquent pas entre eux.",
    color: "#ea580c",
    bg: "#fff7ed",
    border: "#fed7aa",
  },
  {
    text: "Je veux savoir où en sont mes chantiers sans appeler tout le monde.",
    color: "#059669",
    bg: "#ecfdf5",
    border: "#a7f3d0",
  },
  {
    text: "Notre Excel de suivi est devenu indispensable — et fragile.",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
  },
  {
    text: "Notre logiciel ne correspond pas à notre façon de travailler.",
    color: "#4f46e5",
    bg: "#eef2ff",
    border: "#c7d2fe",
  },
] as const;

export function HomeProblemsRecognition() {
  return (
    <section id="problemes" className={`${HOME_SECTION} bg-[#f8fafc]`} aria-labelledby="problems-heading">
      <div className="container-site">
        {/* Heading éditorial */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Vous vous reconnaissez ?
          </p>
          <h2
            id="problems-heading"
            className="font-display mt-3 text-balance text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#0a0a0a] sm:text-[2.25rem] md:text-[2.75rem]"
          >
            Ce que nous entendons
            <span className="mt-1 block text-slate-400">tous les jours.</span>
          </h2>
        </div>

        {/* Grille de citations */}
        <div className="mx-auto mt-10 grid max-w-5xl gap-3 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
          {PROBLEMS.map((p) => (
            <div
              key={p.text}
              className="bework-sheen group relative overflow-hidden rounded-2xl border bg-white px-6 py-6 shadow-[0_1px_4px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(15,23,42,0.10)]"
              style={{ borderColor: p.border }}
            >
              {/* Accent de coin */}
              <div
                className="absolute left-0 top-0 h-full w-1 rounded-l-2xl"
                style={{ background: p.color }}
                aria-hidden
              />
              {/* Guillemets */}
              <p
                className="font-display mb-2 text-3xl font-extrabold leading-none opacity-20"
                style={{ color: p.color }}
                aria-hidden
              >
                &ldquo;
              </p>
              <p className="text-sm font-semibold leading-relaxed text-slate-700">{p.text}</p>
              {/* Étiquette colorée */}
              <div
                className="mt-4 inline-flex h-1 w-10 rounded-full"
                style={{ background: p.color }}
                aria-hidden
              />
            </div>
          ))}
        </div>

        {/* Réponse BeWork — bloc sombre */}
        <div className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-3xl sm:mt-12">
          <div className="bework-sheen relative bg-gradient-to-br from-[#0f1e3a] via-[#1a2e52] to-[#1e3a5f] px-8 py-10 text-center sm:px-14 sm:py-14">
            {/* Halos intérieurs */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(37,99,235,0.2) 0%, transparent 65%)" }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(ellipse 50% 40% at 80% 100%, rgba(124,58,237,0.12) 0%, transparent 65%)" }}
              aria-hidden
            />
            <div className="relative">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-300/60">
                Notre réponse
              </p>
              <p className="font-display mx-auto mt-4 max-w-2xl text-balance text-[1.5rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-white sm:text-[2rem] md:text-[2.5rem]">
                C&apos;est exactement ce que BeWork cherche à résoudre.
              </p>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
                Nous construisons la plateforme autour de votre façon de travailler.
                Pas l&apos;inverse.
              </p>
              {/* Piliers inline */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {[
                  { label: "Construire", color: "#60a5fa" },
                  { label: "Connecter", color: "#c4b5fd" },
                  { label: "Automatiser", color: "#fb923c" },
                ].map((p) => (
                  <span
                    key={p.label}
                    className="rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em]"
                    style={{ borderColor: `${p.color}40`, background: `${p.color}15`, color: p.color }}
                  >
                    {p.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
