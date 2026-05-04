import {
  BriefcaseBusiness,
  HardHat,
  Mail,
  ShieldCheck,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const rows: {
  icon: LucideIcon;
  title: string;
  text: string;
}[] = [
  {
    icon: BriefcaseBusiness,
    title: "Administratif",
    text: "Devis clients, facturation, situations de travaux, suivi client et avenants.",
  },
  {
    icon: Mail,
    title: "Gestion",
    text: "Boîte mail, classement, relances, structuration des dossiers et des priorités.",
  },
  {
    icon: HardHat,
    title: "Chantier & démarches",
    text: "DICT, autorisations, déclarations, suivi administratif réglementaire.",
  },
  {
    icon: Truck,
    title: "Logistique",
    text: "Commandes fournisseurs, livraisons, coordination avec le planning chantier.",
  },
  {
    icon: Wrench,
    title: "Moyens",
    text: "Recherche matériel, engins et véhicules, devis comparés, réservations.",
  },
  {
    icon: Users,
    title: "Organisation",
    text: "Planning équipes, coordination sous-traitants, structuration des flux.",
  },
  {
    icon: ShieldCheck,
    title: "Litiges & dossiers sensibles",
    text: "Relances fermes, suivi des mises en demeure, dossiers administratifs complexes.",
  },
];

/** Tableau d’expertise BTP — fond transparent pour laisser suivre la courbe métallique globale (#page hero) */
export function ExpertiseTableSection() {
  return (
    <section
      id="notre-expertise"
      className="relative scroll-mt-28 overflow-hidden bg-transparent px-6 pb-14 pt-14 md:scroll-mt-32 md:pb-16 md:pt-18 lg:pt-22"
      aria-labelledby="expertise-table-heading"
    >
      {/* Renfort droit (lusible sur la zone claire globale), cohérent avec Preuve & crédibilité */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[min(38%,18rem)] rounded-l-[88px] bg-gradient-to-l from-slate-200/30 via-slate-100/15 to-transparent opacity-[0.42] md:w-[min(36%,22rem)] md:rounded-l-[110px] md:opacity-35"
      />

      <div className="relative z-[1] mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-8 md:gap-9 lg:flex-row lg:items-start lg:justify-between lg:gap-12 xl:gap-14">
          <header className="max-w-xl shrink-0 lg:max-w-[min(22rem,36vw)] lg:pt-0.5 xl:max-w-[24rem]">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#1d4ed8] md:text-[12px]">
              Notre expertise
            </p>
            <h2
              id="expertise-table-heading"
              className="mt-2.5 font-sans text-[1.5rem] font-bold leading-[1.25] tracking-tight text-[#0f172a] md:text-3xl lg:text-[2rem]"
            >
              <span className="block">Ce que nous prenons en charge</span>
              <span className="block">— pensé pour le BTP.</span>
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600 md:mt-4 lg:max-w-none md:text-base">
              <span className="block">Une organisation claire pour structurer votre activité</span>
              <span className="block">sans vous ralentir sur le terrain.</span>
            </p>
          </header>

          <div className="min-w-0 w-full lg:flex-1">
          <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_10px_32px_-16px_rgba(15,23,42,0.1)] ring-1 ring-slate-100/80">
          <div className="hidden bg-[#0f172a] text-white md:grid md:grid-cols-[minmax(0,12.5rem)_minmax(0,1fr)]">
            <div className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/95 lg:px-5">
              Domaines
            </div>
            <div className="border-l border-white/10 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/95 lg:px-5">
              Ce que nous prenons en charge
            </div>
          </div>

          <div className="divide-y divide-slate-200/90">
            {rows.map((row, index) => {
              const Icon = row.icon;
              return (
                <div
                  key={row.title}
                  className={`grid grid-cols-1 md:grid-cols-[minmax(0,12.5rem)_minmax(0,1fr)] ${
                    index % 2 === 0 ? "bg-white" : "bg-slate-50/80"
                  }`}
                >
                  <div className="flex items-start gap-2.5 px-3 py-3 md:items-center md:gap-3 md:px-4 md:py-3.5 lg:px-5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#eff6ff] text-[#1d4ed8] md:h-8 md:w-8"
                      aria-hidden
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <p className="pt-[1px] text-[13px] font-semibold leading-snug text-[#0f172a] md:pt-0 md:text-[14px]">
                      {row.title}
                    </p>
                  </div>
                  <div className="border-t border-slate-200/80 px-3 pb-3 pt-2.5 text-[13px] leading-relaxed text-slate-600 md:border-l md:border-t-0 md:px-4 md:py-3.5 md:text-[14px] md:leading-relaxed lg:px-5">
                    {row.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
          </div>
        </div>
      </div>
    </section>
  );
}
