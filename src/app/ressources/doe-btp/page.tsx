import type { Metadata } from "next";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { TUTO_TITRE } from "@/components/seo/tuto-section-titles";
import { absoluteUrl } from "@/lib/site";

const pageUrl = absoluteUrl("/ressources/doe-btp");
const META_DESCRIPTION =
  "Tuto DOE BTP : documents à rassembler, erreurs à éviter et méthode pour un dossier des ouvrages exécutés clair.";

export const metadata: Metadata = {
  title: "DOE BTP | Préparer un dossier des ouvrages exécutés",
  description: META_DESCRIPTION,
  alternates: { canonical: pageUrl, languages: { fr: pageUrl, "x-default": pageUrl } },
  openGraph: {
    type: "article",
    locale: "fr_FR",
    url: pageUrl,
    siteName: "BeWork",
    title: "DOE BTP | Préparer un dossier des ouvrages exécutés",
    description: META_DESCRIPTION,
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "DOE BTP — Tuto pratique (BeWork)",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DOE BTP | Préparer un dossier des ouvrages exécutés",
    description: META_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

const FAQ_ITEMS = [
  {
    q: "Que veut dire DOE dans le BTP ?",
    a: "DOE signifie « Dossier des Ouvrages Exécutés ». C’est un dossier qui regroupe les documents utiles pour comprendre ce qui a été réellement réalisé sur le chantier et pour faciliter la remise au client et l’exploitation.",
  },
  {
    q: "Quand faut-il préparer le DOE ?",
    a: "Idéalement au fil de l’eau, pendant les travaux : à chaque validation importante et à chaque document reçu (fournisseurs, plans, notices). En fin de chantier, il ne doit rester qu’à compléter et vérifier.",
  },
  {
    q: "Quels documents mettre dans un DOE ?",
    a: "Le contenu dépend du marché, du lot, du CCTP et des exigences du maître d’ouvrage. En pratique, on y trouve souvent : plans, notices, fiches techniques, garanties, PV, documents de maintenance/exploitation et une liste des pièces remises.",
  },
  {
    q: "Qui doit valider le DOE avant remise ?",
    a: "L’entreprise doit vérifier le dossier avant remise. Selon le contexte, une validation peut aussi impliquer la maîtrise d’œuvre ou le maître d’ouvrage. Dans tous les cas, gardez un circuit de validation clair avant l’envoi.",
  },
  {
    q: "BeWork peut-elle préparer un DOE ?",
    a: "BeWork peut aider à structurer le DOE : checklist, classement, renommage, repérage des manquants et relances fournisseurs/sous-traitants. Vous gardez la validation finale sur les pièces qui engagent votre entreprise.",
  },
  {
    q: "Le DOE remplace-t-il les validations techniques ?",
    a: "Non. Le DOE est un dossier de remise et de traçabilité. Il ne remplace pas les validations techniques, réglementaires ou les responsabilités des intervenants (maîtrise d’œuvre, bureau d’études, etc.).",
  },
] as const;

function FaqDoeJsonLd() {
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

function ChecklistCard({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
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

export default function DoeBtpTutoPage() {
  return (
    <>
      <FaqDoeJsonLd />
      <SeoLandingPage
        description={metadata.description as string}
        h1="DOE BTP : comment préparer un dossier des ouvrages exécutés"
        intro={
          <>
            Le DOE (dossier des ouvrages exécutés) est souvent repoussé à la fin du chantier… et finit en urgence, avec
            des pièces dispersées entre mails, WhatsApp et dossiers internes. La bonne approche est simple :{" "}
            <strong>collecter et classer progressivement</strong>, puis finaliser avant la réception.
          </>
        }
        breadcrumbItems={[
          { name: "Accueil", href: "/" },
          { name: "Ressources", href: "/ressources" },
          { name: "DOE BTP", href: "/ressources/doe-btp" },
        ]}
      >
        <section aria-labelledby="intro" className="not-prose">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-[13px] font-semibold text-slate-700">
              Objectif : vous aider à comprendre le DOE, savoir quoi mettre dedans, et appliquer une méthode simple pour
              sortir un dossier clair en fin de chantier (sans faire un cours juridique).
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
              Le contenu exact dépend du marché, du lot, du CCTP, du maître d’ouvrage et des exigences du chantier.
              Gardez toujours une validation finale avant remise.
            </p>
          </div>
        </section>

        <h2 id="definition">Qu’est-ce qu’un DOE dans le BTP ?</h2>
        <p>
          Le <strong>DOE</strong>, ou <strong>dossier des ouvrages exécutés</strong>, est un dossier qui rassemble les
          documents utiles pour comprendre ce qui a été réalisé : plans, notices, fiches techniques, garanties, PV,
          éléments de maintenance/exploitation et pièces demandées selon le chantier.
        </p>
        <p>
          Ce n’est pas “un dossier de plus” : c’est une <strong>remise structurée</strong> qui évite les allers-retours
          et permet au client (ou à l’exploitant) de retrouver rapidement l’information.
        </p>

        <h2>{TUTO_TITRE.aQuoi}</h2>
        <ul>
          <li>Clôturer proprement un chantier (dossier final clair et complet).</li>
          <li>Transmettre les informations au client ou au maître d’ouvrage.</li>
          <li>Faciliter l’exploitation et la maintenance (notices, garanties, références).</li>
          <li>Garder une trace des ouvrages réellement réalisés (plans et documents à jour).</li>
          <li>Limiter les oublis en fin de chantier (checklist + suivi des manquants).</li>
          <li>Montrer une organisation professionnelle (remise lisible et vérifiée).</li>
        </ul>

        <h2>{TUTO_TITRE.quand}</h2>
        <p>
          Le DOE ne doit pas se faire “le dernier jour”. La bonne routine est de{" "}
          <strong>collecter les pièces au fil de l’eau</strong> :
        </p>
        <ul>
          <li>pendant les travaux (plans d’exécution, photos utiles, versions à jour) ;</li>
          <li>à chaque livraison de document fournisseur (fiches, notices, garanties) ;</li>
          <li>après les validations importantes (documents signés, comptes rendus, points actés) ;</li>
          <li>à l’approche des OPR / réception (vérification des manquants) ;</li>
          <li>avant la levée des réserves si nécessaire (PV, preuves, statuts).</li>
        </ul>

        <h2>Quels documents mettre dans un DOE ? (checklist)</h2>
        <p>
          Le contenu exact dépend du marché/CCTP et du lot. La checklist ci-dessous sert de base pour{" "}
          <strong>ne pas oublier l’essentiel</strong> et structurer votre collecte.
        </p>

        <section className="not-prose">
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ChecklistCard
              title="Documents généraux"
              items={[
                "Coordonnées des intervenants (MOA/MOE, sous-traitants, fournisseurs, contacts clés).",
                "Références chantier (adresse, lot(s), période, version de remise).",
                "Marchés / lots concernés (selon ce qui est attendu au DOE).",
                "Liste des pièces remises (sommaire / index).",
              ]}
            />
            <ChecklistCard
              title="Plans & éléments techniques"
              items={[
                "Plans d’exécution (versions finales).",
                "Plans de récolement si concernés / demandés.",
                "Schémas (ex : électrique, plomberie, CVC, réseaux, etc.).",
                "Fiches techniques et notices produits (références exactes posées).",
              ]}
            />
            <ChecklistCard
              title="Matériaux & équipements"
              items={[
                "Fiches fournisseurs (références, caractéristiques).",
                "Notices d’entretien et consignes d’utilisation.",
                "Garanties et conditions (durées, contacts SAV).",
                "Certificats/attestations si demandés au marché (selon lot et exigences).",
              ]}
            />
            <ChecklistCard
              title="Réception & fin de chantier"
              items={[
                "PV de réception si disponible (et pièces associées).",
                "PV de levée de réserves / suivi des réserves (si applicable).",
                "Photos utiles (avant/après, éléments cachés, repères).",
                "Documents de maintenance/exploitation demandés (selon chantier).",
              ]}
            />
          </div>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
            <p className="font-semibold text-slate-900">À retenir</p>
            <p className="mt-2 leading-relaxed">
              Un DOE “utile” est un DOE <strong>lisible</strong> : une arborescence claire + des fichiers bien nommés +
              une liste des pièces + une vérification des manquants avant remise.
            </p>
          </div>
        </section>

        <h2>{TUTO_TITRE.etapes}</h2>
        <ol>
          <li>Relire les exigences du marché et du CCTP (ce qui est attendu, par lot).</li>
          <li>Créer une arborescence claire (par lot / zone / phase / type de document).</li>
          <li>Lister les pièces attendues (checklist + “responsable” + date cible).</li>
          <li>Collecter les documents au fil de l’eau (dès réception fournisseur / validation).</li>
          <li>Renommer les fichiers proprement (date, lot, référence, version).</li>
          <li>Repérer les pièces manquantes (tableau de suivi).</li>
          <li>Relancer fournisseurs / sous-traitants (messages courts + échéance).</li>
          <li>Préparer une version finale lisible (sommaire + dossiers propres).</li>
          <li>Faire valider avant remise (circuit de validation interne).</li>
        </ol>

        <h2>{TUTO_TITRE.erreurs}</h2>
        <ul>
          <li>Attendre la fin du chantier : vous perdez du temps et oubliez des pièces.</li>
          <li>Fichiers mal nommés : impossible de s’y retrouver, même avec “toutes les pièces”.</li>
          <li>Documents fournisseurs manquants : pas de notices/garanties au moment de la remise.</li>
          <li>Plans non mis à jour : versions incohérentes, récolements oubliés si requis.</li>
          <li>Pas de checklist : vous “pensez que c’est bon”… jusqu’au dernier jour.</li>
          <li>Pièces dispersées entre mails/WhatsApp/ordinateur : pertes, doublons, confusion.</li>
          <li>DOE envoyé sans vérification : allers-retours, image moins pro, retards de clôture.</li>
          <li>Pas de validation finale : risque d’envoyer une version incomplète ou non cohérente.</li>
        </ul>

        <h2>Comment BeWork peut aider (sans remplacer un expert)</h2>
        <p>
          BeWork peut vous aider à <strong>structurer</strong> la préparation du DOE (assistante travaux / assistante BTP)
          sur un périmètre cadré :
        </p>
        <ul>
          <li>créer une checklist DOE et une arborescence de classement ;</li>
          <li>classer les documents, renommer les fichiers et tenir un tableau de suivi ;</li>
          <li>repérer les pièces manquantes et préparer les relances ;</li>
          <li>organiser une version DOE finale lisible à valider avant remise.</li>
        </ul>
        <p>
          Vous gardez la <strong>validation finale</strong>. BeWork ne remplace pas un maître d’œuvre, un bureau d’études,
          un expert technique ou un responsable réglementaire, et ne garantit pas la conformité à tous les marchés : le
          contenu exact dépend du chantier et des exigences contractuelles.
        </p>

        <h2>{TUTO_TITRE.exemple}</h2>
        <p>
          <strong>Mini scénario.</strong> À deux semaines de la réception, plusieurs fiches techniques, notices et plans sont
          dispersés entre mails et dossiers internes. BeWork peut créer une checklist, classer les pièces déjà disponibles,
          identifier les manquants, préparer les relances et organiser une version DOE claire à faire valider.
        </p>

        <section className="not-prose" id="faq" aria-label="FAQ DOE" style={{ scrollMarginTop: "6rem" }}>
          <h2 className="mt-12 border-b border-slate-200 pb-3 text-xl font-bold tracking-tight text-black md:text-2xl">
            {TUTO_TITRE.faq} — DOE
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
            <p className="text-base font-bold tracking-tight text-slate-900">Besoin d’un coup de main pour structurer vos dossiers chantier ?</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              On peut vous aider à préparer, classer et suivre les pièces (DOE, relances, DICT, documents travaux) avec un circuit de validation clair.
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

