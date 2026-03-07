import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#e0e4ea]">
      <header className="sticky top-0 z-20 border-b border-[#c8cdd6] bg-[#f8f9fb]">
        <div className="mx-auto max-w-6xl px-6 py-4">
          {/* Ligne 1 : Logo + boutons */}
          <div className="flex items-center justify-between">
            <Link href="/" className="shrink-0">
              <BeWorkLogo size="sm" />
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/contact"
                className="hidden rounded-lg border border-[#c8cdd6] bg-white px-5 py-2.5 text-sm font-medium text-[#1e293b] shadow-sm transition-all hover:border-[#9ca3af] hover:bg-[#f8f9fb] sm:inline-flex"
              >
                Contact
              </Link>
              <Link
                href="/connexion"
                className="rounded-lg bg-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#1e40af] hover:shadow-lg"
              >
                Accéder
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
            <Link className="whitespace-nowrap transition-colors hover:text-[#0f172a]" href="/tarifs">Tarifs</Link>
            <a className="whitespace-nowrap transition-colors hover:text-[#0f172a]" href="#equipe">Équipe</a>
            <a className="whitespace-nowrap transition-colors hover:text-[#0f172a]" href="#conciergerie">Conciergerie</a>
            <Link className="whitespace-nowrap transition-colors hover:text-[#0f172a]" href="/contact">Contact</Link>
          </nav>
        </div>
      </header>

      <main className="pt-0">
        {/* Hero — message orienté bénéfice + CTAs + mockup */}
        <section id="hero" className="px-6 pt-20 pb-20 md:pt-24 md:pb-24" style={{ scrollMarginTop: "6rem" }}>
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
              <div>
                <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-[#0f172a] md:text-4xl lg:text-5xl">
                  Gagnez jusqu&apos;à 20 heures par semaine grâce à un assistant administratif dédié.
                </h1>
                <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-[#334155] md:text-lg">
                  Emails, devis, factures, relances, suivi de dossiers : nos assistants francophones gèrent votre administratif pendant que vous vous concentrez sur votre activité.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/tarifs"
                    className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3.5 text-center font-semibold text-white shadow-lg transition-all hover:bg-[#1e40af] hover:shadow-xl"
                    aria-label="Découvrir les tarifs BeWork"
                  >
                    Découvrir les tarifs
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex rounded-lg border-2 border-[#1d4ed8] bg-transparent px-6 py-3.5 text-center font-semibold text-[#1d4ed8] transition-all hover:bg-[#eff6ff]"
                  >
                    Demander une démo
                  </Link>
                </div>
                <p className="mt-6 text-sm text-[#64748b]">
                  Plateforme internationale supervisée depuis la France. Dès 215€/mois, sans recrutement.
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
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <Link href="/connexion" className="text-sm font-medium text-[#1d4ed8] hover:underline">
                Se connecter
              </Link>
              <Link href="/inscription" className="text-sm font-medium text-[#64748b] hover:text-[#0f172a]">
                Créer un compte
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

        {/* Une plateforme de suivi simple et transparente */}
        <section id="plateforme" className="px-6 py-16 md:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#0f172a] md:text-3xl">
                  Une plateforme de suivi simple et transparente
                </h2>
                <p className="mt-4 text-[#334155] leading-relaxed">
                  Suivez vos tâches, échangez avec votre assistant et consultez l&apos;historique en un coup d&apos;œil.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "Suivi des tâches en temps réel",
                    "Messagerie avec l'assistant dédié",
                    "Gestion documentaire centralisée",
                    "Historique des actions et reporting",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] text-[#1d4ed8]">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      </span>
                      <span className="text-[#334155]">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/tarifs" className="mt-8 inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-semibold text-white hover:bg-[#1e40af]">
                  Découvrir les tarifs
                </Link>
              </div>
              <div className="relative flex justify-center lg:justify-end">
                <div className="w-full max-w-sm rounded-xl border-2 border-[#c8cdd6] bg-white p-4 shadow-lg">
                  <div className="flex gap-2 mb-3">
                    <span className="h-2 w-2 rounded-full bg-[#94a3b8]" /><span className="h-2 w-2 rounded-full bg-[#94a3b8]" /><span className="h-2 w-2 rounded-full bg-[#94a3b8]" />
                  </div>
                  <div className="space-y-2 rounded-lg bg-[#f8fafc] p-3 text-sm">
                    {["Tâches · En cours", "Messages · 2 non lus", "Documents · À jour", "Rapport · Ce mois"].map((l, i) => (
                      <div key={i} className="rounded bg-white px-3 py-2 border border-[#e2e8f0]">{l}</div>
                    ))}
                  </div>
                </div>
              </div>
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

        {/* Qui sommes-nous */}
        <section id="equipe" className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
                Une équipe triée sur le volet.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[#334155]">
                BeWork est une société française fondée par{" "}
                <strong className="text-slate-900">Laure Olivie</strong>, formatrice
                IA reconnue et diplômée. Votre interlocuteur principal est notre{" "}
                <strong className="text-slate-900">agence en région parisienne</strong>,
                qu&apos;elle dirige au quotidien. Une plateforme opérationnelle internationale
                est supervisée depuis la France en temps réel, pour une qualité et une réactivité identiques.
                Notre équipe est composée de diplômés Bac+5 minimum, expérimentés et
                formés aux outils d&apos;intelligence artificielle.
              </p>
            </div>
            <div className="card-frame rounded-xl p-10 md:p-14">
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
              {[
                {
                  title: "Mise en place d’un assistant virtuel",
                  desc: "Comment démarrer rapidement et intégrer l’IA dans vos process administratifs.",
                },
                {
                  title: "Délégation et suivi des dossiers",
                  desc: "Bonnes pratiques pour déléguer en confiance et garder la main sur l’avancement.",
                },
                {
                  title: "IA et qualité administrative",
                  desc: "Rigueur, traçabilité et gain de temps avec des assistants formés à l’IA.",
                },
              ].map((r) => (
                <div
                  key={r.title}
                  className="card-frame rounded-lg p-8"
                >
                  <p className="text-lg font-semibold text-[#0f172a]">
                    {r.title}
                  </p>
                  <p className="mt-4 text-[#334155] leading-relaxed">{r.desc}</p>
                  <Link
                    href="/assistants-administratifs-taches"
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
            <Link className="font-medium transition-colors hover:text-[#0f172a]" href="/connexion">
              Connexion
            </Link>
            <Link className="font-medium transition-colors hover:text-[#0f172a]" href="/inscription">
              Inscription
            </Link>
            <Link className="font-medium transition-colors hover:text-[#0f172a]" href="/tarifs">
              Tarifs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
