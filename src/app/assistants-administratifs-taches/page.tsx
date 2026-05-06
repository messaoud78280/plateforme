import type { Metadata } from "next";
import Link from "next/link";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { absoluteUrl } from "@/lib/site";

const pageUrl = absoluteUrl("/assistants-administratifs-taches");

export const metadata: Metadata = {
  title: "Missions BeWork pour vos chantiers (assistante travaux BTP) | BeWork",
  description:
    "Devis, relances, dossiers chantier, DICT, fournisseurs, comptes rendus, réserves, DOE, DCE/CCTP : BeWork, assistante travaux BTP augmentée par l’IA, tient ce qui doit avancer côté bureau et structure vos livrables chantier.",
  alternates: { canonical: pageUrl, languages: { fr: pageUrl, "x-default": pageUrl } },
};

const top5Chronophages = [
  {
    title: "Devis à relancer",
    benefit: "Relances tenues, suivi des réponses, statuts clairs jusqu’à la signature.",
  },
  {
    title: "Situations & factures chantier",
    benefit: "Préparation, mise en forme, suivi des envois et pièces associées.",
  },
  {
    title: "DICT / DT & pièces chantier",
    benefit: "Dossiers suivis, documents classés, rappels et échéances sous contrôle.",
  },
  {
    title: "Fournisseurs, livraisons, locations",
    benefit: "Commandes et suivis, relances, coordination logistique au bon moment.",
  },
  {
    title: "Comptes rendus, réserves, DOE",
    benefit: "CR chantier propres, OPR/réserves suivies, DOE organisé en fin de chantier.",
  },
];

const missionFamilies = [
  {
    h2: "Devis, relances & situations",
    benefice: "Plus de chances de signer et un suivi financier chantier plus net.",
    items: [
      "Préparation / mise en forme de devis (sur modèle validé)",
      "Relances devis (jusqu’à réponse)",
      "Suivi des validations client et prochaines actions",
      "Situations de travaux (préparation, pièces)",
      "Suivi factures liées aux chantiers",
      "Avenants (préparation, suivi, relances)",
    ],
  },
  {
    h2: "Dossiers chantier & documents travaux",
    benefice: "Des livrables chantier propres, retrouvables, et à jour.",
    items: [
      "Comptes rendus de chantier (structure, mise au propre, diffusion)",
      "Suivi OPR / réserves",
      "PV de levée de réserve (préparation, organisation des pièces)",
      "DOE (organisation, relances pièces, compilation)",
      "PPSPS / documents sécurité (structuration, checklists, pièces)",
      "Classement des pièces chantier (plans, échanges, PV, photos)",
    ],
  },
  {
    h2: "Analyse de dossiers techniques (IA augmentée)",
    benefice: "Trier, synthétiser, extraire l’essentiel pour décider plus vite.",
    items: [
      "Tri et analyse DCE (pièces, exigences, manquants)",
      "Synthèse CCTP (points clés, obligations)",
      "Repérage des pièces importantes et des risques",
      "Extraction des obligations (délais, livrables, pénalités)",
      "Checklists de documents à préparer",
      "Structuration d’un dossier de réponse (sans engagement technique à votre place)",
    ],
  },
  {
    h2: "Fournisseurs, planning & logistique",
    benefice: "Moins de blocages terrain grâce à un suivi bureau-terrain serré.",
    items: [
      "Commandes matériaux (préparation, suivi, confirmations)",
      "Suivi livraisons chantier (créneaux, contacts, relances)",
      "Locations matériel (recherche, réservation, prolongations)",
      "Relances fournisseurs (disponibilités, délais, AR)",
      "Organisation des rendez-vous (clients, fournisseurs, sous-traitants)",
      "Planning simple chantier (rappels, jalons, coordination)",
    ],
  },
  {
    h2: "Suivi client & organisation bureau-terrain",
    benefice: "Une relation client plus régulière, sans vous couper du chantier.",
    items: [
      "Préparation de mails professionnels (sur votre ton, sur modèle)",
      "Relances client (devis, validations, pièces, RDV)",
      "Organisation des demandes et des priorités",
      "Suivi des réponses en attente",
      "Tableau de bord chantier hebdomadaire (statuts, prochaines actions)",
      "Synthèses courtes pour arbitrage (vous décidez)",
    ],
  },
];

const repetitiveVsAdvanced = {
  repetitive: [
    "Relances devis",
    "Mails clients (préparation, réponses simples sur modèle)",
    "Suivi factures / situations",
    "Commandes fournisseurs",
    "Locations matériel",
    "Planning simple",
    "Classement documents",
  ],
  advanced: [
    "DOE",
    "PPSPS",
    "DUERP (organisation des pièces / structure)",
    "DCE (tri, checklists, pièces)",
    "CCTP (synthèse des points clés)",
    "PV de levée de réserve",
    "Avenants",
    "Comptes rendus chantier",
    "Tableau de bord chantier",
  ],
} as const;

const prepareVsValidate = {
  prepare: [
    "Brouillons de mails et réponses (sur modèle)",
    "Tableaux de suivi et statuts",
    "Checklists de pièces et échéances",
    "Synthèses (DCE/CCTP, échanges, points bloquants)",
    "Comptes rendus mis au propre",
    "Dossiers organisés (DOE, réserves, pièces chantier)",
    "Relances et suivis jusqu’à réponse",
  ],
  validate: [
    "Prix et marges",
    "Choix techniques",
    "Engagements contractuels",
    "Signatures",
    "Réponses sensibles",
    "Arbitrages chantier",
  ],
} as const;

const complementaryRequests = [
  "Agenda général (si cadré : rdv chantier, rdv client, jalons)",
  "Emails non liés au chantier (au cas par cas)",
  "Saisie administrative interne (ponctuelle, cadrée)",
  "Pré-comptabilité (uniquement flux simple et transmission de pièces)",
  "RH (uniquement si cadré, jamais au cœur de l’accompagnement)",
] as const;

const nonFait = [
  "Prendre des décisions techniques à votre place",
  "Signer ou engager contractuellement sans votre validation explicite",
  "Remplacer un conducteur de travaux, un maître d’œuvre ou un bureau d’études",
  "Produire une étude technique, un plan d’exécution ou un avis d’expert",
  "Prendre des décisions juridiques ou fiscales à votre place",
  "Effectuer un acte engageant votre responsabilité sans votre accord",
];

const commentCaMarche = [
  { step: 1, title: "Cadrage chantier", desc: "On définit vos types de demandes (devis, dossiers chantier, fournisseurs…), vos outils et vos règles de validation." },
  { step: 2, title: "Mise en route", desc: "On met en place les modèles (mails, tableaux), les accès et le circuit de validation. Vous gardez la main sur les points sensibles." },
  { step: 3, title: "Suivi & cadence", desc: "Votre Beworker exécute, relance, structure et vous remonte les arbitrages. Points réguliers et ajustements selon la charge." },
];

const reassurance = [
  { label: "Confidentialité", desc: "Process rigoureux, données sécurisées et respect des engagements." },
  { label: "Outils", desc: "Google, Microsoft, CRM — nous nous adaptons à votre environnement." },
  { label: "Pilotage", desc: "Direction en France, suivi de qualité et réactivité." },
];

const faqItems = [
  {
    q: "Quelles missions peut gérer une assistante travaux BeWork ?",
    a: "Les missions qui doivent avancer côté bureau : relances devis, suivi client, dossiers chantier, DICT/DT, fournisseurs, comptes rendus, réserves, DOE et tableaux de suivi.",
  },
  {
    q: "BeWork peut-elle préparer un DOE ou un PPSPS ?",
    a: "Oui, sur un périmètre cadré : organisation des pièces, checklists, relances documents, mise au propre et compilation. Vous validez les éléments sensibles avant diffusion.",
  },
  {
    q: "BeWork peut-elle analyser un DCE ou un CCTP ?",
    a: "BeWork peut trier, structurer et synthétiser les pièces (DCE/CCTP), repérer les obligations et produire des checklists. Cela ne remplace pas un bureau d’études ni une décision technique : vous gardez la validation.",
  },
  {
    q: "Est-ce que BeWork peut relancer mes devis et mes clients ?",
    a: "Oui : relances devis, relances de pièces, relances de validation, suivi des réponses. On tient la cadence et on vous remonte ce qui doit être arbitré.",
  },
  {
    q: "Qui valide les documents avant envoi ?",
    a: "Vous. BeWork prépare, met en forme, organise et propose ; vous validez les prix, choix techniques, engagements contractuels, signatures et réponses sensibles.",
  },
  {
    q: "BeWork remplace-t-elle un conducteur de travaux ou un bureau d’études ?",
    a: "Non. BeWork est un relais travaux bureau-terrain pour tenir vos dossiers, relances et documents. Les décisions techniques et responsabilités restent chez vous (ou vos partenaires habilités).",
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
    <div className="min-h-screen bg-[#f8fafc]">
      <FaqJsonLd />
      <MarketingSiteHeader />

      <main>
        {/* A) Hero */}
        <section className="px-6 pt-16 pb-12 md:pt-20 md:pb-16" style={{ scrollMarginTop: "6rem" }}>
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-balance text-3xl font-bold tracking-tight text-black md:text-4xl lg:text-5xl">
              Missions BeWork pour vos chantiers
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg leading-relaxed text-black">
              Devis, relances, dossiers chantier, DICT, fournisseurs, comptes rendus, réserves, DOE, DCE, CCTP : BeWork vous aide à tenir ce qui doit
              avancer côté bureau pendant que vous gérez le terrain.
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
              BeWork n’est pas un “secrétariat PME” généraliste. C’est une{" "}
              <strong>assistante travaux / assistante BTP augmentée par l’IA</strong> : un relais bureau‑terrain pour tenir les{" "}
              <strong>dossiers chantier</strong>, les <strong>relances</strong>, les <strong>documents travaux</strong> et la{" "}
              <strong>coordination</strong> quand vous êtes pris sur le terrain. L’IA sert à trier, synthétiser et structurer — pas à “faire de la magie” :
              vous gardez la validation finale sur les décisions qui engagent votre entreprise.
            </p>
          </div>
        </section>

        {/* C) Les 5 tâches les plus chronophages */}
        <section className="px-6 py-12 md:py-16" aria-labelledby="top5-heading">
          <div className="mx-auto max-w-site">
            <h2 id="top5-heading" className="text-2xl font-bold tracking-tight text-black md:text-3xl">
              Les 5 sujets qui bloquent le plus souvent côté chantier
            </h2>
            <p className="mt-4 max-w-2xl text-black leading-relaxed">
              Ce que nos clients BTP nous confient en priorité pour garder le chantier fluide et le dossier carré.
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

        {/* D) Missions BTP (par familles) */}
        <section className="px-6 py-12 md:py-16" aria-labelledby="catalogue-heading">
          <div className="mx-auto max-w-site">
            <h2 id="catalogue-heading" className="text-2xl font-bold tracking-tight text-black md:text-3xl">
              Les missions BeWork (version chantier)
            </h2>
            <p className="mt-4 max-w-2xl text-black leading-relaxed">
              Un aperçu structuré (sans liste interminable) des missions les plus fréquentes côté BTP.
            </p>
            <div className="mt-10 space-y-10">
              {missionFamilies.map((cat) => (
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

        {/* E) Tâches répétitives vs missions avancées */}
        <section className="px-6 py-12 md:py-16" aria-labelledby="repeat-advanced-heading">
          <div className="mx-auto max-w-site">
            <h2 id="repeat-advanced-heading" className="text-2xl font-bold tracking-tight text-black md:text-3xl">
              Tâches répétitives vs missions avancées BTP
            </h2>
            <p className="mt-4 max-w-3xl text-black leading-relaxed">
              L’objectif : tenir la cadence sur le quotidien, et structurer les livrables chantier quand il faut.
            </p>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="card-frame rounded-xl p-6 md:p-8">
                <h3 className="text-xl font-semibold text-black">Tâches répétitives à tenir</h3>
                <p className="mt-2 text-black">Celles qui doivent avancer tous les jours, sans vous consommer.</p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2" role="list">
                  {repetitiveVsAdvanced.repetitive.map((item) => (
                    <li key={item} className="flex gap-2 text-black">
                      <span className="text-[#1d4ed8] shrink-0" aria-hidden>
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card-frame rounded-xl p-6 md:p-8">
                <h3 className="text-xl font-semibold text-black">Missions avancées BTP à structurer</h3>
                <p className="mt-2 text-black">Celles qui demandent méthode, rigueur et livrables propres.</p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2" role="list">
                  {repetitiveVsAdvanced.advanced.map((item) => (
                    <li key={item} className="flex gap-2 text-black">
                      <span className="text-[#1d4ed8] shrink-0" aria-hidden>
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* F) Prépare vs vous validez */}
        <section className="px-6 py-12 md:py-16" aria-labelledby="prepare-validate-heading">
          <div className="mx-auto max-w-site">
            <h2 id="prepare-validate-heading" className="text-2xl font-bold tracking-tight text-black md:text-3xl">
              Ce que BeWork prépare, ce que vous validez
            </h2>
            <p className="mt-4 max-w-3xl text-black leading-relaxed">
              BeWork prépare, structure, classe, relance et suit. Les décisions qui engagent votre entreprise restent sous votre contrôle.
            </p>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="card-frame rounded-xl p-6 md:p-8">
                <h3 className="text-xl font-semibold text-black">BeWork peut préparer</h3>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2" role="list">
                  {prepareVsValidate.prepare.map((item) => (
                    <li key={item} className="flex gap-2 text-black">
                      <span className="text-[#1d4ed8] shrink-0" aria-hidden>
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card-frame rounded-xl p-6 md:p-8">
                <h3 className="text-xl font-semibold text-black">Vous validez</h3>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2" role="list">
                  {prepareVsValidate.validate.map((item) => (
                    <li key={item} className="flex gap-2 text-black">
                      <span className="text-black shrink-0" aria-hidden>
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* G) Ce que nous ne faisons pas */}
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

        {/* H) Comment ça marche */}
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

        {/* I) FAQ */}
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

        {/* J) Demandes complémentaires (hors cœur BTP) */}
        <section className="px-6 py-12 md:py-16" aria-labelledby="complementary-heading">
          <div className="mx-auto max-w-site">
            <h2 id="complementary-heading" className="text-2xl font-bold tracking-tight text-black md:text-3xl">
              Demandes complémentaires (uniquement si elles sont cadrées)
            </h2>
            <p className="mt-4 max-w-4xl text-black leading-relaxed">
              BeWork peut aussi traiter certaines demandes complémentaires liées à votre organisation interne, mais le cœur de l’accompagnement reste le
              suivi travaux, les dossiers chantier, les devis, les documents et la coordination bureau‑terrain.
            </p>
            <div className="mt-8 card-frame rounded-xl p-6 md:p-8">
              <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3" role="list">
                {complementaryRequests.map((item) => (
                  <li key={item} className="flex gap-2 text-black">
                    <span className="text-[#1d4ed8] shrink-0" aria-hidden>
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* K) Bloc final conversion */}
        <section className="px-6 py-16 md:py-20">
          <div className="mx-auto max-w-4xl rounded-2xl border-2 border-[#1d4ed8]/30 bg-[#eff6ff] p-8 text-center md:p-12">
            <h2 className="text-2xl font-bold text-black md:text-3xl">
              Dès 290 € TTC/mois — sans recrutement
            </h2>
            <p className="mt-4 text-black">
              Un relais travaux bureau‑terrain, avec une assistante BTP augmentée par l’IA pour trier, synthétiser et structurer. Vous gardez la validation
              finale.
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
