import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_BG_WHITE, HOME_CONTENT, HOME_SECTION } from "@/components/home/homeSectionStyles";

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
    <section id="equipes" className={`${HOME_SECTION} ${HOME_BG_WHITE}`} aria-labelledby="teams-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="teams-heading"
          eyebrow="Vos équipes"
          title="Vos équipes pilotent. BeWork équipe la plateforme."
          lead={
            <>
              <p>
                Après le déploiement, ce sont exclusivement les collaborateurs autorisés de votre entreprise qui
                utilisent la plateforme au quotidien — marchés, chantiers, documents, validations et outils IA.
              </p>
              <p className="mt-3 text-sm font-medium text-[#1d4ed8]">
                BeWork construit et fait évoluer l&apos;environnement numérique. Vous restez maître des opérations, des
                données et des décisions.
              </p>
            </>
          }
        />
        <ul className={`${HOME_CONTENT} mx-auto flex max-w-4xl flex-wrap justify-center gap-2`}>
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
