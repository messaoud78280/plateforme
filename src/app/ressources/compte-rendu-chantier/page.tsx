import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteFooter } from "@/components/layout/MarketingSiteFooter";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { TUTO_TITRE } from "@/components/seo/tuto-section-titles";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { absoluteUrl } from "@/lib/site";

const pageUrl = absoluteUrl("/ressources/compte-rendu-chantier");
const pagePath = "/ressources/compte-rendu-chantier";

const H1 =
  "Compte rendu de chantier : comment le rédiger et le structurer";
const META_DESCRIPTION =
  "Tuto compte rendu de chantier : participants, décisions, actions, délais et points bloquants. Méthode simple à appliquer.";

export const metadata: Metadata = {
  title: "Compte rendu de chantier | Tuto pratique BTP",
  description: META_DESCRIPTION,
  alternates: { canonical: pageUrl, languages: { fr: pageUrl, "x-default": pageUrl } },
  openGraph: {
    type: "article",
    locale: "fr_FR",
    url: pageUrl,
    siteName: "BeWork",
    title: "Compte rendu de chantier | Tuto pratique BTP",
    description:
      "Tuto compte rendu de chantier : participants, décisions, actions, délais et points bloquants. Méthode simple à appliquer.",
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "Compte rendu de chantier — Tuto pratique (BeWork)",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Compte rendu de chantier | Tuto pratique BTP",
    description:
      "Tuto compte rendu de chantier : participants, décisions, actions, délais et points bloquants. Méthode simple à appliquer.",
  },
  robots: { index: true, follow: true },
};

const FAQ_ITEMS = [
  {
    q: "À quoi sert un compte rendu de chantier ?",
    a: "À garder une trace claire de ce qui a été dit, décidé et demandé : avancement, points bloquants, responsabilités et actions à suivre. Il évite les oublis et les malentendus après réunion.",
  },
  {
    q: "Qui rédige le compte rendu de chantier ?",
    a: "Cela dépend de l’organisation : maîtrise d’œuvre, conducteur de travaux, responsable chantier ou entreprise pilote. L’important est de savoir qui le rédige, qui le valide, et qui le diffuse.",
  },
  {
    q: "Que doit contenir un compte rendu de réunion chantier, et quand l’envoyer ?",
    a: "Au minimum : informations générales, participants, avancement, décisions, points bloquants et une liste d’actions avec responsable + date limite. À envoyer le plus vite possible — idéalement le jour même ou le lendemain — pendant que les décisions sont fraîches ; cela évite les erreurs d’exécution coûteuses.",
  },
  {
    q: "Est-ce que BeWork peut préparer un compte rendu à partir de notes, photos ou messages vocaux ?",
    a: "Oui. BeWork peut structurer un compte rendu à partir de notes de chantier, photos, échanges, messages vocaux ou informations transmises par le conducteur de travaux. L’objectif est de transformer des éléments bruts en document clair, exploitable et facile à valider. Vous gardez la validation finale avant diffusion.",
  },
  {
    q: "Est-ce adapté aux artisans, chefs de chantier et conducteurs de travaux ?",
    a: "Oui. Le service est pensé pour les artisans, chefs de chantier, conducteurs de travaux et petites entreprises BTP qui manquent de temps pour formaliser leurs suivis de chantier, relances et décisions importantes.",
  },
  {
    q: "Le compte rendu de chantier remplace-t-il une validation technique ?",
    a: "Non. C’est un outil de suivi et de traçabilité. Il ne remplace pas les validations techniques, les responsabilités des intervenants (MOE, conducteur de travaux, responsable chantier) ni la validation du client sur les points engageants.",
  },
] as const;

const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: "Compte rendu de chantier", href: pagePath },
] as const;

function FaqCrJsonLd() {
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

const webJsonLd = buildWebPageAndBreadcrumbJsonLd({
  pagePath,
  h1: H1,
  description: META_DESCRIPTION,
  breadcrumbItems: [...breadcrumbItems],
});

function ChecklistCard({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_10px_40px_-16px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/85 transition hover:border-slate-300/90">
      <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#1d4ed8]">{title}</p>
      <ul className="mt-4 space-y-2.5 text-[15px] leading-snug text-slate-700">
        {items.map((it) => (
          <li key={it} className="flex gap-3">
            <span
              className="mt-[0.35rem] inline-block size-1.5 shrink-0 rounded-full bg-[#2563eb]"
              aria-hidden
            />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StructureModelCard() {
  const rows = [
    ["1. Informations générales", "Chantier, date, lieu/format, objet du point."],
    ["2. Participants", "Présents, entreprises, absents si nécessaire."],
    ["3. Avancement chantier", "Réalisé, en cours, à venir, planning/décalages."],
    ["4. Décisions prises", "Arbitrages, demandes client actées, modifications validées."],
    ["5. Points bloquants", "Accès, matériaux, plans, validations, retards, réserves, coordination."],
    ["6. Actions à suivre", "Action + responsable + date limite + statut + commentaire."],
    ["7. Documents à transmettre", "Pièces attendues, qui envoie quoi, pour quand."],
    ["8. Prochaine réunion", "Date/heure, ordre du jour, points à vérifier."],
  ] as const;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_10px_40px_-16px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/85">
      <p className="text-base font-bold tracking-tight text-[#0F172A]">Modèle de structure simple</p>
      <p className="mt-1 text-sm text-slate-500">À réutiliser sur vos chantiers.</p>
      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200/90">
        <table className="w-full border-collapse text-left text-sm">
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} className="border-t border-slate-100 first:border-t-0">
                <th className="w-[42%] bg-[#f8fafc] px-4 py-3.5 align-top text-[13px] font-semibold leading-snug text-[#0F172A]">
                  {k}
                </th>
                <td className="px-4 py-3.5 text-[13px] leading-relaxed text-slate-600">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ArticleProseSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="pt-10 first:pt-0">
      <h2 className="text-xl font-bold tracking-tight text-[#0F172A] md:text-[1.35rem]">{title}</h2>
      <div className="prose prose-slate mt-5 max-w-none prose-p:text-[15px] prose-p:leading-relaxed prose-p:text-slate-700 prose-li:text-[15px] prose-li:leading-snug prose-li:text-slate-700 prose-strong:font-semibold prose-strong:text-[#0F172A] prose-ul:my-3 prose-ol:my-3">
        {children}
      </div>
    </section>
  );
}

export default function CompteRenduChantierTutoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#f1f5f9]">
      <FaqCrJsonLd />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webJsonLd) }} />
      <MarketingSiteHeader plainBg />

      {/* Bande hero alignée DA accueil */}
      <div className="relative overflow-hidden bg-gradient-to-b from-white via-[#fdfefe] to-[#F8FAFC] pb-14 pt-8 md:pb-16 md:pt-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-8%] top-[-6rem] h-[28rem] w-[52%] skew-x-[-12deg] opacity-[0.55] md:top-[-7rem]"
          style={{
            background: "linear-gradient(135deg, #F8FAFC 0%, #D7E0EA 45%, #EEF3F8 100%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-8%] top-[-6rem] h-[28rem] w-[52%] skew-x-[-12deg] opacity-25 md:top-[-7rem]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(120deg, rgba(15,23,42,0.12) 0px, rgba(15,23,42,0.12) 1px, transparent 1px, transparent 7px)",
          }}
        />
        <div className="relative z-[1]">
          <div className="container-site">
            <nav className="text-[13px] text-slate-600" aria-label="Fil d’Ariane">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {breadcrumbItems.map((item, i) => (
                  <li key={item.href} className="flex items-center gap-2">
                    {i > 0 ? <span className="text-slate-300" aria-hidden>/</span> : null}
                    {i < breadcrumbItems.length - 1 ? (
                      <Link href={item.href} className="font-medium text-slate-700 transition hover:text-[#1d4ed8]">
                        {item.name}
                      </Link>
                    ) : (
                      <span className="font-semibold text-slate-900">{item.name}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>

            <p className="mt-8 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-4 py-1.5 text-[12.5px] font-medium leading-snug text-[#2563eb] sm:text-[13px]">
              <svg
                className="size-[15px] shrink-0 text-[#2563eb] sm:size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.85}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" x2="8" y1="13" y2="13" />
                <line x1="16" x2="8" y1="17" y2="17" />
                <line x1="10" x2="8" y1="9" y2="9" />
              </svg>
              <span>Tuto pratique · Ressources BTP · Dossiers chantier</span>
            </p>

            <h1
              className="font-heading mt-5 max-w-3xl text-balance text-[clamp(1.625rem,calc(0.95rem+2.35vw),2.375rem)] font-bold leading-[1.12] tracking-[-0.03em] text-[#0F172A]"
            >
              Compte rendu de chantier :{" "}
              <span className="text-[#3072F0]">comment le rédiger et le structurer</span>
            </h1>

            <p className="mt-5 max-w-2xl text-[17px] leading-[1.6] text-slate-700">
              Un compte rendu de chantier bien rédigé évite les oublis, les malentendus et les discussions floues après
              réunion. Il sert à <span className="font-semibold text-[#3072F0]">tracer</span> ce qui a été dit,{" "}
              <strong className="font-semibold text-[#0F172A]">acté</strong> et{" "}
              <strong className="font-semibold text-[#0F172A]">à faire</strong> — avec responsables et délais —
              pour préparer la réunion suivante et sécuriser le suivi.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/ressources"
                className="inline-flex min-h-[2.875rem] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-[#0F172A] shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                ← Ressources
              </Link>
              <CalendlyBookingLink className="inline-flex min-h-[2.875rem] items-center justify-center gap-2 rounded-xl bg-[#1d4ed8] px-6 text-sm font-semibold text-white shadow-md shadow-[#1d4ed8]/22 transition hover:bg-[#1e40af]">
                Réserver un appel
              </CalendlyBookingLink>
            </div>
          </div>
        </div>
      </div>

      <main className="relative z-[1]">
        {/* Encadré objectif */}
        <div className="container-site -mt-4 pb-14 md:-mt-6 md:pb-20">
          <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_10px_40px_-16px_rgba(15,23,42,0.1)] ring-1 ring-slate-100/85 md:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#1d4ed8]">Objectif</p>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
              Une structure simple, une checklist et une méthode rapide pour sortir un compte rendu exploitable (réunion
              chantier, point client, visite avec réserves…).
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Le contenu exact dépend du chantier, des intervenants et du cadre contractuel. Gardez une validation finale
              sur les points qui engagent votre entreprise.
            </p>
          </div>

          {/* Corps tuto */}
          <article className="mx-auto mt-10 max-w-3xl space-y-0 rounded-2xl border border-slate-200/90 bg-white px-7 py-10 shadow-[0_10px_40px_-16px_rgba(15,23,42,0.1)] ring-1 ring-slate-100/85 md:px-10 md:py-12">
            <section>
              <h2 className="text-xl font-bold tracking-tight text-[#0F172A] md:text-[1.35rem]">
                Qu’est-ce qu’un compte rendu de chantier ?
              </h2>
              <div className="prose prose-slate mt-5 max-w-none prose-p:text-[15px] prose-p:leading-relaxed prose-p:text-slate-700 prose-strong:font-semibold prose-strong:text-[#0F172A]">
                <p>
                  Un <strong>compte rendu de chantier</strong> est un document qui résume les échanges, décisions, avancement,
                  points bloquants et <strong>actions à suivre</strong> après une réunion ou un point chantier. Son rôle est d’être clair,
                  daté, diffusable et facile à relire.
                </p>
              </div>
            </section>

            <ArticleProseSection title={TUTO_TITRE.aQuoi}>
              <ul className="!mt-0">
                <li>Garder une trace des décisions et arbitrages.</li>
                <li>Clarifier les responsabilités (qui fait quoi).</li>
                <li>Suivre les actions à réaliser (avec délais et statuts).</li>
                <li>Éviter les oublis et les « on avait dit quoi déjà ? ».</li>
                <li>Formaliser les points bloquants (validations, matériaux, accès, plans…).</li>
                <li>Suivre les réserves ou demandes client et préparer la réunion suivante.</li>
                <li>Améliorer la relation avec le client / la MOE / les entreprises (moins de flou).</li>
              </ul>
            </ArticleProseSection>

            <ArticleProseSection title={TUTO_TITRE.quand}>
              <ul className="!mt-0">
                <li>Après une réunion chantier.</li>
                <li>Après un point client important.</li>
                <li>Après une visite avec réserves ou constats.</li>
                <li>Après un échange multi-intervenants (coordination, planning, appro…).</li>
                <li>Quand une décision doit être tracée ou qu’une action doit être suivie.</li>
              </ul>
            </ArticleProseSection>

            <section aria-labelledby="titre-checklist" className="pt-10">
              <h2 id="titre-checklist" className="text-xl font-bold tracking-tight text-[#0F172A] md:text-[1.35rem]">
                Que doit contenir un compte rendu ?
              </h2>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate-600">
                Une checklist courte — adaptez au contexte chantier et au type de réunion.
              </p>
              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <ChecklistCard
                  title="Informations générales"
                  items={[
                    "Chantier concerné (références, adresse/zone si utile).",
                    "Date de réunion et objet du point.",
                    "Lieu ou format (sur site, visio, téléphone).",
                    "Participants / entreprises présentes (et absents si nécessaire).",
                  ]}
                />
                <ChecklistCard
                  title="Avancement"
                  items={[
                    "Travaux réalisés (faits).",
                    "Travaux en cours (où on en est).",
                    "Travaux à venir (prochaines étapes).",
                    "Planning, décalages et impacts (si nécessaire).",
                  ]}
                />
                <ChecklistCard
                  title="Décisions prises"
                  items={[
                    "Décisions validées / arbitrages.",
                    "Demandes client et modifications actées.",
                    "Points à valider ultérieurement (avec responsable).",
                  ]}
                />
                <ChecklistCard
                  title="Points bloquants"
                  items={[
                    "Accès, coactivité, contraintes site.",
                    "Matériaux / livraisons / locations.",
                    "Plans, schémas, documents manquants.",
                    "Validations en attente, réserves, retards, coordination.",
                  ]}
                />
              </div>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <ChecklistCard
                  title="Actions à suivre"
                  items={[
                    "Action à faire (formulation précise, sans flou).",
                    "Responsable désigné (une personne/une entreprise).",
                    "Date limite / échéance.",
                    "Statut (à faire / en cours / fait) et commentaire si utile.",
                  ]}
                />
                <ChecklistCard
                  title="Prochaine étape"
                  items={[
                    "Prochaine réunion (date/heure si connue).",
                    "Documents à transmettre (qui, quoi, pour quand).",
                    "Points à vérifier avant le prochain point.",
                  ]}
                />
              </div>
            </section>

            <ArticleProseSection title={TUTO_TITRE.etapes}>
              <ol className="!mt-0">
                <li>Prendre des notes pendant la réunion (et repérer les décisions).</li>
                <li>Distinguer faits, décisions et demandes (trois blocs différents).</li>
                <li>Éviter les phrases floues (qui / quoi / où / quand).</li>
                <li>Nommer un responsable par action.</li>
                <li>Ajouter une date limite réaliste.</li>
                <li>Classer les points par priorité (bloquants en haut).</li>
                <li>Envoyer rapidement après réunion (idéalement J0 / J+1).</li>
                <li>Archiver une version propre (dossier unique, nommage cohérent).</li>
                <li>Suivre les actions avant la prochaine réunion.</li>
              </ol>
            </ArticleProseSection>

            <ArticleProseSection title={TUTO_TITRE.erreurs}>
              <ul className="!mt-0">
                <li>Compte rendu envoyé trop tard : les souvenirs divergent.</li>
                <li>Aucun responsable : personne ne se sent concerné.</li>
                <li>Aucune date limite : l’action disparaît jusqu’à la prochaine réunion.</li>
                <li>Décisions mélangées avec discussions : on ne sait plus ce qui est acté.</li>
                <li>Phrases vagues (« voir », « à confirmer ») sans précision.</li>
                <li>Réserves non suivies : elles reviennent au pire moment.</li>
                <li>Documents joints oubliés : impossible de valider.</li>
                <li>Absence de suivi : le CR devient un fichier « pour la forme ».</li>
              </ul>
            </ArticleProseSection>

            <section aria-labelledby="titre-modele" className="pt-10">
              <h2 id="titre-modele" className="text-xl font-bold tracking-tight text-[#0F172A] md:text-[1.35rem]">
                {TUTO_TITRE.exemple}
              </h2>
              <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.92fr]">
                <StructureModelCard />
                <div className="flex flex-col justify-center rounded-2xl border border-slate-200/90 bg-[#fafbfc] p-6 ring-1 ring-slate-100/80 md:p-7">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1d4ed8]">Astuce</p>
                  <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
                    Si vous ne deviez garder qu’un élément : <strong className="text-[#0F172A]">un tableau d’actions</strong>{" "}
                    (action + responsable + date limite + statut). C’est lui qui transforme un compte rendu en outil de pilotage.
                  </p>
                </div>
              </div>
            </section>

            <ArticleProseSection title="Comment BeWork peut aider">
              <>
                <p className="!mt-2">
                  BeWork peut vous aider à préparer et exploiter vos comptes rendus{" "}
                  <span className="text-[#3072F0] font-semibold">(assistante travaux / documents chantier)</span> :
                </p>
                <ul>
                  <li>remise en forme des notes ;</li>
                  <li>structure claire du compte rendu ;</li>
                  <li>tableau d’actions (responsables, délais, statuts) ;</li>
                  <li>archivage et relances sur les points en attente.</li>
                </ul>
                <p className="not-prose mt-6 rounded-xl border border-blue-100 bg-[#eff6ff]/50 px-4 py-3 text-sm leading-relaxed text-slate-700">
                  <strong className="text-[#0F172A]">Important.</strong> Vous gardez la validation finale avant diffusion. BeWork ne
                  remplace pas le maître d’œuvre, le conducteur de travaux, le responsable chantier ou l’expert technique : un
                  compte rendu ne vaut pas validation technique par lui-même.
                </p>
              </>
            </ArticleProseSection>

            <ArticleProseSection title="Exemple concret">
              <p className="!mt-3">
                Après une réunion chantier avec plusieurs entreprises, les notes sont dispersées et les décisions ne sont pas
                formalisées. BeWork peut structurer le compte rendu, identifier les actions à suivre, préparer le tableau de
                responsabilités et vous transmettre une version claire à valider.
              </p>
            </ArticleProseSection>

            {/* CTA style accueil */}
            <aside
              aria-label="Aller plus loin"
              className="mt-12 border-t border-slate-100 pt-10"
              style={{ scrollMarginTop: "6rem" }}
            >
              <div className="rounded-2xl border border-[#1d4ed8]/25 bg-[#fafcff] px-6 py-7 ring-1 ring-blue-500/10 md:p-8">
                <p className="text-lg font-bold tracking-tight text-[#0F172A]">Structurer vos suivis sans vous perdre dans les mails</p>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
                  Besoin d’un appui pour mettre au propre, classer et suivre vos comptes rendus — avec un circuit de validation net.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <CalendlyBookingLink className="inline-flex min-h-[3rem] items-center justify-center rounded-xl bg-[#1d4ed8] px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#1d4ed8]/22 transition hover:bg-[#1e40af]">
                    Réserver un échange
                  </CalendlyBookingLink>
                  <Link
                    href="/assistants-administratifs-taches"
                    className="inline-flex min-h-[3rem] items-center justify-center rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-[#0F172A] shadow-sm hover:border-slate-300 hover:bg-slate-50"
                  >
                    Voir les missions
                  </Link>
                  <Link
                    href="/notre-facon-de-travailler"
                    className="inline-flex min-h-[3rem] items-center justify-center rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-[#0F172A] shadow-sm hover:border-slate-300 hover:bg-slate-50"
                  >
                    Notre méthode
                  </Link>
                  <Link
                    href="/tarifs"
                    className="inline-flex min-h-[3rem] items-center justify-center rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-[#0F172A] shadow-sm hover:border-slate-300 hover:bg-slate-50"
                  >
                    Tarifs
                  </Link>
                  <Link
                    href="/ressources"
                    className="inline-flex min-h-[3rem] items-center justify-center rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-[#1d4ed8] shadow-sm hover:border-slate-300 hover:bg-[#eff6ff]/60"
                  >
                    ← Ressources
                  </Link>
                </div>
              </div>
            </aside>

            <section id="faq" aria-label="FAQ compte rendu" className="mt-14 scroll-mt-[6.5rem]">
              <h2 className="border-b border-slate-200 pb-3 text-xl font-bold tracking-tight text-[#0F172A] md:text-2xl">
                {TUTO_TITRE.faq}
              </h2>
              <p className="mt-2 text-sm text-slate-600">Réponses rapides avant d’adapter à votre chantier.</p>
              <dl className="mt-6 space-y-3">
                {FAQ_ITEMS.map((item) => (
                  <div
                    key={item.q}
                    className="rounded-2xl border border-slate-200/90 bg-[#fafbfc] px-5 py-4 ring-1 ring-slate-100/85"
                  >
                    <dt className="text-[15px] font-semibold text-[#0F172A]">{item.q}</dt>
                    <dd className="mt-2 text-[14px] leading-relaxed text-slate-600">{item.a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </article>

          {/* Bloc aide type SeoLandingPage mais assorti */}
          <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-slate-200/90 bg-white p-8 shadow-[0_10px_40px_-16px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/85 md:p-9">
            <h2 className="text-xl font-bold text-[#0F172A]">Vérifier l’adéquation avec votre charge</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
              BeWork intervient pour artisans, conducteurs de travaux et dirigeants BTP — avec des forfaits TTC cadrés par volume.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <CalendlyBookingLink className="inline-flex justify-center rounded-xl bg-[#1d4ed8] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1e40af]">
                Échanger sur votre besoin
              </CalendlyBookingLink>
              <Link
                href="/tarifs"
                className="inline-flex justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-[#0F172A] shadow-sm hover:bg-slate-50"
              >
                Consulter les forfaits
              </Link>
            </div>
          </div>
        </div>
      </main>

      <MarketingSiteFooter />
    </div>
  );
}
