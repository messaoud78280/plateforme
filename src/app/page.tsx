import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#e0e4ea]">
      <header className="sticky top-0 z-20 border-b border-[#c8cdd6] bg-[#f8f9fb]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-12 px-6 py-5">
          <Link href="/" className="shrink-0 mr-8 md:mr-12">
            <BeWorkLogo size="sm" />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-[#334155] md:flex">
            <a className="transition-colors hover:text-[#0f172a]" href="#solutions">
              Solutions
            </a>
            <a className="transition-colors hover:text-[#0f172a]" href="#equipe">
              Notre équipe
            </a>
            <a className="transition-colors hover:text-[#0f172a]" href="#secteurs">
              Secteurs
            </a>
            <Link className="transition-colors hover:text-[#0f172a]" href="/tarifs">
              Tarifs
            </Link>
            <a className="transition-colors hover:text-[#0f172a]" href="#avantages">
              Avantages
            </a>
            <a className="transition-colors hover:text-[#0f172a]" href="#pourquoi-nous">
              Pourquoi nous
            </a>
            <a className="transition-colors hover:text-[#0f172a]" href="#ressources">
              Ressources
            </a>
            <Link className="transition-colors hover:text-[#0f172a]" href="/contact">
              Contact
            </Link>
          </nav>

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
      </header>

      <main className="pt-0">
        {/* Hero — marge suffisante pour ne jamais chevaucher le header */}
        <section className="px-6 pt-24 pb-16 md:pt-28 md:pb-20" style={{ scrollMarginTop: "6rem" }}>
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
              <div className="mb-12 flex w-full flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
                <Link
                  href="/connexion"
                  className="w-full rounded-lg border border-[#1d4ed8] bg-[#1d4ed8] px-8 py-4 text-center font-semibold text-white shadow-lg transition-all hover:bg-[#1e40af] hover:shadow-xl sm:w-auto"
                >
                  Se connecter
                </Link>
                <Link
                  href="/inscription"
                  className="w-full rounded-lg border-2 border-[#c8cdd6] bg-white px-8 py-4 text-center font-semibold text-[#1e293b] shadow-sm transition-all hover:border-[#9ca3af] hover:bg-[#f8f9fb] sm:w-auto"
                >
                  Créer un compte
                </Link>
                <Link
                  href="/tarifs"
                  className="w-full rounded-lg border-2 border-[#1d4ed8] bg-transparent px-8 py-4 text-center font-semibold text-[#1d4ed8] transition-all hover:bg-[#eff6ff] sm:w-auto"
                >
                  Voir les tarifs
                </Link>
              </div>

              <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-[#0f172a] md:text-6xl md:leading-tight">
                Assistants administratifs augmentés par l&apos;IA. En France,
                pour les professionnels exigeants.
              </h1>

              <p className="mt-8 max-w-2xl text-pretty text-base leading-relaxed text-[#334155] md:text-lg md:leading-relaxed">
                BeWork vous propose un service d&apos;assistants virtuels
                qualifiés, formés à l&apos;intelligence artificielle. Gestion
                administrative, suivi de dossiers, documents et coordination :
                une équipe rigoureuse et efficace à votre service.
              </p>

              <p className="mt-6 text-base font-semibold text-[#1e293b]">
                BeWork, l&apos;assistant administratif pas comme les autres.
              </p>

              <div className="mt-10 flex w-full max-w-2xl justify-center">
                <div className="card-frame rounded-lg border-2 border-[#1d4ed8]/30 bg-white px-8 py-4 text-center">
                  <p className="text-lg font-semibold text-[#0f172a] md:text-xl">
                    Nos prestations sont{" "}
                    <span className="text-[#1d4ed8]">40 à 60&nbsp;%</span>
                    {" "}moins chères qu&apos;en France.
                  </p>
                  <p className="mt-2 text-sm text-[#334155]">
                    Qualité professionnelle, tarifs compétitifs.
                  </p>
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
                "Même fuseau horaire qu'en France : nous travaillons avec l'Algérie pour une collaboration en temps réel.",
                "Diplômés Bac+5 minimum, formés à l'IA et aux process administratifs.",
                "Garantie : satisfait ou remplacé rapidement.",
                "Direction et pilotage en France pour rester au plus proche de vos attentes.",
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
                qu&apos;elle dirige au quotidien. Une agence secondaire en Algérie
                opère sous son pilotage et celui d&apos;expatriés français qui la
                dirigent en temps réel, pour une qualité et une réactivité identiques.
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
                    Agence secondaire — Algérie
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#64748b]">
                    Sous direction française en temps réel
                  </p>
                  <p className="mt-3 text-[#334155] leading-relaxed">
                    L&apos;agence en Algérie est pilotée au quotidien par Laure et
                    par des cadres expatriés français. Même fuseau horaire que la
                    France, même niveau d&apos;exigence : sélection Bac+5, formation
                    IA et encadrement continu pour une assistance réactive et
                    professionnelle.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pourquoi l'Algérie / Notre organisation */}
        <section id="pourquoi-nous" className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
              Pourquoi collaborer avec nous ?
            </h2>
            <ul className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                "Interlocuteur principal en Île-de-France (Laure Olivie) : proximité et réactivité.",
                "Agence en Algérie pilotée en temps réel par des dirigeants français expatriés.",
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

        {/* Secteurs */}
        <section id="secteurs" className="px-6 py-24 md:py-28">
          <div className="card-frame mx-auto max-w-6xl rounded-xl p-10 md:p-14">
            <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
              Pour les professionnels et les entreprises exigeants.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#334155]">
              Dirigeants, cadres, PME ou grands comptes : vous avez besoin
              d&apos;une assistance administrative fiable et réactive. Nous nous
              adaptons à votre secteur et à vos process.
            </p>
            <div className="mt-12 flex flex-wrap gap-3">
              {[
                "Dirigeants & cadres",
                "PME & ETI",
                "Cabinet juridique",
                "Comptabilité & finance",
                "Consulting",
                "Santé",
                "Immobilier",
                "Associations & institutions",
                "Profession libérale",
                "E-commerce",
                "Événementiel",
                "BTP",
              ].map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg border border-[#c8cdd6] bg-white px-4 py-2 text-sm font-medium text-[#334155] transition-colors hover:border-[#1d4ed8] hover:text-[#1d4ed8]"
                >
                  {tag}
                </span>
              ))}
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

        {/* Processus en 4 étapes */}
        <section id="processus" className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
              Le processus de mise en place en 4 étapes
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#334155]">
              Un cadre clair pour démarrer sereinement et obtenir des résultats rapidement.
            </p>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                { step: "1", title: "Analyse de vos besoins", desc: "Nous analysons avec vous vos besoins, vos process et les compétences à mettre à disposition." },
                { step: "2", title: "Sélection et présentation", desc: "Nous vous présentons des profils préqualifiés (Bac+5, formation IA, savoir-être) adaptés à votre contexte." },
                { step: "3", title: "Validation et contrat", desc: "Vous validez le ou les profils, nous signons le cadre de collaboration et définissons les objectifs." },
                { step: "4", title: "Onboarding et démarrage", desc: "Mise en place des outils, des rituels de suivi et démarrage opérationnel avec un encadrement dédié." },
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
                    href="/contact"
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

        {/* CTA bas */}
        <section id="contact" className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-6xl rounded-xl border-2 border-[#c8cdd6] bg-[#0f172a] p-12 text-white shadow-lg md:p-16">
            <div className="grid gap-12 md:grid-cols-3 md:items-center md:gap-16">
              <div className="md:col-span-2">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Envie d&apos;une démo ou d&apos;un tarif personnalisé ?
                </h2>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#94a3b8]">
                  Dites-nous votre contexte (volume de dossiers, besoins
                  administratifs, secteur) : notre équipe en France vous
                  répond et vous propose l&apos;offre adaptée.
                </p>
              </div>
              <div className="flex flex-col gap-4 md:items-end">
                <Link
                  href="/tarifs"
                  className="inline-flex w-full justify-center rounded-lg border border-[#c8cdd6] bg-white px-8 py-4 font-semibold text-[#0f172a] shadow-md transition-all hover:bg-[#f8f9fb] md:w-auto"
                >
                  Voir les tarifs
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex w-full justify-center rounded-lg bg-[#1d4ed8] px-8 py-4 font-semibold text-white shadow-md transition-all hover:bg-[#1e40af] md:w-auto"
                >
                  Demande de contact et RDV
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
              Société française — Agence principale : Île-de-France (Laure Olivie) — Agence secondaire : Algérie (sous direction française en temps réel)
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
