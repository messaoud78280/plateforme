/** Modes de génération PPSPS — V5 */
export type PpspsGenerationMode =
  | "analyse_risques"
  | "ppsps_complet"
  | "audit_ppsps"
  | "enrichissement"
  | "coordination_coactivite";

export type PpspsSiteProfile = "public" | "prive" | "sous_traitance" | "maintenance";

export const PPSPS_GENERATION_MODES: {
  id: PpspsGenerationMode;
  label: string;
  description: string;
}[] = [
  {
    id: "analyse_risques",
    label: "Analyse des risques",
    description: "Section « Analyse des risques et modes opératoires » uniquement.",
  },
  {
    id: "ppsps_complet",
    label: "PPSPS complet",
    description: "Trame documentaire complète (organisation, risques, secours, environnement).",
  },
  {
    id: "audit_ppsps",
    label: "Audit & manques",
    description: "Diagnostic d'un PPSPS existant : écarts, priorités, actions correctives.",
  },
  {
    id: "enrichissement",
    label: "Enrichissement",
    description: "Renforcer un document existant sans le diluer — ajouts marqués [Ajout BeWork].",
  },
  {
    id: "coordination_coactivite",
    label: "Coordination & coactivité",
    description: "Interfaces entre entreprises, réunions, zones, planning de coordination.",
  },
];

export const PPSPS_SITE_PROFILES: {
  id: PpspsSiteProfile;
  label: string;
  hint: string;
}[] = [
  { id: "public", label: "Marché public / ERP", hint: "CSPS, PGC, registres, autorisations administratives." },
  { id: "prive", label: "Chantier privé", hint: "MOA/MOE, consignes contractuelles, voisinage." },
  { id: "sous_traitance", label: "Sous-traitance", hint: "Périmètre lot, interfaces donneur d'ordre, PPSPS entreprise utilisatrice." },
  { id: "maintenance", label: "Maintenance / exploitation", hint: "Site occupé, continuité d'activité, consignes exploitant." },
];

export function getPpspsModeLabel(mode: PpspsGenerationMode | string | null | undefined): string {
  return PPSPS_GENERATION_MODES.find((m) => m.id === mode)?.label ?? "Analyse";
}

export function getPpspsModePromptSuffix(mode: PpspsGenerationMode): string {
  switch (mode) {
    case "audit_ppsps":
      return `
## Mode actif : AUDIT PPSPS & MANQUES
Structure obligatoire :
1. Synthèse exécutive (5 lignes max)
2. Tableau | Thème | Constat | Risque | Recommandation |
3. Écarts par rapport aux tâches à risque sélectionnées
4. Top 5 actions prioritaires avant diffusion sur chantier
Ne pas réécrire tout le PPSPS : diagnostiquer et prescrire. Si un PPSPS existant est joint, s'y référer explicitement.`;
    case "enrichissement":
      return `
## Mode actif : ENRICHISSEMENT PPSPS
Conserver la structure existante si un document est fourni. Pour chaque section concernée : compléter modes opératoires, EPI, mesures de prévention.
Marquer clairement les ajouts avec « [Ajout BeWork] ». Ne pas supprimer le contenu source sans raison.`;
    case "coordination_coactivite":
      return `
## Mode actif : COORDINATION & COACTIVITÉ
Produire :
- Matrice des interfaces (entreprise / zone / risque / mesure / responsable)
- Réunions de coordination et points de contrôle communs
- Règles de circulation, stockages, livraisons
- Planning type de coordination sécurité
Citer les entreprises / lots limitrophes à valider avec le SPS.`;
    case "ppsps_complet":
      return `
## Mode actif : PPSPS COMPLET (trame entreprise)
Rédiger un PPSPS exploitable avec la structure suivante (Markdown, titres numérotés) :

# Plan Particulier de Sécurité et de Protection de la Santé

## 1. Rappel du chantier et de l'intervention
(Tableau synthétique + rappel MOA/MOE/SPS)

## 2. Avertissement de validation
(Rappel obligatoire : aide à la rédaction, validation entreprise / CSPS avant diffusion)

## 3. Organisation de la coordination et de la prévention
- Responsables, effectifs, horaires types
- Réunions de coordination, consignes de coactivité
- Accueil sécurité, affichage, registres

## 4. Installations de chantier
- Clôtures, accès, signalisation, éclairage
- Locaux sociaux, sanitaires, consignes hygiène
- Stockages, voies de circulation piétons / engins

## 5. Analyse des risques et modes opératoires
(Pour chaque tâche cochée : tableau détaillé comme en mode analyse)

## 6. Secours et situations d'urgence
- Numéros, PTI si applicable, évacuation
- Soins, arrière-garde, formation premiers secours

## 7. Déchets, nuisances et environnement
- Tri, évacuation, bruit, poussières, horaires sensibles

## 8. Points à vérifier avant démarrage
(Liste consolidée DICT, habilitations, plans, autorisations)

## 9. Annexes suggérées
(Liste des pièces à joindre : plans, fiches DATA, attestations, registres…)

Ne pas inventer de données entreprise (SIRET, assurances) : indiquer « À compléter par l'entreprise ».`;
    default:
      return `
## Mode actif : ANALYSE DES RISQUES
Produire uniquement la section analyse des risques et modes opératoires au format défini (sans répéter tout le PPSPS).`;
  }
}

export function getPpspsSiteProfilePromptSuffix(profile: PpspsSiteProfile | null | undefined): string {
  if (!profile) return "";
  const p = PPSPS_SITE_PROFILES.find((x) => x.id === profile);
  if (!p) return "";
  return `\n## Profil chantier : ${p.label}\n${p.hint}`;
}
