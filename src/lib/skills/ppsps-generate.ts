import { getPpspsTaskById, PPSPS_ALERT_LABELS, type PpspsRiskAlert } from "@/content/ppsps-risk-tasks";
import { buildPpspsUserMessage } from "@/lib/skills/ppsps-build-user-message";
import {
  coactivityLabel,
  detailLevelLabel,
  operationTypeLabel,
} from "@/lib/skills/ppsps-labels";
import type { PpspsGenerationMode } from "@/lib/skills/ppsps-generation-modes";
import { PPSPS_SYSTEM_PROMPT } from "@/lib/skills/ppsps-system-prompt";
import type { PpspsFormInput, PpspsGenerationInput, PpspsGenerationResponse } from "@/lib/skills/ppsps-types";
import { chatCompletion, isSkillsLlmConfigured, type LlmChatMessage } from "@/lib/skills/llm-chat";

const VALIDATION_WARNING =
  "Cette analyse constitue une aide à la préparation du PPSPS. Elle doit être vérifiée, complétée et validée par l'entreprise intervenante, le responsable sécurité et/ou le coordonnateur SPS avant diffusion ou utilisation sur chantier.";

function alertBadge(alert: PpspsRiskAlert): string {
  return PPSPS_ALERT_LABELS[alert] ?? alert;
}

function generateTaskSection(taskId: string, detailLevel: PpspsFormInput["detailLevel"]): string {
  const task = getPpspsTaskById(taskId);
  if (!task) return "";

  const alertLine = task.alerts?.length
    ? `\n\n> **Alertes :** ${task.alerts.map((a) => alertBadge(a)).join(" · ")}`
    : "";

  const verbose = detailLevel === "detaille" || detailLevel === "tres_detaille";

  const description = verbose
    ? `Phase de travail « ${task.label} » sur le chantier décrit — décrire les étapes concrètes d'intervention, l'approvisionnement, la zone d'intervention et les interfaces avec les autres lots. **À adapter au mode opératoire réel de l'entreprise.**`
    : `Intervention : ${task.label}. **À préciser selon le mode opératoire validé par l'entreprise.**`;

  const risks =
    "- Chutes (hauteur, plain-pied, objets)\n- Heurt, écrasement, coincement\n- Exposition poussières / bruit / produits si applicable\n- Coactivité et circulation\n- **À compléter selon analyse de risques de l'entreprise**";

  const measures =
    "- Balisage et signalisation de la zone\n- Protections collectives adaptées (garde-corps, blindage, consignation…)\n- Organisation des circulations et du stockage\n- **À vérifier avant validation du PPSPS**";

  const modeOp =
    "1. Préparation et repérage de la zone\n2. Vérifications préalables (matériel, habilitations, autorisations)\n3. Mise en sécurité et balisage\n4. Exécution contrôlée\n5. Contrôles intermédiaires\n6. Nettoyage et remise en état";

  const epi =
    "- Casque de chantier\n- Chaussures de sécurité\n- Gants adaptés\n- Lunettes si projection / poussières\n- EPI spécifiques selon tâche (harnais, protections auditives, masque…) — **à valider**";

  const vigilance =
    "- Plans, autorisations, DICT/DT si réseaux\n- Habilitations / CACES / vérifications matériel\n- Coactivité et consignes CSPS\n- **À vérifier avant validation du PPSPS**";

  return `### Phase : ${task.label}${alertLine}

| Élément | Analyse |
|---|---|
| Description de la phase | ${description.replace(/\n/g, " ")} |
| Risques identifiés | ${risks.replace(/\n/g, " ; ")} |
| Mesures de prévention collectives | ${measures.replace(/\n/g, " ; ")} |
| Mode opératoire sécurisé | ${modeOp.replace(/\n/g, " ; ")} |
| EPI obligatoires | ${epi.replace(/\n/g, " ; ")} |
| Points à vérifier | ${vigilance.replace(/\n/g, " ; ")} |
`;
}

function generatePpspsFallback(input: PpspsFormInput): string {
  const { site, trades, tradeOther, selectedRiskTaskIds, detailLevel, constraints } = input;
  const tradeList = [...trades];
  if (tradeList.includes("Autre") && tradeOther.trim()) {
    tradeList[tradeList.indexOf("Autre")] = `Autre : ${tradeOther.trim()}`;
  }

  const sections = selectedRiskTaskIds.map((id) => generateTaskSection(id, detailLevel)).filter(Boolean);

  const missing: string[] = [];
  if (!site.siteName.trim()) missing.push("Nom du chantier");
  if (!site.siteAddress.trim()) missing.push("Adresse");
  if (!site.safetyManager.trim()) missing.push("Responsable sécurité");

  let md = `# Analyse des risques et modes opératoires — PPSPS

## 1. Rappel des informations chantier

| Information | Valeur |
|---|---|
| Chantier | ${site.siteName.trim() || "À renseigner"} |
| Adresse | ${site.siteAddress.trim() || "À renseigner"} |
| Type d'opération | ${operationTypeLabel(site.operationType, site.operationTypeOther)} |
| Corps d'état | ${tradeList.length ? tradeList.join(", ") : "À renseigner"} |
| Effectif prévu | ${site.maxWorkers.trim() || "À renseigner"} |
| Coactivité | ${coactivityLabel(site.coactivity)} |
| Contraintes particulières | ${constraints.trim() || "Aucune"} |

## 2. Avertissement de validation

> ${VALIDATION_WARNING}

## 3. Analyse par phase de travail

${sections.join("\n")}

## 4. Synthèse des EPI à prévoir

- Casque de chantier
- Chaussures de sécurité S3
- Gants adaptés aux tâches sélectionnées
- Lunettes de protection
- Vêtements haute visibilité si circulation engins
- Protections auditives si bruit
- Masque antipoussières si poussières
- Harnais antichute si travail en hauteur — **uniquement après analyse et point d'ancrage validés**

## 5. Points bloquants ou à vérifier avant validation

- Document généré en **mode assisté** (sans IA cloud ou repli local) : chaque phase doit être relue et complétée par une personne compétente.
${missing.map((m) => `- ${m} : **à compléter**`).join("\n")}
- Vérifier DICT, plans de prévention, autorisations voirie, repérages amiante/plomb si applicables.
- Valider coactivité et interfaces avec le coordonnateur SPS.

## 6. Questions complémentaires

1. Quelles entreprises tierces seront présentes simultanément sur la zone d'intervention ?
2. Les plans de circulation et d'installation de chantier sont-ils validés ?
3. Existe-t-il des contraintes horaires, de voisinage ou d'accès à intégrer ?
4. Les moyens de secours et d'évacuation sont-ils adaptés à l'effectif prévu ?
5. Des phases nécessitent-elles un plan de prévention spécifique ou une autorisation particulière ?
`;

  if (missing.length) {
    md += `\n## Informations manquantes à compléter\n\n${missing.map((m) => `- ${m}`).join("\n")}\n`;
  }

  return md;
}

export async function generatePpspsAnalysis(input: PpspsGenerationInput): Promise<PpspsGenerationResponse> {
  const auditLike =
    input.generationMode === "audit_ppsps" || input.generationMode === "enrichissement";
  const hasAltInput = Boolean(input.extractedFromFiles?.trim() || input.freeformInstruction?.trim());
  if (!input.selectedRiskTaskIds.length && !input.refine && !(auditLike && hasAltInput)) {
    throw new Error(
      auditLike
        ? "Mode audit/enrichissement : fournissez un document, une consigne libre ou des tâches à risque."
        : "Sélectionnez au moins une tâche à risque avant de générer l'analyse.",
    );
  }

  const userMessage = buildPpspsUserMessage(input);
  const formOnly = input as PpspsFormInput;

  const mode: PpspsGenerationMode = input.generationMode ?? "analyse_risques";

  if (isSkillsLlmConfigured()) {
    try {
      const messages: LlmChatMessage[] = [
        { role: "system", content: PPSPS_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ];
      const markdown = await chatCompletion(messages);
      return { markdown, usedLlm: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur LLM";
      return {
        markdown: input.refine ? input.refine.previousMarkdown : generatePpspsFallback(formOnly),
        usedLlm: false,
        notice: `Génération IA indisponible (${msg}). Résultat assisté local affiché — à compléter impérativement avant usage.`,
      };
    }
  }

  if (input.refine) {
    return {
      markdown: input.refine.previousMarkdown,
      usedLlm: false,
      notice:
        "OPENAI_API_KEY non configurée : affinage IA indisponible. Configurez l'IA ou modifiez le document manuellement.",
    };
  }

  return {
    markdown: generatePpspsFallback(formOnly),
    usedLlm: false,
    notice:
      "OPENAI_API_KEY non configurée : analyse structurée générée localement. Activez l'IA pour une analyse détaillée, puis validez toujours le document avant chantier.",
  };
}
