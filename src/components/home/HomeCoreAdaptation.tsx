import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_CONTENT, HOME_SECTION } from "@/components/home/homeSectionStyles";

const LAYERS = [
  { label: "Socle BeWork", color: "#2563eb", desc: "La fondation technique et métier" },
  { label: "Vos modules", color: "#4f46e5", desc: "Chantiers, documents, planning, finance…" },
  { label: "Vos rôles", color: "#7c3aed", desc: "Direction, conducteur, administratif…" },
  { label: "Vos processus", color: "#9333ea", desc: "Vos façons de travailler" },
  { label: "Vos logiciels", color: "#a855f7", desc: "Outils déjà utilisés, connectés si possible" },
  { label: "Vos automatisations", color: "#ea580c", desc: "Actions répétitives supprimées" },
  { label: "Vos adaptations métier", color: "#d97706", desc: "Spécificités de votre entreprise" },
] as const;

export function HomeCoreAdaptation() {
  return (
    <section id="socle" className={`${HOME_SECTION} bg-white`} aria-labelledby="core-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="core-heading"
          title={
            <>
              Pas votre entreprise qui s&apos;adapte au logiciel.
              <span className="mt-2 block text-slate-400">Le logiciel qui s&apos;adapte à votre entreprise.</span>
            </>
          }
          lead="Un socle commun, configuré selon vos métiers, vos équipes et votre organisation."
        />

        <div className={`${HOME_CONTENT} mx-auto max-w-4xl`}>
          <div className="grid gap-8 md:grid-cols-[1fr_1fr] md:gap-10 md:items-start">
            {/* Colonne gauche — pile de couches */}
            <div>
              <ul className="space-y-0" aria-label="Composantes de votre environnement">
                {LAYERS.map((layer, i) => (
                  <li key={layer.label}>
                    <div
                      className="bework-sheen group flex items-center gap-4 rounded-xl border bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_3px_12px_rgba(15,23,42,0.09)]"
                      style={{ borderColor: `${layer.color}30` }}
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white text-xs font-extrabold shadow-sm"
                        style={{ background: layer.color }}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-sm font-extrabold tracking-tight text-[#0a0a0a]">
                          {layer.label}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{layer.desc}</p>
                      </div>
                      {/* Trait coloré à droite au hover */}
                      <div
                        className="h-5 w-0.5 rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                        style={{ backgroundColor: layer.color }}
                        aria-hidden
                      />
                    </div>
                    {i < LAYERS.length - 1 && (
                      <div className="my-1 flex items-center gap-2 pl-10" aria-hidden>
                        <svg className="h-3 w-3 text-slate-300" viewBox="0 0 12 12" fill="none">
                          <path d="M6 0v12M3 9l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Colonne droite — résultat sticky */}
            <div className="flex flex-col gap-5 md:sticky md:top-24">
              {/* Signe égal */}
              <div className="flex items-center gap-3" aria-hidden>
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                <span className="font-display text-2xl font-extrabold text-slate-300">=</span>
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              </div>

              {/* Bloc résultat */}
              <div className="bework-sheen relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f1e3a] via-[#1a2e52] to-[#1e3a5f] px-7 py-10 text-center shadow-[0_12px_40px_rgba(15,30,58,0.30)]">
                {/* Halos */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(37,99,235,0.25) 0%, transparent 65%)" }}
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ background: "radial-gradient(ellipse 60% 40% at 80% 100%, rgba(124,58,237,0.15) 0%, transparent 65%)" }}
                  aria-hidden
                />
                <div className="relative">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-300/50">
                    Résultat
                  </p>
                  <p className="font-display mt-3 text-[2rem] font-extrabold tracking-tight text-white sm:text-[2.5rem]">
                    Votre environnement
                  </p>
                  <p className="mt-3 text-sm text-white/55">
                    Unique à votre entreprise.
                    <br />
                    Construit pour durer.
                  </p>
                </div>
              </div>

              {/* Message complémentaire */}
              <div className="bework-sheen rounded-2xl border border-slate-100 bg-[#f8fafc] p-5">
                <p className="text-sm font-semibold leading-relaxed text-slate-700">
                  Chaque entreprise BTP fonctionne différemment. BeWork ne vous impose pas une méthode. Il s&apos;adapte à la vôtre.
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Lors du déploiement, nous configurons la plateforme avec vous — rôles, processus, automatisations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
