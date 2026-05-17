import { getPpspsTaskById } from "@/content/ppsps-risk-tasks";
import {
  coactivityLabel,
  detailLevelLabel,
  operationTypeLabel,
} from "@/lib/skills/ppsps-labels";
import {
  formatOppbtpKnowledgeForPrompt,
  searchOppbtpKnowledge,
} from "@/lib/skills/ppsps-oppbtp-search";
import { formatPpspsNormReferencesForPrompt } from "@/content/ppsps-norm-references";
import type { PpspsGenerationMode } from "@/lib/skills/ppsps-generation-modes";
import {
  getPpspsModePromptSuffix,
  getPpspsSiteProfilePromptSuffix,
} from "@/lib/skills/ppsps-generation-modes";
import type { PpspsFormInput, PpspsGenerationInput } from "@/lib/skills/ppsps-types";

function siteCompleteness(site: PpspsFormInput["site"]): string[] {
  const missing: string[] = [];
  if (!site.siteName.trim()) missing.push("Nom du chantier");
  if (!site.siteAddress.trim()) missing.push("Adresse du chantier");
  if (!site.startDate.trim()) missing.push("Date de démarrage");
  if (!site.estimatedDuration.trim()) missing.push("Durée estimée");
  if (!site.maxWorkers.trim()) missing.push("Effectif maximum");
  if (!site.safetyManager.trim()) missing.push("Responsable sécurité / chef de chantier");
  return missing;
}

export function buildPpspsUserMessage(input: PpspsGenerationInput): string {
  const { site, trades, tradeOther, selectedRiskTaskIds, detailLevel, constraints } = input;
  const tradeList = [...trades];
  if (tradeList.includes("Autre") && tradeOther.trim()) {
    const idx = tradeList.indexOf("Autre");
    tradeList[idx] = `Autre : ${tradeOther.trim()}`;
  }

  const tasks = selectedRiskTaskIds
    .map((id) => getPpspsTaskById(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof getPpspsTaskById>>[];

  const lines = [
    "## Informations chantier",
    `- Nom : ${site.siteName.trim() || "Non renseigné"}`,
    `- Adresse : ${site.siteAddress.trim() || "Non renseigné"}`,
    `- Type d'opération : ${operationTypeLabel(site.operationType, site.operationTypeOther)}`,
    `- Date prévisionnelle de démarrage : ${site.startDate.trim() || "Non renseignée"}`,
    `- Durée estimée : ${site.estimatedDuration.trim() || "Non renseignée"}`,
    `- Effectif maximum : ${site.maxWorkers.trim() || "Non renseigné"}`,
    `- Coactivité : ${coactivityLabel(site.coactivity)}`,
    `- Coordonnateur SPS : ${site.spsCoordinator.trim() || "Non renseigné"}`,
    `- Maître d'ouvrage : ${site.projectOwner.trim() || "Non renseigné"}`,
    `- Maître d'œuvre : ${site.projectManager.trim() || "Non renseigné"}`,
    `- Responsable sécurité / chef de chantier : ${site.safetyManager.trim() || "Non renseigné"}`,
    "",
    "## Corps d'état concerné",
    tradeList.length ? tradeList.map((t) => `- ${t}`).join("\n") : "- Non renseigné",
    "",
    "## Niveau de détail souhaité",
    detailLevelLabel(detailLevel),
    "",
    "## Contraintes particulières",
    constraints.trim() || "Aucune précisée",
  ];

  if (input.freeformInstruction?.trim()) {
    lines.push("", "## Consigne complémentaire", input.freeformInstruction.trim());
  }

  const normBlock = formatPpspsNormReferencesForPrompt(input.normReferences ?? []);
  if (normBlock) {
    lines.push("", "## Références prévention à prendre en compte", normBlock);
  }

  lines.push("", "## Tâches à risques sélectionnées (à traiter une par une)");

  for (const t of tasks) {
    const alerts = t.alerts?.length ? ` [${t.alerts.join(", ")}]` : "";
    lines.push(`- ${t.label} (famille : ${t.familyTitle})${alerts}`);
  }

  const missing = siteCompleteness(site);
  if (missing.length) {
    lines.push("", "## Informations chantier incomplètes", "Ajouter une section « Informations manquantes à compléter » listant :");
    for (const m of missing) lines.push(`- ${m}`);
  }

  if (input.includeOppbtpHints !== false) {
    const entries = searchOppbtpKnowledge({
      query: input.oppbtpSearchQuery ?? "",
      taskIds: selectedRiskTaskIds,
      limit: 8,
    });
    const block = formatOppbtpKnowledgeForPrompt(entries);
    if (block) {
      lines.push(
        "",
        "## Base de connaissances prévention (repères OPPBTP / INRS — à croiser avec documentation officielle)",
        block,
      );
    }
  }

  const mode: PpspsGenerationMode = input.generationMode ?? "analyse_risques";
  lines.push("", getPpspsModePromptSuffix(mode));
  const profileSuffix = getPpspsSiteProfilePromptSuffix(input.siteProfile);
  if (profileSuffix) lines.push(profileSuffix);

  if (input.extractedFromFiles?.trim()) {
    lines.push(
      "",
      "## Extraits des documents importés (PPSPS existant, plans, notes)",
      input.extractedFromFiles.trim(),
    );
  }

  if (input.refine) {
    lines.push(
      "",
      "## Affinage demandé",
      input.refine.instruction.trim(),
      "",
      "## Document précédent à faire évoluer",
      input.refine.previousMarkdown.trim(),
    );
  } else {
    lines.push(
      "",
      "## Consigne",
      "Génère l'analyse PPSPS complète au format Markdown demandé dans le prompt système, pour chaque tâche listée.",
    );
  }

  return lines.join("\n");
}
