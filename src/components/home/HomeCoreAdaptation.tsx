const CORE_ITEMS = [
  "Entreprises, utilisateurs, rôles et permissions",
  "Équipes, agences, chantiers et affaires",
  "Tâches, échéances, validations et historique",
  "Communication interne et notifications",
  "Documents, photos et moteur de recherche",
  "Tableaux de bord et accès ordinateur / mobile",
  "Outils IA intégrés au socle",
] as const;

const CONFIG_ITEMS = [
  "Métiers, types de chantiers et procédures",
  "Droits d’accès et circuits de validation",
  "Formulaires, statuts et modèles de documents",
  "Tableaux de bord et indicateurs",
  "Assistants IA activés selon vos usages",
  "Intégrations et développements spécifiques si besoin",
] as const;

/** Socle commun vs adaptation entreprise. */
export function HomeCoreAdaptation() {
  return (
    <section id="socle" className="scroll-mt-24 bg-[#f8fafc] px-6 py-14 md:py-20 lg:py-24" aria-labelledby="core-heading">
      <div className="container-site">
        <header className="mx-auto max-w-3xl text-center">
          <h2 id="core-heading" className="font-display text-balance text-[1.75rem] font-extrabold tracking-tight text-[#0f172a] md:text-[2.25rem]">
            Une base éprouvée, adaptée à votre fonctionnement
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-700 md:text-lg">
            Chaque entreprise bénéficie du socle technologique BeWork, complété par des modules, des workflows et des
            outils IA configurés selon son organisation.
          </p>
        </header>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
          <article className="rounded-2xl border-2 border-[#1d4ed8]/30 bg-white p-6 shadow-sm md:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1d4ed8]">Niveau 1</p>
            <h3 className="mt-2 text-xl font-bold text-[#0f172a]">Le socle BeWork</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              La base commune, maintenue et sécurisée par BeWork — partagée par toutes les entreprises.
            </p>
            <ul className="mt-5 space-y-2.5">
              {CORE_ITEMS.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-slate-800">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d4ed8]" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Niveau 2</p>
            <h3 className="mt-2 text-xl font-bold text-[#0f172a]">Votre configuration</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Modules, workflows, droits et outils IA adaptés à votre entreprise — pas une application reconstruite à
              zéro pour chaque client.
            </p>
            <ul className="mt-5 space-y-2.5">
              {CONFIG_ITEMS.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-slate-800">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
