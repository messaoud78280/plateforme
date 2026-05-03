import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { absoluteUrl } from "@/lib/site";

const pageUrl = absoluteUrl("/assistants-administratifs-taches");

export const metadata: Metadata = {
  title: "Tâches d'assistant administratif externalisé | BeWork",
  description:
    "Emails, devis, factures, relances, agenda, suivi clients : découvrez les tâches prises en charge par nos assistants administratifs externalisés pour PME. Délégation fiable et francophone.",
  alternates: { canonical: pageUrl, languages: { fr: pageUrl, "x-default": pageUrl } },
};

const top5Chronophages = [
  {
    title: "Gestion des emails",
    benefit: "Tri, priorisation, réponses simples et relances sans perdre de temps.",
  },
  {
    title: "Facturation & relances",
    benefit: "Devis, factures, suivi paiements et relances gérés par un tiers de confiance.",
  },
  {
    title: "Agenda & RDV",
    benefit: "Planification, coordination et rappels pour garder le contrôle de votre calendrier.",
  },
  {
    title: "Suivi dossiers clients",
    benefit: "Collecte de pièces, CRM, relances : plus aucune perte de trace.",
  },
  {
    title: "Saisie & mise en forme",
    benefit: "Documents, tableaux, comptes rendus : une présentation impeccable, sans effort.",
  },
];

const catalogue = [
  {
    h2: "Emails",
    benefice: "Reprenez la main sur votre boîte mail sans sacrifier la réactivité.",
    items: [
      "Tri et classement des emails entrants",
      "Réponses simples sur modèle validé",
      "Relances clients et fournisseurs",
      "Priorisation et transmission des urgences",
      "Archivage et organisation des dossiers",
      "Synthèse hebdomadaire des échanges importants",
    ],
  },
  {
    h2: "Devis / Factures / Relances",
    benefice: "Un cycle de facturation fluide et des encaissements optimisés.",
    items: [
      "Création et envoi des devis",
      "Émission des factures",
      "Suivi des paiements et rapprochements",
      "Relances amiables et formalisées",
      "Mise à jour des tableaux de bord",
      "Archivage des pièces comptables",
    ],
  },
  {
    h2: "Agenda / RDV",
    benefice: "Un calendrier maîtrisé et des rendez-vous bien préparés.",
    items: [
      "Planification des RDV",
      "Coordination avec les participants",
      "Reprogrammation et rappels",
      "Préparation des visioconférences",
      "Synthèse post-RDV",
      "Gestion des conflits de créneaux",
    ],
  },
  {
    h2: "Suivi dossiers",
    benefice: "Aucun dossier ne tombe entre les mailles du filet.",
    items: [
      "Collecte des documents requis",
      "Check-list d’avancement par dossier",
      "Saisie et mise à jour CRM",
      "Relances pièces manquantes",
      "Synthèse pour validation",
      "Alertes échéances",
    ],
  },
  {
    h2: "Documents & mise en forme",
    benefice: "Une présentation professionnelle sans vous en occuper.",
    items: [
      "Saisie de documents et tableaux",
      "Comptes rendus de réunions",
      "Mise en page et formatage",
      "Préparation de présentations",
      "Relecture et corrections",
      "Conversion de formats (PDF, Word, Excel)",
    ],
  },
  {
    h2: "RH administratif",
    benefice: "L’administratif RH allégé, dans le respect du cadre légal.",
    items: [
      "Suivi des congés et absences",
      "Préparation des dossiers paie",
      "Notes de frais et justificatifs",
      "Mise à jour des contrats (informations)",
      "Archivage des dossiers personnels",
      "Coordination avec le service paie externe",
    ],
  },
  {
    h2: "Pré-comptabilité",
    benefice: "Un flux propre vers votre expert-comptable.",
    items: [
      "Classement des pièces comptables",
      "Saisie des écritures courantes",
      "Préparation des relevés pour le comptable",
      "Transmission des pièces",
      "Suivi des demandes d’informations",
      "Point d’étape mensuel",
    ],
  },
  {
    h2: "Fournisseurs",
    benefice: "Des achats suivis et des relations fournisseurs apaisées.",
    items: [
      "Demande de devis",
      "Comparatifs et synthèses",
      "Relances commandes et livraisons",
      "Suivi des contrats et échéances",
      "Mise à jour des référentiels",
      "Archivage des pièces",
    ],
  },
  {
    h2: "Reporting",
    benefice: "Des tableaux de bord à jour et une visibilité claire.",
    items: [
      "KPI simples (CA, factures en attente, etc.)",
      "Reporting hebdomadaire ou mensuel",
      "Mises à jour des tableaux Excel",
      "Graphiques et synthèses",
      "Alertes sur seuils",
      "Préparation des supports de réunion",
    ],
  },
  {
    h2: "Relances administratives",
    benefice: "Signatures, validations et paiements suivis jusqu’au bout.",
    items: [
      "Relance des signatures en attente",
      "Suivi des documents à valider",
      "Relances paiements",
      "Coordination avec les services concernés",
      "Mise à jour du suivi",
      "Escalade si nécessaire",
    ],
  },
];

const nonFait = [
  "Prendre des décisions juridiques ou fiscales à votre place",
  "Représenter légalement votre entreprise sans mandat écrit",
  "Signer des documents sans votre validation explicite",
  "Rédiger des attestations ou bilans comptables (réservé aux experts habilités)",
  "Accéder à des systèmes ou données sans autorisation formelle",
  "Effectuer des actes engageant votre responsabilité sans votre accord",
];

const commentCaMarche = [
  { step: 1, title: "Call de découverte", desc: "Échange pour comprendre vos activités, préférences et outils. Notre équipe vous propose ensuite un profil adapté (sélection humaine, pas par algorithme)." },
  { step: 2, title: "Onboarding", desc: "Cadre de démarrage : rôles, objectifs, rituels de communication. Accès aux outils et prise en main avec votre assistant dédié." },
  { step: 3, title: "Exécution & pilotage", desc: "Livraison des missions, points de suivi réguliers et ajustements si besoin." },
];

const reassurance = [
  { label: "Confidentialité", desc: "Process rigoureux, données sécurisées et respect des engagements." },
  { label: "Outils", desc: "Google, Microsoft, CRM — nous nous adaptons à votre environnement." },
  { label: "Pilotage", desc: "Direction en France, suivi de qualité et réactivité." },
];

const faqItems = [
  {
    q: "Quels outils utilisez-vous ?",
    a: "Nous travaillons avec Google Workspace, Microsoft 365, CRM (Salesforce, HubSpot, etc.) et messageries selon vos usages. L’assistant s’adapte à votre environnement.",
  },
  {
    q: "Quels sont les délais et horaires ?",
    a: "Les assistants travaillent du lundi au vendredi, alignés sur le fuseau français. Les délais dépendent du volume et de la complexité ; nous les cadrons ensemble au démarrage.",
  },
  {
    q: "Comment sont protégées mes données (RGPD) ?",
    a: "Nous appliquons des mesures de confidentialité adaptées. Les données sont traitées dans un cadre strict. Nous restons à votre disposition pour toute précision sur nos engagements.",
  },
  {
    q: "Combien de périmètres puis-je déléguer ?",
    a: "Nos offres couvrent jusqu’à 2 périmètres. Au-delà, nous construisons une offre sur-mesure adaptée à vos besoins.",
  },
  {
    q: "Comment communiquer avec mon assistant ?",
    a: "Vous échangez avec votre assistant directement via notre plateforme dédiée. Messagerie interne, email ou téléphone : les canaux de communication sont définis lors de votre onboarding pour garantir une collaboration fluide et efficace.",
  },
  {
    q: "Peut-on monter en charge progressivement ?",
    a: "Oui. Nous pouvons démarrer sur un volume limité et ajuster selon vos besoins, en cohérence avec nos offres.",
  },
  {
    q: "Que se passe-t-il en cas d’absence de l’assistant ?",
    a: "Nous prévoyons une continuité de service et un remplacement si nécessaire. Les modalités sont détaillées dans le contrat.",
  },
  {
    q: "Comment démarrer ?",
    a: "Remplissez notre formulaire de contact, choisissez un créneau pour un premier RDV en visioconférence. Nous vous recontactons et cadrons ensemble votre besoin.",
  },
];

function FaqJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function AssistantsAdministratifsTachesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#e0e4ea]">
      <FaqJsonLd />
      <MarketingSiteHeader />

      <main>
        {/* A) Hero */}
        <section className="px-6 pt-16 pb-12 md:pt-20 md:pb-16" style={{ scrollMarginTop: "6rem" }}>
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-balance text-3xl font-bold tracking-tight text-black md:text-4xl lg:text-5xl">
              Tâches d&apos;assistant administratif externalisé : ce que BeWork prend en charge
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg leading-relaxed text-black">
              Emails, devis, factures, relances, agenda, suivi clients… déléguez l&apos;administratif à des assistants francophones augmentés par l&apos;IA.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/contact"
                className="w-full rounded-lg bg-[#1d4ed8] px-8 py-4 text-center font-semibold text-white shadow-md transition hover:bg-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-offset-2 sm:w-auto"
                aria-label="Demander un rendez-vous"
              >
                Demander un RDV
              </Link>
              <Link
                href="/tarifs"
                className="surface-metallic-outline surface-metallic-outline--neutral w-full rounded-lg px-8 py-4 text-center font-semibold text-[#1e293b] transition focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-offset-2 sm:w-auto"
                aria-label="Voir les tarifs BeWork"
              >
                Voir les tarifs
              </Link>
            </div>
          </div>
        </section>

        {/* B) Intro SEO */}
        <section className="px-6 py-12 md:py-16">
          <div className="mx-auto max-w-3xl">
            <p className="text-black leading-relaxed">
              L&apos;externalisation de l&apos;assistanat administratif permet aux PME, TPE et professionnels de gagner du temps et de se recentrer sur leur cœur de métier. Avec BeWork, vous déléguez des tâches concrètes — gestion des emails, devis, factures, relances, agenda, suivi de dossiers — à des assistants francophones formés à l&apos;IA. Notre organisation combine une agence en France (Laure Olivie, votre interlocutrice principale) et une équipe opérationnelle alignée sur le fuseau horaire français. Vous bénéficiez d&apos;une qualité professionnelle, d&apos;un pilotage réactif et d&apos;outils adaptés à vos process. Découvrez ci-dessous le catalogue des tâches prises en charge et ce que nous ne faisons pas, pour cadrer sereinement votre projet d&apos;externalisation administrative.
            </p>
          </div>
        </section>

        {/* C) Les 5 tâches les plus chronophages */}
        <section className="px-6 py-12 md:py-16" aria-labelledby="top5-heading">
          <div className="mx-auto max-w-site">
            <h2 id="top5-heading" className="text-2xl font-bold tracking-tight text-black md:text-3xl">
              Les 5 tâches les plus chronophages (et les plus déléguées)
            </h2>
            <p className="mt-4 max-w-2xl text-black leading-relaxed">
              Celles qui absorbent le plus de temps et que nos clients nous confient en priorité.
            </p>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {top5Chronophages.map((item) => (
                <li key={item.title} className="card-frame rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-black">{item.title}</h3>
                  <p className="mt-3 text-black leading-relaxed">{item.benefit}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* D) Catalogue des tâches */}
        <section className="px-6 py-12 md:py-16" aria-labelledby="catalogue-heading">
          <div className="mx-auto max-w-site">
            <h2 id="catalogue-heading" className="text-2xl font-bold tracking-tight text-black md:text-3xl">
              Catalogue des tâches
            </h2>
            <p className="mt-4 max-w-2xl text-black leading-relaxed">
              Par catégorie : ce que nous faisons et le bénéfice pour vous.
            </p>
            <div className="mt-10 space-y-10">
              {catalogue.map((cat) => (
                <article key={cat.h2} className="card-frame rounded-xl p-6 md:p-8">
                  <h3 className="text-xl font-semibold text-black">{cat.h2}</h3>
                  <p className="mt-2 text-black">{cat.benefice}</p>
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3" role="list">
                    {cat.items.map((item) => (
                      <li key={item} className="flex gap-2 text-black">
                        <span className="text-[#1d4ed8] shrink-0" aria-hidden>✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* E) Ce que nous ne faisons pas */}
        <section className="px-6 py-12 md:py-16" aria-labelledby="non-fait-heading">
          <div className="mx-auto max-w-4xl">
            <h2 id="non-fait-heading" className="text-2xl font-bold tracking-tight text-black md:text-3xl">
              Ce que nous ne faisons pas
            </h2>
            <p className="mt-4 text-black leading-relaxed">
              Cadre clair dès le rendez-vous découverte pour éviter tout malentendu. L&apos;assistant exécute des missions définies avec vous ; les actes engageant votre responsabilité restent sous votre contrôle.
            </p>
            <ul className="mt-6 space-y-3">
              {nonFait.map((item) => (
                <li key={item} className="flex gap-3 rounded-lg surface-metallic-light px-4 py-3">
                  <span className="text-black" aria-hidden>✕</span>
                  <span className="text-black">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* F) Comment ça marche */}
        <section className="px-6 py-12 md:py-16" aria-labelledby="process-heading">
          <div className="mx-auto max-w-site">
            <h2 id="process-heading" className="text-2xl font-bold tracking-tight text-black md:text-3xl">
              Comment ça marche
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {commentCaMarche.map((item) => (
                <div key={item.step} className="card-frame rounded-lg p-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1d4ed8] text-lg font-bold text-white">
                    {item.step}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-black">{item.title}</h3>
                  <p className="mt-2 text-black leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <ul className="mt-10 flex flex-wrap justify-center gap-4 md:gap-6" role="list">
              {reassurance.map(({ label, desc }) => (
                <li
                  key={label}
                  className="rounded-lg surface-metallic-light px-4 py-3 text-center"
                >
                  <span className="block font-semibold text-black">{label}</span>
                  <span className="block text-sm text-black">{desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* G) FAQ */}
        <section className="px-6 py-12 md:py-16" aria-labelledby="faq-heading">
          <div className="mx-auto max-w-3xl">
            <h2 id="faq-heading" className="text-2xl font-bold tracking-tight text-black md:text-3xl">
              Questions fréquentes
            </h2>
            <ul className="mt-8 space-y-4">
              {faqItems.map((item, i) => (
                <li key={i} className="rounded-xl surface-metallic-light">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4 font-medium text-black focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-inset [&::-webkit-details-marker]:hidden">
                      <span>{item.q}</span>
                      <span className="shrink-0 pl-2 text-black group-open:rotate-180">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </summary>
                    <div className="border-t border-[#e0e4ea] px-4 py-3 text-black">{item.a}</div>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* H) Bloc final conversion */}
        <section className="px-6 py-16 md:py-20">
          <div className="mx-auto max-w-4xl rounded-2xl border-2 border-[#1d4ed8]/30 bg-[#eff6ff] p-8 text-center md:p-12">
            <h2 className="text-2xl font-bold text-black md:text-3xl">
              Dès 290 € TTC/mois — sans recrutement
            </h2>
            <p className="mt-4 text-black">
              Déléguez vos tâches administratives à des assistants francophones augmentés par l&apos;IA. Pilotez en France, travaillez sereinement.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/contact"
                className="w-full rounded-lg bg-[#1d4ed8] px-8 py-4 text-center font-semibold text-white shadow-md transition hover:bg-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-offset-2 sm:w-auto"
                aria-label="Demander un rendez-vous"
              >
                Demander un RDV
              </Link>
              <Link
                href="/tarifs"
                className="w-full rounded-lg surface-metallic-light px-8 py-4 text-center font-semibold text-[#1e293b] transition hover:bg-[#f8f9fb] sm:w-auto"
                aria-label="Voir les tarifs BeWork"
              >
                Voir les tarifs
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#c8cdd6] bg-[#f8f9fb] px-6 py-8">
        <div className="mx-auto flex max-w-site flex-wrap items-center justify-between gap-4 text-sm text-black">
          <Link href="/" className="font-medium transition-colors hover:text-black">
            Accueil
          </Link>
          <Link href="/tarifs" className="font-medium transition-colors hover:text-black">
            Tarifs
          </Link>
          <Link href="/contact" className="font-medium transition-colors hover:text-black">
            Contact
          </Link>
        </div>
      </footer>
    </div>
  );
}
