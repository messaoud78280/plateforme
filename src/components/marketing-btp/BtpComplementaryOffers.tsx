import Link from "next/link";

const COMPLEMENTS = [
  {
    id: "marches",
    title: "Assistance aux marchés BTP",
    body: "Analyse DCE, réponses aux appels d’offres, métrés, chiffrage et suivi contractuel.",
    items: [
      "Analyse DCE",
      "Réponses aux appels d’offres",
      "Métrés et chiffrage",
      "Suivi contractuel",
    ],
    href: "/marches-publics-prives",
    cta: "Voir l’offre marchés",
  },
  {
    id: "formation",
    title: "Formation des compagnons sur chantier",
    body: "Transmission des modes opératoires et accompagnement technique sur le terrain — hors formations réglementaires.",
    items: [
      "Transmission des modes opératoires",
      "Accompagnement technique",
      "Respect des prescriptions de l’ouvrage",
      "Amélioration des méthodes d’exécution",
    ],
    href: "/accompagnement-technique-chantier",
    cta: "Découvrir l’accompagnement",
  },
  {
    id: "outils",
    title: "Outils numériques et intelligence artificielle",
    body: "Des outils internes au service de nos missions humaines : reporting, documents, suivi et collaboration.",
    items: [
      "Reporting chantier",
      "Organisation documentaire",
      "Suivi des opérations",
      "Outils collaboratifs",
    ],
    href: "/plateforme-ia",
    cta: "Voir méthode & outils",
  },
] as const;

export function BtpComplementaryOffers() {
  return (
    <section
      className="bw-btp-section bw-btp-section-alt"
      aria-labelledby="complements-title"
    >
      <div className="bw-btp-container">
        <p className="bw-btp-eyebrow">Prestations complémentaires</p>
        <h2 id="complements-title" className="mt-2 max-w-3xl font-bold">
          Des expertises qui renforcent vos opérations.
        </h2>
        <p className="mt-3 max-w-3xl text-base text-[var(--btp-muted)]">
          Elles complètent la conduite de travaux et les équipes terrain — sans
          remplacer nos deux offres principales.
        </p>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {COMPLEMENTS.map((item) => (
            <article key={item.id} className="bw-btp-card flex flex-col">
              <h3 className="font-bold">{item.title}</h3>
              <p className="mt-3 text-base text-[var(--btp-muted)]">{item.body}</p>
              <ul className="bw-home-offer-list mt-4 flex-1">
                {item.items.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <Link
                href={item.href}
                className="mt-6 text-base font-semibold text-[var(--btp-accent)] hover:underline"
              >
                {item.cta} →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
