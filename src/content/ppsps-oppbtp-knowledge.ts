/**
 * Base de connaissances prévention BTP (repères OPPBTP / INRS).
 * Aide à la rédaction — ne remplace pas les publications officielles.
 */
export type OppbtpKnowledgeEntry = {
  id: string;
  title: string;
  themes: string[];
  keywords: string[];
  content: string;
  sourceLabel: string;
};

export const PPSPS_OPPBTP_KNOWLEDGE: readonly OppbtpKnowledgeEntry[] = [
  {
    id: "chute-hauteur",
    title: "Prévention des chutes de hauteur",
    themes: ["hauteur"],
    keywords: ["échafaudage", "toiture", "garde-corps", "ligne de vie", "harnais", "échelle", "nacelle"],
    sourceLabel: "Repère OPPBTP — travail en hauteur",
    content:
      "Vérifier la stabilité des supports, la pose des garde-corps normalisés ou des dispositifs de retenue des chutes (harnais + point d'ancrage validé). Contrôler l'aptitude médicale et la formation. Interdire le travail par temps venteux ou gel sans mesures compensatoires. Planifier l'approvisionnement pour limiter les manutentions en hauteur.",
  },
  {
    id: "echafaudage",
    title: "Montage et utilisation des échafaudages",
    themes: ["hauteur"],
    keywords: ["échafaudage", "montage", "vérification", "platelage", "garde-corps"],
    sourceLabel: "Repère OPPBTP — échafaudages",
    content:
      "Échafaudage conforme et monté par personnes compétentes. Vérification avant mise en service et après modification. Platelage complet, garde-corps (lisse supérieure, plinthe, madrier intermédiaire). Accès sécurisé. Interdiction de surcharge et de stockage excessif sur platelages.",
  },
  {
    id: "fouilles-reseaux",
    title: "Fouilles et réseaux enterrés",
    themes: ["terrassement"],
    keywords: ["fouille", "tranchée", "dict", "réseau", "blindage", "ensevelissement"],
    sourceLabel: "Repère OPPBTP — fouilles",
    content:
      "DICT et repérage avant terrassement. Blindage ou talutage selon profondeur et nature du sol. Interdire le stockage de terre en bordure de fouille non blindée. Accès et évacuation des travailleurs. Signalisation et balisage des zones. Arrêt des travaux si découverte de réseau non identifié.",
  },
  {
    id: "levage-manutention",
    title: "Levage et manutention",
    themes: ["manutention"],
    keywords: ["grue", "engin", "élingage", "caces", "charge", "levage"],
    sourceLabel: "Repère OPPBTP — levage",
    content:
      "Plan de levage pour opérations complexes. Élingage par personnes compétentes. CACES ou habilitation selon engin. Zone d'exclusion sous charge suspendue. Contrôle des accessoires de levage (étiquetage, état). Interdire le passage sous charge et le levage de personnes sauf dispositif prévu.",
  },
  {
    id: "circulation-engins",
    title: "Circulation engins et piétons",
    themes: ["engins"],
    keywords: ["pelle", "engin", "circulation", "piéton", "signalisation", "voirie"],
    sourceLabel: "Repère OPPBTP — circulation chantier",
    content:
      "Séparer physiquement ou temporellement les flux piétons et engins. Voies de circulation dimensionnées, signalées et éclairées. Vitesses adaptées. Recul assisté ou guidage. Port des EPI haute visibilité. Formation et habilitation des conducteurs.",
  },
  {
    id: "electricite-chantier",
    title: "Électricité sur chantier",
    themes: ["electricite"],
    keywords: ["électrique", "consignation", "coffret", "habilitation", "ligne"],
    sourceLabel: "Repère OPPBTP — électricité",
    content:
      "Installations provisoires conformes. Coffrets de chantier verrouillés et identifiés. Habilitations électriques selon interventions. Consignation avant travaux sur installations existantes. Vérification des distances avec lignes aériennes. Outillage en bon état (double isolation si nécessaire).",
  },
  {
    id: "demolition-poussieres",
    title: "Démolition, poussières et bruit",
    themes: ["demolition"],
    keywords: ["démolition", "poussière", "bruit", "amiante", "carottage"],
    sourceLabel: "Repère OPPBTP — démolition",
    content:
      "Repérage amiante / plomb / plomb avant travaux sur existant. Humidification ou aspiration à la source. Protections collectives et EPI (masques, auditifs). Périmètre de sécurité pour chutes de projectiles. Évacuation des gravats sans surcharge des planchers.",
  },
  {
    id: "produits-chimiques",
    title: "Produits chimiques et solvants",
    themes: ["chimique"],
    keywords: ["chimique", "solvant", "fds", "colle", "résine"],
    sourceLabel: "Repère OPPBTP — produits dangereux",
    content:
      "Fiches de données de sécurité accessibles. Stockage ventilé et identifié. EPI adaptés (gants, lunettes, masque). Ventilation des locaux. Interdiction de mélanges inconnus. Formation aux risques spécifiques. Élimination des déchets selon filière.",
  },
  {
    id: "coactivite-sps",
    title: "Coactivité et coordination SPS",
    themes: ["organisation"],
    keywords: ["coactivité", "sps", "coordination", "pgc", "entreprise"],
    sourceLabel: "Repère coordination SPS",
    content:
      "Respect du plan général de coordination et des plans particuliers. Réunions de coordination, compte-rendu, consignes affichées. Délimitation des zones par entreprise. Gestion des interfaces (horaires, levages, réseaux). Signalement immédiat des situations dangereuses au coordonnateur SPS.",
  },
  {
    id: "site-occupe-erp",
    title: "Travaux en site occupé ou ERP",
    themes: ["organisation"],
    keywords: ["site occupé", "erp", "public", "évacuation", "horaires"],
    sourceLabel: "Repère site occupé",
    content:
      "Séparer zones de travaux et public/usagers. Horaaires et nuisances maîtrisés. Maintien des voies d'évacuation et d'accès secours. Information des occupants. Plan d'intervention en cas d'urgence adapté à la présence du public.",
  },
  {
    id: "epi-chantier",
    title: "Choix et port des EPI",
    themes: ["organisation", "hauteur", "demolition"],
    keywords: ["epi", "casque", "chaussure", "gants", "masque", "harnais"],
    sourceLabel: "Repère EPI chantier",
    content:
      "EPI conformes CE, adaptés aux risques réels, entretenus et remplacés si défectueux. Casque obligatoire sur chantier. Chaussures de sécurité. Gants selon tâche. Protection auditive si seuils dépassés. Masque antipoussières si poussières. Harnais uniquement avec point d'ancrage et formation.",
  },
  {
    id: "travail-isole",
    title: "Travail isolé et vigilance",
    themes: ["organisation"],
    keywords: ["isolé", "vigilance", "pti", "secours"],
    sourceLabel: "Repère travail isolé",
    content:
      "Éviter le travail isolé si possible. Dispositif d'alerte ou PTI selon contexte. Consignes de contact régulier. Moyens de secours accessibles. Formation aux gestes de premiers secours sur site.",
  },
  {
    id: "voirie-emprise",
    title: "Travaux en voirie et emprise publique",
    themes: ["engins", "terrassement"],
    keywords: ["voirie", "autorisation", "signalisation", "trafic"],
    sourceLabel: "Repère voirie",
    content:
      "Autorisation administrative si emprise sur voie publique. Signalisation temporaire conforme. Balisage de jour et de nuit. Plan de circulation validé. Formation des intervenants aux risques routiers.",
  },
  {
    id: "maconnerie-manutention",
    title: "Maçonnerie et approvisionnement",
    themes: ["manutention", "hauteur"],
    keywords: ["maçonnerie", "parpaing", "déchargement", "stockage"],
    sourceLabel: "Repère maçonnerie",
    content:
      "Organiser zones de déchargement et stockage. Limiter manutentions manuelles (aides mécaniques). Protection des trémies et ouvertures. Garde-corps sur rives. Coordination livraisons (horaires, engins).",
  },
] as const;
