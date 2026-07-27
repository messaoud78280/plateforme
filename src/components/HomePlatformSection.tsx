import { HomeClientSpacePreview } from "@/components/HomeClientSpacePreview";

const BENEFITS = [
  "Un contexte clair pour chaque demande",
  "Les documents utiles associés à la mission",
  "Une prochaine action identifiée",
  "Un suivi visible sans multiplier les appels",
] as const;

/** Section « plateforme » — l’espace de mission, pas un argumentaire logiciel autonome. */
export function HomePlatformSection() {
  return (
    <section id="espace-mission" className="relative bg-transparent px-6 py-14 md:py-20 lg:py-24" style={{ scrollMarginTop: "6rem" }}>
      <div className="container-site">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <h2 className="font-display text-balance text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.02em] text-[#0f172a] md:text-[2.25rem]">
              Un assistant travaux, avec un espace de suivi par mission
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-700 md:text-lg">
              Votre Beworker réalise le travail convenu. L&apos;espace de mission vous permet de transmettre les
              éléments, consulter l&apos;avancement et identifier ce qui nécessite votre intervention.
            </p>

            <ul className="mt-6 space-y-3">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3 text-[0.9375rem] font-medium leading-snug text-slate-800">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-[#1d4ed8]" aria-hidden>
                    <IconCheck />
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-sm leading-relaxed text-slate-700">
              Les outils d&apos;intelligence artificielle facilitent le classement, la recherche, les synthèses et la
              préparation des livrables. Chaque mission reste suivie par un Beworker.
            </p>
          </div>

          <div className="lg:pl-4">
            <HomeClientSpacePreview className="max-w-md" />
          </div>
        </div>
      </div>
    </section>
  );
}

function IconCheck() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
    </svg>
  );
}
