import Link from "next/link";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_BG_MUTED, HOME_CARD_SOFT, HOME_CONTENT, HOME_SECTION } from "@/components/home/homeSectionStyles";

const POINTS = [
  {
    title: "Hébergement en Europe",
    text: "Infrastructures situées au sein de l’Union européenne ou conformes aux exigences européennes applicables.",
  },
  {
    title: "Accès selon les rôles",
    text: "Permissions configurables pour limiter la visibilité et les actions selon les responsabilités.",
  },
  {
    title: "Isolation des espaces clients",
    text: "Les données de chaque organisation sont séparées de celles des autres clients BeWork.",
  },
  {
    title: "Confidentialité des documents",
    text: "Marchés, prix, plans, pièces financières et échanges internes traités dans un cadre contrôlé.",
  },
] as const;

/**
 * Confidentialité — formulations alignées sur le contrat / mentions existantes.
 * Pas de certification inventée ; OpenAI et flux tiers à confirmer juridiquement.
 */
export function HomeConfidentiality() {
  return (
    <section id="confidentialite" className={`${HOME_SECTION} ${HOME_BG_MUTED}`} aria-labelledby="privacy-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="privacy-heading"
          eyebrow="Confidentialité"
          title="Vos données professionnelles restent confidentielles"
          lead="Les plateformes BeWork sont conçues pour protéger les informations sensibles des entreprises du BTP. Les accès sont réservés aux utilisateurs autorisés."
        />

        <ul className={`${HOME_CONTENT} mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5`}>
          {POINTS.map((p) => (
            <li
              key={p.title}
              className={`${HOME_CARD_SOFT} p-5 transition hover:border-[#1d4ed8]/20`}
            >
              <h3 className="text-sm font-bold text-[#0f172a] md:text-base">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.text}</p>
            </li>
          ))}
        </ul>

        <div className="mx-auto mt-10 max-w-3xl rounded-xl border border-slate-200/90 bg-white px-5 py-4 text-sm leading-relaxed text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
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
