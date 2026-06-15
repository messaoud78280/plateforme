import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Building2, ClipboardList, HardHat, Landmark } from "lucide-react";

const TARGETS: {
  title: string;
  icon: LucideIcon;
  bullets: string[];
  stripe: string;
  href?: string;
  linkLabel?: string;
}[] = [
  {
    title: "PME BTP & entreprises générales",
    icon: Building2,
    bullets: [
      "Artisans structurés et PME en croissance",
      "Multi-lots, multi-sites, équipes terrain + bureau",
      "Besoin d'appui technique et administratif sans recruter",
    ],
    stripe: "from-[#1e40af] via-[#2563eb] to-[#3b82f6]",
  },
  {
    title: "Appels d'offres & marchés publics",
    icon: ClipboardList,
    bullets: [
      "Entreprises répondant aux appels d'offres",
      "Titulaires de marchés publics et accords-cadres",
      "Analyse DCE, mémoire technique, suivi marché et Chorus Pro",
    ],
    stripe: "from-[#2563eb] via-[#3b82f6] to-[#60a5fa]",
  },
  {
    title: "Conducteurs de travaux & chargés d'affaires",
    icon: HardHat,
    bullets: [
      "Assistant conducteur de travaux externalisé",
      "Suivi documentaire, relances et comptes rendus",
      "Coordination bureau-chantier et preuves de suivi",
    ],
    stripe: "from-[#3b82f6] via-[#60a5fa] to-[#93c5fd]",
  },
  {
    title: "Logement occupé & coordination MOEX / OPC",
    icon: Landmark,
    bullets: [
      "Interventions en milieu occupé et marchés sensibles",
      "MOEX / OPC qui veulent déléguer une partie documentaire",
      "Promoteurs, bailleurs et donneurs d'ordre exigeants",
    ],
    stripe: "from-[#2563eb] via-[#3b82f6] to-[#60a5fa]",
    href: "/promoteurs-immobiliers",
    linkLabel: "Promoteurs immobiliers →",
  },
];

/** Cibles — entreprises BTP, AO, marchés publics, conducteurs de travaux */
export function HomeTargetAudienceSection() {
  return (
    <section
      id="cibles-marches"
      className="scroll-mt-24 bg-transparent px-6 py-24 md:py-28"
      style={{ scrollMarginTop: "6rem" }}
      aria-labelledby="target-audience-heading"
    >
      <div className="mx-auto max-w-site">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1d4ed8] md:text-sm">
          Pour qui
        </p>
        <h2
          id="target-audience-heading"
          className="mt-2.5 max-w-3xl text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl"
        >
          Pour les entreprises BTP qui veulent sécuriser délais, dossiers et rentabilité.
        </h2>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-700">
          BeWork accompagne dirigeants, conducteurs de travaux, chargés d&apos;affaires et équipes marchés lorsque la
          préparation des dossiers, le suivi technique et administratif des chantiers, ou l&apos;exécution de marchés publics
          devient un goulet d&apos;étranglement.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-5">
          {TARGETS.map((target) => {
            const Icon = target.icon;
            return (
              <article
                key={target.title}
                className="bework-sector-example-card group/card relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 pb-6 shadow-md shadow-slate-900/[0.06] ring-1 ring-black/[0.03] transition-[transform,box-shadow,border-color,ring-color] duration-300 ease-out will-change-transform motion-safe:hover:-translate-y-1 motion-safe:hover:border-slate-300/90 motion-safe:hover:shadow-xl motion-safe:hover:shadow-slate-900/[0.1] motion-safe:hover:ring-slate-200/75 motion-reduce:transition-none md:p-6"
              >
                <div
                  className={`absolute left-5 right-5 top-0 h-[3px] rounded-b-full bg-gradient-to-r opacity-95 ${target.stripe} md:left-6 md:right-6`}
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
                      <h3 className="text-base font-bold tracking-tight text-[#1d4ed8] md:text-[1.05rem]">{target.title}</h3>
                      <div className={`mt-2 h-0.5 w-10 rounded-full bg-gradient-to-r ${target.stripe} opacity-90`} aria-hidden />
                    </div>
                  </div>

                  <ul className="mt-5 space-y-2.5 text-sm leading-snug text-slate-800 md:text-base">
                    {target.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2">
                        <span className="mt-[3px] shrink-0 font-semibold text-[#1d4ed8]" aria-hidden>
                          ✓
                        </span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  {target.href && target.linkLabel ? (
                    <Link
                      href={target.href}
                      className="mt-5 inline-flex text-sm font-semibold text-[#1d4ed8] hover:underline"
                    >
                      {target.linkLabel}
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
