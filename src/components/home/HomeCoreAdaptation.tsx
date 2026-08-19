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
    <section id="socle" className={`${HOME_SECTION} bg-[#fafafa]`} aria-labelledby="core-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="core-heading"
          title={
            <>
              Pas votre entreprise qui s&apos;adapte au logiciel.
              <span className="mt-2 block text-slate-500">Le logiciel qui s&apos;adapte à votre entreprise.</span>
            </>
          }
          lead="Un socle commun, configuré selon vos métiers, vos équipes et votre organisation."
        />

        <div className={`${HOME_CONTENT} mx-auto max-w-lg`}>
          <ul className="space-y-0" aria-label="Composantes de votre environnement">
            {LAYERS.map((layer, i) => (
              <li key={layer.label}>
                <div
                  className="flex items-center gap-4 rounded-xl border bg-white px-5 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_2px_8px_rgba(15,23,42,0.08)]"
                  style={{ borderColor: `${layer.color}30` }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white text-sm font-bold shadow-sm"
                    style={{ background: layer.color }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-base font-extrabold tracking-tight text-[#0a0a0a]">
                      {layer.label}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{layer.desc}</p>
                  </div>
                </div>
                {i < LAYERS.length - 1 && (
                  <div className="my-1 flex justify-center" aria-hidden>
                    <span className="text-slate-300 text-sm font-medium">+</span>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center gap-3" aria-hidden>
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-sm font-semibold text-slate-400">=</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="mt-3 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f1e3a] to-[#1e3a5f] px-6 py-8 text-center shadow-[0_8px_24px_rgba(30,58,95,0.25)]">
            <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.15)_0%,transparent_60%)]" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">Résultat</p>
            <p className="font-display mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Votre environnement
            </p>
            <p className="mt-2 text-sm text-white/60">
              Unique à votre entreprise. Construit pour durer.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
