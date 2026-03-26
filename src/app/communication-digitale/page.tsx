import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { absoluteUrl } from "@/lib/site";

const pageUrl = absoluteUrl("/communication-digitale");

export const metadata: Metadata = {
  title: "Tarifs communication digitale | Packs visibilité en ligne",
  description:
    "Tarifs des packs communication digitale BeWork : visibilité locale (Google Business), réseaux sociaux, site vitrine. De 149€ à 449€/mois. Développez votre présence en ligne.",
  alternates: { canonical: pageUrl },
};

const PACKS = [
  {
    id: "visibilite-locale",
    name: "Pack Visibilité Locale",
    description: "Améliorez la visibilité locale de votre entreprise.",
    price: "149",
    services: [
      "Création fiche Google Business",
      "Optimisation fiche Google",
      "Gestion des avis",
      "1 publication mensuelle",
    ],
    badge: null as string | null,
  },
  {
    id: "reseaux-sociaux",
    name: "Pack Réseaux Sociaux",
    description: "Animez votre présence sur les réseaux sociaux.",
    price: "199",
    services: [
      "Création pages Facebook ou Instagram",
      "4 publications par mois",
      "Gestion des messages simples",
      "Création visuels simples",
    ],
    badge: null as string | null,
  },
  {
    id: "site-internet",
    name: "Pack Site Internet",
    description: "Ayez un site professionnel pour votre entreprise.",
    price: "299",
    services: [
      "Création site vitrine",
      "Hébergement",
      "Maintenance technique",
      "Optimisation SEO de base",
    ],
    badge: null as string | null,
  },
  {
    id: "visibilite-complete",
    name: "Pack Visibilité Complète",
    description: "Développez la visibilité globale de votre entreprise.",
    price: "449",
    services: [
      "Création site internet",
      "Gestion Google Business",
      "Publications réseaux sociaux",
      "Optimisation SEO local",
    ],
    badge: "Complet" as string | null,
  },
] as const;

export default async function CommunicationDigitalePage() {
  // Fonctionnalité mise en cache : redirige toujours vers l'accueil pour l'instant.
  redirect("/");
  const session = await getServerSession(authOptions);
  const isClient = session?.user?.role === "CLIENT";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#e0e4ea] pb-24 md:pb-16">
      <header className="sticky top-0 z-20 border-b border-[#c8cdd6] bg-[#f8f9fb]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="shrink-0" aria-label="BeWork - Retour à l'accueil">
            <BeWorkLogo size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/tarifs"
              className="hidden rounded-lg border border-[#c8cdd6] bg-white px-4 py-2 text-sm font-medium text-[#1e293b] transition hover:bg-[#f8f9fb] sm:inline-flex"
            >
              Tarifs administratif
            </Link>
            <Link
              href="/contact"
              className="hidden rounded-lg border border-[#c8cdd6] bg-white px-4 py-2 text-sm font-medium text-[#1e293b] transition hover:bg-[#f8f9fb] sm:inline-flex"
            >
              Contact
            </Link>
            <Link
              href={isClient ? "/dashboard" : "/connexion"}
              className="rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1e40af]"
            >
              {isClient ? "Mon espace" : "Accéder"}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        {/* Hero */}
        <section className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
            Communication digitale
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-[#334155]">
            Complétez votre assistance administrative avec des packs de visibilité en ligne simples et faciles à comprendre.
          </p>
          <p className="mt-2 text-sm text-[#64748b]">
            Créez votre fiche Google, animez vos réseaux sociaux ou lancez votre site professionnel.
          </p>
        </section>

        {/* Tarifs expliqués */}
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#0f172a]">Les tarifs communication BeWork</h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Les prix affichés ci-dessous sont les tarifs officiels de BeWork. Chaque pack est facturé mensuellement et comprend
            l&apos;ensemble des services listés. Pas de frais cachés, pas de supplément pour l&apos;accompagnement : tout est inclus.
            Choisissez le pack qui correspond à vos besoins en visibilité et contactez-nous pour démarrer.
          </p>
          <p className="mt-3 text-xs text-slate-500">
            Les tarifs sont indiqués TTC (TVA non applicable, art. 293 B du CGI).
          </p>
        </section>

        {/* Packs */}
        <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-labelledby="packs-heading">
          <h2 id="packs-heading" className="col-span-full text-xl font-semibold text-[#0f172a]">
            Tarifs des packs
          </h2>
          {PACKS.map((pack) => (
            <article
              key={pack.id}
              className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              {pack.badge && (
                <span className="absolute right-4 top-4 rounded-full bg-[#1d4ed8] px-2.5 py-0.5 text-xs font-medium text-white">
                  {pack.badge}
                </span>
              )}
              <h3 className="text-lg font-semibold text-[#0f172a]">{pack.name}</h3>
              <p className="mt-2 text-sm text-[#64748b]">{pack.description}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-[#334155]">
                {pack.services.map((s) => (
                  <li key={s} className="flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d4ed8]" />
                    {s}
                  </li>
                ))}
              </ul>
              <p className="mt-4">
                <span className="text-2xl font-bold text-[#0f172a]">{pack.price}€</span>
                <span className="ml-1 text-sm font-normal text-slate-500">/mois TTC</span>
              </p>
              <Link
                href={
                  isClient
                    ? `/dashboard/nouvelle-demande?pack=communication&suggestion=${pack.id}`
                    : `/contact?pack=${pack.id}`
                }
                className="mt-4 inline-flex w-full justify-center rounded-lg bg-[#1d4ed8] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1e40af]"
              >
                Choisir ce pack
              </Link>
            </article>
          ))}
        </section>

        {/* Missions possibles */}
        <section className="mt-16 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-[#0f172a]">Missions possibles</h2>
          <p className="mt-1 text-sm text-slate-500">
            Avec un pack communication, vous pouvez créer ces missions dans votre tableau de bord.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Créer un post Facebook",
              "Optimiser fiche Google",
              "Modifier une page du site",
              "Publier un article SEO",
              "Ajouter un contenu sur le site",
            ].map((m) => (
              <li key={m} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-4 py-2 text-sm text-slate-700">
                <span className="text-[#1d4ed8]">→</span>
                {m}
              </li>
            ))}
          </ul>
          {isClient && (
            <div className="mt-6">
              <Link
                href="/dashboard/nouvelle-demande"
                className="inline-flex rounded-lg border border-[#1d4ed8] bg-white px-4 py-2 text-sm font-medium text-[#1d4ed8] hover:bg-[#1d4ed8]/5"
              >
                + Nouvelle mission communication
              </Link>
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="mt-12 text-center">
          <p className="text-slate-600">
            Vous avez déjà un compte ?{" "}
            <Link href={isClient ? "/dashboard" : "/connexion"} className="font-medium text-[#1d4ed8] hover:underline">
              {isClient ? "Accéder au tableau de bord" : "Se connecter"}
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
