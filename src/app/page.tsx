import type { Metadata } from "next";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { SITE_URL } from "@/lib/site";

const RESSOURCES_BLOG = [
  {
    title: "10 tâches administratives à déléguer en BTP",
    desc: "Ce qui grève le quotidien des chefs d’entreprise du bâtiment — et comment le structurer autrement.",
    href: "/blog/10-taches-administratives-deleguer-dirigeant",
  },
  {
    title: "Combien coûte un administratif externalisé ?",
    desc: "Comparatif forfait externalisé vs embauche : coûts cachés, charges sociales et charge RH pour les PME.",
    href: "/blog/combien-coute-assistant-administratif",
  },
  {
    title: "Externaliser ou recruter : le bon choix pour votre entreprise",
    desc: "Recrutement, RH, matériel… ou une équipe opérationnelle sans friction. Les critères pour décider sereinement.",
    href: "/blog/assistant-virtuel-vs-assistant-salarie",
  },
];

export const metadata: Metadata = {
  title: "Organisation & administratif premium pour artisans et BTP | BeWork",
  description:
    "Pilotage administratif pour artisans et entreprises du bâtiment : devis, facturation chantier, relances, organisation. Pensé par une fondatrice avec 20 ans d’expérience artisanale. Dès 215 € TTC/mois, sans recrutement ni charges. France, Belgique, Suisse, Luxembourg.",
  keywords: [
    "administratif BTP",
    "organisation entreprise bâtiment",
    "devis facturation artisan",
    "externaliser administratif BTP",
    "pilotage administratif artisans",
  ],
  alternates: { canonical: SITE_URL, languages: { fr: SITE_URL } },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: "BeWork",
    title: "BeWork — Administratif premium pour artisans et BTP",
    description:
      "Structurez votre administratif de chantier sans embauche. Dès 215 € TTC/mois. France, Belgique, Suisse, Luxembourg.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BeWork — Administratif premium pour artisans et BTP",
    description:
      "Gain de temps, trésorerie et image pro : un service structuré pour le BTP. Dès 215 € TTC/mois.",
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#e0e4ea]">
      <header className="sticky top-0 z-20 bg-[#f8f9fb] shadow-[0_1px_0_0_rgba(203,213,225,0.9)]">
        {/* Zone marque / actions — claire, délimitée */}
        <div className="mx-auto max-w-6xl border-b border-[#dce3ec] px-4 py-2.5 sm:px-6 sm:py-3">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="shrink-0">
              <BeWorkLogo
                size="sm"
                showTagline
                tagline="Organisation & administratif premium — le BTP, au quotidien"
              />
            </Link>
            <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
              <Link
                href="/connexion"
                className="rounded-lg surface-metallic-light px-3.5 py-2 text-xs font-medium text-[#1e293b] shadow-sm transition-all hover:bg-[#f8f9fb] sm:px-4 sm:text-sm"
              >
                Connexion
              </Link>
              <Link
                href="/contact"
                className="hidden rounded-lg surface-metallic-light px-3.5 py-2 text-xs font-medium text-[#1e293b] shadow-sm transition-all hover:border-[#9ca3af] hover:bg-[#f8f9fb] sm:inline-flex sm:px-4 sm:text-sm"
              >
                Contact
              </Link>
              <Link
                href="/inscription"
                className="rounded-lg bg-[#1d4ed8] px-3.5 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-[#1e40af] hover:shadow-lg sm:px-4 sm:text-sm"
              >
                Tester BeWork
              </Link>
            </div>
          </div>
        </div>
        {/* Navigation — bandeau bleu métallisé pleine largeur (distinct du bloc du haut) */}
        <div className="nav-strip-metallic-blue nav-strip-metallic-blue--compact hidden md:block">
          <nav
            className="nav-strip-metallic-blue__nav mx-auto flex max-w-6xl flex-nowrap items-center justify-center gap-x-0 px-3 py-1.5 sm:px-5 sm:py-2"
            aria-label="Navigation principale"
          >
            <a className="whitespace-nowrap" href="#plateforme" title="Offre, plateforme et secteurs — dont le BTP">
              Offre & secteurs
            </a>
            <Link className="whitespace-nowrap" href="/tarifs" title="Tarifs — sans recrutement ni charges">
              Tarifs
            </Link>
            <Link className="whitespace-nowrap" href="/blog">
              Blog
            </Link>
            <a className="whitespace-nowrap" href="#equipe">
              Équipe
            </a>
            <Link className="whitespace-nowrap" href="/faq">
              FAQ
            </Link>
          </nav>
        </div>
      </header>

      <main className="pt-0">
        {/* Hero + parcours client (4 étapes) */}
        <section id="hero" className="px-6 pt-24 pb-24 md:pt-32 md:pb-32" style={{ scrollMarginTop: "6rem" }}>
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch lg:gap-10">
              <div className="flex flex-col gap-8 text-center md:text-left">
                <h1 className="text-metallic-black text-balance text-3xl font-bold leading-[1.15] tracking-tight md:text-4xl lg:text-5xl lg:leading-[1.1]">
                  Artisans et entreprises du BTP : moins d&apos;administratif, plus de chantiers.
                </h1>
                <Link
                  href="/tarifs"
                  className="group surface-metallic-blue mx-auto flex w-full max-w-xl flex-col gap-3 rounded-2xl px-6 py-6 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#93c5fd]/80 md:mx-0 md:max-w-none"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#93c5fd]">
                    Formule de référence
                  </span>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                    <span className="text-4xl font-bold tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)] tabular-nums md:text-[2.75rem]">
                      215
                    </span>
                    <span className="text-xl font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">€</span>
                    <span className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-[#cbd5e1]">TTC</span>
                    <span className="text-lg font-semibold text-[#cbd5e1]">/ mois</span>
                  </div>
                  <div className="space-y-1.5 text-sm leading-snug text-[#e2e8f0]">
                    <p className="font-medium text-white">≈ 20 h incluses</p>
                    <p className="font-medium text-white">À partir de 10 €/h</p>
                    <p className="pt-1 text-[#cbd5e1]">
                      Sans recrutement, sans charges sociales, sans gestion RH : une équipe prête à l&apos;emploi.
                    </p>
                    <p className="text-[#cbd5e1]">
                      Solution immédiatement opérationnelle — vous ne payez que le pilotage dont vous avez besoin.
                    </p>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#94a3b8]">
                    TTC, sans frais cachés · Sans engagement long terme · Mise en route rapide
                  </p>
                  <span className="text-xs font-semibold text-[#93c5fd] group-hover:text-white group-hover:underline">
                    Voir les tarifs →
                  </span>
                </Link>
                <p className="max-w-xl text-lg font-medium leading-relaxed text-[#0f172a] md:text-xl mx-auto md:mx-0">
                  BeWork structure et optimise votre administratif de terrain : devis clients, facturation chantier,
                  relances, mails, organisation. Une offre premium pensée pour le bâtiment — portée par une fondatrice
                  avec <strong className="font-semibold text-[#0f172a]">20 ans d&apos;expérience en artisanat</strong>.
                  Vous gagnez du temps, de la sérénité et une image plus professionnelle, sans passer par l&apos;embauche.
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <Link
                    href="/inscription"
                    className="inline-flex rounded-lg bg-[#1d4ed8] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#1d4ed8]/25 transition-all hover:bg-[#1e40af] hover:shadow-xl hover:shadow-[#1d4ed8]/30"
                    aria-label="Tester BeWork gratuitement"
                  >
                    Tester BeWork
                  </Link>
                  <Link
                    href="#comment-ca-marche"
                    className="inline-flex rounded-lg surface-metallic-light px-6 py-3.5 text-base font-medium text-[#334155] transition-all hover:border-[#c8cdd6] hover:bg-[#f8fafc]"
                    aria-label="Voir le parcours client en quatre étapes"
                  >
                    Voir le parcours
                  </Link>
                </div>
                <p className="text-sm text-[#64748b]">
                  France, Belgique, Suisse • sans embauche, sans charges cachées
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm text-[#64748b]">
                  <Link href="/inscription" className="font-medium hover:text-[#0f172a] hover:underline">
                    Créer un compte
                  </Link>
                  <Link href="/connexion" className="font-medium hover:text-[#0f172a]">
                    Se connecter
                  </Link>
                </div>
              </div>
              <div
                id="comment-ca-marche"
                className="surface-metallic-blue flex h-full flex-col rounded-2xl p-6 md:p-7"
              >
                <div className="mb-5 md:mb-6">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#93c5fd]">
                    Votre cadence
                  </span>
                  <h2 className="mt-2 text-lg font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)] md:text-xl">
                    Quatre étapes, un pilotage clair
                  </h2>
                  <p className="mt-2 text-sm leading-snug text-[#cbd5e1]">
                    De la consigne au livrable : un flux structuré pour sécuriser votre administratif de chantier.
                  </p>
                </div>
                <div className="grid flex-1 auto-rows-fr gap-3 sm:grid-cols-2 sm:gap-4">
                  {[
                    { step: 1, title: "Vous déposez vos demandes (devis, factures, relances…)" },
                    { step: 2, title: "Votre équipe dédiée les traite dans les délais" },
                    { step: 3, title: "Vous pilotez l’avancement sur la plateforme" },
                    { step: 4, title: "Vous libérez du temps pour le terrain et la rentabilité" },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="surface-metallic-blue surface-metallic-blue--inset flex min-h-[9rem] flex-col items-center rounded-2xl px-4 pb-5 pt-5 text-center sm:min-h-[9.5rem]"
                    >
                      <span className="relative inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-white via-[#dbe6f2] to-[#8fa9c2] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#0c1f33] shadow-[0_3px_12px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.95)] ring-2 ring-white/35 sm:text-xs sm:tracking-[0.1em]">
                        Étape {item.step}
                      </span>
                      <h3 className="mt-4 flex w-full max-w-[17rem] flex-1 flex-col justify-center text-balance text-sm font-semibold leading-snug text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)] sm:max-w-none">
                        {item.title}
                      </h3>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Deux propositions tarifaires distinctes */}
        <section id="tarifs" className="scroll-mt-24 px-6 py-16 md:py-20" style={{ scrollMarginTop: "6rem" }}>
          <div className="mx-auto max-w-6xl rounded-2xl surface-metallic-light surface-metallic-light--soft px-6 py-12 md:px-10 md:py-16">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-[#0f172a] md:text-3xl">
                Des tarifs nets pour artisans et entreprises du bâtiment
              </h2>
              <p className="mt-3 text-[#334155]">
                Une entrée de gamme pour tester, puis des forfaits qui montent en puissance — sans surprise, sans embauche.
              </p>
              <div className="mt-10 flex justify-center">
                <Link
                  href="/tarifs"
                  className="group surface-metallic-blue flex w-full max-w-md flex-col rounded-2xl p-6 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#93c5fd]/80"
                >
                  <span className="text-sm font-medium text-[#94a3b8]">Pilotage administratif</span>
                  <h3 className="mt-1 text-lg font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                    Forfaits BeWork
                  </h3>
                  <p className="mt-2 text-sm leading-snug text-[#cbd5e1]">
                    Devis clients, facturation chantier, relances, suivi de dossiers… Dès 109 € TTC pour tester, sans engagement lourd.
                  </p>
                  <p className="mt-3 text-base font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">
                    <span className="tabular-nums">215</span> €{" "}
                    <span className="text-sm font-semibold text-[#cbd5e1]">TTC</span> / mois{" "}
                    <span className="text-[#93c5fd] transition-colors group-hover:text-white" aria-hidden>
                      →
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-[#94a3b8]">TTC, sans frais cachés · Démarrage rapide</p>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Pourquoi externaliser son administratif */}
        <section id="pourquoi-externaliser" className="scroll-mt-24 px-6 py-16 md:py-20" style={{ scrollMarginTop: "6rem" }}>
          <div className="mx-auto max-w-6xl rounded-2xl surface-metallic-light surface-metallic-light--soft px-6 py-12 md:px-10 md:py-16">
            <div className="text-center mb-10 md:mb-12">
              <h2 className="text-2xl font-bold tracking-tight text-[#0f172a] md:text-3xl">
                Quand l&apos;administratif vous vole vos soirées — et votre marge
              </h2>
              <p className="mt-3 max-w-2xl mx-auto text-[#334155] leading-relaxed">
                Les devis qui s&apos;étalent après 19 h. Les factures chantier qui prennent du retard. Les mails qui
                s&apos;accumulent. L&apos;organisation qui vous freine avant même d&apos;ouvrir le camion.
                <strong className="font-semibold text-[#0f172a]">
                  {" "}
                  BeWork transforme ce chaos en pilotage structuré
                </strong>{" "}
                : une équipe dédiée, des process clairs, pour que vous recentriez énergie et trésorerie sur vos ouvrages.
              </p>
            </div>
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 md:items-stretch">
              {[
                "Gain de temps massif : vous sortez du secrétariat, vous rentrez dans le chantier et le chiffrage.",
                "Coût maîtrisé : zéro recrutement, zéro charges sociales — forfait tout compris dès 215 € TTC/mois.",
                "Réactivité : équipe opérationnelle après un onboarding court, adaptée au rythme du BTP.",
                "Évolutif : montez ou baissez le volume d’actions selon vos pics de devis ou de facturation.",
                "Exigence : profils francophones Bac+5, outils et IA maîtrisés, encadrement en France.",
                "Souplesse : structurez votre administratif sans vous enfermer dans un CDI ni une structure lourde.",
              ].map((item, i) => (
                <li key={i} className="card-frame flex h-full gap-3 rounded-xl p-5">
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
                Jusqu&apos;à 75&nbsp;% d&apos;économie vs une embauche en interne
              </h2>
              <p className="mt-3 max-w-2xl mx-auto text-[#334155]">
                Même exigence professionnelle : autrement plus de cash disponible pour matériel, sous-traitance et chantiers.
              </p>
            </div>
            <div className="card-frame rounded-2xl border-2 border-[#1d4ed8]/20 overflow-hidden">
              <div className="grid divide-y divide-[#e2e8f0] md:grid-cols-2 md:items-stretch md:divide-x md:divide-y-0">
                <div className="flex flex-col p-8 md:p-10">
                  <h3 className="text-lg font-bold text-[#0f172a]">Poste administratif en interne (Europe)</h3>
                  <ul className="mt-4 space-y-2 text-[#334155]">
                    {["Salaire brut", "Charges sociales", "Bureau & matériel", "Recrutement & formation"].map((line) => (
                      <li key={line} className="flex items-center gap-2">
                        <span className="text-[#94a3b8]">•</span> {line}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-auto pt-6 text-2xl font-bold text-[#64748b]">~5 050 € / mois</p>
                </div>
                <div className="flex flex-col bg-[#eff6ff]/50 p-8 md:p-10">
                  <h3 className="text-lg font-bold text-[#1d4ed8]">Forfait BeWork</h3>
                  <ul className="mt-4 space-y-2 text-[#334155]">
                    {["Un seul forfait tout compris", "Aucun coût de recrutement", "Aucune charge sociale", "Plateforme incluse"].map((line) => (
                      <li key={line} className="flex items-center gap-2">
                        <span className="text-[#1d4ed8]">✓</span> {line}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-auto pt-6 text-2xl font-bold text-[#1d4ed8]">
                    <span className="tabular-nums">215</span> € <span className="text-base font-semibold text-[#64748b]">TTC</span> / mois
                  </p>
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
              Ils nous confient leur administratif
            </h2>
            <div className="mb-12 grid gap-8 md:grid-cols-2 md:items-stretch lg:grid-cols-4">
              {[
                {
                  sector: "Entreprise de second œuvre",
                  quote: "Nos devis sortent plus vite, les relances sont faites : on respire sur les chantiers.",
                },
                {
                  sector: "Artisan gros œuvre",
                  quote: "Moins de retard sur la facturation chantier — la trésorerie suit enfin le rythme des acomptes.",
                },
                {
                  sector: "Coffrage / génie civil",
                  quote: "Une structure pro derrière nous : mails, organisation, suivi fournisseurs, sans recruter.",
                },
                {
                  sector: "PME du bâtiment",
                  quote: "On a retrouvé des soirées sans Excel. L'image auprès des clients maîtres d'ouvrage est plus nette.",
                },
              ].map((item) => (
                <div key={item.sector} className="card-frame flex h-full flex-col rounded-xl p-6">
                  <p className="flex-1 text-[#334155] leading-relaxed italic">&ldquo;{item.quote}&rdquo;</p>
                  <p className="mt-4 text-sm font-semibold text-[#1d4ed8]">{item.sector}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-[#64748b]">
              Artisans, chefs d’entreprise du bâtiment et PME du BTP — France, Belgique, Suisse, Luxembourg.
            </p>
          </div>
        </section>

        {/* Une plateforme simple pour déléguer votre administratif */}
        <section id="plateforme" className="px-6 py-20 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-2xl font-bold tracking-tight text-[#0f172a] md:text-3xl lg:text-4xl">
                Une plateforme pour piloter votre administratif de chantier
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-[#475569]">
                Consignes, échanges, livrables et statuts : tout est centralisé, traçable et aligné sur vos priorités terrain.
              </p>
            </div>

            {/* Démo dashboard — contenu réel */}
            <div className="mb-20 flex justify-center">
              <div className="w-full max-w-5xl overflow-hidden rounded-xl surface-metallic-light shadow-xl shadow-[#0f172a]/8">
                <div className="flex items-center gap-2 border-b border-[#e2e8f0] bg-[#f8fafc] px-5 py-3.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#94a3b8]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#94a3b8]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#94a3b8]" />
                  <span className="ml-2 text-sm font-medium text-[#64748b]">Dashboard BeWork</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#e2e8f0] p-px">
                  {/* Colonne 1 : Nouvelle demande */}
                  <div className="surface-metallic-light p-5">
                    <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Nouvelle demande</h3>
                    <div className="space-y-2.5">
                      {[
                        { title: "Chiffrer devis rénovation immeuble", cat: "Devis clients" },
                        { title: "Relancer situation de travaux n° ST-118", cat: "Suivi chantier" },
                        { title: "Mettre à jour planning sous-traitants", cat: "Organisation" },
                      ].map((d, i) => (
                        <div key={i} className="rounded-lg surface-metallic-light px-3 py-2.5 text-left shadow-sm hover:border-[#1d4ed8]/30 transition-colors">
                          <p className="text-sm font-medium text-[#0f172a] line-clamp-1">{d.title}</p>
                          <p className="mt-0.5 text-xs text-[#64748b]">{d.cat}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Colonne 2 : Messagerie */}
                  <div className="surface-metallic-light p-5">
                    <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Échanges</h3>
                    <div className="space-y-2.5">
                      {[
                        { from: "Équipe BeWork", msg: "Le devis est validé côté chiffrage, je vous l’envoie pour relecture.", time: "10:24" },
                        { from: "Vous", msg: "Parfait — ajoutez la mention garantie décennale sur la dernière page.", time: "09:52" },
                        { from: "Équipe BeWork", msg: "Reçu. Je mets à jour et je relance le client pour signature.", time: "Hier 16:30" },
                      ].map((m, i) => (
                        <div key={i} className="rounded-lg surface-metallic-light px-3 py-2.5 text-left shadow-sm">
                          <p className="text-xs font-medium text-[#1d4ed8]">{m.from}</p>
                          <p className="mt-0.5 text-xs text-[#475569] line-clamp-2">{m.msg}</p>
                          <p className="mt-1 text-[10px] text-[#94a3b8]">{m.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Colonne 3 : Mes demandes */}
                  <div className="surface-metallic-light p-5">
                    <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Mes demandes</h3>
                    <div className="space-y-2.5">
                      {[
                        { title: "Devis extension bureaux", status: "En cours", color: "bg-blue-100 text-blue-800" },
                        { title: "Relance facture chantier", status: "Terminée", color: "bg-green-100 text-green-800" },
                        { title: "Mise en forme situation travaux", status: "En attente", color: "bg-amber-100 text-amber-800" },
                      ].map((t, i) => (
                        <div key={i} className="rounded-lg surface-metallic-light px-3 py-2.5 text-left shadow-sm">
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
            <div className="grid gap-10 md:grid-cols-3 md:items-stretch md:gap-8">
              {[
                {
                  title: "Créer une demande",
                  description:
                    "Devis, relance client, situation de travaux : une consigne claire, des pièces jointes, un dossier unique.",
                  icon: "M12 6v6m0 0v6m0-6h6m-6 0H6",
                },
                {
                  title: "Échanges avec votre équipe dédiée",
                  description:
                    "Questions, ajustements, validations : le fil de discussion reste pro, traçable et au même endroit.",
                  icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
                },
                {
                  title: "Suivi des missions",
                  description:
                    "Statuts, livrables, échéances : vous voyez ce qui avance, ce qui bloque, sans relancer par téléphone.",
                  icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
                },
              ].map((item, i) => (
                <div key={i} className="surface-metallic-light flex h-full flex-col rounded-xl p-6 text-left">
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
                Exigence terrain, exigence administrative
              </h2>
              <p className="mt-5 max-w-2xl mx-auto text-lg leading-relaxed text-[#334155]">
                Allégez votre charge de pilotage sans baisser le niveau : une équipe structurée, francophone, outillée — pour
                des dossiers propres et une image irréprochable auprès de vos clients.
              </p>
            </div>
            <ul className="grid gap-6 md:grid-cols-2 md:items-stretch lg:grid-cols-3">
              {[
                "Zéro recrutement, zéro investissement matériel : l’équipe est opérationnelle après onboarding cadré.",
                "Profils qualifiés, 100 % francophones, encadrés et alignés sur vos délais de chantier.",
                "Même fuseau qu’en France : supervision depuis la France, réactivité quand ça presse sur le terrain.",
                "Bac+5 minimum, formation IA et process administratifs — rigueur sur les chiffres et les relances.",
                "Garantie satisfait ou remplacé : réaffectation rapide d'un profil si l'adéquation n'est pas au rendez-vous.",
                "Pilotage et direction opérationnelle en France : un interlocuteur à la hauteur de votre entreprise.",
              ].map((item, i) => (
                <li key={i} className="card-frame flex h-full gap-3 rounded-xl p-5">
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
            <div className="card-frame rounded-2xl border-2 border-[#e2e8f0] border-l-[4px] border-l-[#1d4ed8] p-6 text-center md:p-8">
              <p className="text-lg font-semibold text-[#0f172a]">
                Découvrez le catalogue des missions que nous prenons en charge pour le BTP
              </p>
              <p className="mt-2 text-[#334155]">
                Devis, facturation chantier, situations de travaux, relances clients, mails, planning — autant de leviers
                pour sécuriser votre trésorerie et votre image.
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
                Une offre structurée pour piloter l&apos;administratif du bâtiment
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[#334155]">
                Organisation, optimisation et suivi : votre équipe BeWork traite dossiers, documents et relances avec une
                méthode éprouvée — et des outils d&apos;IA au service de la précision, pas du gadget.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 md:items-stretch md:gap-10">
              <div className="card-frame flex h-full flex-col rounded-xl p-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-[#eff6ff] text-[#1d4ed8]">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-[#0f172a]">
                  Suivi de dossiers & chantiers
                </p>
                <p className="mt-3 flex-1 text-[#334155] leading-relaxed">
                  Situations de travaux, acomptes, échéances MOA : un pilotage lisible pour ne rien laisser en suspens.
                </p>
              </div>
              <div className="card-frame flex h-full flex-col rounded-xl p-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-[#eff6ff] text-[#1d4ed8]">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-[#0f172a]">
                  Gestion documentaire
                </p>
                <p className="mt-3 flex-1 text-[#334155] leading-relaxed">
                  Devis, annexes techniques, plans de recollement : versionning, classement et partage maîtrisés.
                </p>
              </div>
              <div className="card-frame flex h-full flex-col rounded-xl p-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-[#eff6ff] text-[#1d4ed8]">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-[#0f172a]">
                  Coordination & relances
                </p>
                <p className="mt-3 flex-1 text-[#334155] leading-relaxed">
                  Relances clients et fournisseurs, synthèses mail, comptes rendus : des échanges nets, datés, exploitables.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Ce que fait votre assistant */}
        <section id="missions" className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
              Ce que nous prenons en charge pour vous
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#334155]">
              Pensé pour les artisans et entreprises du bâtiment — avec la souplesse d&apos;étendre à vos autres besoins
              administratifs.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 sm:items-stretch lg:grid-cols-3">
              {[
                {
                  title: "Secrétariat & administration",
                  keys: "Gestion des emails, courriers, agenda, déplacements, classement, archivage des dossiers chantier",
                },
                {
                  title: "Comptabilité & trésorerie",
                  keys: "Facturation chantier, relances impayés, suivi des paiements, pré-compta, rapprochements",
                },
                {
                  title: "Commercial & relation client",
                  keys: "Devis clients, relances devis, suivi CRM, traitement des demandes et avenants",
                },
                {
                  title: "Ressources humaines",
                  keys: "Contrats, suivi administratif du personnel, onboarding, coordination avec la paie",
                },
                {
                  title: "Visibilité & communication",
                  keys: "Réseaux sociaux chantiers, newsletters, contenus pour valoriser vos réalisations",
                },
                {
                  title: "Pilotage de projets",
                  keys: "Planning chantier, coordination sous-traitants, reporting d'avancement",
                },
                {
                  title: "Achats & fournisseurs",
                  keys: "Sourcing matériaux, commandes, suivi livraisons, relations fournisseurs",
                },
              ].map((item) => (
                <div key={item.title} className="card-frame flex h-full flex-col rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[#0f172a]">{item.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-[#334155]">{item.keys}</p>
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
              Le BTP est notre socle — nous accompagnons aussi l&apos;immobilier, les PME et les indépendants avec la même
              exigence de structuration.
            </p>
            <div className="mt-12 grid gap-8 md:grid-cols-2 md:items-stretch lg:grid-cols-4">
              <div className="card-frame flex h-full flex-col rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[#1d4ed8]">BTP</h3>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-[#334155]">
                  {[
                    "Devis clients & chiffrage",
                    "Facturation chantier & situations de travaux",
                    "Relances clients et fournisseurs",
                    "Organisation du planning chantier",
                  ].map((m, i) => (
                    <li key={i}>• {m}</li>
                  ))}
                </ul>
                <Link href="/assistant-administratif-btp" className="mt-4 inline-block text-sm font-semibold text-[#1d4ed8] hover:underline">
                  En savoir plus →
                </Link>
              </div>
              <div className="card-frame flex h-full flex-col rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[#1d4ed8]">Immobilier</h3>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-[#334155]">
                  {["Dossiers locataires", "Relances loyers", "État des lieux", "Gestion des demandes"].map((m, i) => (
                    <li key={i}>• {m}</li>
                  ))}
                </ul>
                <Link href="/assistant-administratif-immobilier" className="mt-4 inline-block text-sm font-semibold text-[#1d4ed8] hover:underline">
                  En savoir plus →
                </Link>
              </div>
              <div className="card-frame flex h-full flex-col rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[#1d4ed8]">PME</h3>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-[#334155]">
                  {["Devis et factures clients", "Suivi des commandes", "Relances impayées", "Administratif RH"].map((m, i) => (
                    <li key={i}>• {m}</li>
                  ))}
                </ul>
                <Link href="/assistant-administratif-pme" className="mt-4 inline-block text-sm font-semibold text-[#1d4ed8] hover:underline">
                  En savoir plus →
                </Link>
              </div>
              <div className="card-frame flex h-full flex-col rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[#1d4ed8]">Indépendants</h3>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-[#334155]">
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

        {/* Équipe & ADN fondateur */}
        <section id="equipe" className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
              Une solution pensée par une ancienne artisane
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[#334155]">
              BeWork n&apos;est pas une plateforme générique importée d&apos;ailleurs. Elle porte{" "}
              <strong className="font-semibold text-[#0f172a]">vingt ans de terrain en artisanat</strong> : contraintes de
              délais, tension de trésorerie, image client, paperasse du soir. Cette lecture du métier guide chaque
              process, chaque brief, chaque livrable.
            </p>

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
                  BeWork est né d&apos;un constat de terrain&nbsp;: trop d&apos;artisans et d&apos;entreprises du bâtiment
                  brillent sur l&apos;ouvrage mais s&apos;étouffent sur l&apos;administratif. La réponse n&apos;est pas
                  toujours l&apos;embauche — c&apos;est une organisation structurée, fiable, immédiatement opérationnelle.
                </p>
                <p className="mt-6 font-medium text-[#0f172a]">
                  Notre mission&nbsp;: vous rendre du temps, de la marge et de la sérénité — sans alourdir votre structure.
                </p>
                <p className="mt-6 text-[#334155] leading-relaxed">
                  Société française fondée par{" "}
                  <strong className="font-semibold text-[#0f172a]">Laure Olivie</strong>,{" "}
                  <strong className="font-semibold text-[#0f172a]">vingt ans d&apos;expérience en artisanat</strong>,
                  formatrice IA reconnue et diplômée. Votre interlocution principale passe par notre agence en région
                  parisienne, qu&apos;elle pilote au quotidien. La plateforme opérationnelle est supervisée depuis la France
                  en temps réel : même exigence, même réactivité. L&apos;équipe exécutive est composée de diplômés Bac+5
                  minimum, rodés aux outils d&apos;intelligence artificielle — au service de la précision, pas du gadget.
                </p>
              </div>
            </div>
            <div className="card-frame mt-16 rounded-xl p-10 md:p-14">
              <div className="grid gap-10 md:grid-cols-2 md:items-stretch md:gap-14">
                <div className="flex flex-col">
                  <p className="text-lg font-semibold text-[#0f172a]">
                    Agence principale — Région parisienne
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#64748b]">
                    Gérée par Laure Olivie, votre interlocutrice principale
                  </p>
                  <p className="mt-3 text-[#334155] leading-relaxed">
                    Laure Olivie — ancienne artisane, vingt ans sur le terrain — pilote l&apos;agence en Île-de-France.
                    Elle structure les missions, arbitre la qualité et garde le lien direct avec les dirigeants. Une exigence
                    forgée sur le chantier, transposée à votre administratif.
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="text-lg font-semibold text-[#0f172a]">
                    Plateforme opérationnelle internationale
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#64748b]">
                    Supervision opérationnelle en France
                  </p>
                  <p className="mt-3 text-[#334155] leading-relaxed">
                    La plateforme est pilotée au quotidien depuis la France. Même fuseau, même niveau d&apos;exigence :
                    sélection Bac+5, formation IA et encadrement continu — pour un service réactif quand votre planning
                    serré ne pardonne pas.
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
              Pourquoi les entreprises du BTP nous choisissent
            </h2>
            <ul className="mt-8 grid gap-4 md:grid-cols-2 md:items-stretch">
              {[
                "ADN terrain : une fondatrice qui a porté l'artisanat pendant vingt ans — briefs qui parlent votre langue.",
                "Interlocuteur principal en Île-de-France (Laure Olivie) : cadrage, exigence, disponibilité.",
                "Plateforme pilotée en temps réel depuis la France : réactivité quand le chantier n'attend pas.",
                "Équipe francophone Bac+5, formée à l'IA et encadrée en continu — rigueur sur les dossiers et les délais.",
              ].map((item, i) => (
                <li key={i} className="card-frame flex h-full gap-3 rounded-xl p-4">
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
              Des secteurs où nous excellons
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#334155]">
              Le bâtiment est notre cœur de cible — nous accompagnons aussi les structures qui partagent les mêmes exigences
              de rigueur et de délais.
            </p>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 sm:items-stretch lg:grid-cols-3 xl:grid-cols-4">
              {[
                { name: "BTP & artisans", desc: "Devis, facturation chantier, situations de travaux, planning" },
                { name: "Immobilier", desc: "Dossiers locataires, relances, gestion administrative" },
                { name: "Cabinets juridiques", desc: "Structuration et suivi de dossiers" },
                { name: "PME du bâtiment", desc: "Pilotage administratif quotidien, sans embauche" },
                { name: "Consulting", desc: "Support, synthèses et livrables premium" },
                { name: "E-commerce", desc: "Commandes, SAV, suivi opérationnel" },
                { name: "Agences de recrutement", desc: "Coordination et suivi candidats" },
              ].map((sector) => (
                <Link
                  key={sector.name}
                  href="/contact"
                  className="card-frame group flex h-full flex-col rounded-xl border-2 border-[#e2e8f0] p-6 text-left transition-all hover:border-[#1d4ed8] hover:shadow-md"
                >
                  <h3 className="text-lg font-semibold text-[#0f172a] group-hover:text-[#1d4ed8]">{sector.name}</h3>
                  <p className="mt-2 flex-1 text-sm text-[#64748b]">{sector.desc}</p>
                  <span className="mt-3 inline-flex items-center text-sm font-medium text-[#1d4ed8] opacity-0 transition-opacity group-hover:opacity-100">
                    Nous contacter →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Service de conciergerie — sur devis, 24/24 */}
        <section id="conciergerie" className="px-6 py-24 md:py-28">
          <div className="card-frame mx-auto max-w-6xl rounded-xl border-2 border-[#1d4ed8]/20 p-10 md:p-14">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
                  Conciergerie d&apos;entreprise
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-[#334155]">
                  Au-delà du pilotage administratif, BeWork propose une{" "}
                  <strong className="text-[#0f172a]">conciergerie professionnelle</strong> pour vos imprévus de dirigeant :
                  déplacements, réservations, recherches pointues — exécutées à distance (appels, mails, confirmations) en
                  votre nom. Disponibilité 24h/24, tarif sur mesure.
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
                Des offres lisibles, une équipe dédiée, une qualité de prestation alignée sur les standards du BTP.
                Aucun frais caché : vous savez ce que vous payez — et ce que cela vous rapporte en temps et en trésorerie.
              </p>
              <div className="mt-6 rounded-lg border border-[#1d4ed8]/30 bg-[#eff6ff] px-5 py-4">
                <p className="font-semibold text-[#0f172a]">
                  Un poste administratif en CDI en France ? Environ 5 050 €/mois (salaire, charges, bureau, RH). Avec
                  BeWork : à partir de 215 € TTC/mois, tout compris — sans recrutement, sans charges sociales, sans gestion
                  RH — jusqu&apos;à ~75 % d&apos;économie.
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
                Nous travaillons dans vos outils
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#334155]">
                CRM, logiciels de devis, GED, messageries : votre équipe BeWork s&apos;insère dans votre stack. La plateforme
                centralise consignes, statuts et livrables — pour une traçabilité digne des exigences chantier.
              </p>
            </div>
          </div>
        </section>

        {/* Processus : matching et onboarding */}
        <section id="processus" className="px-6 py-24 md:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
              Matching et onboarding : un cadrage premium
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#334155]">
              Aucune surprise : nous cartographions vos flux administratifs, vos urgences chantier et vos outils — avant de
              verrouiller l&apos;équipe et le rythme.
            </p>
            <div className="mt-12 grid gap-8 md:grid-cols-2 md:items-stretch lg:grid-cols-4">
              {[
                {
                  step: "1",
                  title: "Échange de découverte",
                  desc: "Comprendre vos métiers, vos délais, vos irritants (devis, factures, relances). Pas de formulaire froid : un vrai diagnostic avec notre équipe.",
                },
                {
                  step: "2",
                  title: "Proposition de profil",
                  desc: "Nous sélectionnons et présentons un ou plusieurs profils alignés sur votre culture et vos outils. Choix humain, pas automatisé.",
                },
                {
                  step: "3",
                  title: "Validation & cadre",
                  desc: "Vous validez l'équipe, nous formalisons le cadre de collaboration et les indicateurs de réussite.",
                },
                {
                  step: "4",
                  title: "Onboarding & go-live",
                  desc: "Rituels de communication, accès outils, priorités : nous démarrons opérationnellement — pour des premiers livrables rapides.",
                },
              ].map((item) => (
                <div key={item.step} className="card-frame flex h-full flex-col rounded-xl p-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1d4ed8] text-lg font-bold text-white">
                    {item.step}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-[#0f172a]">{item.title}</h3>
                  <p className="mt-2 flex-1 text-[#334155] leading-relaxed">{item.desc}</p>
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
                Ressources & bonnes pratiques
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[#334155]">
                Guides et retours d&apos;expérience pour structurer votre administratif, sécuriser votre trésorerie et
                professionnaliser votre relation client.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 md:items-stretch md:gap-10">
              {RESSOURCES_BLOG.map((r) => (
                <div
                  key={r.title}
                  className="card-frame flex h-full flex-col rounded-xl p-8"
                >
                  <p className="text-lg font-semibold text-[#0f172a]">{r.title}</p>
                  <p className="mt-4 flex-1 text-[#334155] leading-relaxed">{r.desc}</p>
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
              Tout ce que les artisans et entreprises du bâtiment nous demandent avant de déléguer leur pilotage
              administratif.
            </p>
            <p className="mt-4 text-sm font-medium text-[#0f172a]">
              Tous nos tarifs sont exprimés TTC, sans frais supplémentaires.
            </p>
            <dl className="mt-12 space-y-8">
              {[
                {
                  q: "Combien coûte le pilotage administratif avec BeWork ?",
                  a: "Tous les tarifs affichés sont TTC, sans frais supplémentaires. Les offres démarrent à 215 € TTC/mois pour la formule Standard (120 actions/mois, soit environ 20 h d'assistance), 415 € TTC/mois pour Business (240 actions) et 630 € TTC/mois pour Premium (360 actions). L'offre Découverte à 109 € TTC permet de tester le service. Tout est inclus : pas de coût caché, pas de recrutement, pas de charges sociales ni de gestion RH.",
                },
                {
                  q: "Comment ça se passe concrètement au quotidien ?",
                  a: "Vous déposez vos demandes sur la plateforme BeWork (devis, facturation chantier, relances, mails, organisation). Une équipe dédiée traite les dossiers, vous suivez l'avancement en temps réel et récupérez les livrables. Sans embauche ni infrastructure lourde : une solution immédiatement opérationnelle.",
                },
                {
                  q: "Qui exécute les missions ?",
                  a: "Des profils francophones diplômés Bac+5, formés à l'IA, encadrés par notre agence en région parisienne. Direction et supervision en France ; la plateforme garantit réactivité et niveau de finition attendu par les entreprises du BTP.",
                },
                {
                  q: "Quel est le délai de traitement ?",
                  a: "Réponse moyenne en moins de 2 heures. Les urgences chantier sont priorisées. Le délai dépend du type de mission ; notre équipe en France coordonne pour respecter vos échéances et vos envois client.",
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
                    {
                      "@type": "Question",
                      name: "Combien coûte le pilotage administratif avec BeWork ?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "Tarifs TTC sans frais supplémentaires. Offres dès 215 € TTC/mois (Standard, 120 actions), 415 € TTC/mois (Business), 630 € TTC/mois (Premium), 109 € TTC (Découverte). Tout inclus, sans recrutement ni charges sociales.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Comment ça se passe concrètement au quotidien ?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "Demandes via la plateforme BeWork, équipe dédiée, suivi en temps réel et livrables. Sans embauche ni infrastructure lourde.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Qui exécute les missions ?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "Profils francophones Bac+5, formés à l'IA, encadrés par l'agence en région parisienne. Direction et supervision en France.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Quel est le délai de traitement ?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "Réponse moyenne en moins de 2 heures. Urgences priorisées. Coordination par l'équipe en France.",
                      },
                    },
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
                  Prêt à structurer votre administratif de chantier ?
                </h2>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#94a3b8]">
                  Demandez un échange : nous dimensionnons l&apos;offre à votre rythme, à vos outils et à vos enjeux de
                  trésorerie — sans engagement long terme, avec une exigence de résultat.
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
              Société française — Agence Île-de-France (Laure Olivie) — Pilotage opérationnel supervisé depuis la France
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
              Tarifs pilotage administratif
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