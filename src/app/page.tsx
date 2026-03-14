import type { Metadata } from "next";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bework.fr";

const RESSOURCES_BLOG = [
  { title: "10 tâches administratives à déléguer", desc: "Les tâches chronophages que les dirigeants peuvent externaliser.", href: "/blog/10-taches-administratives-deleguer-dirigeant" },
  { title: "Combien coûte un assistant administratif ?", desc: "Comparatif assistant externalisé vs salarié. Tarifs pour les PME.", href: "/blog/combien-coute-assistant-administratif" },
  { title: "Assistant virtuel vs assistant salarié", desc: "Avantages et inconvénients pour choisir entre externaliser ou recruter.", href: "/blog/assistant-virtuel-vs-assistant-salarie" },
];

export const metadata: Metadata = {
  title: "Assistant administratif externalisé pour PME | BeWork — France, Belgique, Suisse, Luxembourg",
  description:
    "Assistant administratif externalisé et assistant virtuel entreprise pour PME francophones. Externaliser votre administratif à distance : devis, factures, relances. Dès 215€/mois, sans recrutement. France, Belgique, Suisse, Luxembourg.",
  keywords: [
    "assistant administratif externalisé",
    "assistant administratif à distance",
    "assistant virtuel entreprise",
    "externaliser administratif PME",
    "assistant administratif PME",
  ],
  alternates: { canonical: BASE_URL },
  openGraph: {
    title: "Assistant administratif externalisé pour PME | BeWork",
    description:
      "Externalisez votre administratif avec un assistant virtuel dédié. Dès 215€/mois. France, Belgique, Suisse, Luxembourg.",
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#e0e4ea]">
      <header className="sticky top-0 z-20 border-b border-[#c8cdd6] bg-[#f8f9fb]">
        <div className="mx-auto max-w-6xl px-6 py-4">
          {/* Ligne 1 : Logo + boutons */}
          <div className="flex items-center justify-between">
            <Link href="/" className="shrink-0">
              <BeWorkLogo size="sm" showTagline />
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/connexion"
                className="rounded-lg border border-[#c8cdd6] bg-white px-5 py-2.5 text-sm font-medium text-[#1e293b] shadow-sm transition-all hover:bg-[#f8f9fb]"
              >
                Connexion
              </Link>
              <Link
                href="/contact"
                className="hidden rounded-lg border border-[#c8cdd6] bg-white px-5 py-2.5 text-sm font-medium text-[#1e293b] shadow-sm transition-all hover:border-[#9ca3af] hover:bg-[#f8f9fb] sm:inline-flex"
              >
                Contact
              </Link>
              <Link
                href="/inscription"
                className="rounded-lg bg-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#1e40af] hover:shadow-lg"
              >
                Tester BeWork
              </Link>
            </div>
          </div>
          {/* Ligne 2 : Navigation — chaque lien sur une seule ligne */}
          <nav className="mt-3 hidden flex-wrap items-center justify-center gap-x-5 gap-y-1 border-t border-[#e0e4ea] pt-3 text-sm font-medium text-[#334155] md:flex">
            <a className="whitespace-nowrap transition-colors hover:text-[#0f172a]" href="#comment-ca-marche">Comment ça marche</a>
            <a className="whitespace-nowrap transition-colors hover:text-[#0f172a]" href="#roi">Économies</a>
            <a className="whitespace-nowrap transition-colors hover:text-[#0f172a]" href="#solutions">Solutions</a>
            <a className="whitespace-nowrap transition-colors hover:text-[#0f172a]" href="#secteurs">Secteurs</a>
            <a className="whitespace-nowrap transition-colors hover:text-[#0f172a]" href="#plateforme">Plateforme</a>
            <Link className="whitespace-nowrap transition-colors hover:text-[#0f172a]" href="/tarifs" title="Tarifs assistance administrative">Tarifs administratif</Link>
            <Link className="whitespace-nowrap transition-colors hover:text-[#0f172a]" href="/communication-digitale" title="Tarifs communication digitale">Tarifs communication</Link>
            <Link className="whitespace-nowrap transition-colors hover:text-[#0f172a]" href="/blog">Blog</Link>
            <a className="whitespace-nowrap transition-colors hover:text-[#0f172a]" href="#equipe">Équipe</a>
            <a className="whitespace-nowrap transition-colors hover:text-[#0f172a]" href="#conciergerie">Conciergerie</a>
            <Link className="whitespace-nowrap transition-colors hover:text-[#0f172a]" href="/faq">FAQ</Link>
          </nav>
        </div>
      </header>

      <main className="pt-0">
        {/* Hero — message orienté bénéfice + CTAs + mockup */}
        <section id="hero" className="px-6 pt-24 pb-24 md:pt-32 md:pb-32" style={{ scrollMarginTop: "6rem" }}>
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-20 lg:items-center">
              <div className="space-y-8">
                <h1 className="text-balance text-3xl font-bold leading-[1.15] tracking-tight text-[#0f172a] md:text-4xl lg:text-5xl lg:leading-[1.1]">
                  Gagnez du temps. Déléguez votre administratif.
                </h1>
                <p className="max-w-xl text-lg leading-relaxed text-[#475569] md:text-xl">
                  Confiez vos tâches administratives à un assistant à la demande, sans embauche et sans contraintes.
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href="/inscription"
                    className="inline-flex rounded-lg bg-[#1d4ed8] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#1d4ed8]/25 transition-all hover:bg-[#1e40af] hover:shadow-xl hover:shadow-[#1d4ed8]/30"
                    aria-label="Tester BeWork gratuitement"
                  >
                    Tester BeWork
                  </Link>
                  <Link
                    href="#comment-ca-marche"
                    className="inline-flex rounded-lg border border-[#e2e8f0] bg-white px-6 py-3.5 text-base font-medium text-[#334155] transition-all hover:border-[#c8cdd6] hover:bg-[#f8fafc]"
                  >
                    Comment ça marche
                  </Link>
                </div>
                <p className="text-sm text-[#64748b]">
                  France, Belgique, Suisse, Luxembourg. Dès 215€/mois, sans recrutement.
                </p>
              </div>
              {/* Mockup plateforme */}
              <div className="relative flex justify-center lg:justify-end">
                <div className="w-full max-w-md rounded-xl border-2 border-[#c8cdd6] bg-white p-4 shadow-xl ring-1 ring-black/5 md:max-w-lg">
                  <div className="flex gap-2 mb-4">
                    <span className="h-2 w-2 rounded-full bg-[#94a3b8]" />
                    <span className="h-2 w-2 rounded-full bg-[#94a3b8]" />
                    <span className="h-2 w-2 rounded-full bg-[#94a3b8]" />
                  </div>
                  <div className="space-y-3 rounded-lg bg-[#f8fafc] p-4">
                    {["Suivi des tâches", "Messagerie avec l'assistant", "Historique des actions"].map((label, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 border border-[#e2e8f0]">
                        <span className="h-2 w-2 rounded-full bg-[#1d4ed8]" />
                        <span className="text-sm text-[#334155]">{label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-center text-xs text-[#64748b]">Interface BeWork</p>
                </div>
              </div>
            </div>
            <div className="mt-16 flex flex-wrap justify-center gap-6 text-sm">
              <Link href="/inscription" className="font-medium text-[#1d4ed8] hover:underline">
                Créer un compte
              </Link>
              <Link href="/connexion" className="font-medium text-[#64748b] hover:text-[#0f172a]">
                Se connecter
              </Link>
            </div>
          </div>
        </section>

        {/* Comment ça marche — 4 étapes */}
        <section id="comment-ca-marche" className="px-6 py-16 md:py-20 bg-white/60 rounded-2xl mx-4 md:mx-6 max-w-6xl md:mx-auto scroll-mt-24" style={{ scrollMarginTop: "6rem" }}>
          <div className="mx-auto max-w-4xl text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-[#0f172a] md:text-3xl">
              Comment ça marche
            </h2>
            <p className="mt-3 text-[#334155]">
              Un parcours simple pour déléguer votre administratif en toute sérénité.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: 1, title: "Vous envoyez vos tâches", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
              { step: 2, title: "Votre assistant les traite", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
              { step: 3, title: "Vous suivez l'avancement sur la plateforme", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
              { step: 4, title: "Vous gagnez du temps sur votre activité", icon: "M12 8v4l3 3m6-3a9 10.5 0 11-21 0 10.5 0 21 0z" },
            ].map((item) => (
              <div key={item.step} className="card-frame rounded-xl p-6 text-center transition-transform hover:scale-[1.02]">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#eff6ff] text-[#1d4ed8]">
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </div>
                <span className="mt-3 block text-sm font-medium text-[#64748b]">Étape {item.step}</span>
                <h3 className="mt-1 text-lg font-semibold text-[#0f172a]">{item.title}</h3>
              </div>
            ))}
          </div>
        </section>

        {/* Deux propositions tarifaires distinctes */}
        <section id="tarifs" className="px-6 py-16 md:py-20 bg-white/60 rounded-2xl mx-4 md:mx-6 max-w-6xl md:mx-auto scroll-mt-24" style={{ scrollMarginTop: "6rem" }}>
          <div className="mx-auto max-w-6xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-[#0f172a] md:text-3xl">
              Choisissez vos tarifs
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-[#334155]">
              BeWork propose deux offres complémentaires. Sélectionnez celle qui correspond à vos besoins.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
              <Link
                href="/tarifs"
                className="group flex flex-col rounded-2xl border-2 border-[#e2e8f0] bg-white p-6 text-left transition hover:border-[#1d4ed8] hover:shadow-lg"
              >
                <span className="text-sm font-medium text-[#64748b]">Assistance administrative</span>
                <h3 className="mt-1 text-lg font-semibold text-[#0f172a]">Tarifs administratif</h3>
                <p className="mt-2 text-sm text-[#334155]">
                  Assistant virtuel, devis, factures, relances, suivi dossiers… Dès 109€ pour tester.
                </p>
                <p className="mt-3 text-base font-bold text-[#1d4ed8]">Dès 215€/mois →</p>
              </Link>
              <Link
                href="/communication-digitale"
                className="group flex flex-col rounded-2xl border-2 border-[#e2e8f0] bg-white p-6 text-left transition hover:border-[#1d4ed8] hover:shadow-lg"
              >
                <span className="text-sm font-medium text-[#64748b]">Visibilité en ligne</span>
                <h3 className="mt-1 text-lg font-semibold text-[#0f172a]">Tarifs communication</h3>
                <p className="mt-2 text-sm text-[#334155]">
                  Google Business, réseaux sociaux, site vitrine, SEO… Packs clés en main.
                </p>
                <p className="mt-3 text-base font-bold text-[#1d4ed8]">Dès 149€/mois →</p>
              </Link>
            </div>
          </div>
        </section>

        {/* Pourquoi externaliser son administratif */}
        <section id="pourquoi-externaliser" className="px-6 py-16 md:py-20 bg-white/60 rounded-2xl mx-4 md:mx-6 max-w-6xl md:mx-auto scroll-mt-24" style={{ scrollMarginTop: "6rem" }}>
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold tracking-tight text-[#0f172a] md:text-3xl">
                Pourquoi externaliser son administratif ?
              </h2>
              <p className="mt-3 max-w-2xl mx-auto text-[#334155]">
                Externaliser votre administratif avec un assistant virtuel entreprise permet de recentrer vos équipes sur votre cœur de métier tout en sécurisant les tâches de secrétariat, facturation et suivi.
              </p>
            </div>
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                "Gain de temps : déchargez-vous des tâches chronophages et concentrez-vous sur votre activité.",
                "Coût maîtrisé : pas de recrutement ni de charges sociales — un forfait tout compris dès 215€/mois.",
                "Réactivité : assistant administratif à distance opérationnel après un court onboarding.",
                "Scalabilité : augmentez ou réduisez le volume d'actions selon vos besoins.",
                "Qualité : équipe francophone Bac+5, formée à l'IA, supervisée en France.",
                "Souplesse : externaliser administratif PME sans engagement long terme.",
              ].map((item, i) => (
                <li key={i} className="card-frame flex gap-3 rounded-lg p-5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] text-[#1d4ed8] text-sm font-bold">✓</span>
                  <span className="text-[#334155] leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ROI / Économies — comparatif */}
        <section id="roi" className="px-6 py-16 md:py-20 scroll-mt-24" style={{ scrollMarginTop: "6rem" }}>
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold tracking-tight text-[#0f172a] md:text-3xl">
                Jusqu&apos;à 75&nbsp;% d&apos;économie par rapport à un recrutement interne
              </h2>
              <p className="mt-3 max-w-2xl mx-auto text-[#334155]">
                Comparez le coût d&apos;un assistant en interne en Europe avec une solution externalisée BeWork.
              </p>
            </div>
            <div className="card-frame rounded-2xl border-2 border-[#1d4ed8]/20 overflow-hidden bg-white">
              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#e2e8f0]">
                <div className="p-8 md:p-10">
                  <h3 className="text-lg font-bold text-[#0f172a]">Assistant en interne (Europe)</h3>
                  <ul className="mt-4 space-y-2 text-[#334155]">
                    {["Salaire brut", "Charges sociales", "Bureau & matériel", "Recrutement & formation"].map((line) => (
                      <li key={line} className="flex items-center gap-2">
                        <span className="text-[#94a3b8]">•</span> {line}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-2xl font-bold text-[#64748b]">~5 050 € / mois</p>
                </div>
                <div className="p-8 md:p-10 bg-[#eff6ff]/50">
                  <h3 className="text-lg font-bold text-[#1d4ed8]">Assistant via BeWork</h3>
                  <ul className="mt-4 space-y-2 text-[#334155]">
                    {["Un seul forfait tout compris", "Aucun coût de recrutement", "Aucune charge sociale", "Plateforme incluse"].map((line) => (
                      <li key={line} className="flex items-center gap-2">
                        <span className="text-[#1d4ed8]">✓</span> {line}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-2xl font-bold text-[#1d4ed8]">Dès 215 € / mois</p>
                  <Link href="/tarifs" className="mt-4 inline-block text-sm font-semibold text-[#1d4ed8] hover:underline">
                    Voir les offres →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ils nous font confiance — preuve sociale */}
        <section id="confiance" className="px-6 py-16 md:py-20 bg-white/50">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-bold tracking-tight text-[#0f172a] md:text-3xl text-center mb-10">
              Ils nous font confiance
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-12">
              {[
                { sector: "PME BTP", quote: "Une équipe réactive pour nos devis et notre suivi chantiers." },
                { sector: "Agence immobilière", quote: "Gestion des dossiers et relances clients simplifiée." },
                { sector: "Cabinet de conseil", quote: "Support admin qui nous permet de nous concentrer sur le conseil." },
                { sector: "Agence de recrutement", quote: "Coordination et suivi candidats en toute sérénité." },
              ].map((item) => (
                <div key={item.sector} className="card-frame rounded-xl p-6">
                  <p className="text-[#334155] leading-relaxed italic">&ldquo;{item.quote}&rdquo;</p>
                  <p className="mt-4 text-sm font-semibold text-[#1d4ed8]">{item.sector}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-[#64748b]">
              PME, dirigeants, cabinets et agences en France, Belgique, Suisse et Luxembourg.
            </p>
          </div>
        </section>

        {/* Une plateforme simple pour déléguer votre administratif */}
        <section id="plateforme" className="px-6 py-20 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-2xl font-bold tracking-tight text-[#0f172a] md:text-3xl lg:text-4xl">
                Une plateforme simple pour déléguer votre administratif
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-[#475569]">
                Envoyez vos demandes, échangez avec votre assistant et suivez l&apos;avancement en temps réel.
              </p>
            </div>

            {/* Démo dashboard — contenu réel */}
            <div className="mb-20 flex justify-center">
              <div className="w-full max-w-5xl overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-xl shadow-[#0f172a]/8">
                <div className="flex items-center gap-2 border-b border-[#e2e8f0] bg-[#f8fafc] px-5 py-3.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#94a3b8]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#94a3b8]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#94a3b8]" />
                  <span className="ml-2 text-sm font-medium text-[#64748b]">Dashboard BeWork</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#e2e8f0] p-px">
                  {/* Colonne 1 : Nouvelle demande */}
                  <div className="bg-white p-5">
                    <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Nouvelle demande</h3>
                    <div className="space-y-2.5">
                      {[
                        { title: "Préparer devis Dupont BTP", cat: "Facturation" },
                        { title: "Relancer facture n°2024-089", cat: "Comptabilité" },
                        { title: "Organiser RDV client Martin", cat: "Organisation" },
                      ].map((d, i) => (
                        <div key={i} className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-left shadow-sm hover:border-[#1d4ed8]/30 transition-colors">
                          <p className="text-sm font-medium text-[#0f172a] line-clamp-1">{d.title}</p>
                          <p className="mt-0.5 text-xs text-[#64748b]">{d.cat}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Colonne 2 : Messagerie */}
                  <div className="bg-white p-5">
                    <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Messagerie</h3>
                    <div className="space-y-2.5">
                      {[
                        { from: "Catherine (assistant)", msg: "Le devis est prêt, je vous l'envoie.", time: "10:24" },
                        { from: "Vous", msg: "Merci, pouvez-vous le relire avant ?", time: "09:52" },
                        { from: "Catherine (assistant)", msg: "Bien reçu, j'attaque ce matin.", time: "Hier 16:30" },
                      ].map((m, i) => (
                        <div key={i} className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-left shadow-sm">
                          <p className="text-xs font-medium text-[#1d4ed8]">{m.from}</p>
                          <p className="mt-0.5 text-xs text-[#475569] line-clamp-2">{m.msg}</p>
                          <p className="mt-1 text-[10px] text-[#94a3b8]">{m.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Colonne 3 : Mes demandes */}
                  <div className="bg-white p-5">
                    <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Mes demandes</h3>
                    <div className="space-y-2.5">
                      {[
                        { title: "Devis Dupont", status: "En cours", color: "bg-blue-100 text-blue-800" },
                        { title: "Relance facture", status: "Terminée", color: "bg-green-100 text-green-800" },
                        { title: "RDV Martin", status: "En attente", color: "bg-amber-100 text-amber-800" },
                      ].map((t, i) => (
                        <div key={i} className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-left shadow-sm">
                          <p className="text-sm font-medium text-[#0f172a]">{t.title}</p>
                          <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${t.color}`}>
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 fonctionnalités clés */}
            <div className="grid gap-10 md:grid-cols-3 md:gap-8">
              {[
                {
                  title: "Créer une demande",
                  description: "Déposez une tâche en quelques clics. Titre, description, pièces jointes : tout est centralisé.",
                  icon: "M12 6v6m0 0v6m0-6h6m-6 0H6",
                },
                {
                  title: "Messagerie avec l'assistant",
                  description: "Échangez directement avec votre assistant dédié. Réponses rapides et historique des échanges.",
                  icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
                },
                {
                  title: "Suivi des missions",
                  description: "Consultez l'état de vos demandes, les actions réalisées et le temps économisé en un coup d'œil.",
                  icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
                },
              ].map((item, i) => (
                <div key={i} className="rounded-xl border border-[#e2e8f0] bg-white p-6 text-left shadow-sm">
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#eff6ff] text-[#1d4ed8]">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-[#0f172a]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#475569]">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Avantages / Aucun compromis sur la qualité */}
        <section id="avantages" className="px-6 pt-16 pb-24 md:pt-20 md:pb-28">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
                Aucun compromis sur la qualité
              </h2>
              <p className="mt-5 max-w-2xl mx-auto text-lg leading-relaxed text-[#334155]">
                Réduisez la charge administrative tout en sécurisant la qualité de vos opérations. 
                Équipe francophone, dédiée et opérationnelle.
              </p>
            </div>
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                "Aucun coût de recrutement ni d'infrastructure : votre assistant est opérationnel après l'onboarding.",
                "Main-d'œuvre qualifiée, 100% francophone, motivée et encadrée.",
                "Même fuseau horaire qu'en France : plateforme internationale supervisée depuis la France pour une collaboration en temps réel.",
                "Diplômés Bac+5 minimum, formés à l'IA et aux process administratifs.",
                "Garantie : satisfait ou remplacé rapidement.",
                "Direction et supervision opérationnelle en France pour rester au plus proche de vos attentes.",
              ].map((item, i) => (
                <li key={i} className="card-frame flex gap-3 rounded-lg p-5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1d4ed8] text-white text-sm font-bold">
                    {i + 1}
                  </span>
                  <span className="text-[#334155] leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Lien pilier tâches */}
        <section className="px-6 py-8 md:py-10">
          <div className="mx-auto max-w-6xl">
            <div className="card-frame rounded-xl border-2 border-[#1d4ed8]/20 bg-white p-6 text-center md:p-8">
              <p className="text-lg font-semibold text-[#0f172a]">
                Découvrez les tâches prises en charge par nos assistants administratifs externalisés
              </p>
              <p className="mt-2 text-[#334155]">
                Emails, devis, factures, relances, agenda, suivi dossiers — un catalogue complet pour les PME.
              </p>
              <Link
                href="/assistants-administratifs-taches"
                className="mt-4 inline-flex items-center gap-1 font-semibold text-[#1d4ed8] transition-colors hover:text-[#1e40af]"
              >
                Voir les tâches prises en charge
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Solutions */}
        <section id="solutions" className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
                Des solutions d&apos;assistance administrative qui font la différence.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[#334155]">
                Nos assistants augmentés par l&apos;IA gèrent vos dossiers, documents et
                suivis avec rigueur. Une équipe expérimentée, à l&apos;écoute de vos
                besoins.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 md:gap-10">
              <div className="card-frame rounded-lg p-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-[#eff6ff] text-[#1d4ed8]">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-[#0f172a]">
                  Suivi de dossiers et projets
                </p>
                <p className="mt-3 text-[#334155] leading-relaxed">
                  Avancement, échéances, priorités : nos assistants assurent un
                  suivi clair et réactif de vos dossiers.
                </p>
              </div>
              <div className="card-frame rounded-lg p-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-[#eff6ff] text-[#1d4ed8]">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-[#0f172a]">
                  Gestion documentaire
                </p>
                <p className="mt-3 text-[#334155] leading-relaxed">
                  Saisie, classement, mise à jour et partage de documents :
                  une organisation irréprochable.
                </p>
              </div>
              <div className="card-frame rounded-lg p-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-[#eff6ff] text-[#1d4ed8]">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-[#0f172a]">
                  Coordination & communication
                </p>
                <p className="mt-3 text-[#334155] leading-relaxed">
                  Relances, synthèses, compte-rendu : des échanges professionnels
                  et tracés avec vos interlocuteurs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Ce que fait votre assistant */}
        <section id="missions" className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
              Ce que fait votre assistant à distance
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#334155]">
              Une palette de missions pour PME, TPE, indépendants et agences : agilité, stabilité et sécurité.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "Secrétariat & administration", keys: "Emails, téléphone, courriers, agenda, déplacements, classement, archivage" },
                { title: "Comptabilité & finance", keys: "Factures, relances, suivi paiements, pré-comptabilité, rapprochements bancaires" },
                { title: "Commercial & client", keys: "Devis, CRM, support client, ADV, traitement commandes" },
                { title: "Ressources humaines", keys: "Contrats, paie, recrutement, onboarding, gestion administrative du personnel" },
                { title: "Marketing & digital", keys: "Réseaux sociaux, rédaction web, newsletters, création de contenu" },
                { title: "Gestion de projets", keys: "Événements, coordination, planning, reporting" },
                { title: "Achats & services généraux", keys: "Sourcing, commandes, relations fournisseurs, gestion des stocks" },
              ].map((item) => (
                <div key={item.title} className="card-frame rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-[#0f172a]">{item.title}</h3>
                  <p className="mt-2 text-sm text-[#334155]">{item.keys}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Exemples de missions par secteur */}
        <section id="exemples-missions" className="px-6 py-24 md:py-28 scroll-mt-24" style={{ scrollMarginTop: "6rem" }}>
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
              Exemples de missions par secteur
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#334155]">
              Un assistant administratif externalisé s&apos;adapte à votre secteur : BTP, immobilier, PME, indépendants.
            </p>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="card-frame rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[#1d4ed8]">BTP</h3>
                <ul className="mt-4 space-y-2 text-sm text-[#334155]">
                  {["Devis chantiers", "Suivi des sous-traitants", "Relances factures fournisseurs", "Mise à jour planning"].map((m, i) => (
                    <li key={i}>• {m}</li>
                  ))}
                </ul>
                <Link href="/assistant-administratif-btp" className="mt-4 inline-block text-sm font-semibold text-[#1d4ed8] hover:underline">
                  En savoir plus →
                </Link>
              </div>
              <div className="card-frame rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[#1d4ed8]">Immobilier</h3>
                <ul className="mt-4 space-y-2 text-sm text-[#334155]">
                  {["Dossiers locataires", "Relances loyers", "État des lieux", "Gestion des demandes"].map((m, i) => (
                    <li key={i}>• {m}</li>
                  ))}
                </ul>
                <Link href="/assistant-administratif-immobilier" className="mt-4 inline-block text-sm font-semibold text-[#1d4ed8] hover:underline">
                  En savoir plus →
                </Link>
              </div>
              <div className="card-frame rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[#1d4ed8]">PME</h3>
                <ul className="mt-4 space-y-2 text-sm text-[#334155]">
                  {["Devis et factures clients", "Suivi des commandes", "Relances impayées", "Administratif RH"].map((m, i) => (
                    <li key={i}>• {m}</li>
                  ))}
                </ul>
                <Link href="/assistant-administratif-pme" className="mt-4 inline-block text-sm font-semibold text-[#1d4ed8] hover:underline">
                  En savoir plus →
                </Link>
              </div>
              <div className="card-frame rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[#1d4ed8]">Indépendants</h3>
                <ul className="mt-4 space-y-2 text-sm text-[#334155]">
                  {["Facturation", "Agenda et RDV", "Recherches fournisseurs", "Suivi administratif"].map((m, i) => (
                    <li key={i}>• {m}</li>
                  ))}
                </ul>
                <Link href="/assistant-administratif-distance" className="mt-4 inline-block text-sm font-semibold text-[#1d4ed8] hover:underline">
                  En savoir plus →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* L'équipe derrière BeWork */}
        <section id="equipe" className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
              L&apos;équipe derrière BeWork
            </h2>

            {/* Laure Olivie — Fondatrice */}
            <div className="mt-16 flex flex-col items-center text-center md:flex-row md:items-start md:gap-12 md:text-left">
              <div className="shrink-0">
                <div className="relative mx-auto h-56 w-56 overflow-hidden rounded-2xl bg-[#e2e8f0] shadow-lg shadow-[#0f172a]/8 md:h-64 md:w-64">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/laure-olivie.jpg"
                    alt="Laure Olivie, fondatrice de BeWork"
                    className="absolute inset-0 h-full w-full object-cover object-center"
                  />
                </div>
                <p className="mt-4 text-lg font-semibold text-[#0f172a]">Laure Olivie</p>
                <p className="mt-0.5 text-sm font-medium text-[#64748b]">Fondatrice de BeWork</p>
              </div>
              <div className="mt-8 max-w-2xl md:mt-0 md:flex-1">
                <p className="text-lg leading-relaxed text-[#334155]">
                  BeWork est né d&apos;une idée simple&nbsp;: permettre aux entreprises de déléguer leur
                  administratif facilement grâce à une plateforme moderne et efficace.
                </p>
                <p className="mt-6 font-medium text-[#0f172a]">
                  Notre mission&nbsp;: aider les entreprises à se concentrer sur l&apos;essentiel.
                </p>
                <p className="mt-6 text-[#334155] leading-relaxed">
                  BeWork est une société française fondée par Laure Olivie, formatrice IA reconnue et diplômée.
                  Votre interlocuteur principal est notre agence en région parisienne, qu&apos;elle dirige au quotidien.
                  Une plateforme opérationnelle internationale est supervisée depuis la France en temps réel,
                  pour une qualité et une réactivité identiques. Notre équipe est composée de diplômés Bac+5
                  minimum, expérimentés et formés aux outils d&apos;intelligence artificielle.
                </p>
              </div>
            </div>
            <div className="card-frame mt-16 rounded-xl p-10 md:p-14">
              <div className="grid gap-10 md:grid-cols-2 md:gap-14">
                <div>
                  <p className="text-lg font-semibold text-[#0f172a]">
                    Agence principale — Région parisienne
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#64748b]">
                    Gérée par Laure Olivie, votre interlocutrice principale
                  </p>
                  <p className="mt-3 text-[#334155] leading-relaxed">
                    Laure Olivie, formatrice IA reconnue et diplômée, pilote
                    l&apos;agence en Île-de-France. C&apos;est elle qui assure la
                    relation client, le cadrage des missions et la qualité du
                    service. Son expertise et son exigence garantissent un
                    accompagnement de haut niveau.
                  </p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-[#0f172a]">
                    Plateforme opérationnelle internationale
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#64748b]">
                    Supervision opérationnelle en France
                  </p>
                  <p className="mt-3 text-[#334155] leading-relaxed">
                    La plateforme est pilotée au quotidien depuis la France. Même fuseau horaire,
                    même niveau d&apos;exigence : sélection Bac+5, formation IA et encadrement continu
                    pour une assistance réactive et professionnelle.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Notre organisation */}
        <section id="pourquoi-nous" className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
              Pourquoi collaborer avec nous ?
            </h2>
            <ul className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                "Interlocuteur principal en Île-de-France (Laure Olivie) : proximité et réactivité.",
                "Plateforme internationale pilotée en temps réel depuis la France.",
                "Même fuseau horaire qu'en France : collaboration sans décalage.",
                "Assistants francophones, Bac+5, formés à l'IA et encadrés en continu.",
              ].map((item, i) => (
                <li key={i} className="card-frame flex gap-3 rounded-lg p-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#1d4ed8]/10 text-[#1d4ed8] text-xs font-bold">✓</span>
                  <span className="text-[#334155]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Secteurs — cartes cliquables */}
        <section id="secteurs" className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
              Des secteurs que nous connaissons bien
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#334155]">
              Dirigeants, cadres, PME ou cabinets : nous nous adaptons à votre secteur et à vos process.
            </p>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[
                { name: "BTP", desc: "Devis, suivi chantiers, coordination" },
                { name: "Immobilier", desc: "Dossiers, relances, gestion locative" },
                { name: "Cabinets juridiques", desc: "Administratif et suivi dossiers" },
                { name: "PME", desc: "Assistance administrative au quotidien" },
                { name: "Consulting", desc: "Support et livrables" },
                { name: "E-commerce", desc: "Commandes, SAV, suivi" },
                { name: "Agences de recrutement", desc: "Coordination et suivi candidats" },
              ].map((sector) => (
                <Link
                  key={sector.name}
                  href="/contact"
                  className="card-frame group rounded-xl border-2 border-[#e2e8f0] bg-white p-6 text-left transition-all hover:border-[#1d4ed8] hover:shadow-md"
                >
                  <h3 className="text-lg font-semibold text-[#0f172a] group-hover:text-[#1d4ed8]">{sector.name}</h3>
                  <p className="mt-2 text-sm text-[#64748b]">{sector.desc}</p>
                  <span className="mt-3 inline-flex items-center text-sm font-medium text-[#1d4ed8] opacity-0 group-hover:opacity-100 transition-opacity">
                    Nous contacter →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Service de conciergerie — sur devis, 24/24 */}
        <section id="conciergerie" className="px-6 py-24 md:py-28">
          <div className="card-frame mx-auto max-w-6xl rounded-xl border-2 border-[#1d4ed8]/20 bg-gradient-to-b from-white to-[#f8fafc] p-10 md:p-14">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
                  Service de conciergerie
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-[#334155]">
                  Au-delà de l&apos;assistance administrative, BeWork propose un{" "}
                  <strong className="text-[#0f172a]">service de conciergerie professionnelle</strong>{" "}
                  pour répondre à vos demandes sur mesure : assistance à la réservation, organisation de déplacements,
                  recherches spécifiques ou gestion d&apos;imprévus. Tout se fait à distance — sans nous déplacer : recherches, appels, mails et réservations en votre nom. Service personnalisé, disponible 24h/24, sur devis.
                </p>
                <ul className="mt-6 grid gap-2 sm:grid-cols-2 text-[#334155]">
                  {[
                    "Réservation hôtel & hébergement",
                    "Location de voiture",
                    "Réservation restaurant",
                    "Organisation de déplacements",
                    "Recherche & comparaison sur mesure",
                    "Envoi de cadeaux & attentions",
                  ].map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-[#1d4ed8] shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contact"
                  className="mt-8 inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-[#1e40af] hover:shadow-lg"
                >
                  Demander un devis conciergerie
                </Link>
              </div>
              <div className="rounded-lg border border-[#1d4ed8]/30 bg-[#eff6ff] px-5 py-4">
                <p className="text-sm font-semibold text-[#0f172a]">Sur devis personnalisé</p>
                <p className="mt-1 text-sm text-[#334155]">Tarif adapté à vos besoins et au volume de demandes. 24h/24.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tarif transparent + Nous travaillons avec vos outils */}
        <section className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-6xl space-y-20">
            <div className="card-frame rounded-xl p-10 md:p-14">
              <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
                Un tarif transparent et tout compris
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#334155]">
                Des offres claires, de l&apos;assistance dédiée à la qualité professionnelle. 
                Pas de coût caché : vous savez ce que vous payez et ce que vous obtenez.
              </p>
              <div className="mt-6 rounded-lg border border-[#1d4ed8]/30 bg-[#eff6ff] px-5 py-4">
                <p className="font-semibold text-[#0f172a]">
                  Le coût réel d&apos;un assistant en CDI en France ? ~5 050 €/mois (salaire + charges + bureau + RH). 
                  Nos assistants virtuels : à partir de 215 €/mois, tout compris — jusqu&apos;à ~75 % d&apos;économie.
                </p>
                <Link href="/tarifs" className="mt-3 inline-block text-sm font-medium text-[#1d4ed8] hover:underline">
                  Voir le comparatif détaillé →
                </Link>
              </div>
              <ul className="mt-8 grid gap-2 sm:grid-cols-2 text-[#334155]">
                {[
                  "Équipe dédiée et encadrée",
                  "Formation continue et outils IA",
                  "Plateforme de suivi et de livrables",
                  "Direction et pilotage en France",
                ].map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[#1d4ed8]">✓</span> {item}
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <Link
                  href="/tarifs"
                  className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-[#1e40af] hover:shadow-lg"
                >
                  Voir les tarifs
                </Link>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
                Nous travaillons avec vos outils
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#334155]">
                Intégration transparente à vos outils : CRM, logiciels de gestion, espaces 
                collaboratifs et messageries. Nos assistants travaillent dans votre environnement ; 
                notre plateforme BeWork complète le dispositif pour le suivi des dossiers et la 
                livraison des tâches, avec une traçabilité et une réactivité à la hauteur de vos exigences.
              </p>
            </div>
          </div>
        </section>

        {/* Processus : matching et onboarding */}
        <section id="processus" className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
              Processus de matching et d&apos;onboarding
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#334155]">
              Un parcours structuré : découverte de vos besoins, proposition de profil par notre équipe, puis phase de démarrage avec un cadre clair.
            </p>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                { step: "1", title: "Call de découverte", desc: "Échange pour comprendre vos activités, vos préférences et les outils que vous utilisez. Pas de questionnaire automatisé : un vrai échange avec notre équipe." },
                { step: "2", title: "Proposition de profil", desc: "L'équipe BeWork sélectionne et vous présente un ou plusieurs profils adaptés. Sélection humaine, pas par algorithme." },
                { step: "3", title: "Validation et contrat", desc: "Vous validez le ou les profils, nous signons le cadre de collaboration et définissons les objectifs communs." },
                { step: "4", title: "Onboarding et démarrage", desc: "Phase de démarrage avec un cadre défini : rôles, objectifs, rituels de communication. Mise en place des outils et démarrage opérationnel." },
              ].map((item) => (
                <div key={item.step} className="card-frame rounded-lg p-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1d4ed8] text-lg font-bold text-white">
                    {item.step}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-[#0f172a]">{item.title}</h3>
                  <p className="mt-2 text-[#334155] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ressources */}
        <section id="ressources" className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
                Ressources & bonnes pratiques.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[#334155]">
                Guides et cas d&apos;usage pour mieux comprendre l&apos;assistance
                virtuelle et son impact sur votre activité.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 md:gap-10">
              {RESSOURCES_BLOG.map((r) => (
                <div
                  key={r.title}
                  className="card-frame rounded-lg p-8"
                >
                  <p className="text-lg font-semibold text-[#0f172a]">{r.title}</p>
                  <p className="mt-4 text-[#334155] leading-relaxed">{r.desc}</p>
                  <Link
                    href={r.href}
                    className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[#1d4ed8] transition-colors hover:text-[#1e40af]"
                  >
                    En savoir plus
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ optimisée SEO */}
        <section id="faq" className="px-6 py-24 md:py-28 scroll-mt-24" style={{ scrollMarginTop: "6rem" }}>
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
              Questions fréquentes
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-[#334155]">
              Réponses aux questions les plus posées sur l&apos;assistant administratif externalisé.
            </p>
            <dl className="mt-12 space-y-8">
              {[
                {
                  q: "Combien coûte un assistant administratif ?",
                  a: "Chez BeWork, les offres démarrent à 215€/mois pour une formule Standard (120 actions/mois, soit ~20h), 415€/mois pour Business (240 actions) et 630€/mois pour Premium (360 actions). L'offre Découverte à 109€ permet de tester le service. Tout est inclus : pas de coût caché, pas de recrutement.",
                },
                {
                  q: "Comment fonctionne un assistant administratif externalisé ?",
                  a: "Vous envoyez vos tâches via la plateforme BeWork, un assistant dédié les traite à distance (devis, factures, relances, suivi dossiers), vous suivez l'avancement en temps réel et recevez les livrables. Le tout sans recrutement ni infrastructure : externaliser administratif PME en toute simplicité.",
                },
                {
                  q: "Qui réalise les missions ?",
                  a: "Des assistants francophones diplômés Bac+5, formés à l'IA, encadrés par notre agence en région parisienne. La direction et la supervision sont en France ; la plateforme opérationnelle permet une exécution réactive et de qualité.",
                },
                {
                  q: "Quel est le délai de traitement ?",
                  a: "Réponse moyenne en moins de 2 heures. Les tâches urgentes sont priorisées. Le délai dépend du type de mission et de la complexité ; notre équipe en France assure une coordination fluide pour respecter vos échéances.",
                },
              ].map((item, i) => (
                <div key={i} className="card-frame rounded-xl p-6">
                  <dt className="text-lg font-semibold text-[#0f172a]">{item.q}</dt>
                  <dd className="mt-3 text-[#334155] leading-relaxed">{item.a}</dd>
                </div>
              ))}
            </dl>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: [
                    { "@type": "Question", name: "Combien coûte un assistant administratif ?", acceptedAnswer: { "@type": "Answer", text: "Chez BeWork, les offres démarrent à 215€/mois pour une formule Standard (120 actions/mois), 415€/mois pour Business et 630€/mois pour Premium. L'offre Découverte à 109€ permet de tester le service. Tout est inclus." } },
                    { "@type": "Question", name: "Comment fonctionne un assistant administratif externalisé ?", acceptedAnswer: { "@type": "Answer", text: "Vous envoyez vos tâches via la plateforme BeWork, un assistant dédié les traite à distance, vous suivez l'avancement en temps réel et recevez les livrables. Sans recrutement ni infrastructure." } },
                    { "@type": "Question", name: "Qui réalise les missions ?", acceptedAnswer: { "@type": "Answer", text: "Des assistants francophones diplômés Bac+5, formés à l'IA, encadrés par notre agence en région parisienne. Direction et supervision en France." } },
                    { "@type": "Question", name: "Quel est le délai de traitement ?", acceptedAnswer: { "@type": "Answer", text: "Réponse moyenne en moins de 2 heures. Les tâches urgentes sont priorisées. Notre équipe en France assure une coordination fluide." } },
                  ],
                }),
              }}
            />
          </div>
        </section>

        {/* CTA final */}
        <section id="contact" className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-6xl rounded-2xl border-2 border-[#1d4ed8]/30 bg-[#0f172a] p-12 text-white shadow-xl md:p-16">
            <div className="grid gap-12 md:grid-cols-3 md:items-center md:gap-16">
              <div className="md:col-span-2">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Prêt à déléguer votre administratif ?
                </h2>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#94a3b8]">
                  Découvrez nos offres ou demandez un rendez-vous : notre équipe en France vous répond et vous propose l&apos;offre adaptée à votre activité.
                </p>
              </div>
              <div className="flex flex-col gap-4 md:items-end">
                <Link
                  href="/tarifs"
                  className="inline-flex w-full justify-center rounded-lg border-2 border-white bg-white px-8 py-4 font-semibold text-[#0f172a] shadow-md transition-all hover:bg-[#f8f9fb] md:w-auto"
                >
                  Voir les tarifs
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex w-full justify-center rounded-lg bg-[#1d4ed8] px-8 py-4 font-semibold text-white shadow-md transition-all hover:bg-[#1e40af] md:w-auto"
                >
                  Demander un rendez-vous
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#c8cdd6] bg-[#f8f9fb] px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 text-sm text-[#334155] md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <BeWorkLogo size="sm" />
              <span className="text-[#0f172a]">© {new Date().getFullYear()} BeWork</span>
            </div>
            <span className="text-[#64748b]">
              Société française — Agence principale : Île-de-France (Laure Olivie) — Plateforme internationale supervisée depuis la France
            </span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link className="font-medium transition-colors hover:text-[#0f172a]" href="/inscription">
              Tester BeWork
            </Link>
            <Link className="font-medium transition-colors hover:text-[#0f172a]" href="/inscription">
              Créer un compte
            </Link>
            <Link className="font-medium transition-colors hover:text-[#0f172a]" href="/connexion">
              Connexion
            </Link>
            <Link className="font-medium transition-colors hover:text-[#0f172a]" href="/faq">
              FAQ
            </Link>
            <Link className="font-medium transition-colors hover:text-[#0f172a]" href="/tarifs">
              Tarifs administratif
            </Link>
            <Link className="font-medium transition-colors hover:text-[#0f172a]" href="/communication-digitale">
              Tarifs communication
            </Link>
            <Link className="font-medium transition-colors hover:text-[#0f172a]" href="/blog">
              Blog
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}