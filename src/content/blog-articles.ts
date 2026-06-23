/**
 * Contenu des articles blog — source unique (liste /blog, pages /blog/[slug],
 * carrousel /ressources, sitemap.xml, JSON-LD).
 *
 * Pour publier un nouvel article :
 *
 *   1. Choisir un slug kebab-case clair, ex. `relance-devis-btp-checklist`.
 *      L'URL sera : https://www.bework.fr/blog/relance-devis-btp-checklist
 *
 *   2. Ajouter une entrée dans BLOG_ARTICLES (cf. exemple ci-dessous) :
 *      - title : ≤ 60 caractères (apparaît dans Google, Twitter, OG)
 *      - description : 145–160 caractères (meta description SEO)
 *      - excerpt : 1–2 phrases pour le résumé carte (par défaut = description)
 *      - keywords : 5 à 10 expressions cibles BTP
 *      - publishedTime / modifiedTime : ISO 8601 (ex. "2026-06-01T09:00:00+02:00")
 *      - articleSection : thème (ex. "Marchés travaux", "Administratif chantier")
 *      - body : alternance de blocs (cf. BlogBodyBlock ci-dessous)
 *
 *   3. Commit + push → Railway redéploie en quelques minutes :
 *      - L'article apparaît automatiquement sur /blog
 *      - La carte apparaît sur /ressources (section "Blog", triée par date)
 *      - L'URL est ajoutée à /sitemap.xml et indexée par Google
 *      - JSON-LD BlogPosting + Article + BreadcrumbList + FAQPage (si bloc faq) générés automatiquement
 *
 * Stockage : fichier TS versionné dans Git (pas de DB). Avantages :
 *   - Génération statique (SSG) → 0 appel DB en prod, rendu instantané
 *   - Historique Git natif (rollback facile)
 *   - Pas de cold start, pas de risque 5xx
 */

/** Blocs supportés dans le corps d'un article. */
export type BlogBodyBlock =
  | { type: "h2"; content: string }
  | { type: "h3"; content: string }
  | { type: "p"; content: string }
  | {
      /** Encadré "L'essentiel en 30 secondes" en haut d'article. */
      type: "tldr";
      title?: string;
      points: string[];
    }
  | { type: "ul"; items: string[] }
  | {
      /** Tableau avec entête + lignes. Chaque cellule est du texte brut. */
      type: "table";
      headers: string[];
      rows: string[][];
      caption?: string;
    }
  | {
      /** Encadré coloré (note, alerte, info, succès). */
      type: "callout";
      variant?: "info" | "warning" | "success" | "highlight";
      title?: string;
      content: string;
    }
  | { type: "quote"; content: string; cite?: string }
  | {
      /** Liste de fichiers téléchargeables (PDF, XLSX...) avec aperçu optionnel intégré façon annales. */
      type: "downloads";
      title?: string;
      description?: string;
      items: {
        label: string;
        href: string;
        /** Extension affichée (PDF, XLSX, DOCX…). */
        kind: string;
        /** Taille humanisée optionnelle (ex. "162 Ko"). */
        size?: string;
        /** Description courte 1 ligne. */
        description?: string;
        /** Nom de fichier proposé au téléchargement (attribut HTML `download`). */
        downloadAs?: string;
        /** Si true ET fichier PDF : affiche un aperçu intégré (iframe). */
        preview?: boolean;
        /** Hauteur de l'aperçu (px), par défaut 720. */
        previewHeight?: number;
      }[];
    }
  | {
      /** FAQ structurée (rend des <details> + génère le JSON-LD FAQPage). */
      type: "faq";
      title?: string;
      items: { question: string; answer: string }[];
    };

export type BlogArticle = {
  title: string;
  description: string;
  /** Résumé carte sur /blog et /ressources ; par défaut = description */
  excerpt?: string;
  keywords: string[];
  /** ISO 8601 — Open Graph & JSON-LD */
  publishedTime: string;
  modifiedTime?: string;
  /** Thème pour schema.org articleSection (ex. "Marchés travaux", "Administratif chantier") */
  articleSection?: string;
  body: BlogBodyBlock[];
};

import { BLOG_ARTICLES_SEO } from "@/content/blog-articles-seo";

export const BLOG_ARTICLES: Record<string, BlogArticle> = {
  ...BLOG_ARTICLES_SEO,
  "gerer-aleas-chantier": {
    title: "Gérer les aléas de chantier : éviter les pénalités de retard",
    description:
      "Intempéries, retards de livraison, OS imprévus : la méthode pour recaler votre planning, chiffrer un rattrapage et éviter les pénalités sur un chantier BTP.",
    excerpt:
      "Recaler son planning, chiffrer un rattrapage, sécuriser une note d'impact CCAG art. 19 : la méthode complète + planning Hortensias et exemple de livrable téléchargeables.",
    keywords: [
      "gérer les aléas de chantier",
      "planning chantier BTP",
      "pénalités de retard chantier",
      "note d'impact CCAG",
      "recaler un planning",
      "chemin critique chantier",
      "CCAG-Travaux article 19",
      "conducteur de travaux",
    ],
    publishedTime: "2026-05-24T09:00:00+02:00",
    modifiedTime: "2026-05-26T18:00:00+02:00",
    articleSection: "Gestion de chantier",
    body: [
      {
        type: "tldr",
        title: "L'essentiel en 30 secondes",
        points: [
          "Un aléa mal géré peut coûter 1 850 € par jour de pénalité sur un marché à 1,85 M€.",
          "Face à un imprévu, trois réflexes : recaler le planning, chiffrer un scénario de rattrapage, sécuriser avec une note d'impact CCAG art. 19.",
          "Sur un cas réel de double aléa (intempérie + retard menuiseries), le pilotage a évité 18 500 € de pénalité pour un surcoût maîtrisé de 12 800 €.",
          "Règle d'or chantier : anticiper coûte un, réparer coûte dix.",
        ],
      },
      {
        type: "p",
        content:
          "Quatre jours de pluie. Six jours de retard sur une livraison de menuiseries. Et une pénalité de 1 850 € par jour qui commence à tourner dans votre tête.",
      },
      {
        type: "p",
        content:
          "Si vous conduisez des travaux, cette situation ne vous est pas étrangère. L'aléa n'est pas l'exception sur un chantier : c'est la règle. La vraie question n'est pas de savoir si un imprévu va survenir, mais comment vous allez le gérer quand il tombera.",
      },

      { type: "h2", content: "Qu'est-ce qu'un aléa de chantier ?" },
      {
        type: "p",
        content:
          "Un aléa de chantier désigne tout événement imprévu qui perturbe le déroulement normal des travaux et menace le respect du délai contractuel. On distingue huit grandes familles d'aléas : intempéries, retards de livraison, absences de personnel, ordres de service modificatifs, co-activité bloquée, malfaçons, défauts d'autorisation administrative et sinistres.",
      },
      {
        type: "p",
        content:
          "Certains aléas sont imputables à l'entreprise (absence, malfaçon), d'autres non (intempérie exceptionnelle, défaillance d'un fournisseur). Cette distinction est déterminante : elle conditionne votre droit à une prolongation de délai au titre de l'article 19 du CCAG-Travaux.",
      },
      {
        type: "table",
        caption: "Régime de responsabilité par type d'aléa chantier",
        headers: ["Type d'aléa", "Imputable à l'entreprise ?", "Base juridique"],
        rows: [
          ["Intempérie exceptionnelle", "Non", "CCAG-Travaux art. 19"],
          ["Retard de livraison fournisseur", "Non", "CCAG-Travaux art. 19"],
          ["Ordre de service modificatif", "Non", "CCAG-Travaux art. 13-14"],
          ["Défaut d'autorisation administrative", "Non", "CCAG-Travaux art. 19"],
          ["Co-activité bloquée", "Partagé", "CCAG-Travaux art. 31"],
          ["Absence de personnel", "Oui", "À la charge de l'entreprise"],
          ["Malfaçon", "Oui", "CCAG-Travaux art. 27-28"],
          ["Sinistre / vol", "Oui (sécurité chantier)", "CCAG-Travaux art. 24"],
        ],
      },

      { type: "h2", content: "Pourquoi un aléa de chantier coûte si cher" },
      {
        type: "p",
        content:
          "La plupart des marchés de travaux prévoient une pénalité de retard calculée au millième du montant du marché, par jour calendaire. Sur un chantier à 1,85 million d'euros, cela représente 1 850 € par jour. Dix jours de glissement, et ce sont 18 500 € qui s'évaporent.",
      },
      {
        type: "p",
        content:
          "Le piège, c'est le chemin critique. En milieu de chantier, les marges de planning sont souvent déjà consommées. Quand un aléa frappe une tâche située sur ce chemin critique — une étanchéité, une livraison structurante, une phase de gros œuvre — il se répercute directement sur la date de livraison. Il n'y a plus de coussin pour absorber.",
      },
      {
        type: "p",
        content:
          "C'est exactement là que se joue la différence entre un conducteur de travaux qui subit et un conducteur de travaux qui pilote.",
      },

      { type: "h2", content: "Les trois réflexes face à un aléa" },
      {
        type: "p",
        content:
          "Quand l'imprévu survient, vous avez trois options. Elles ne se valent pas.",
      },

      { type: "h3", content: "1. Subir le glissement" },
      {
        type: "p",
        content:
          "Vous laissez le retard se propager et vous espérez que le maître d'ouvrage acceptera une prolongation de délai. C'est l'option la plus risquée : si la demande est refusée, la pénalité tombe. Une demande mal documentée, rédigée dans l'urgence, a toutes les chances d'être contestée.",
      },

      { type: "h3", content: "2. Recaler intelligemment le planning" },
      {
        type: "p",
        content:
          "Vous recalculez l'enchaînement des tâches, vous identifiez les zones où vous pouvez anticiper, et vous construisez un scénario de rattrapage. Par exemple : travailler quelques samedis sur la phase critique, ou démarrer une tâche en parallèle sur une zone déjà libérée. Le coût est réel, mais maîtrisé — et le délai contractuel est préservé.",
      },

      { type: "h3", content: "3. Sécuriser juridiquement" },
      {
        type: "p",
        content:
          "En parallèle, vous préparez une note d'impact conforme à l'article 19 du CCAG-Travaux. Même si vous choisissez le rattrapage, cette note constitue votre filet de sécurité : si le rattrapage échoue, vous avez déjà tracé l'aléa, daté le fait générateur et justifié la demande de prolongation.",
      },
      {
        type: "callout",
        variant: "highlight",
        title: "Règle de pilotage",
        content:
          "La bonne gestion d'un aléa, c'est presque toujours la combinaison du réflexe 2 et du réflexe 3 : on recale et on sécurise — jamais l'un sans l'autre.",
      },

      { type: "h2", content: "Cas concret : un chantier de 1,85 M€ face à une double contrainte" },
      {
        type: "p",
        content:
          "Prenons un chantier de 24 logements collectifs, en milieu d'exécution — mois 8 sur 14. Deux aléas tombent la même semaine :",
      },
      {
        type: "ul",
        items: [
          "Une intempérie exceptionnelle bloque l'étanchéité pendant 4 jours.",
          "Le fournisseur de menuiseries annonce 6 jours de retard de livraison.",
        ],
      },
      {
        type: "p",
        content:
          "Les deux tâches sont sur le chemin critique. La marge est à zéro. Sans réaction, le chantier glisse de 10 jours — soit 18 500 € de pénalité potentielle.",
      },
      {
        type: "p",
        content:
          "Le pilotage a transformé la situation en trois temps : recalage du planning sur les 62 semaines de l'opération, construction de trois scénarios de rattrapage chiffrés, et préparation d'une note CCAG art. 19 gardée en réserve.",
      },
      {
        type: "table",
        caption: "Trois scénarios de réponse comparés — chantier Résidence Les Hortensias (24 logements, 1,85 M€ HT)",
        headers: ["Scénario", "Action", "Surcoût", "Délai", "Risque"],
        rows: [
          [
            "A — Glissement",
            "Subir, demander une prolongation",
            "0 €",
            "+10 jours",
            "Pénalité 18 500 € si refus",
          ],
          [
            "B — Rattrapage",
            "Samedis travaillés + anticipation cloisons",
            "12 800 € HT",
            "Préservé",
            "Maîtrisé",
          ],
          [
            "C — Avenant",
            "Ajournement partiel négocié",
            "Variable",
            "Préservé",
            "Refus possible du maître d'ouvrage",
          ],
        ],
      },
      {
        type: "callout",
        variant: "success",
        title: "Décision retenue : scénario B",
        content:
          "Rattrapage par samedis travaillés et anticipation des cloisons sur zones libérées. Surcoût maîtrisé de 12 800 € HT, pénalité de 18 500 € évitée, délai contractuel préservé et relation MOA intacte. Soit 5 700 € d'écart entre subir et piloter — sans compter la sérénité d'un chantier qui tient son délai.",
      },

      { type: "h2", content: "La note d'impact CCAG art. 19 : votre meilleure protection" },
      {
        type: "p",
        content:
          "L'article 19 du CCAG-Travaux encadre les prolongations de délai liées à des événements qui ne vous sont pas imputables : intempéries exceptionnelles, force majeure, défaillance d'un tiers. Mais une demande de prolongation ne s'improvise pas.",
      },
      {
        type: "p",
        content: "Une note d'impact solide contient quatre éléments :",
      },
      {
        type: "ul",
        items: [
          "Le fait générateur daté et précis (relevé Météo-France, mail du fournisseur reconnaissant le retard).",
          "Les conséquences sur le délai, chiffrées en jours ouvrés et calendaires.",
          "La demande motivée, appuyée sur l'article applicable.",
          "Les pièces justificatives annexées.",
        ],
      },
      {
        type: "callout",
        variant: "warning",
        title: "Traçabilité = sécurité juridique",
        content:
          "Un aléa non documenté le jour où il survient devient très difficile à défendre trois mois plus tard. Tenir un journal des aléas tout au long du chantier — date, type, durée, impact, surcoût, statut — vaut bien plus que sa contrainte apparente.",
      },

      { type: "h2", content: "Anticiper plutôt que subir" },
      {
        type: "p",
        content:
          "La meilleure gestion d'un aléa, c'est encore de l'avoir anticipé. Chaque type d'imprévu a ses indicateurs d'alerte précoce :",
      },
      {
        type: "ul",
        items: [
          "Intempérie : suivi du bulletin météo à trois jours, programmation des tâches sensibles aux périodes stables.",
          "Retard de livraison : bons de commande passés trois semaines à l'avance, confirmation des fournisseurs à sept jours.",
          "Ordre de service : acceptation conditionnée à un avenant signé avant exécution.",
          "Co-activité : séquençage par zone, plan de prévention révisé à chaque entrée de corps d'état.",
        ],
      },
      {
        type: "p",
        content:
          "Une matrice de criticité — qui croise la probabilité et l'impact de chaque type d'aléa — permet de concentrer la vigilance là où elle compte vraiment. Anticiper coûte un. Réparer coûte dix.",
      },

      { type: "h2", content: "Le vrai problème : vous n'avez pas le temps" },
      {
        type: "p",
        content:
          "Recaler un planning sur 62 semaines, chiffrer trois scénarios, rédiger une note CCAG : tout cela prend des heures. Des heures que vous passez au bureau, le soir, alors que votre place est sur le chantier, à piloter les équipes et à anticiper le poste suivant.",
      },
      {
        type: "p",
        content:
          "C'est précisément le rôle d'une assistance travaux. Pendant que vous tenez le terrain, nous tenons le bureau : recalage de planning, chiffrage des scénarios, note d'impact, suivi des aléas. Vous gardez la décision — c'est votre métier. Nous vous rendons le temps de la prendre.",
      },
      {
        type: "p",
        content:
          "Augmentés par l'intelligence artificielle et supervisés par des humains en France, nos assistants travaux livrent des dossiers exploitables en trois à cinq jours. Sans recrutement à faire, sans risque RH.",
      },

      {
        type: "downloads",
        title: "Ressources planning chantier à consulter et télécharger",
        description:
          "Trois fichiers gratuits pour passer de la théorie au terrain : l'exemple de livrable BeWork (aperçu intégré), le planning Excel complet et le tutoriel skill Claude.",
        items: [
          {
            label: "Exemple de livrable BeWork — Recalage planning + Note d'impact MOA",
            href: "/ressources/pdf/exemple-livrable-planning-bework.pdf",
            kind: "PDF",
            size: "159 Ko · 4 pages",
            description:
              "Ce que BeWork remet à un conducteur de travaux face à un aléa : synthèse chantier, planning recalé par phases, trois scénarios de rattrapage chiffrés et note d'impact CCAG art. 19 prête à signer.",
            downloadAs: "BeWork-Exemple-Livrable-Planning-MOA.pdf",
            preview: true,
            previewHeight: 820,
          },
          {
            label: "Tutoriel — Crée ton skill Claude « Planning chantier »",
            href: "/ressources/pdf/tuto-skill-planning-chantier-bework.pdf",
            kind: "PDF",
            size: "182 Ko · 9 pages",
            description:
              "Méthode pas à pas pour construire un skill Claude qui lit votre planning, identifie le chemin critique, recale automatiquement les aléas et rédige la note CCAG. 30 min de recalage hebdo au lieu de 5 h.",
            downloadAs: "BeWork-Tuto-Skill-Planning-Chantier.pdf",
            preview: true,
            previewHeight: 820,
          },
          {
            label: "Planning Résidence Les Hortensias — Gantt + journal des aléas",
            href: "/ressources/pdf/planning-hortensias-bework.xlsx",
            kind: "XLSX",
            size: "460 Ko · 8 onglets",
            description:
              "Diagramme de Gantt sur 62 semaines, planning recalé scénario B, journal des aléas, matrice de criticité, chiffrage de rattrapage. Fichier de travail à adapter à votre chantier.",
            downloadAs: "BeWork-Planning-Hortensias-Gantt.xlsx",
          },
        ],
      },

      {
        type: "faq",
        title: "Foire aux questions",
        items: [
          {
            question: "Qu'est-ce qu'un aléa de chantier ?",
            answer:
              "Un aléa de chantier est un événement imprévu qui perturbe le déroulement normal des travaux : intempérie, retard de livraison, absence de personnel, ordre de service modificatif, co-activité bloquée, malfaçon, défaut d'autorisation ou sinistre. Certains sont imputables à l'entreprise, d'autres non — ce qui détermine le régime de responsabilité et le droit à une prolongation de délai.",
          },
          {
            question: "Comment éviter les pénalités de retard sur un chantier ?",
            answer:
              "Pour éviter les pénalités de retard, recalez votre planning dès qu'un aléa survient, construisez un scénario de rattrapage chiffré (heures supplémentaires, anticipation de tâches, renfort d'équipe) et préparez une note d'impact CCAG art. 19 lorsque l'aléa n'est pas imputable à l'entreprise. La rapidité de réaction et la traçabilité des justificatifs sont déterminantes.",
          },
          {
            question: "Qu'est-ce que l'article 19 du CCAG-Travaux ?",
            answer:
              "L'article 19 du CCAG-Travaux encadre les prolongations de délai d'exécution lorsque le retard découle d'un événement extérieur non imputable à l'entreprise : intempéries exceptionnelles, force majeure ou défaillance d'un tiers. Il impose une notification dans les délais prévus au marché et une demande motivée accompagnée de pièces justificatives.",
          },
          {
            question: "Combien coûte une journée de retard sur un chantier ?",
            answer:
              "La pénalité de retard est généralement fixée au millième du montant du marché par jour calendaire. Sur un marché de 1,85 million d'euros, cela représente environ 1 850 € par jour. Le montant exact dépend des clauses du CCAP de votre marché, qui peut prévoir un taux différent ou un plafonnement.",
          },
          {
            question: "Qu'est-ce que le chemin critique d'un planning de chantier ?",
            answer:
              "Le chemin critique est la séquence de tâches qui détermine la durée totale du chantier. Toute tâche située sur ce chemin n'a aucune marge : un retard sur l'une d'elles décale directement la date de livraison. Identifier le chemin critique permet de savoir où concentrer la vigilance face aux aléas.",
          },
          {
            question: "Comment recaler un planning de chantier après un aléa ?",
            answer:
              "Pour recaler un planning de chantier, recalculez l'enchaînement des tâches en intégrant le retard, identifiez les marges résiduelles par phase, puis testez des leviers de rattrapage : heures supplémentaires sur la tâche critique, anticipation d'une tâche sur une zone libre, ou renfort d'équipe. Chaque levier doit être chiffré en jours gagnés et en coût.",
          },
          {
            question: "Peut-on déléguer le suivi du planning de chantier ?",
            answer:
              "Oui, le suivi administratif du planning peut être délégué à une assistance travaux externalisée. Le conducteur de travaux conserve la décision et le pilotage terrain, tandis que le prestataire prend en charge le recalage du planning, le chiffrage des scénarios et la rédaction des notes d'impact. Cela libère du temps pour la conduite opérationnelle du chantier.",
          },
        ],
      },
    ],
  },
};

export type BlogSlug = string;

export const BLOG_SLUGS: BlogSlug[] = Object.keys(BLOG_ARTICLES);
