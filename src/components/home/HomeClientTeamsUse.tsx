const ROLES = [
  "Direction",
  "Directeur de travaux",
  "Conducteur de travaux",
  "Chargé d’affaires",
  "Études de prix",
  "Responsable administratif",
  "Comptabilité",
  "Chef de chantier",
  "Responsable qualité",
  "Collaborateur",
] as const;

/** Utilisation quotidienne par les équipes du client. */
export function HomeClientTeamsUse() {
  return (
    <section id="equipes" className="scroll-mt-24 bg-white px-6 py-14 md:py-20 lg:py-24" aria-labelledby="teams-heading">
      <div className="container-site">
        <header className="mx-auto max-w-3xl text-center">
          <h2 id="teams-heading" className="font-display text-balance text-[1.75rem] font-extrabold tracking-tight text-[#0f172a] md:text-[2.25rem]">
            Vos équipes pilotent. BeWork équipe la plateforme.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-700 md:text-lg">
            Après le déploiement, ce sont exclusivement les collaborateurs autorisés de votre entreprise qui utilisent
            la plateforme au quotidien — marchés, chantiers, documents, validations et outils IA.
          </p>
          <p className="mt-3 text-sm font-medium text-[#1d4ed8]">
            BeWork construit et fait évoluer l&apos;environnement numérique. Vous restez maître des opérations, des
            données et des décisions.
          </p>
        </header>
        <ul className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-2">
          {ROLES.map((role) => (
            <li
              key={role}
              className="rounded-full border border-slate-200 bg-[#f8fafc] px-3.5 py-1.5 text-sm font-medium text-slate-800"
            >
              {role}
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-slate-600">
          Chaque rôle n&apos;accède qu&apos;aux informations et actions nécessaires à sa mission, selon la configuration
          définie avec votre administrateur.
        </p>
      </div>
    </section>
  );
}
