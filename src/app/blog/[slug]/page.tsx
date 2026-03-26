import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import type { BlogSlug } from "@/content/blog-slugs";
import { absoluteUrl, SITE_URL } from "@/lib/site";

type BlogArticle = {
  title: string;
  description: string;
  body: { type: "h2" | "p"; content: string }[];
};

const ARTICLES: Record<BlogSlug, BlogArticle> = {
  "10-taches-administratives-deleguer-dirigeant": {
    title: "10 tâches administratives à déléguer quand on est dirigeant",
    description:
      "Les 10 tâches administratives les plus chronophages à déléguer pour les dirigeants. Gagnez du temps et recentrez-vous sur votre cœur de métier.",
    body: [
      { type: "h2", content: "1. Gestion des emails" },
      { type: "p", content: "Tri, priorisation et réponses simples : un assistant administratif externalisé peut traiter les messages courants et ne vous transmettre que l'essentiel." },
      { type: "h2", content: "2. Devis et factures" },
      { type: "p", content: "Création, envoi et relance des devis et factures. Une tâche répétitive et chronophage que les dirigeants délèguent volontiers." },
      { type: "h2", content: "3. Relances clients" },
      { type: "p", content: "Relances amiables ou formalisées des factures impayées. Votre assistant peut suivre le processus et vous alerter si nécessaire." },
      { type: "h2", content: "4. Agenda et RDV" },
      { type: "p", content: "Planification des rendez-vous, coordination avec les participants, rappels. Un gain de temps considérable pour les dirigeants toujours sur le pont." },
      { type: "h2", content: "5. Suivi des dossiers" },
      { type: "p", content: "Collecte des pièces, mise à jour CRM, alertes d'échéances. L'assistant administratif à distance garde la main sur le suivi des dossiers." },
      { type: "h2", content: "6. Recherche fournisseurs" },
      { type: "p", content: "Demandes de devis, comparatifs, relances commandes. Une tâche qui prend beaucoup de temps et peut être externalisée." },
      { type: "h2", content: "7. Saisie documentaire" },
      { type: "p", content: "Saisie, mise en forme et classement de documents. Les dirigeants peuvent déléguer cette charge pour se concentrer sur la stratégie." },
      { type: "h2", content: "8. Pré-comptabilité" },
      { type: "p", content: "Classement des pièces, saisie des écritures courantes, transmission au comptable. Un flux propre sans mobiliser le dirigeant." },
      { type: "h2", content: "9. Reporting simple" },
      { type: "p", content: "Mises à jour des tableaux de bord, KPI simples (CA, factures en attente). L'assistant prépare les données, le dirigeant analyse." },
      { type: "h2", content: "10. Administration RH légère" },
      { type: "p", content: "Suivi des congés, notes de frais, mise à jour des dossiers. Des tâches essentielles mais chronophages à déléguer." },
    ],
  },
  "combien-coute-assistant-administratif": {
    title: "Combien coûte un assistant administratif ?",
    description:
      "Comparatif des coûts : assistant administratif externalisé vs salarié. Dès 215 € TTC/mois chez BeWork pour les PME.",
    body: [
      { type: "h2", content: "Assistant administratif externalisé : les tarifs BeWork" },
      { type: "p", content: "BeWork propose des forfaits dès 215 € TTC/mois (formule Standard, 120 actions/mois, soit environ 20 h d'assistance), 415 € TTC/mois (Business, 240 actions) et 630 € TTC/mois (Premium, 360 actions). L'offre Découverte à 109 € TTC permet de tester le service. Tout est inclus : pas de charges sociales, pas de recrutement." },
      { type: "h2", content: "Assistant en interne : le coût réel" },
      { type: "p", content: "Un assistant administratif en CDI en Europe coûte environ 5 050€/mois (salaire brut + charges + bureau + matériel + recrutement). Soit jusqu'à 75 % plus cher qu'une solution externalisée." },
      { type: "h2", content: "Pourquoi externaliser coûte moins cher ?" },
      { type: "p", content: "Pas de charges sociales, pas de bureau, pas de matériel, pas de recrutement. Vous payez un forfait tout compris et vous ne réglez que les actions consommées. Scalabilité et flexibilité à la clé." },
    ],
  },
  "assistant-virtuel-vs-assistant-salarie": {
    title: "Assistant virtuel vs assistant salarié",
    description:
      "Comparatif assistant administratif externalisé vs recrutement interne. Avantages et inconvénients pour les PME.",
    body: [
      { type: "h2", content: "Assistant virtuel (externalisé) : avantages" },
      { type: "p", content: "Coût maîtrisé (dès 215 € TTC/mois), pas de recrutement, pas de charges sociales, scalabilité selon les besoins, opérationnel rapidement, supervision en France avec BeWork." },
      { type: "h2", content: "Assistant salarié : avantages" },
      { type: "p", content: "Présence physique possible, lien direct si besoin d'un bureau sur site. En revanche, coût élevé (~5 050€/mois), charges, recrutement, formation." },
      { type: "h2", content: "Pour qui choisir quoi ?" },
      { type: "p", content: "L'assistant virtuel convient aux PME qui veulent externaliser administratif sans recruter, aux dirigeants surchargés, aux entreprises qui souhaitent scaler sans engagement long terme. L'assistant salarié reste pertinent si une présence physique est indispensable." },
    ],
  },
  "gagner-5-heures-semaine-deleguer-administratif": {
    title: "Comment gagner 5 heures par semaine en déléguant l'administratif",
    description:
      "Conseils pratiques pour identifier les tâches à déléguer et libérer du temps avec un assistant administratif externalisé.",
    body: [
      { type: "h2", content: "Identifiez les tâches chronophages" },
      { type: "p", content: "Listez pendant une semaine ce qui vous prend du temps : emails, facturation, relances, agenda. Ces tâches sont les premières candidates à la délégation." },
      { type: "h2", content: "Priorisez ce qui peut être externalisé" },
      { type: "p", content: "Tout ce qui est répétitif, cadré par des process, ne nécessite pas une décision stratégique peut être délégué. Un assistant administratif externalisé gère devis, factures, relances, suivi de dossiers." },
      { type: "h2", content: "Démarrez progressivement" },
      { type: "p", content: "Commencez par une ou deux missions pilotes (ex. relances factures, agenda). Validez les livrables, affinez les consignes, puis élargissez le périmètre." },
      { type: "h2", content: "Résultat : 5 h et plus par semaine" },
      { type: "p", content: "Avec un assistant BeWork, les dirigeants récupèrent en moyenne 5 à 20 heures par semaine selon le volume délégué. Temps réinvesti dans le développement commercial, la stratégie ou la vie personnelle." },
    ],
  },
  "externaliser-assistant-administratif-avantages": {
    title: "Externaliser son assistant administratif : 7 avantages concrets pour une PME",
    description:
      "Pourquoi externaliser votre assistant administratif ? 7 bénéfices concrets pour les dirigeants de PME : coûts, flexibilité, continuité de service et qualité.",
    body: [
      { type: "h2", content: "1. Un coût maîtrisé et prévisible" },
      { type: "p", content: "Avec un assistant administratif externalisé, vous payez un forfait clair, sans charges sociales, sans bureau ni matériel. Le coût devient une ligne de service, pas une masse salariale fixe." },
      { type: "h2", content: "2. Une montée en charge plus simple" },
      { type: "p", content: "Quand le volume de dossiers augmente, vous ajustez votre forfait au lieu de recruter une nouvelle personne. Idéal pour les saisons hautes, les pics d’activité ou les périodes de croissance." },
      { type: "h2", content: "3. Moins de risques RH" },
      { type: "p", content: "Absences, turn-over, recrutement raté… Autant de risques pris en charge par le prestataire. Votre continuité de service administratif est assurée, même en cas d’imprévu." },
      { type: "h2", content: "4. Une expertise mutualisée" },
      { type: "p", content: "Les assistants externalisés travaillent pour plusieurs clients, secteurs et outils. Ils capitalisent sur ces expériences pour vous proposer de meilleures pratiques et des idées d’optimisation." },
      { type: "h2", content: "5. Un démarrage rapide" },
      { type: "p", content: "Inutile d’attendre des semaines entre l’offre, le recrutement, l’onboarding. Avec BeWork, un assistant peut être opérationnel en quelques jours après cadrage de votre périmètre." },
      { type: "h2", content: "6. Une direction et un suivi structurés" },
      { type: "p", content: "Les assistants sont encadrés par une équipe de pilotage. Vous n’êtes pas seul à gérer l’organisation de l’administratif : l’agence vous accompagne et suit la qualité au quotidien." },
      { type: "h2", content: "7. Un levier pour vous concentrer sur le développement" },
      { type: "p", content: "Moins de temps dans les mails, la facturation et les relances = plus de temps pour vos clients, vos offres, votre développement commercial. Externaliser l’administratif devient un levier de croissance, pas seulement une charge." },
    ],
  },
  "organiser-journee-dirigeant-avec-assistant": {
    title: "Comment organiser votre journée de dirigeant avec l’aide d’un assistant administratif",
    description:
      "Modèle de journée type pour un dirigeant qui travaille avec un assistant administratif externalisé : priorisation, délégation et rituels de suivi.",
    body: [
      { type: "h2", content: "Matin : prioriser et déléguer" },
      { type: "p", content: "Commencez la journée par 15 minutes de revue avec votre assistant : mails importants, urgences, relances à prévoir. Tout ce qui est répétitif ou administratif part en mission dans BeWork." },
      { type: "h2", content: "Milieu de journée : focus business" },
      { type: "p", content: "Bloquez des plages sans interruption pour vos rendez-vous clients, vos propositions commerciales ou votre production. Pendant ce temps, l’assistant traite les flux administratifs en arrière-plan." },
      { type: "h2", content: "Fin de journée : point rapide et préparation du lendemain" },
      { type: "p", content: "En 10 à 20 minutes, faites le point : missions terminées, dossiers en attente, prochaines échéances. Ce rituel simple vous permet de fermer la journée l’esprit plus léger." },
      { type: "h2", content: "Mettre en place des rituels hebdomadaires" },
      { type: "p", content: "Ajoutez un point hebdomadaire plus long (30 minutes) pour revoir les KPIs : nombre de missions, factures envoyées, relances, dossiers clos. Votre assistant prépare le reporting, vous prenez les décisions." },
      { type: "h2", content: "Résultat : moins de charge mentale, plus de clarté" },
      { type: "p", content: "Avec un minimum de rituels, votre administratif cesse d’être une fuite de temps permanente et devient un processus cadré, piloté en binôme avec votre assistant." },
    ],
  },
  "erreurs-a-eviter-deleguer-administratif": {
    title: "5 erreurs à éviter quand vous commencez à déléguer votre administratif",
    description:
      "Les pièges classiques à éviter lorsqu’on démarre avec un assistant administratif externalisé : périmètre flou, consignes incomplètes, absence de suivi… et comment faire mieux.",
    body: [
      { type: "h2", content: "1. Ne pas définir clairement le périmètre" },
      { type: "p", content: "« Tu t’occupes de l’administratif » est trop vague. Listez les types de missions : devis, factures, relances, pré-comptabilité, suivi de dossiers… Plus le périmètre est clair, plus la collaboration est fluide." },
      { type: "h2", content: "2. Garder toutes les décisions pour soi" },
      { type: "p", content: "Si votre assistant doit valider chaque détail avec vous, vous ne gagnez pas de temps. Donnez des règles de décision : montants seuils, modèles de réponse, cas où il peut agir en autonomie." },
      { type: "h2", content: "3. Oublier de partager les outils et accès" },
      { type: "p", content: "Pour bien travailler, l’assistant a besoin d’accéder à vos outils (facturation, CRM, agenda…). Prévoyez une mise à disposition sécurisée et documentée dès le démarrage." },
      { type: "h2", content: "4. Ne pas donner de feedback" },
      { type: "p", content: "Les premières missions servent à caler votre façon de travailler. Prenez le temps de dire ce qui vous convient, ce qui doit être ajusté. C’est un investissement qui se rentabilise très vite." },
      { type: "h2", content: "5. Vouloir tout déléguer d’un coup" },
      { type: "p", content: "Commencez par un bloc de missions ciblé (ex. facturation + relances), puis élargissez progressivement. Vous gardez le contrôle, tout en faisant monter votre assistant en puissance." },
      { type: "h2", content: "Bien démarrer la délégation" },
      { type: "p", content: "En évitant ces erreurs, vous transformez rapidement la délégation en vrai levier de confort et de croissance. L’objectif : moins de charge mentale, plus de temps utile pour votre entreprise." },
    ],
  },
};

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(ARTICLES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES[slug as BlogSlug];
  if (!article) return { title: "Article non trouvé | BeWork" };
  const url = absoluteUrl(`/blog/${slug}`);
  return {
    title: `${article.title} | BeWork Blog`,
    description: article.description,
    alternates: { canonical: url, languages: { fr: url } },
    openGraph: {
      type: "article",
      locale: "fr_FR",
      url,
      siteName: "BeWork",
      title: article.title,
      description: article.description,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
    },
    robots: { index: true, follow: true },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = ARTICLES[slug as BlogSlug];
  if (!article) notFound();

  const pageUrl = absoluteUrl(`/blog/${slug}`);
  const blogPostingLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    inLanguage: "fr-FR",
    url: pageUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    publisher: {
      "@type": "Organization",
      name: "BeWork",
      url: SITE_URL,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#e0e4ea]">
      <header className="sticky top-0 z-20 border-b border-[#c8cdd6] bg-[#f8f9fb]">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="shrink-0">
            <BeWorkLogo size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/blog" className="text-sm font-medium text-[#64748b] hover:text-[#0f172a]">Blog</Link>
            <Link href="/inscription" className="rounded-lg bg-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1e40af]">
              Tester BeWork
            </Link>
          </div>
        </div>
      </header>

      <main className="px-6 py-16 md:py-24">
        <article className="mx-auto max-w-2xl" itemScope itemType="https://schema.org/BlogPosting">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingLd) }}
          />
          <Link href="/blog" className="text-sm font-medium text-[#1d4ed8] hover:underline">
            ← Retour au blog
          </Link>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl" itemProp="headline">
            {article.title}
          </h1>
          <div className="mt-12 space-y-6 text-[#334155]">
            {article.body.map((block, i) =>
              block.type === "h2" ? (
                <h2 key={i} className="text-xl font-semibold text-[#0f172a]">
                  {block.content}
                </h2>
              ) : (
                <p key={i} className="leading-relaxed">
                  {block.content}
                </p>
              )
            )}
          </div>
          <div className="mt-12 rounded-xl border-2 border-[#1d4ed8]/30 bg-[#eff6ff] p-8">
            <p className="font-semibold text-[#0f172a]">Prêt à déléguer votre administratif ?</p>
            <p className="mt-2 text-[#334155]">BeWork propose un assistant administratif externalisé dès 215 € TTC/mois.</p>
            <Link
              href="/inscription"
              className="mt-4 inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-semibold text-white hover:bg-[#1e40af]"
            >
              Tester BeWork
            </Link>
          </div>
        </article>
      </main>

      <footer className="border-t border-[#c8cdd6] bg-[#f8f9fb] px-6 py-12 mt-16">
        <div className="mx-auto max-w-6xl flex flex-col gap-6 md:flex-row md:items-center md:justify-between text-sm text-[#334155]">
          <div className="flex items-center gap-3">
            <BeWorkLogo size="sm" />
            <span className="text-[#0f172a]">© {new Date().getFullYear()} BeWork</span>
          </div>
          <div className="flex gap-6">
            <Link href="/" className="font-medium hover:text-[#0f172a]">Accueil</Link>
            <Link href="/blog" className="font-medium hover:text-[#0f172a]">Blog</Link>
            <Link href="/contact" className="font-medium hover:text-[#0f172a]">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
