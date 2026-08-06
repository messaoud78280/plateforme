import Link from "next/link";

const POINTS = [
  {
    title: "Accès par rôles",
    text: "Permissions configurables pour limiter la visibilité et les actions selon les responsabilités.",
  },
  {
    title: "Isolation entre entreprises",
    text: "Les données de chaque organisation sont séparées de celles des autres clients BeWork.",
  },
  {
    title: "Hébergement principal en Europe",
    text: "Infrastructures situées au sein de l’Union européenne ou conformes aux exigences européennes applicables.",
  },
  {
    title: "Documents et échanges sensibles",
    text: "Marchés, prix, plans, pièces financières et échanges internes traités dans un cadre contrôlé.",
  },
] as const;

/**
 * Confidentialité — formulations alignées sur le contrat / mentions existantes.
 * Pas de certification inventée ; OpenAI et flux tiers à confirmer juridiquement.
 */
export function HomeConfidentiality() {
  return (
    <section id="confidentialite" className="scroll-mt-24 bg-[#f8fafc] px-6 py-14 md:py-20 lg:py-24" aria-labelledby="privacy-heading">
      <div className="container-site">
        <header className="mx-auto max-w-3xl text-center">
          <h2 id="privacy-heading" className="font-display text-balance text-[1.75rem] font-extrabold tracking-tight text-[#0f172a] md:text-[2.25rem]">
            Vos données professionnelles restent confidentielles
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-700 md:text-lg">
            Les plateformes BeWork sont conçues pour protéger les informations sensibles des entreprises du BTP. Les
            accès sont réservés aux utilisateurs autorisés.
          </p>
        </header>

        <ul className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2">
          {POINTS.map((p) => (
            <li key={p.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-bold text-[#0f172a]">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.text}</p>
            </li>
          ))}
        </ul>

        <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm leading-relaxed text-slate-700">
          <p>
            Les documents traités par les outils d&apos;intelligence artificielle le sont uniquement pour fournir les
            fonctionnalités demandées, selon les engagements de confidentialité et les paramètres applicables aux
            fournisseurs techniques utilisés. La validation des analyses reste sous la responsabilité de vos
            professionnels.
          </p>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/politique-confidentialite" className="font-semibold text-[#1d4ed8] hover:underline">
              Politique de confidentialité
            </Link>
            <Link href="/mentions-legales" className="font-semibold text-[#1d4ed8] hover:underline">
              Mentions légales
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
