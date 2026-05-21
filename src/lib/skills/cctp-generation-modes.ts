/** Modes de mission — orientent le prompt et la structure de réponse. */
export type CctpGenerationMode =
  | "redaction"
  | "sommaire"
  | "audit"
  | "enrichissement"
  | "coordination"
  | "fiche_ouvrage"
  | "checklist_documents"
  | "coherence_dpgf"
  | "methode";

export type CctpMarketProfile = "public" | "prive" | "sous_traitance" | "maintenance";

export const CCTP_GENERATION_MODES: {
  id: CctpGenerationMode;
  label: string;
  description: string;
}[] = [
  {
    id: "redaction",
    label: "Rédaction",
    description: "Articles, clauses et prescriptions prêtes à intégrer.",
  },
  {
    id: "sommaire",
    label: "Sommaire & structure",
    description: "Plan détaillé, hiérarchie des articles et logique par lot.",
  },
  {
    id: "audit",
    label: "Audit & manques",
    description: "Analyse critique, tableau des lacunes et priorités.",
  },
  {
    id: "enrichissement",
    label: "Enrichissement",
    description: "Renforcer un texte existant sans le diluer.",
  },
  {
    id: "coordination",
    label: "Coordination lots",
    description: "Interfaces, réservations et coactivité entre corps d'état.",
  },
  {
    id: "fiche_ouvrage",
    label: "Fiche ouvrage",
    description: "Fiche ouvrage standardisée (14 rubriques + vigilance).",
  },
  {
    id: "checklist_documents",
    label: "Pièces à rassembler",
    description: "Checklist plans, diagnostics, études, DPGF, marché.",
  },
  {
    id: "coherence_dpgf",
    label: "Cohérence DPGF",
    description: "Croiser CCTP, devis et pièces de prix.",
  },
  {
    id: "methode",
    label: "Guide méthode",
    description: "Plan de travail en 6 étapes pour établir le CCTP.",
  },
];

export const CCTP_MARKET_PROFILES: {
  id: CctpMarketProfile;
  label: string;
  hint: string;
}[] = [
  { id: "public", label: "Marché public", hint: "Formulations CCAG, pénalités, variantes, DPGF." },
  { id: "prive", label: "Marché privé", hint: "Souplesse contractuelle, références MOA/MOE." },
  { id: "sous_traitance", label: "Sous-traitance", hint: "Périmètre lot, interfaces donneur d'ordre." },
  { id: "maintenance", label: "Maintenance / exploitation", hint: "Exploitant, accès, sécurité, continuité." },
];

export function getModePromptSuffix(mode: CctpGenerationMode): string {
  switch (mode) {
    case "sommaire":
      return `
## Mode actif : SOMMAIRE & STRUCTURE
Produis un sommaire hiérarchisé (titres numérotés) exploitable tel quel. Pour chaque grande partie, indique en 1 ligne l'objectif.
Inclure : dispositions générales, prescriptions communes, lot technique, sécurité/environnement, réception/DOE.
Terminer par une section « Articles à développer en priorité ».`;
    case "audit":
      return `
## Mode actif : AUDIT & MANQUES
Structure obligatoire :
1. Synthèse exécutive (5 lignes max)
2. Tableau | Thème | Constat | Risque | Recommandation |
3. Liste des incohérences avec documents joints si présents
4. Top 5 actions prioritaires avant diffusion
Ne pas réécrire tout le CCTP : diagnostiquer et prescrire.`;
    case "enrichissement":
      return `
## Mode actif : ENRICHISSEMENT
Conserver la structure existante. Pour chaque section concernée : reformuler, ajouter prescriptions manquantes, sujétions, contrôles et tolérances.
Marquer clairement les ajouts avec « [Ajout BeWork] ».`;
    case "coordination":
      return `
## Mode actif : COORDINATION LOTS
Produire : matrice des interfaces (lot / prestation / responsable / délai), réservations à prévoir, points de contrôle communs, planning type de coordination.
Citer les lots limitrophes à valider avec le MOE.`;
    case "fiche_ouvrage":
      return `
## Mode actif : FICHE OUVRAGE INTELLIGENTE
Pour chaque ouvrage, produire une fiche avec les rubriques standard :
Objet des travaux · Prestations comprises · Prestations exclues · Matériaux · Mise en œuvre · Références DTU et normes · Prescriptions techniques · Tolérances · Réservations · Interfaces inter-lots · Points de contrôle · Nettoyage chantier · Essais et validations · DOE et documents finaux.
Ajouter si pertinent : localisation sur plans, variantes, limites de prestation, contrôles avant réception.
Pour 2 rubriques sensibles, inclure une ligne « Pourquoi » et « Risque si oubli ».
Ton conducteur de travaux, prescriptions impératives, sections vides = « à valider avec le MOE ».
Format : ### par rubrique ; listes pour compris / exclu / contrôles.`;
    case "checklist_documents":
      return `
## Mode actif : PIÈCES À RASSEMBLER
Produire une checklist structurée par catégories :
A) Documents de base (plans, photos, programme)
B) Pièces graphiques complémentaires
C) Diagnostics (si rénovation)
D) Études techniques
E) Règles techniques (DTU, normes, fabricants — sans numéros inventés)
F) Documents financiers (DPGF, BPU, DQE, devis)
G) Documents administratifs (CCAP, RC, planning, DOE…)
Pour chaque ligne : statut (disponible / manquant / à demander) si l'utilisateur l'a indiqué, sinon « à vérifier ».`;
    case "coherence_dpgf":
      return `
## Mode actif : COHÉRENCE DPGF / DEVIS
Structure :
1. Synthèse des écarts CCTP ↔ DPGF/BPU/devis
2. Tableau | Ouvrage ou prestation CCTP | Présent au DPGF ? | Risque chiffrage | Action |
3. Ouvrages au DPGF absents du CCTP
4. Recommandations avant diffusion du dossier`;
    case "methode":
      return `
## Mode actif : GUIDE MÉTHODE (6 étapes)
Produire un plan de travail personnalisé selon le contexte :
1. Comprendre le besoin client
2. Rassembler les documents (liste détaillée)
3. Lister les lots
4. Repérer les ouvrages par lot
5. Décrire chaque ouvrage
6. Vérifier la cohérence (checklist finale)
Inclure le schéma : plans → études → ouvrages → normes → limites → CCTP final.`;
    default:
      return `
## Mode actif : RÉDACTION
Produire un contenu contractuel directement exploitable (phrases à l'infinitif ou « l'entreprise devra »).
Structurer par articles numérotés avec prescriptions impératives et sujétions.`;
  }
}

export function getMarketPromptSuffix(profile: CctpMarketProfile | null | undefined): string {
  if (!profile) return "";
  const p = CCTP_MARKET_PROFILES.find((x) => x.id === profile);
  if (!p) return "";
  return `\n## Profil marché : ${p.label}\n${p.hint}`;
}

export function getCctpModeLabel(mode: CctpGenerationMode): string {
  return CCTP_GENERATION_MODES.find((m) => m.id === mode)?.label ?? mode;
}

/** Conseil court affiché sous le sélecteur de mode. */
export function getCctpModeUiHint(mode: CctpGenerationMode): string {
  switch (mode) {
    case "sommaire":
      return "Importez un CCTP existant ou listez les lots : l’IA produit une trame numérotée prête à compléter.";
    case "audit":
      return "Joignez votre CCTP + plans : l’IA liste les manques, risques et actions prioritaires en tableau.";
    case "enrichissement":
      return "Collez ou importez l’article à enrichir : les ajouts seront marqués [Ajout BeWork].";
    case "coordination":
      return "Précisez les lots limitrophes : matrice interfaces, réservations, rebouchages, responsables.";
    case "fiche_ouvrage":
      return "Nommez l’ouvrage et la localisation (plans) : fiche complète 14 rubriques, chiffrable et relivable chantier.";
    case "checklist_documents":
      return "Cochez les pièces dans la checklist puis synchronisez vers le formulaire avant de générer.";
    case "coherence_dpgf":
      return "Importez CCTP + DPGF/devis : croisement ouvrages ↔ lignes de prix.";
    case "methode":
      return "Décrivez le type de projet : plan personnalisé en 6 étapes + lots à traiter.";
    default:
      return "Précisez lot, localisation et ouvrages : articles contractuels « l’entreprise devra… ».";
  }
}

export function getCctpModeRequestPlaceholder(mode: CctpGenerationMode): string {
  switch (mode) {
    case "sommaire":
      return "Ex. : Sommaire CCTP lot gros œuvre — maison individuelle neuve, avec réception et DOE…";
    case "audit":
      return "Ex. : Audite ce CCTP importé : manques, incohérences avec les plans, points bloquants pour le chiffrage…";
    case "enrichissement":
      return "Ex. : Enrichis l’article carrelage (trop vague) : format, support, sujétions, plinthes, contrôles…";
    case "coordination":
      return "Ex. : Matrice de coordination lot plomberie / GO : percements, réservations, rebouchages, coupe-feu…";
    case "fiche_ouvrage":
      return "Ex. : Fiche ouvrage — dallage béton 12 cm, réservations, interfaces GO/fluides, contrôles avant coulage…";
    case "checklist_documents":
      return "Ex. : Checklist complète des pièces pour un CCTP rénovation tertiaire (diagnostics + études)…";
    case "coherence_dpgf":
      return "Ex. : Vérifie la cohérence entre le CCTP joint et le DPGF : ouvrages sans ligne de prix…";
    case "methode":
      return "Ex. : Plan de travail en 6 étapes pour établir le CCTP d’une extension de bureaux (lot GO + second œuvre)…";
    default:
      return "Ex. : Rédige l’article CCTP murs en blocs 20 cm — fourniture, pose, chaînages, réservations, sujétions…";
  }
}

/** Déduit le mode depuis la formulation de la demande (si mode « rédaction » générique). */
export function inferCctpGenerationModeFromRequest(request: string): CctpGenerationMode | null {
  const t = request.toLowerCase();
  if (/(fiche ouvrage|fiche d'ouvrage|modèle ouvrage|modele ouvrage)/.test(t)) return "fiche_ouvrage";
  if (/(checklist|pièces à rassembler|pieces a rassembler|documents à rassembler|dossier document)/.test(t))
    return "checklist_documents";
  if (/(cohérence dpgf|coherence dpgf|\bdpgf\b|\bbpu\b|\bdqe\b|devis.*cctp|cctp.*devis)/.test(t))
    return "coherence_dpgf";
  if (/(6 étapes|6 etapes|guide méthode|guide methode|plan de travail|méthode pour établir)/.test(t)) return "methode";
  if (/(coordination|interfaces|réservations|reservations|rebouchage|matrice.*lot|limites de prestation)/.test(t))
    return "coordination";
  if (/(sommaire|trame|plan du cctp|structure du cctp)/.test(t)) return "sommaire";
  if (/(amélior|amelior|corriger|reformul|relecture|trop vague|enrichir)/.test(t)) return "enrichissement";
  if (/(manque|analys|audit|incohéren|incohéren)/.test(t)) return "audit";
  return null;
}

export function resolveCctpGenerationMode(
  explicit: CctpGenerationMode | undefined,
  request: string,
): CctpGenerationMode {
  if (explicit && explicit !== "redaction") return explicit;
  return inferCctpGenerationModeFromRequest(request) ?? explicit ?? "redaction";
}
