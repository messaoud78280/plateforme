/**
 * Articles blog SEO / GEO — marchés publics, administratif chantier, assistant travaux.
 * Rendu via /blog/[slug] (même charte graphique que le blog BeWork).
 */
import type { BlogArticle } from "@/content/blog-articles";

function seoArticle(
  partial: BlogArticle & {
    body: BlogArticle["body"];
  },
): BlogArticle {
  return partial;
}

const PUBLISHED = "2026-06-02T09:00:00+02:00";
const PUBLISHED_JUNE_18 = "2026-06-18T09:00:00+02:00";

export const BLOG_ARTICLES_SEO: Record<string, BlogArticle> = {
  "comment-repondre-appel-offres-btp": seoArticle({
    title: "Comment répondre à un appel d'offres BTP ?",
    description:
      "Méthode terrain pour répondre à un appel d'offres BTP : lecture du RC, pièces obligatoires, mémoire technique, DPGF et dépôt sans oubli.",
    keywords: [
      "réponse appel d'offres BTP",
      "dossier appel d'offres",
      "mémoire technique BTP",
      "DPGF BTP",
      "marché public travaux",
    ],
    publishedTime: PUBLISHED,
    articleSection: "Marchés publics",
    body: [
      {
        type: "tldr",
        points: [
          "Lire d'abord le règlement de consultation : délai, lots, critères, pièces obligatoires.",
          "Préparer en parallèle l'offre technique (mémoire) et l'offre financière (DPGF, BPU, DQE).",
          "Vérifier la checklist administrative avant dépôt (DC1, DC2, attestations).",
          "Ne jamais déposer sans relecture croisée CCTP ↔ mémoire ↔ prix.",
        ],
      },
      { type: "h2", content: "Étape 1 — Trier le DCE" },
      {
        type: "p",
        content:
          "Avant de chiffrer, classez les pièces : RC (délais et modalités), CCAP (contractuel), CCTP (technique), bordereaux de prix, plans. Repérez les exigences éliminatoires et les visites obligatoires.",
      },
      { type: "h2", content: "Étape 2 — Décider Go / No Go" },
      {
        type: "p",
        content:
          "Une réponse lancée trop tard ou sur un lot hors périmètre coûte cher. Synthétisez : faisabilité technique, charge bureau, délai réaliste, risques CCAP (pénalités, sous-traitance, délais).",
      },
      { type: "h2", content: "Étape 3 — Monter le dossier" },
      {
        type: "ul",
        items: [
          "Mémoire technique aligné sur les critères du RC",
          "Offre financière cohérente avec le CCTP",
          "Pièces administratives à jour",
          "Dépôt sur la bonne plateforme, dans le fuseau horaire indiqué",
        ],
      },
      { type: "h2", content: "Étape 4 — Checklist avant dépôt" },
      {
        type: "p",
        content:
          "La veille du dépôt, repassez pièce par pièce : attestations à jour, DC1/DC2 signés, mémoire dans le bon format, prix cohérents avec le bordereau. Une relecture croisée CCTP ↔ mémoire ↔ DPGF évite la majorité des rejets administratifs.",
      },
      {
        type: "table",
        headers: ["Contrôle", "À vérifier"],
        rows: [
          ["Délai", "Date et heure limite sur la plateforme indiquée dans le RC"],
          ["Pièces obligatoires", "Liste du RC cochée une par une"],
          ["Offre financière", "Montants et unités alignés sur le bordereau"],
          ["Mémoire technique", "Critères du RC traités dans l'ordre imposé"],
          ["Preuve de dépôt", "Accusé de réception ou horodatage conservé"],
        ],
        caption: "Checklist terrain avant envoi — à adapter selon le RC",
      },
      {
        type: "callout",
        variant: "info",
        title: "Offre rejetée ?",
        content:
          "Voir aussi /blog/eviter-rejet-offre-marche-public pour les causes fréquentes et la checklist anti-rejet.",
      },
      {
        type: "callout",
        variant: "highlight",
        title: "Ressource BeWork",
        content:
          "BeWork peut analyser le DCE, structurer le mémoire technique et préparer les tableaux — vous validez avant dépôt. Voir /reponse-appel-offres-btp.",
      },
      {
        type: "faq",
        items: [
          {
            question: "Combien de temps pour répondre à un appel d'offres BTP ?",
            answer:
              "Selon le lot et le volume de pièces : de quelques jours (petit lot) à plusieurs semaines (marché complexe). Anticiper la lecture DCE évite de perdre 40 % du temps en allers-retours.",
          },
          {
            question: "Peut-on externaliser la réponse ?",
            answer:
              "Oui sur l'administratif et la structuration documentaire. Le prix, les engagements techniques et la signature restent chez l'entreprise titulaire ou candidate.",
          },
        ],
      },
    ],
  }),

  "comment-analyser-dce-btp": seoArticle({
    title: "Comment analyser un DCE BTP ?",
    description:
      "Analyser un DCE travaux : ordre de lecture, pièces critiques, synthèse Go/No Go et points à ne pas manquer avant chiffrage.",
    keywords: ["analyse DCE", "dossier consultation entreprises", "CCTP BTP", "appel d'offres"],
    publishedTime: PUBLISHED,
    articleSection: "Marchés publics",
    body: [
      {
        type: "tldr",
        points: [
          "Commencer par le RC : date limite, lots, variantes, critères.",
          "Recouper CCTP et pièces de prix pour les exigences chiffrables.",
          "Lister les pièces manquantes ou ambiguës avant de s'engager.",
          "Produire une synthèse d'une page pour le dirigeant ou le CT.",
        ],
      },
      { type: "h2", content: "Ordre de lecture efficace" },
      {
        type: "ul",
        items: [
          "Règlement de consultation",
          "CCAP (délais, pénalités, paiement)",
          "CCTP par lot",
          "BPU / DPGF / DQE",
          "Plans et annexes techniques",
        ],
      },
      { type: "h2", content: "Ce qu'une bonne synthèse doit contenir" },
      {
        type: "p",
        content:
          "Échéance, lots concernés, visites, sous-traitance autorisée ou non, garanties, pièces à fournir, points techniques bloquants, hypothèses à valider sur chantier.",
      },
      {
        type: "faq",
        items: [
          {
            question: "BeWork peut-il analyser un DCE ?",
            answer:
              "Oui : tri des pièces, synthèse et checklist de réponse. Service : /services/analyse-dce-btp et guide /ressources/analyse-dce-btp.",
          },
        ],
      },
    ],
  }),

  "rc-ccap-cctp-pieces-marche-public": seoArticle({
    title: "RC, CCAP, CCTP : comprendre les pièces d'un marché public travaux",
    description:
      "RC, CCAP et CCTP expliqués pour les entreprises BTP : rôle de chaque pièce, ordre de lecture et pièges fréquents en appel d'offres.",
    keywords: ["RC marché public", "CCAP travaux", "CCTP BTP", "règlement consultation"],
    publishedTime: PUBLISHED,
    articleSection: "Marchés publics",
    body: [
      {
        type: "tldr",
        points: [
          "RC = mode d'emploi de la consultation (délais, critères, dépôt).",
          "CCAP = contrat exécution (paiement, pénalités, avenants).",
          "CCTP = prescription technique à exécuter et à chiffrer.",
        ],
      },
      {
        type: "table",
        headers: ["Pièce", "Rôle principal", "À vérifier en priorité"],
        rows: [
          ["RC", "Organisation de la consultation", "Date limite, lots, critères, pièces obligatoires"],
          ["CCAP", "Clauses contractuelles", "Délais, pénalités, réception, paiement, sous-traitance"],
          ["CCTP", "Description technique", "Matériaux, performances, interfaces lots, DOE attendu"],
        ],
      },
      {
        type: "callout",
        variant: "warning",
        title: "Piège fréquent",
        content:
          "Chiffrer sans avoir croisé CCTP et CCAP : une exigence technique non chiffrée ou un délai impossible devient une marge mangée ou une pénalité.",
      },
      {
        type: "faq",
        items: [
          {
            question: "Où trouver la liste des pièces à fournir ?",
            answer: "Dans le règlement de consultation et les annexes administratives (DC1, DC2, attestations, références).",
          },
        ],
      },
    ],
  }),

  "dpgf-bpu-dqe-differences": seoArticle({
    title: "DPGF, BPU, DQE : quelles différences ?",
    description:
      "DPGF, BPU et DQE en marchés publics travaux : définitions, usage en chiffrage et erreurs à éviter pour les PME du BTP.",
    keywords: ["DPGF BTP", "BPU BTP", "DQE BTP", "chiffrage marché public"],
    publishedTime: PUBLISHED,
    articleSection: "Marchés publics",
    body: [
      {
        type: "tldr",
        points: [
          "BPU = catalogue de prix unitaires (prix × quantités).",
          "DQE = décomposition quantitative (quantités à remplir).",
          "DPGF = cadre de réponse prix souvent utilisé en travaux (selon RC).",
        ],
      },
      {
        type: "p",
        content:
          "Selon le marché, l'acheteur fournit un bordereau à compléter ou un cadre DPGF à renseigner. L'essentiel : unités, quantités et cohérence avec le CCTP.",
      },
      {
        type: "h2", content: "Erreurs qui font perdre des offres" },
      {
        type: "ul",
        items: [
          "Oublier une ligne ou un lot dans le tableau",
          "Unité incohérente (m² vs ml)",
          "Prix unitaire hors TVA mal positionné",
          "Total qui ne correspond pas à la somme des lignes",
        ],
      },
      {
        type: "faq",
        items: [
          {
            question: "BeWork peut-il aider sur les tableaux de prix ?",
            answer:
              "Oui sur la structuration, la relecture de cohérence et la préparation des fichiers — le prix final et la marge restent validés par vous.",
          },
        ],
      },
    ],
  }),

  "comment-rediger-memoire-technique-btp": seoArticle({
    title: "Comment rédiger un mémoire technique BTP ?",
    description:
      "Mémoire technique BTP : plan type, critères MOA, méthodologie chantier et erreurs à éviter pour les appels d'offres publics et privés.",
    keywords: ["mémoire technique BTP", "rédaction mémoire technique", "appel d'offres"],
    publishedTime: PUBLISHED,
    articleSection: "Marchés publics",
    body: [
      {
        type: "tldr",
        points: [
          "Reprenir les critères du RC comme plan du mémoire.",
          "Répondre au CCTP point par point, pas en généralités.",
          "Illustrer avec des références chantier comparables.",
          "Soigner la lisibilité : sommaire, encadrés, schémas simples.",
        ],
      },
      { type: "h2", content: "Structure type" },
      {
        type: "ul",
        items: [
          "Compréhension du projet et contraintes",
          "Moyens humains et matériels",
          "Méthodologie et phasage",
          "Qualité, sécurité, environnement",
          "Références et engagements",
        ],
      },
      {
        type: "faq",
        items: [
          {
            question: "BeWork rédige-t-il le mémoire technique ?",
            answer:
              "Oui à partir de vos données : structure, rédaction, mise en forme. Validation technique obligatoire avant dépôt. Voir /services/memoire-technique-btp.",
          },
        ],
      },
    ],
  }),

  "eviter-rejet-offre-marche-public": seoArticle({
    title: "Comment éviter le rejet d'une offre en marché public ?",
    description:
      "Offre rejetée en marché public travaux : causes fréquentes (pièce manquante, délai, forme) et checklist avant dépôt.",
    keywords: ["offre rejetée marché public", "dépôt plateforme", "appel d'offres BTP"],
    publishedTime: PUBLISHED,
    articleSection: "Marchés publics",
    body: [
      {
        type: "tldr",
        points: [
          "La majorité des rejets sont administratifs, pas techniques.",
          "Checklist pièces + relecture du RC la veille du dépôt.",
          "Vérifier formats, signatures et enveloppes électroniques.",
          "Conserver une preuve de dépôt horodatée.",
        ],
      },
      {
        type: "h2", content: "Causes fréquentes de rejet" },
      {
        type: "ul",
        items: [
          "Pièce administrative absente ou expirée",
          "Dépôt hors délai ou mauvaise enveloppe",
          "Mémoire non conforme au formulaire imposé",
          "Incohérence entre offre financière et technique",
        ],
      },
      {
        type: "faq",
        items: [
          {
            question: "BeWork garantit-il qu'une offre ne sera pas rejetée ?",
            answer:
              "Non. BeWork réduit les oublis via checklists et relectures — la conformité finale et le dépôt restent sous votre responsabilité.",
          },
        ],
      },
    ],
  }),

  "chorus-pro-facture-refusee-que-faire": seoArticle({
    title: "Chorus Pro : facture refusée, que faire ?",
    description:
      "Facture Chorus Pro refusée sur marché public BTP : lire le motif, corriger la situation ou la facture, redéposer et relancer sans bloquer le paiement.",
    keywords: [
      "Chorus Pro facture refusée",
      "rejet facture marché public",
      "Chorus Pro BTP",
      "situation travaux rejetée",
      "corriger facture Chorus Pro",
    ],
    publishedTime: "2026-06-02T14:00:00+02:00",
    articleSection: "Administratif chantier",
    body: [
      {
        type: "tldr",
        points: [
          "Un rejet Chorus Pro bloque le paiement : lisez le motif avant toute correction.",
          "Les causes fréquentes : référence marché erronée, PJ manquante, montant incohérent avec la situation.",
          "Corrigez, redéposez et tracez chaque version pour éviter les doublons.",
          "Relancez l'acheteur public après le délai contractuel si le statut reste bloqué.",
        ],
      },
      { type: "h2", content: "Étape 1 — Comprendre le motif de rejet" },
      {
        type: "p",
        content:
          "Dans Chorus Pro, ouvrez la facture ou la situation refusée et notez le code ou le libellé du rejet. Ne corrigez pas au hasard : un mauvais numéro d'engagement, une référence de bon de commande ou un SIRET acheteur incorrect suffisent à bloquer le flux.",
      },
      {
        type: "h2",
        content: "Causes fréquentes sur marchés travaux",
      },
      {
        type: "ul",
        items: [
          "Référence marché, bon de commande ou engagement juridique incorrect",
          "Situation de travaux non validée ou montant différent de la facture",
          "Pièce jointe absente (situation signée, attachement, PV de réception partielle)",
          "TVA ou code service erroné côté acheteur public",
          "Facture déjà déposée en doublon sous un autre numéro",
        ],
      },
      { type: "h2", content: "Étape 2 — Corriger et redéposer" },
      {
        type: "ul",
        items: [
          "Recouper CCAP, bon de commande et dernière situation acceptée",
          "Modifier la facture ou la situation selon le motif (nouveau numéro si nécessaire)",
          "Joindre les PJ demandées au bon format (PDF lisible, nom explicite)",
          "Conserver une copie de l'ancienne version et du motif pour votre dossier",
        ],
      },
      {
        type: "callout",
        variant: "warning",
        title: "À ne pas faire",
        content:
          "Redéposer la même facture sans correction, ou facturer un montant supérieur à la situation validée — cela prolonge le blocage et complique la relation avec le comptable public.",
      },
      { type: "h2", content: "Étape 3 — Suivre et relancer" },
      {
        type: "p",
        content:
          "Tenez un tableau : date de dépôt, statut, motif de rejet, date de correction, relance MOE ou service comptable. Après le délai de paiement prévu au CCAP, une relance factuelle (références marché, numéro de facture, date d'acceptation attendue) est légitime.",
      },
      {
        type: "faq",
        items: [
          {
            question: "Combien de temps pour débloquer une facture refusée ?",
            answer:
              "Selon la cause : quelques jours si c'est une référence ou une PJ, plus long si une situation doit être revalidée par le maître d'œuvre. Anticiper en préparant les situations au fil du chantier réduit ce délai.",
          },
          {
            question: "BeWork peut-il gérer les rejets Chorus Pro ?",
            answer:
              "Oui sur l'analyse du motif, la préparation de la correction, le redépôt encadré et le suivi des statuts — validation des montants et signatures chez vous. Voir /facturation-chorus-pro-btp.",
          },
        ],
      },
    ],
  }),

  "chorus-pro-entreprises-btp": seoArticle({
    title: "Comment fonctionne Chorus Pro pour les entreprises BTP ?",
    description:
      "Chorus Pro pour le BTP : dépôt de factures publiques, situations de travaux, rejets fréquents et bonnes pratiques pour les titulaires de marchés.",
    keywords: ["Chorus Pro BTP", "facture marché public", "situation travaux"],
    publishedTime: PUBLISHED,
    articleSection: "Administratif chantier",
    body: [
      {
        type: "tldr",
        points: [
          "Chorus Pro est le portail de facturation électronique vers les acheteurs publics.",
          "Les situations de travaux précèdent souvent la facture sur marchés à prix global ou forfaitaires.",
          "Un rejet bloque le paiement : références marché et PJ à contrôler.",
        ],
      },
      { type: "h2", content: "Bonnes pratiques terrain" },
      {
        type: "ul",
        items: [
          "Préparer la situation au fil du chantier, pas la veille",
          "Aligner avancement réel et pièces justificatives",
          "Tracer les statuts (déposée, en traitement, rejetée)",
          "Relancer proprement après délai contractuel",
        ],
      },
      {
        type: "faq",
        items: [
          {
            question: "BeWork peut-il gérer Chorus Pro ?",
            answer: "Oui sur la préparation, le dépôt encadré et le suivi — validation des montants chez vous. Voir /facturation-chorus-pro-btp.",
          },
        ],
      },
    ],
  }),

  "accord-cadre-bons-commande": seoArticle({
    title: "Qu'est-ce qu'un accord-cadre à bons de commande ?",
    description:
      "Accord-cadre travaux à bons de commande : fonctionnement, suivi administratif et erreurs des PME titulaires en marché public.",
    keywords: ["accord-cadre travaux", "bons de commande", "marché public BTP"],
    publishedTime: PUBLISHED,
    articleSection: "Marchés publics",
    body: [
      {
        type: "tldr",
        points: [
          "L'accord-cadre fixe les conditions ; chaque bon de commande lance une intervention.",
          "Le suivi multi-bons nécessite un tableau d'échéances et de pièces.",
          "Les mêmes exigences Chorus Pro et DOE s'appliquent souvent par bon.",
        ],
      },
      {
        type: "faq",
        items: [
          {
            question: "BeWork peut-il suivre les bons de commande ?",
            answer:
              "Oui : échéances, pièces, relances et classement documentaire — voir /gestion-marche-public-btp.",
          },
        ],
      },
    ],
  }),

  "comment-preparer-doe-chantier": seoArticle({
    title: "Comment préparer un DOE chantier ?",
    description:
      "DOE BTP : pièces à collecter, organisation par lot, relances fournisseurs et remise au maître d'ouvrage sans retard.",
    keywords: ["DOE BTP", "dossier ouvrages exécutés", "fin de chantier"],
    publishedTime: PUBLISHED,
    articleSection: "Administratif chantier",
    body: [
      {
        type: "tldr",
        points: [
          "Collecter les pièces au fil de l'eau, pas en fin de chantier.",
          "Arborescence claire + liste des manquants mise à jour chaque semaine.",
          "Relancer tôt notices, attestations et plans as-built.",
        ],
      },
      {
        type: "faq",
        items: [
          {
            question: "BeWork peut-il préparer un DOE ?",
            answer: "Oui : organisation, relances et compilation — contenu technique validé par vous. /services/doe-btp et /ressources/doe-btp.",
          },
        ],
      },
    ],
  }),

  "quest-ce-qu-un-ppsps": seoArticle({
    title: "Qu'est-ce qu'un PPSPS ?",
    description:
      "PPSPS BTP : définition, contenu type, responsabilités et aide à la structuration du plan de sécurité chantier.",
    keywords: ["PPSPS BTP", "plan sécurité chantier", "sécurité BTP"],
    publishedTime: PUBLISHED,
    articleSection: "Administratif chantier",
    body: [
      {
        type: "tldr",
        points: [
          "Le PPSPS décrit l'organisation sécurité propre à chaque entreprise sur le chantier.",
          "Il complète le PGC et les plans particuliers des autres intervenants.",
          "La responsabilité employeur reste chez l'entreprise — BeWork aide à structurer, pas à valider la sécurité.",
        ],
      },
      {
        type: "faq",
        items: [
          {
            question: "BeWork peut-il aider pour un PPSPS ?",
            answer: "Oui sur la mise en forme et le suivi documentaire — validation sécurité chez vous ou votre coordinateur SPS. /services/ppsps.",
          },
        ],
      },
    ],
  }),

  "gerer-dict-avant-travaux": seoArticle({
    title: "Comment gérer les DICT avant travaux ?",
    description:
      "DICT et DT travaux : démarches, délais, coordination réseaux et suivi administratif pour VRD, terrassement et travaux publics.",
    keywords: ["DICT travaux", "DT DICT", "réseaux enterrés"],
    publishedTime: PUBLISHED,
    articleSection: "Administratif chantier",
    body: [
      {
        type: "tldr",
        points: [
          "La DICT alerte les exploitants de réseaux avant travaux de fouille.",
          "Anticiper les délais : une DICT tardive bloque le démarrage.",
          "Classer récépissés, plans et consignes par chantier.",
        ],
      },
      {
        type: "faq",
        items: [
          {
            question: "BeWork peut-il suivre les DICT ?",
            answer: "Oui sur le suivi dossier, relances et classement — voir /dict-dt-travaux.",
          },
        ],
      },
    ],
  }),

  "suivre-bons-commande-marche-public": seoArticle({
    title: "Comment suivre les bons de commande d'un marché public ?",
    description:
      "Suivi des bons de commande en accord-cadre travaux : tableau de bord, pièces, facturation et DOE par intervention.",
    keywords: ["bons de commande marché public", "accord-cadre", "suivi administratif"],
    publishedTime: PUBLISHED,
    articleSection: "Marchés publics",
    body: [
      {
        type: "tldr",
        points: [
          "Un tableau par bon : montant, échéances, statut facturation, DOE, réserves.",
          "Ne pas mélanger les pièces entre sites ou bons.",
          "Relancer MOA/MOE sur validations qui bloquent la facturation.",
        ],
      },
      {
        type: "faq",
        items: [
          {
            question: "Quel lien avec Chorus Pro ?",
            answer: "Chaque bon peut générer situations et factures distinctes — références à saisir avec soin. Voir /facturation-chorus-pro-btp.",
          },
        ],
      },
    ],
  }),

  "erreurs-reponses-appels-offres-btp": seoArticle({
    title: "Les erreurs fréquentes dans les réponses aux appels d'offres BTP",
    description:
      "Erreurs classiques en réponse AO BTP : mémoire générique, prix incohérents, pièces oubliées et mauvaise lecture du CCTP.",
    keywords: ["erreurs appel d'offres", "réponse marché public", "mémoire technique"],
    publishedTime: PUBLISHED,
    articleSection: "Marchés publics",
    body: [
      {
        type: "tldr",
        points: [
          "Mémoire copié-collé sans lien au CCTP du lot.",
          "Prix non recoupés avec les quantités du DQE.",
          "Sous-traitance ou références non conformes au RC.",
          "Dépôt sans relecture finale croisée.",
        ],
      },
      {
        type: "callout",
        variant: "info",
        title: "Conseil conducteur",
        content: "Bloquez une demi-journée bureau « verrouillage dossier » avant dépôt — même si le chiffrage a été fait sur le tard.",
      },
      {
        type: "faq",
        items: [
          {
            question: "Comment BeWork limite ces erreurs ?",
            answer: "Checklists, synthèse DCE et relecture structurée — sans garantie de gain du marché.",
          },
        ],
      },
    ],
  }),

  "pourquoi-externaliser-administratif-chantier": seoArticle({
    title: "Pourquoi externaliser l'administratif chantier ?",
    description:
      "Externalisation administrative BTP : quand la déléguer, ce qui peut sortir du terrain et ce qui doit rester validé chez vous.",
    keywords: ["externalisation administrative BTP", "relais bureau-chantier", "assistant travaux"],
    publishedTime: PUBLISHED,
    articleSection: "Administratif chantier",
    body: [
      {
        type: "tldr",
        points: [
          "Le terrain génère des dossiers plus vite que le bureau ne les traite.",
          "Externaliser = cadre, pas « secrétariat illimité ».",
          "Idéal pour devis, relances, AO, situations, DOE, classement.",
        ],
      },
      {
        type: "p",
        content:
          "BeWork positionne l'externalisation comme relais bureau-chantier spécialisé BTP : vous tenez le chantier, nous structurons et suivons les livrables administratifs.",
      },
      {
        type: "faq",
        items: [
          {
            question: "Externaliser sans recruter ?",
            answer: "Oui via forfaits mensuels ou missions ponctuelles — /tarifs et /services/externalisation-administrative-btp.",
          },
        ],
      },
    ],
  }),

  "assistant-travaux-ia-role-limites": seoArticle({
    title: "Assistant travaux IA : rôle, limites et avantages",
    description:
      "Assistant travaux augmenté par l'IA : ce qu'il fait, ce qu'il ne remplace pas, et comment l'utiliser sans perdre le contrôle sur le chantier.",
    keywords: ["assistant travaux IA", "assistant travaux BTP", "IA BTP"],
    publishedTime: PUBLISHED,
    articleSection: "Assistant travaux",
    body: [
      {
        type: "tldr",
        points: [
          "L'IA accélère tri, synthèse et mise en forme des dossiers chantier.",
          "Un humain supervise et vous validez avant envoi engageant.",
          "Ne remplace pas CT, BE, MOE ni responsable sécurité.",
        ],
      },
      {
        type: "h2", content: "Différence avec une assistante administrative" },
      {
        type: "p",
        content:
          "Une assistante généraliste gère le courant. Un assistant travaux lit lots, délais, DCE, DOE, réserves — vocabulaire et priorités chantier.",
      },
      {
        type: "faq",
        items: [
          {
            question: "Qu'est-ce que BeWork ?",
            answer:
              "Service d'assistants travaux augmentés par l'IA pour le BTP — slogan : « On tient le bureau, vous tenez le chantier ». /services/assistant-travaux.",
          },
        ],
      },
    ],
  }),

  "situation-travaux-marche-public-btp": seoArticle({
    title: "Situation de travaux sur marché public BTP",
    description:
      "Préparer une situation de travaux sur marché public : avancement, pièces justificatives, validation MOE et lien avec la facture Chorus Pro.",
    keywords: [
      "situation de travaux marché public",
      "situation travaux BTP",
      "facturation marché public",
      "Chorus Pro situation",
      "avancement chantier public",
    ],
    publishedTime: PUBLISHED_JUNE_18,
    articleSection: "Marchés publics",
    body: [
      {
        type: "tldr",
        points: [
          "La situation aligne avancement réel, pièces et montant facturable.",
          "Préparer au fil du chantier — pas la veille de l'échéance CCAP.",
          "Recouper CCTP, bon de commande et dernier PV avant chiffrage.",
          "Tracer validations MOE/MOA : un blocage administratif retarde tout le paiement.",
        ],
      },
      { type: "h2", content: "Contenu type d'une situation" },
      {
        type: "ul",
        items: [
          "Période et pourcentage d'avancement par lot ou poste",
          "Références marché, bon de commande, engagement juridique",
          "Pièces justificatives : photos, attestations, PV partiels si exigés",
          "Montant HT de la période et cumul depuis l'origine",
        ],
      },
      { type: "h2", content: "Erreurs qui bloquent la facture" },
      {
        type: "ul",
        items: [
          "Avancement surévalué sans pièce",
          "Référence marché ou service acheteur erronée",
          "Situation non validée par le maître d'œuvre alors que le CCAP l'exige",
          "Décalage entre situation déposée et facture Chorus Pro",
        ],
      },
      {
        type: "callout",
        variant: "highlight",
        title: "Ressource BeWork",
        content:
          "BeWork peut structurer le tableau de suivi, préparer les situations et tracer les relances — validation des montants chez vous. Voir /situation-travaux-btp et /facturation-chorus-pro-btp.",
      },
      {
        type: "faq",
        items: [
          {
            question: "À quelle fréquence déposer une situation ?",
            answer:
              "Selon le CCAP : souvent mensuelle sur marchés publics. Anticiper la date limite et les délais de validation MOE.",
          },
        ],
      },
    ],
  }),

  "relancer-devis-btp-sans-perdre-client": seoArticle({
    title: "Comment relancer un devis BTP sans perdre le client ?",
    description:
      "Relance devis BTP : timing, ton, canaux et suivi pour convertir plus d'offres sans harceler le prospect ni laisser dormir le dossier.",
    keywords: [
      "relance devis BTP",
      "devis travaux sans réponse",
      "suivi devis bâtiment",
      "convertir devis chantier",
      "relance client BTP",
    ],
    publishedTime: PUBLISHED_JUNE_18,
    articleSection: "Administratif chantier",
    body: [
      {
        type: "tldr",
        points: [
          "Un devis non relancé perd souvent face à un concurrent plus réactif.",
          "J+3 à J+5 : relance courte, factuelle, avec rappel du périmètre.",
          "Tracer statuts : envoyé, vu, en réflexion, à revoir, gagné, perdu.",
          "Proposer un créneau ou une précision technique plutôt qu'un simple « des nouvelles ? ».",
        ],
      },
      { type: "h2", content: "Séquence de relance terrain" },
      {
        type: "table",
        headers: ["Délai", "Action"],
        rows: [
          ["J+0", "Envoi devis + récapitulatif clair inclus / exclusions"],
          ["J+3", "Relance courte : disponibilité pour questions techniques"],
          ["J+7", "Appel ou message : point sur planning et faisabilité"],
          ["J+14", "Dernière relance structurée avant classement « en sommeil »"],
        ],
        caption: "À adapter selon urgence client et saisonnalité",
      },
      { type: "h2", content: "Ce qui fait gagner une relance" },
      {
        type: "ul",
        items: [
          "Rappeler une valeur : délai, méthode, garantie, réactivité",
          "Lever un doute technique identifié à l'envoi",
          "Proposer une variante ou un phasage si le prix bloque",
          "Ne pas relancer sans mettre à jour le statut dans votre tableau",
        ],
      },
      {
        type: "callout",
        variant: "info",
        title: "Checklist dépôt AO",
        content: "Pour les marchés publics, voir /checklist-depot-appel-offres-btp et /blog/eviter-rejet-offre-marche-public.",
      },
      {
        type: "faq",
        items: [
          {
            question: "BeWork peut-il gérer les relances devis ?",
            answer: "Oui : suivi, relances rédigées et tableau de priorités — vous validez le ton et les montants. /relance-devis-btp.",
          },
        ],
      },
    ],
  }),

  "conducteur-travaux-deborde-que-deleguer": seoArticle({
    title: "Conducteur de travaux débordé : que déléguer ?",
    description:
      "Conducteur de travaux débordé : prioriser le terrain, déléguer l'administratif chantier (devis, AO, situations, DOE) sans perdre le contrôle.",
    keywords: [
      "conducteur de travaux débordé",
      "déléguer administratif chantier",
      "assistant conducteur de travaux",
      "surcharge conducteur travaux",
      "externalisation dossiers chantier",
    ],
    publishedTime: PUBLISHED_JUNE_18,
    articleSection: "Assistant travaux",
    body: [
      {
        type: "tldr",
        points: [
          "Le CT doit rester sur les arbitrages techniques, réceptions et interfaces lots.",
          "Déléguable : classement, relances, mise en forme, checklists, suivi pièces.",
          "Non déléguable : choix techniques, signatures, prix engageants, sécurité.",
          "Un cadre clair (canal, priorités, validation) évite le double travail.",
        ],
      },
      { type: "h2", content: "À garder sur le terrain" },
      {
        type: "ul",
        items: [
          "Réunions de chantier et décisions d'exécution",
          "Réceptions, réserves et levées",
          "Coordination entreprises et sous-traitants",
          "Alertes sécurité et aléas critiques",
        ],
      },
      { type: "h2", content: "À déléguer au bureau (avec validation)" },
      {
        type: "ul",
        items: [
          "Synthèse DCE et checklist appels d'offres",
          "Relances devis, fournisseurs, MOE, pièces manquantes",
          "Situations, Chorus Pro, compilation DOE",
          "Comptes rendus, classement et tableaux de suivi",
        ],
      },
      {
        type: "callout",
        variant: "highlight",
        title: "BeWork",
        content:
          "Assistance technique et administrative BTP — pas du secrétariat générique. /services/conducteur-travaux-deborde et /comparatif-assistance-travaux-btp.",
      },
      {
        type: "faq",
        items: [
          {
            question: "Combien de temps gagner ?",
            answer:
              "Variable selon volume : l'objectif est de libérer des demi-journées bureau par semaine pour le pilotage terrain — à cadrer sur devis.",
          },
        ],
      },
    ],
  }),
};

export const BLOG_SEO_SLUGS = Object.keys(BLOG_ARTICLES_SEO);
