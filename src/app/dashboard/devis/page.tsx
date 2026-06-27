import Link from "next/link";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";

export default async function BeWorkDevisHomePage() {
  await requireBeWorkDevisSession();

  const cards = [
    {
      title: "Créer un devis",
      description:
        "Constituer un document estimatif ou de consultation à partir des ouvrages BeWork et exporter un PDF client.",
      href: "/dashboard/devis/creer",
      cta: "Démarrer",
      badge: "Chiffrage",
    },
    {
      title: "Projets clients",
      description: "Regrouper vos dossiers par client et chantier avant de générer des documents.",
      href: "/dashboard/devis/projets",
      cta: "Voir les projets",
      badge: "Organisation",
    },
    {
      title: "Documents",
      description: "Liste des devis et documents estimatifs : modification, statut et export PDF.",
      href: "/dashboard/devis/documents",
      cta: "Ouvrir la liste",
      badge: "Production",
    },
    {
      title: "Ouvrages & prix",
      description:
        "Classer les ouvrages BTP avec désignations, unités, lots et points de vigilance.",
      href: "/dashboard/devis/bibliotheque",
      cta: "Ouvrir la bibliothèque",
      badge: "Référentiel",
    },
    {
      title: "Analyse DPGF",
      description:
        "Fiches pédagogiques ligne par ligne : comprendre les désignations, vérifier CCTP et plans, repérer les pièges — sans prix.",
      href: "/dashboard/devis/analyse-dpgf",
      cta: "Ouvrir Analyse DPGF",
      badge: "Formation",
    },
    {
      title: "Prix observés",
      description: "Centraliser les prix issus de devis, BPU, DPGF et estimations internes.",
      href: "/dashboard/devis/prix",
      cta: "Voir les prix",
      badge: "Données",
    },
    {
      title: "Sources",
      description: "Répertorier les devis, BPU, DPGF et documents utilisés pour alimenter la base.",
      href: "/dashboard/devis/sources",
      cta: "Voir les sources",
      badge: "Traçabilité",
    },
    {
      title: "Recherche",
      description: "Rechercher rapidement un ouvrage, un prix, un lot ou une désignation.",
      href: "/dashboard/devis/recherche",
      cta: "Rechercher",
      badge: "Exploration",
    },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-2 px-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1e3a5f]/80">Bibliothèque interne</p>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">BeWork Devis</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          Bibliothèque privée d&apos;ouvrages, prix et désignations BTP.
        </p>
        <p className="max-w-2xl pt-2 text-sm text-slate-500">
          Construisez progressivement la base interne pour vos assistants travaux — sans import automatique dans
          cette version.
        </p>
      </header>

      <section aria-labelledby="devis-cards-heading" className="space-y-4 px-1">
        <h2 id="devis-cards-heading" className="text-lg font-bold tracking-tight text-slate-900">
          Accès rapide
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((c) => (
            <article
              key={c.href}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#1e3a5f]/25 hover:shadow-md"
            >
              <div>
                <span className="inline-flex rounded-full bg-[#1e3a5f]/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#1e3a5f]">
                  {c.badge}
                </span>
                <h3 className="mt-3 font-heading text-lg font-bold text-slate-900">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.description}</p>
              </div>
              <Link
                href={c.href}
                className="mt-6 inline-flex w-fit items-center rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#152a45]"
              >
                {c.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
