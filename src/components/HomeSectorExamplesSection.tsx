import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Building2, HardHat, Scale, Briefcase } from "lucide-react";

const SECTORS: {
  title: string;
  href: string;
  cta: string;
  icon: LucideIcon;
  bullets: string[];
  stripe: string;
}[] = [
  {
    title: "BTP",
    href: "/assistant-administratif-btp",
    cta: "Voir le périmètre BTP",
    icon: Scale,
    bullets: [
      "Devis, facturation et situations de travaux",
      "DICT, autorisations et dossiers chantier",
      "Fournisseurs, livraisons et coordination planning",
    ],
    stripe: "from-[#1e40af] via-[#2563eb] to-[#3b82f6]",
  },
  {
    title: "Artisanat & sous-traitance",
    href: "/assistant-administratif-btp",
    cta: "Voir le périmètre artisan",
    icon: HardHat,
    bullets: ["Réponses aux marchés", "Dossiers techniques", "Coordination sous-traitants"],
    stripe: "from-[#2563eb] via-[#3b82f6] to-[#60a5fa]",
  },
  {
    title: "PME",
    href: "/assistant-administratif-pme",
    cta: "Voir le périmètre",
    icon: Building2,
    bullets: [
      "Devis et factures clients",
      "Suivi des commandes",
      "Relances et administratif courant",
    ],
    stripe: "from-[#3b82f6] via-[#60a5fa] to-[#93c5fd]",
  },
  {
    title: "Indépendants",
    href: "/assistant-administratif-distance",
    cta: "Voir le périmètre",
    icon: Briefcase,
    bullets: ["Facturation", "Agenda et rendez-vous", "Recherches fournisseurs"],
    stripe: "from-[#2563eb] via-[#3b82f6] to-[#60a5fa]",
  },
];

/** Exemples de missions par secteur — cartes plates (fond blanc), accent bleu BeWork, pas d’effet métallique */
export function HomeSectorExamplesSection() {
  return (
    <section
      id="exemples-missions"
      className="scroll-mt-24 bg-transparent px-6 py-24 md:py-28"
      style={{ scrollMarginTop: "6rem" }}
    >
      <div className="mx-auto max-w-site">
        <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
          Exemples de missions par secteur
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-700">
          Le BTP est notre socle — nous accompagnons aussi les PME et les indépendants qui partagent les mêmes exigences
          de délais, de chantier et de rigueur documentaire.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {SECTORS.map((sector) => {
            const Icon = sector.icon;
            return (
              <article
                key={sector.title}
                className="bework-sector-example-card group/card relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 pb-6 shadow-md shadow-slate-900/[0.06] ring-1 ring-black/[0.03] transition-[transform,box-shadow,border-color,ring-color] duration-300 ease-out will-change-transform motion-safe:hover:-translate-y-1 motion-safe:hover:border-slate-300/90 motion-safe:hover:shadow-xl motion-safe:hover:shadow-slate-900/[0.1] motion-safe:hover:ring-slate-200/75 motion-reduce:transition-none md:p-6"
              >
                <div
                  className={`absolute left-5 right-5 top-0 h-[3px] rounded-b-full bg-gradient-to-r opacity-95 ${sector.stripe} md:left-6 md:right-6`}
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] rounded-t-full bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] opacity-0 transition-opacity duration-300 motion-safe:group-hover/card:opacity-90"
                  aria-hidden
                />

                <div className="relative pt-4">
                  <div className="flex items-start gap-3.5">
                    <span
                      className="bework-sector-example-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1d4ed8] text-white shadow-sm shadow-blue-900/20 ring-2 ring-[#eff6ff]"
                      aria-hidden
                    >
                      <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={2.25} />
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <h3 className="text-base font-bold tracking-tight text-[#1d4ed8] md:text-[1.05rem]">{sector.title}</h3>
                      <div className={`mt-2 h-0.5 w-10 rounded-full bg-gradient-to-r ${sector.stripe} opacity-90`} aria-hidden />
                    </div>
                  </div>

                  <ul className="mt-4 space-y-2.5 text-[13px] leading-snug text-slate-600 md:text-sm">
                    {sector.bullets.map((line) => (
                      <li key={line} className="flex gap-2">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d4ed8] ring-2 ring-blue-100/80"
                          aria-hidden
                        />
                        <span className="min-w-0">{line}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={sector.href}
                    className="mt-5 inline-flex items-center gap-1 text-[13px] font-semibold text-[#1d4ed8] transition-colors hover:text-[#1e40af] md:text-sm"
                  >
                    {sector.cta}
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
