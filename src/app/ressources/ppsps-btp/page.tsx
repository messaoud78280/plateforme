import type { Metadata } from "next";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { TUTO_TITRE } from "@/components/seo/tuto-section-titles";
import { absoluteUrl } from "@/lib/site";

const pageUrl = absoluteUrl("/ressources/ppsps-btp");

export const metadata: Metadata = {
  title: "PPSPS BTP | Préparer un plan particulier de sécurité chantier",
  description:
    "Tuto pratique pour comprendre le PPSPS BTP, les informations à rassembler, les erreurs à éviter et la méthode pour structurer un plan particulier de sécurité chantier.",
  alternates: { canonical: pageUrl, languages: { fr: pageUrl, "x-default": pageUrl } },
  openGraph: {
    type: "article",
    locale: "fr_FR",
    url: pageUrl,
    siteName: "BeWork",
    title: "PPSPS BTP | Préparer un plan particulier de sécurité chantier",
    description:
      "Checklist + méthode simple pour préparer un PPSPS : informations chantier, organisation, risques, prévention et urgence.",
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "PPSPS BTP — Tuto pratique (BeWork)",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PPSPS BTP | Préparer un plan particulier de sécurité chantier",
    description:
      "Tuto pratique : comprendre le PPSPS, rassembler les infos et structurer un document clair avant intervention.",
  },
  robots: { index: true, follow: true },
};

const FAQ_ITEMS = [
  {
    q: "Que veut dire PPSPS dans le BTP ?",
    a: "PPSPS signifie « Plan Particulier de Sécurité et de Protection de la Santé ». C’est un document qui décrit l’organisation prévue par une entreprise intervenante pour limiter les risques liés à son intervention sur un chantier.",
  },
  {
    q: "À quoi sert un PPSPS ?",
    a: "À identifier les risques, préciser les moyens de prévention, clarifier l’organisation (accès, circulations, zones), cadrer les moyens humains/matériels et faciliter la coordination avec les autres intervenants.",
  },
  {
    q: "Quand faut-il préparer un PPSPS ?",
    a: "Avant le démarrage des travaux concernés, dès que les informations chantier sont disponibles. Il peut aussi être mis à jour si les conditions d’intervention changent (phasage, coactivité, accès, moyens…).",
  },
  {
    q: "Quelles informations faut-il rassembler pour un PPSPS ?",
    a: "Informations chantier, organisation (effectifs, accès, zones), risques et prévention, matériel/EPI/protections collectives, et éléments secours/urgence. Le contenu exact dépend du chantier, du marché, du type d’intervention et des exigences applicables.",
  },
  {
    q: "BeWork peut-elle préparer un PPSPS ?",
    a: "BeWork peut aider à collecter et structurer les informations, mettre en forme une trame, classer les pièces sécurité et repérer les éléments manquants. La validation finale et la conformité sécurité restent du ressort de la personne compétente.",
  },
  {
    q: "Qui valide le PPSPS avant transmission ?",
    a: "La personne compétente côté entreprise (selon votre organisation) valide avant transmission. BeWork ne valide pas la conformité sécurité et ne remplace pas un coordonnateur SPS, un responsable sécurité ou un expert réglementaire.",
  },
] as const;

function FaqPpspsJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    url: pageUrl,
    inLanguage: "fr-FR",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

function ChecklistCard({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-bold tracking-tight text-slate-900">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2">
            <span className="mt-1 inline-block size-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StructureModelCard() {
  const rows = [
    ["1. Informations générales du chantier", "Chantier, adresse, MOA/MOE, lot, dates, contacts."],
    ["2. Présentation de l’entreprise intervenante", "Activité, responsables, effectifs, sous-traitance si concernée."],
    ["3. Description des travaux", "Périmètre, zones, tâches principales, contraintes."],
    ["4. Organisation du chantier", "Accès, circulations, stockage, horaires, coactivité, règles site."],
    ["5. Phasage de l’intervention", "Étapes, interfaces, périodes critiques, jalons."],
    ["6. Risques identifiés", "Risques principaux + spécifiques (hauteur, engins, réseaux, manutention…)."],
    ["7. Mesures de prévention", "Protections collectives, modes opératoires, consignes, contrôles."],
    ["8. Moyens humains et matériels", "EPI, engins/outillage, levage, habilitations si applicables."],
    ["9. Secours et urgence", "Contacts, procédures, accès secours, point de rassemblement si prévu."],
    ["10. Documents annexes", "Plans, fiches techniques, attestations, documents demandés (selon exigence)."],
    ["11. Validation", "Validation interne par la personne compétente avant transmission."],
  ] as const;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-bold tracking-tight text-slate-900">Modèle de structure simple (à adapter)</p>
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full border-collapse text-left text-sm">
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} className="border-t border-slate-200 first:border-t-0">
                <th className="w-[42%] bg-slate-50 px-4 py-3 align-top font-semibold text-slate-900">{k}</th>
                <td className="px-4 py-3 leading-relaxed text-slate-700">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PpspsBtpTutoPage() {
  return (
    <>
      <FaqPpspsJsonLd />
      <SeoLandingPage
        description={metadata.description as string}
        h1="PPSPS BTP : comment préparer un plan particulier de sécurité chantier"
        intro={
          <>
            Le PPSPS est souvent préparé dans l’urgence, alors qu’il demande des informations précises (chantier, accès,
            coactivité, risques, prévention, urgence). Un PPSPS mal organisé crée des allers-retours, des oublis et peut
            retarder le démarrage. L’objectif est simple : <strong>rassembler</strong>, <strong>structurer</strong>, puis{" "}
            <strong>faire valider</strong> par la personne compétente avant transmission.
          </>
        }
        breadcrumbItems={[
          { name: "Accueil", href: "/" },
          { name: "Ressources", href: "/ressources" },
          { name: "PPSPS BTP", href: "/ressources/ppsps-btp" },
        ]}
      >
        <section aria-labelledby="cadre" className="not-prose">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-[13px] font-semibold text-slate-700">
              Ce tuto est pédagogique : il aide à structurer la préparation du PPSPS (checklist + méthode), sans faire
              un cours réglementaire.
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
              Le contenu exact dépend du chantier, du marché, du coordonnateur SPS, du type d’intervention et des
              exigences applicables. La validation finale revient à la personne compétente côté entreprise.
            </p>
          </div>
        </section>

        <h2>Qu’est-ce qu’un PPSPS dans le BTP ?</h2>
        <p>
          Le <strong>PPSPS</strong> (plan particulier de sécurité et de protection de la santé) décrit l’organisation
          prévue pour limiter les risques sur un chantier, et coordonner les mesures de prévention propres à{" "}
          <strong>l’entreprise intervenante</strong>. Il sert à cadrer les risques, les moyens de prévention et
          l’organisation pratique avant intervention.
        </p>

        <h2>{TUTO_TITRE.aQuoi}</h2>
        <ul>
          <li>Identifier les risques liés à l’intervention.</li>
          <li>Décrire les moyens de prévention et les consignes de sécurité.</li>
          <li>Clarifier les accès, circulations, zones et contraintes du site.</li>
          <li>Organiser les phases de travaux et la coactivité.</li>
          <li>Préciser les moyens humains et matériels (EPI, protections collectives, engins…).</li>
          <li>Faciliter la coordination avec les autres intervenants.</li>
          <li>Éviter les oublis avant démarrage (checklist + points manquants).</li>
        </ul>

        <h2>{TUTO_TITRE.quand}</h2>
        <ul>
          <li>Avant le démarrage des travaux concernés.</li>
          <li>Dès que les informations chantier sont disponibles (accès, zones, phasage, coactivité…).</li>
          <li>Avant intervention sur site si le marché ou la coordination SPS l’exige.</li>
          <li>À actualiser si les conditions changent (organisation, phasage, moyens, risques).</li>
          <li>À anticiper pour éviter les blocages et les retards de démarrage.</li>
        </ul>

        <h2>Quelles informations rassembler pour préparer un PPSPS ? (checklist)</h2>
        <p>
          La checklist ci-dessous sert de base pour structurer la collecte. Adaptez-la selon le chantier et les exigences
          applicables.
        </p>

        <section className="not-prose">
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ChecklistCard
              title="Informations chantier"
              items={[
                "Nom du chantier, adresse, zone(s) concernée(s).",
                "Maître d’ouvrage / maître d’œuvre (contacts utiles).",
                "Lot ou intervention concernée, dates prévues.",
                "Interlocuteurs (chantier, coordination SPS si applicable).",
              ]}
            />
            <ChecklistCard
              title="Organisation"
              items={[
                "Effectifs prévus et responsables sur site.",
                "Entreprises intervenantes / coactivité à anticiper.",
                "Horaires, accès chantier, consignes site.",
                "Zones de stockage, circulations, zones interdites si présentes.",
              ]}
            />
            <ChecklistCard
              title="Risques & prévention"
              items={[
                "Risques principaux liés à l’intervention.",
                "Coactivité, interfaces, zones à risque.",
                "Travail en hauteur, engins, manutention, réseaux (si concernés).",
                "Poussières/bruit/produits utilisés (si concernés) + mesures de prévention.",
              ]}
            />
            <ChecklistCard
              title="Matériel & équipements"
              items={[
                "Engins, outillage, moyens de levage (si concernés).",
                "EPI prévus, protections collectives.",
                "Documents techniques nécessaires (selon exigence).",
                "Vérifications/contrôles internes prévus (selon organisation).",
              ]}
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <ChecklistCard
              title="Secours & urgence"
              items={[
                "Contacts utiles (site, entreprise, urgence).",
                "Consignes d’urgence, accès secours.",
                "Point de rassemblement si prévu.",
                "Procédures internes (alerte, remontée incident, etc.).",
              ]}
            />
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
              <p className="font-semibold text-slate-900">Important</p>
              <p className="mt-2 leading-relaxed">
                Le contenu exact dépend du chantier, du marché, du coordonnateur SPS, du type d’intervention et des
                exigences applicables. Gardez une liste des “manquants” et un circuit de validation clair.
              </p>
            </div>
          </div>
        </section>

        <h2>{TUTO_TITRE.etapes}</h2>
        <ol>
          <li>Relire les exigences du marché ou du coordonnateur SPS (ce qui est attendu).</li>
          <li>Lister les informations chantier à récupérer (contacts, accès, zones, planning).</li>
          <li>Identifier les phases d’intervention (phasage et interfaces).</li>
          <li>Rassembler les informations sur les risques (par phase et par zone).</li>
          <li>Associer les moyens de prévention (collectif, organisation, EPI, modes opératoires).</li>
          <li>Vérifier accès, circulations, zones de stockage et contraintes site.</li>
          <li>Intégrer les contacts et procédures d’urgence (secours, consignes, accès).</li>
          <li>Repérer les informations manquantes et préparer les relances internes/externes.</li>
          <li>Faire valider par la personne compétente avant transmission.</li>
        </ol>

        <h2>{TUTO_TITRE.erreurs}</h2>
        <ul>
          <li>Préparer le PPSPS trop tard (urgence = oublis).</li>
          <li>Copier un ancien document sans l’adapter au chantier.</li>
          <li>Oublier accès/circulations/zones de stockage.</li>
          <li>Oublier la coactivité et les interfaces.</li>
          <li>Oublier les risques spécifiques du chantier ou de l’intervention.</li>
          <li>Ne pas indiquer les responsables et contacts.</li>
          <li>Documents sécurité dispersés (impossible de retrouver vite).</li>
          <li>Absence de validation par la personne compétente avant transmission.</li>
        </ul>

        <h2>{TUTO_TITRE.exemple}</h2>
        <section className="not-prose">
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <StructureModelCard />
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
              <p className="font-semibold text-slate-900">Astuce</p>
              <p className="mt-2 leading-relaxed">
                Pour éviter le “PPSPS en urgence”, tenez une <strong>base documentaire</strong> réutilisable (EPI, moyens,
                contacts, procédures internes) et ne changez que ce qui dépend du chantier.
              </p>
            </div>
          </div>
        </section>

        <h2>Comment BeWork peut aider (sans valider la conformité sécurité)</h2>
        <p>BeWork peut aider sur la partie organisation / administratif :</p>
        <ul>
          <li>créer une checklist PPSPS et une trame structurée ;</li>
          <li>rassembler les informations disponibles (chantier, contacts, accès, zones, planning) ;</li>
          <li>organiser et classer les pièces sécurité (base documentaire) ;</li>
          <li>repérer les informations manquantes et préparer un tableau de suivi ;</li>
          <li>mettre en forme le document avant validation interne.</li>
        </ul>
        <p>
          La validation finale reste du ressort du client / de la personne compétente. BeWork ne valide pas la conformité
          sécurité et ne remplace pas un coordonnateur SPS, un responsable sécurité, un maître d’œuvre, un bureau d’études
          ou un expert réglementaire.
        </p>
        <p className="font-semibold text-slate-800">Mini scénario</p>
        <p>
          Avant une intervention, les informations chantier sont dispersées entre mails, plans, consignes et documents
          internes. BeWork peut créer une checklist PPSPS, regrouper les informations disponibles, repérer les éléments
          manquants et préparer une trame claire à faire valider par la personne compétente.
        </p>

        <section className="not-prose" id="faq" aria-label="FAQ PPSPS" style={{ scrollMarginTop: "6rem" }}>
          <h2 className="mt-12 border-b border-slate-200 pb-3 text-xl font-bold tracking-tight text-black md:text-2xl">
            {TUTO_TITRE.faq} — PPSPS
          </h2>
          <dl className="mt-5 space-y-4">
            {FAQ_ITEMS.map((item) => (
              <div key={item.q} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <dt className="text-base font-semibold text-black">{item.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-slate-700">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="not-prose" aria-label="CTA">
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <p className="text-base font-bold tracking-tight text-slate-900">Besoin d’aide pour structurer vos documents chantier ?</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              On peut vous aider à collecter, mettre en forme, classer et suivre vos pièces (PPSPS, DOE, comptes rendus…)
              avec un circuit de validation clair.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <CalendlyBookingLink className="inline-flex justify-center rounded-lg bg-[#1d4ed8] px-6 py-3 font-semibold text-white hover:bg-[#1e40af]">
                Réserver un échange
              </CalendlyBookingLink>
              <Link href="/assistants-administratifs-taches" className="inline-flex justify-center rounded-lg border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-slate-50">
                Voir les missions
              </Link>
              <Link href="/notre-facon-de-travailler" className="inline-flex justify-center rounded-lg border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-slate-50">
                Voir la méthode
              </Link>
              <Link href="/tarifs" className="inline-flex justify-center rounded-lg border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-slate-50">
                Voir les forfaits
              </Link>
              <Link href="/ressources" className="inline-flex justify-center rounded-lg border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-slate-50">
                Retour aux ressources
              </Link>
            </div>
          </div>
        </section>
      </SeoLandingPage>
    </>
  );
}

