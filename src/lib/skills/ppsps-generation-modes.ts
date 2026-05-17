/** Modes de génération PPSPS — V3 */
export type PpspsGenerationMode = "analyse_risques" | "ppsps_complet";

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
    description:
      "Document structuré : organisation chantier, analyse des risques, installations, secours, environnement et annexes.",
  },
];

export function getPpspsModePromptSuffix(mode: PpspsGenerationMode): string {
  if (mode === "analyse_risques") {
    return `
## Mode actif : ANALYSE DES RISQUES
Produire uniquement la section analyse des risques et modes opératoires au format défini (sans répéter tout le PPSPS).`;
  }

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
}
