const MODULES = [
  { title: "Chantiers et affaires", desc: "Suivi des dossiers et contextes terrain." },
  { title: "Communication interne", desc: "Échanges liés aux chantiers et responsabilités." },
  { title: "Tâches et validations", desc: "Actions, échéances et circuits de décision." },
  { title: "Documents et GED", desc: "Pièces, photos et historique consultable." },
  { title: "Marchés publics et privés", desc: "Analyse collaborative des dossiers." },
  { title: "Comptes rendus", desc: "Préparation, suivi et extraction d’actions." },
  { title: "Achats et fournisseurs", desc: "Commandes, locations et livraisons." },
  { title: "Situations et suivi financier", desc: "Préparation et traçabilité des situations." },
  { title: "Réserves et DOE", desc: "Contrôle des pièces et clôture documentaire." },
  { title: "Pilotage et tableaux de bord", desc: "Vision synthétique pour la direction." },
  { title: "Assistants IA", desc: "Actions métier configurables selon vos usages." },
  { title: "Portails partenaires", desc: "Clients ou sous-traitants selon configuration." },
] as const;

/** Modules regroupés — sélection lisible. */
export function HomeModulesGrid() {
  return (
    <section id="modules" className="scroll-mt-24 bg-[#f8fafc] px-6 py-14 md:py-20 lg:py-24" aria-labelledby="modules-heading">
      <div className="container-site">
        <header className="mx-auto max-w-2xl text-center">
          <h2 id="modules-heading" className="font-display text-balance text-[1.75rem] font-extrabold tracking-tight text-[#0f172a] md:text-[2.25rem]">
            Des modules adaptés aux métiers du BTP
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-700 md:text-lg">
            Activez ce dont votre organisation a besoin. Disponibilité selon configuration entreprise.
          </p>
        </header>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <li key={m.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-bold text-[#0f172a]">{m.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{m.desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
