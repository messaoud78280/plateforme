import Link from "next/link";

const COMPLEMENTS = [
  {
    id: "ingenierie",
    title: "Ingénierie et marchés BTP",
    body: "Études techniques, métrés, analyse DCE et assistance aux appels d’offres — en soutien des deux offres principales.",
    items: [
      "Études et méthodes d’exécution",
      "Métrés et chiffrage",
      "Analyse DCE / CCTP / CCAP",
      "Mémoires techniques et AO",
    ],
    href: "/ingenierie-et-marches-btp",
    cta: "Voir l’ingénierie & marchés",
  },
  {
    id: "formation",
    title: "Formation professionnelle BTP",
    body: "Formations pratiques sur chantier pour conducteurs, chefs d’équipe et compagnons — offre en développement.",
    items: [
      "Formation conducteur de travaux",
      "Formation chef de chantier",
      "Formation chef d’équipe TP/VRD",
      "Modes opératoires sur ouvrage",
    ],
    href: "/formation-professionnelle-btp",
    cta: "Voir la formation BTP",
  },
  {
    id: "outils",
    title: "Méthode et outils internes",
    body: "Plateforme collaborative et IA utilisées en interne pour préparer, suivre et documenter les missions.",
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
        <p className="bw-btp-eyebrow">Compétences complémentaires</p>
        <h2 id="complements-title" className="mt-2 max-w-3xl font-bold">
          Ingénierie, formation et outils — au service des chantiers.
        </h2>
        <p className="mt-3 max-w-3xl text-base text-[var(--btp-muted)]">
          Elles complètent la conduite de travaux et les équipes TP/VRD en régie
          — sans prendre le dessus sur les deux offres principales.
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
