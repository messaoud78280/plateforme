import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_BG_MUTED, HOME_CARD, HOME_CONTENT, HOME_SECTION } from "@/components/home/homeSectionStyles";

const MODULES = [
  { title: "Chantiers et affaires", desc: "Suivi des dossiers et contextes terrain." },
  { title: "Communication interne", desc: "Échanges liés aux chantiers et responsabilités." },
  { title: "Documents et GED", desc: "Pièces, photos et historique consultable." },
  { title: "Marchés publics et privés", desc: "Analyse collaborative des dossiers." },
  { title: "Analyse IA", desc: "CCTP, CCAP, DPGF et documents métier." },
  { title: "Comptes rendus", desc: "Préparation, suivi et extraction d’actions." },
  { title: "Tâches et validations", desc: "Actions, échéances et circuits de décision." },
  { title: "Achats et fournisseurs", desc: "Commandes, locations et livraisons." },
  { title: "Suivi financier", desc: "Situations et traçabilité financière." },
  { title: "Réserves et DOE", desc: "Contrôle des pièces et clôture documentaire." },
  { title: "Tableaux de bord", desc: "Vision synthétique pour la direction." },
  { title: "Portails externes", desc: "Clients ou sous-traitants selon configuration." },
] as const;

/** Modules regroupés — sélection lisible. */
export function HomeModulesGrid() {
  return (
    <section id="modules" className={`${HOME_SECTION} ${HOME_BG_MUTED}`} aria-labelledby="modules-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="modules-heading"
          eyebrow="Modules"
          title="Composez la plateforme adaptée à votre entreprise"
          lead="À partir du socle BeWork, sélectionnez les modules, les outils IA et les workflows correspondant à votre organisation."
        />
        <ul className={`${HOME_CONTENT} grid gap-4 sm:grid-cols-2 lg:grid-cols-3`}>
          {MODULES.map((m) => (
            <li key={m.title} className={`${HOME_CARD} p-5`}>
              <h3 className="text-base font-bold text-[#0f172a]">{m.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{m.desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
