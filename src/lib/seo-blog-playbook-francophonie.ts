/**
 * Plan éditorial SEO (40 entrées) — à publier progressivement.
 * Chaque entrée : titre + intention + angle pays (pas de contenu dupliqué : rédaction à décliner).
 */

export type BlogPlaybookCountry = "FR" | "BE" | "CH" | "LU";

export type BlogArticlePitch = {
  country: BlogPlaybookCountry;
  slugSuggestion: string;
  title: string;
  primaryIntent: string;
  angle: string;
};

/** 10 sujets France — débordement, rentabilité, devis */
export const BLOG_PITCHES_FR: BlogArticlePitch[] = [
  { country: "FR", slugSuggestion: "devis-btp-pas-convertis-rentabilite", title: "Pourquoi vos devis dormant grèvent la rentabilité (et quoi faire)", primaryIntent: "perte de marge / priorisation", angle: "conducteur travaux + artisan" },
  { country: "FR", slugSuggestion: "relances-devis-sans-passer-pour-insistant", title: "Relances devis : rester pro sans sonner « désespéré »", primaryIntent: "conversion devis", angle: "terrain + image client" },
  { country: "FR", slugSuggestion: "situations-travaux-retard-cash", title: "Situations de travaux en retard : où se fait le trou de trésorerie", primaryIntent: "trésorerie chantier", angle: "chef entreprise" },
  { country: "FR", slugSuggestion: "dictionnaire-jargon-dce-artisan", title: "DCE, DPGF, AO : le minimum à maîtriser côté artisan", primaryIntent: "formation légère AO", angle: "réduction stress administratif" },
  { country: "FR", slugSuggestion: "conducteur-travail-bureau-parallele", title: "Conducteur de travaux : quand le bureau mange les allers-retours chantier", primaryIntent: "charge mentale CT", angle: "externalisation ciblée" },
  { country: "FR", slugSuggestion: "dict-retard-penalites-reputation", title: "DICT et retards : au-delà du risque, la charge cachée pour la TPE", primaryIntent: "démarches administratives", angle: "organisation dossier" },
  { country: "FR", slugSuggestion: "retenue-garantie-tableau-simple", title: "Retenue de garantie : un tableau simple vaut mieux qu’une recherche dans la boîte mail", primaryIntent: "suivi RG", angle: "cash & litiges évités" },
  { country: "FR", slugSuggestion: "facturation-chantier-acomptes-calendrier", title: "Acomptes et calendrier client : structurer la facturation chantier", primaryIntent: "facturation", angle: "réduction impayés light" },
  { country: "FR", slugSuggestion: "artisan-embaucher-assistant-vs-forfait", title: "Assistant interne ou forfait externe : le vrai comparatif charge / coût / risque", primaryIntent: "décision dirigeant", angle: "sans jargon RH" },
  { country: "FR", slugSuggestion: "logistique-chantier-mails-fournisseurs", title: "Livraisons et fournisseurs : quand votre messagerie devient le chef de projet", primaryIntent: "coordination logistique", angle: "terrain" },
];

/** 10 sujets Belgique — structuration entreprise, fiscalité légère vocabulaire BE */
export const BLOG_PITCHES_BE: BlogArticlePitch[] = [
  { country: "BE", slugSuggestion: "gestion-administrative-construction-belgique", title: "Gestion administrative construction en Belgique : ce qui sature en premier", primaryIntent: "structuration PME", angle: "Wallonie & Bruxelles" },
  { country: "BE", slugSuggestion: "facturation-btp-belgique-delais-clients", title: "Facturation BTP belge : suivre les délais sans perdre le chantier", primaryIntent: "trésorerie", angle: "relances encadrées" },
  { country: "BE", slugSuggestion: "formalites-administratives-chantiers-belges", title: "Formalités et chantiers belges : dossiers qui doivent vivre ailleurs que dans la tête du patron", primaryIntent: "démarches", angle: "TPE" },
  { country: "BE", slugSuggestion: "collaborateur-vs-prestataire-belgique", title: "Recruter ou structurer autrement : le cas des bureaux d’étude et TCE", primaryIntent: "alternative à l’embauche", angle: "conducteurs/projets" },
  { country: "BE", slugSuggestion: "devis-et-signatures-marche-public-belge", title: "Appels et offres publiques : préparer une soumission sans y passer quatre nuits", primaryIntent: "offres marchés", angle: "organisation" },
  { country: "BE", slugSuggestion: "organisation-courriers-fournisseur-btp", title: "Fournisseur, planning, confirmations : où l’administratif prend le pouvoir sur le chantier", primaryIntent: "coordination achats", angle: "chef d’entreprise" },
  { country: "BE", slugSuggestion: "entreprise-multilingue-mails-clients-btp", title: "Deux langues dans la même boîte mail : garder une traçabilité propre au BTP", primaryIntent: "process", angle: "communication client BE" },
  { country: "BE", slugSuggestion: "priorisation-taches-admin-belgique", title: "Priorités du lundi pour une PME construction belge saturée", primaryIntent: "productivité", angle: "checklist courte" },
  { country: "BE", slugSuggestion: "sous-traitance-admin-chantiers-internationale", title: "Belgique frontalier : dossiers chantier et clients hors pays — quel minimum d’organisation", primaryIntent: "clients transfrontaliers", angle: "organisation" },
  { country: "BE", slugSuggestion: "securiser-cash-sans-demissionner-sur-terrain", title: "Sécuriser l’argent du chantier sans démissionner du rôle terrain", primaryIntent: "rentabilité", angle: "dirigeant + CT" },
];

/** 10 sujets Suisse — optimisation, précision, organisation Romandie */
export const BLOG_PITCHES_CH: BlogArticlePitch[] = [
  { country: "CH", slugSuggestion: "organisation-administrative-pme-batiment-romande", title: "Organisation administrative d’une PME bâtiment en Suisse romande", primaryIntent: "structuration bureau", angle: "précision & délais" },
  { country: "CH", slugSuggestion: "optimiser-suivi-devis-pme-construction", title: "Optimiser le suivi des devis quand chaque heure coûte cher", primaryIntent: "performance commerciale", angle: "efficacité" },
  { country: "CH", slugSuggestion: "coordination-chantier-tracabilite", title: "Traçabilité chantier : ce que les donneurs d’ordre attendent vis-à-vis des documents", primaryIntent: "qualité dossier", angle: "sous-traitants & TCE" },
  { country: "CH", slugSuggestion: "planning-interne-vs-reactivite-client", title: "Planning interne vs réactivité client : comment découper l’administratif sans dérive", primaryIntent: "charge maîtrisée", angle: "culture exécution" },
  { country: "CH", slugSuggestion: "sous-traitance-administrative-suisse-pme", title: "Quand externaliser l’administratif en Suisse : signaux d’alerte business (pas RH)", primaryIntent: "décision achat service", angle: "PME bâtiment" },
  { country: "CH", slugSuggestion: "gestion-fournisseurs-delais-suisse", title: "Fournisseurs, créneaux et confirmations : réduire les allers-retours par écrit", primaryIntent: "logistique", angle: "coordination" },
  { country: "CH", slugSuggestion: "facturation-situation-travaux-clarte", title: "Situations de travaux et clarté facturation : éviter les discussions en fin de mois", primaryIntent: "relation client", angle: "cash" },
  { country: "CH", slugSuggestion: "charge-mentale-dirigeant-chantier", title: "Dirigeant sur chantier : la charge mentale « invisible » du bureau", primaryIntent: "santé business", angle: "délégation encadrée" },
  { country: "CH", slugSuggestion: "offre-commerciale-btp-memoire-technique", title: "Mémoires techniques et offres : tenir un fil conducteur quand les pièces s’empilent", primaryIntent: "AO privés", angle: "organisation" },
  { country: "CH", slugSuggestion: "interoperabilite-outils-btp-pme", title: "Outils bureautiques et terrain : le minimum pour ne pas dupliquer l’information", primaryIntent: "process", angle: "PME tech-light" },
];

/** 10 sujets Luxembourg — PME, croissance, externalisation */
export const BLOG_PITCHES_LU: BlogArticlePitch[] = [
  { country: "LU", slugSuggestion: "externalisation-administrative-pme-luxembourg", title: "Externalisation administrative pour PME au Luxembourg : par où commencer", primaryIntent: "prise de décision", angle: "croissance sans structure lourde" },
  { country: "LU", slugSuggestion: "support-administratif-pme-batiment", title: "Support administratif PME bâtiment : ce qui peut sortir de votre agenda en premier", primaryIntent: "quick wins", angle: "dirigeant" },
  { country: "LU", slugSuggestion: "chantiers-clients-transfrontaliers-dossiers", title: "Clients et chantiers transfrontaliers : dossiers qui demandent une colonne vertébrale", primaryIntent: "organisation", angle: "LU & voisins" },
  { country: "LU", slugSuggestion: "structurer-bureau-tpe-construction", title: "Structurer le bureau d’une TPE construction en phase de croissance", primaryIntent: "scalabilité", angle: "sans recruter trop tôt" },
  { country: "LU", slugSuggestion: "relances-clients-btp-luxembourg", title: "Relances clients BTP : garder le ton luxembourgeois pro et ferme", primaryIntent: "encaissement", angle: "relation longue" },
  { country: "LU", slugSuggestion: "coordination-fournisseurs-petite-structure", title: "Petite structure, gros volume d’échanges : centraliser sans ajouter de hiérarchie", primaryIntent: "efficacité", angle: "coordination" },
  { country: "LU", slugSuggestion: "devis-signatures-delais-lu", title: "Devis et signatures : raccourcir le cycle sans brûler la marge", primaryIntent: "conversion", angle: "rentabilité" },
  { country: "LU", slugSuggestion: "administratif-avenants-chantier", title: "Avenants et ajustements chantier : ne pas les traiter comme des « petits mails »", primaryIntent: "risque & cash", angle: "gestion projet" },
  { country: "LU", slugSuggestion: "choisir-prestataire-administratif-b2b", title: "Choisir un prestataire administratif B2B : critères utiles (hors promesses magiques)", primaryIntent: "achat service", angle: "due diligence légère" },
  { country: "LU", slugSuggestion: "temps-dirigeant-valorisation-chantier", title: "Combien vaut une heure de dirigeant sur un chantier vs une heure de paperasse", primaryIntent: "ROI temps", angle: "prise de conscience" },
];

export const BLOG_PITCHES_ALL: BlogArticlePitch[] = [
  ...BLOG_PITCHES_FR,
  ...BLOG_PITCHES_BE,
  ...BLOG_PITCHES_CH,
  ...BLOG_PITCHES_LU,
];
