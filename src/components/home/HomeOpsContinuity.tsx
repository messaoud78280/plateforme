import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_BG_WHITE, HOME_CONTENT, HOME_SECTION } from "@/components/home/homeSectionStyles";

const OPS_ITEMS = [
  "Préparation du chantier",
  "Documents et photos",
  "Tâches et comptes rendus",
  "Fournisseurs et sous-traitants",
  "Situations de travaux",
  "Réserves et DOE",
  "Synthèses de direction",
] as const;

/** Continuité étude → exécution → réception. */
export function HomeOpsContinuity() {
  return (
    <section id="suivi-chantier" className={`${HOME_SECTION} ${HOME_BG_WHITE}`} aria-labelledby="ops-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="ops-heading"
          eyebrow="Suivi opérationnel"
          title={<>Du marché remporté jusqu&apos;à la réception du chantier</>}
          lead="La plateforme accompagne la continuité entre la phase d'étude et l'exécution — un environnement unique, pas une collection d'outils isolés."
        />
        <ol className={`${HOME_CONTENT} mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 md:gap-3`}>
          {OPS_ITEMS.map((item, i) => (
            <li key={item} className="flex items-center gap-2 md:gap-3">
              <span className="rounded-full border border-slate-200 bg-[#f8fafc] px-3.5 py-2 text-sm font-semibold text-[#0f172a]">
                {item}
              </span>
              {i < OPS_ITEMS.length - 1 ? (
                <span className="hidden text-slate-300 sm:inline" aria-hidden>
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
