import {
  CCTP_DOCUMENT_CATEGORIES,
  CCTP_OUVRAGE_EXAMPLE,
  CCTP_OUVRAGE_TEMPLATE_FIELDS,
  CCTP_SIX_STEPS,
  CCTP_NORMS_STANDARD_PHRASE,
} from "@/content/cctp-methodology";
import {
  computeCctpAssistantInsights,
  formatInsightsMarkdown,
  formatIntelligenceBlockForPrompt,
} from "@/lib/skills/cctp-assistant-intelligence";
import { cctpNormLabelsByIds } from "@/content/cctp-norm-references";
import { CCTP_REDACTION_SYSTEM_PROMPT } from "@/lib/skills/cctp-redaction-system-prompt";
import type { CctpGenerationInput, CctpProjectContext, CctpRedactionResponseBody } from "@/lib/skills/cctp-redaction-types";
import {
  type CctpGenerationMode,
  getCctpModeLabel,
  getCctpModeUiHint,
  getMarketPromptSuffix,
  getModePromptSuffix,
  resolveCctpGenerationMode,
} from "@/lib/skills/cctp-generation-modes";
import { chatCompletion, isSkillsLlmConfigured, type LlmChatMessage } from "@/lib/skills/llm-chat";

function resolveMode(input: CctpGenerationInput): CctpGenerationMode {
  const req = input.refine ? input.refine.instruction : input.request;
  return resolveCctpGenerationMode(input.generationMode, req);
}

function buildSystemPrompt(input: CctpGenerationInput): string {
  const mode = resolveMode(input);
  return (
    CCTP_REDACTION_SYSTEM_PROMPT +
    getModePromptSuffix(mode) +
    getMarketPromptSuffix(input.marketProfile)
  );
}

const DETAIL_LABELS: Record<CctpProjectContext["detailLevel"], string> = {
  synthese: "Synthèse (sommaire et grandes parties)",
  standard: "Standard (articles exploitables chantier)",
  detaille: "Détaillé (prescriptions fines, sujétions, contrôles)",
};

function buildUserMessage(input: CctpGenerationInput): string {
  const { request, context, extractedFromFiles, normReferences } = input;
  const mode = resolveMode(input);
  const lines = [
    "## Mode de mission",
    `- **${getCctpModeLabel(mode)}** — ${getCctpModeUiHint(mode)}`,
    "",
    "## Contexte projet",
    `- Type d'ouvrage : ${context.projectType || "Non renseigné"}`,
    `- Lot concerné : ${context.lot || "Non renseigné"}`,
    `- Localisation : ${context.location || "Non renseigné"}`,
    `- Contraintes particulières : ${context.constraints || "Aucune précisée"}`,
    `- Niveau de détail souhaité : ${DETAIL_LABELS[context.detailLevel]}`,
    `- Documents disponibles (saisie) : ${context.availableDocuments || "Non précisés"}`,
  ];

  const normLabels = normReferences?.length ? cctpNormLabelsByIds(normReferences) : [];
  if (normLabels.length) {
    lines.push("", "## Familles de normes / DTU à prendre en compte");
    for (const n of normLabels) {
      lines.push(`- ${n} — ne pas inventer de numéro ; signaler « Référence à vérifier avant validation contractuelle » si besoin.`);
    }
  }

  if (extractedFromFiles?.trim()) {
    lines.push(
      "",
      "## Extraits des documents importés (à analyser et croiser avec la demande)",
      extractedFromFiles.trim(),
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
    lines.push("", "## Demande utilisateur", request.trim());
  }

  const insights = computeCctpAssistantInsights(context, {
    extractedFromFiles,
    checkedDocumentIds: input.checkedDocumentIds,
    documentClassifications: input.documentClassifications,
  });
  lines.push("", formatIntelligenceBlockForPrompt(insights));

  return lines.join("\n");
}

function attachInsightsToMarkdown(
  markdown: string,
  insights: ReturnType<typeof computeCctpAssistantInsights>,
  usedLlm: boolean,
): string {
  if (usedLlm) return markdown;
  const prefix = formatInsightsMarkdown(insights);
  if (markdown.includes("## Pilotage chantier BeWork")) return markdown;
  return `${prefix}\n\n---\n\n${markdown}`;
}

function detectIntent(
  request: string,
):
  | "sommaire"
  | "article"
  | "amelioration"
  | "analyse"
  | "fiche_ouvrage"
  | "checklist_documents"
  | "coherence_dpgf"
  | "methode"
  | "coordination"
  | "general" {
  const t = request.toLowerCase();
  if (/(fiche ouvrage|fiche d'ouvrage|modèle ouvrage|modele ouvrage)/.test(t)) return "fiche_ouvrage";
  if (/(checklist|pièces à rassembler|pieces a rassembler|documents à rassembler|dossier document)/.test(t))
    return "checklist_documents";
  if (/(cohérence dpgf|coherence dpgf|dpgf|bpu|dqe|devis.*cctp|cctp.*devis)/.test(t)) return "coherence_dpgf";
  if (/(6 étapes|6 etapes|guide méthode|guide methode|plan de travail|méthode pour établir)/.test(t)) return "methode";
  if (/(coordination|interfaces|réservations|reservations|rebouchage|matrice.*lot)/.test(t)) return "coordination";
  if (/(sommaire|trame|plan|structure)/.test(t)) return "sommaire";
  if (/(amélior|amelior|corriger|reformul|relecture|trop vague)/.test(t)) return "amelioration";
  if (/(manque|analys|audit|vérifier|verifier|incohéren)/.test(t)) return "analyse";
  if (/(rédig|redig|article|clause|prestation)/.test(t)) return "article";
  return "general";
}

function generateCctpFallback(input: CctpGenerationInput): string {
  const { request, context, extractedFromFiles, normReferences } = input;
  const mode = resolveMode(input);
  const intent = detectIntent(request);
  const lot = context.lot || "lot à préciser";
  const ouvrage = context.projectType || "ouvrage à préciser";
  const lieu = context.location || "localisation à préciser";
  const normLabels = normReferences?.length ? cctpNormLabelsByIds(normReferences) : [];

  const docsBlock = extractedFromFiles?.trim()
    ? `\n### Documents importés\nExtrait analysé (${Math.min(extractedFromFiles.length, 12000)} car. max affiché en mode assisté).\n`
    : "";

  const normsBlock = normLabels.length
    ? `\n### Normes / DTU visés\n${normLabels.map((n) => `- ${n} — **Référence à vérifier avant validation contractuelle.**`).join("\n")}\n`
    : "";

  const header = `## Réponse Skill CCTP (mode assisté)

> **Note :** génération locale BeWork (sans API LLM). Configurez \`OPENAI_API_KEY\` pour activer le modèle complet. Le contenu ci-dessous est une base structurée à valider par un professionnel compétent.

### Rappel contexte
- **Ouvrage :** ${ouvrage}
- **Lot :** ${lot}
- **Localisation :** ${lieu}
- **Niveau de détail :** ${DETAIL_LABELS[context.detailLevel]}
${context.constraints ? `- **Contraintes :** ${context.constraints}` : ""}
${docsBlock}${normsBlock}
---

`;

  if (mode === "fiche_ouvrage") {
    const fields = CCTP_OUVRAGE_TEMPLATE_FIELDS.map((f) => `### ${f}\n… (à compléter selon plans et études)`).join("\n\n");
    return `${header}## Fiche ouvrage — ${lot}

${fields}

---

### Exemple de référence (mur blocs 20 cm)
- **Titre :** ${CCTP_OUVRAGE_EXAMPLE.title}
- **Localisation :** ${CCTP_OUVRAGE_EXAMPLE.localization}
- **Description :** ${CCTP_OUVRAGE_EXAMPLE.description}

### Points à vérifier
${CCTP_OUVRAGE_EXAMPLE.aVerifier.map((p) => `- ${p}`).join("\n")}`;
  }

  if (mode === "checklist_documents") {
    const sections = CCTP_DOCUMENT_CATEGORIES.map(
      (cat) =>
        `### ${cat.title}\n${cat.items.map((item) => `- [ ] ${item} — *à vérifier*`).join("\n")}`,
    ).join("\n\n");
    return `${header}## Checklist des pièces à rassembler

${sections}

### Statut global
Cochez chaque pièce disponible avant de lancer la rédaction détaillée. En rénovation, prioriser les diagnostics (amiante, plomb, structure).`;
  }

  if (mode === "coherence_dpgf") {
    return `${header}## Contrôle de cohérence CCTP ↔ DPGF / devis

| Ouvrage ou prestation (CCTP) | Présent au DPGF ? | Risque chiffrage | Action |
|------------------------------|-------------------|------------------|--------|
| *À lister depuis votre CCTP* | À vérifier | — | Croiser avec une ligne de prix |

### Rappel
Tout ouvrage décrit au CCTP doit avoir une ligne au DPGF/BPU/devis, et inversement.

### Questions
1. Disposez-vous du DPGF ou du devis à joindre en import ?
2. Quels lots sont concernés par la demande : **${lot}** ?`;
  }

  if (mode === "methode") {
    const steps = CCTP_SIX_STEPS.map((s) => `**${s.step}. ${s.title}** — ${s.detail}`).join("\n\n");
    return `${header}## Plan de travail — établir le CCTP (${lot})

${steps}

### Schéma de synthèse
Plans + études + diagnostics → ouvrages par lot → normes (${CCTP_NORMS_STANDARD_PHRASE.slice(0, 80)}…) → limites de prestation → vérification DPGF → CCTP final.

### Question clé
L'entreprise peut-elle **comprendre, chiffrer et exécuter** les travaux avec le document prévu ?`;
  }

  if (mode === "coordination") {
    return `${header}## Matrice de coordination — ${lot}

| Interface | Lot concerné | Responsable | Délai / remarque |
|-----------|--------------|-------------|------------------|
| Réservations réseaux | À préciser | Lot GO / fluides | Plans techniques avant exécution |
| Rebouchages après passage | À préciser | Lot fluides / GO | Selon CCTP |
| Protections ouvrages existants | Tous | Chaque lot | En cours de chantier |

### Exemple de limite de prestation
Les réservations nécessaires aux passages des réseaux seront réalisées suivant les plans techniques transmis avant exécution. Les rebouchages après passage des réseaux seront à la charge du lot concerné, sauf indication contraire.`;
  }

  if (intent === "sommaire" || mode === "sommaire") {
    return `${header}## Sommaire type — CCTP ${lot}

1. **Dispositions générales**
   - Objet et périmètre des prestations
   - Documents de référence et ordre de priorité
   - Coordination avec les autres lots

2. **Prescriptions communes**
   - Conditions d'exécution des travaux
   - Protection des ouvrages existants
   - Nettoyage, évacuation des déchets

3. **Prescriptions techniques — ${lot}**
   - Matériaux et produits (marques/types à valider)
   - Mise en œuvre
   - Tolérances et contrôles

4. **Sécurité et environnement**
   - Mesures liées au chantier (à croiser avec le PPSPS)

5. **Réception et DOE**
   - Essais, vérifications, documents à fournir

### Points à valider avant diffusion
- Liste des DTU / normes applicables au lot — **Référence à vérifier avant validation contractuelle.**
- Niveau de performance attendu (classes, résistances).

### Questions pour affiner
1. Quels lots limitrophes doivent être cités dans la coordination ?
2. Disposez-vous d'un CCTP type entreprise ou d'un CCTP MOA de référence ?
3. Souhaitez-vous des articles « prestations incluses / exclues » par famille d'ouvrages ?`;
  }

  if (intent === "article") {
    return `${header}## Article CCTP — ${lot}

### Objet
Les présentes dispositions concernent les travaux de **${lot}** pour **${ouvrage}**, situé à **${lieu}**.

### Prescriptions générales
L'entreprise devra exécuter l'ensemble des prestations décrites au présent article et aux plans de détail, dans le respect des règles de l'art et des textes applicables.

Les ouvrages comprendront toutes sujétions nécessaires à une parfaite finition, y compris protections provisoires, reprises localisées et nettoyage en cours et en fin de chantier.

### Matériaux
Les matériaux seront neufs, conformes aux normes en vigueur et aux prescriptions du CCTP. Toute substitution devra faire l'objet d'un accord écrit du maître d'œuvre.

> **Donnée à compléter :** préciser les classes de performance, épaisseurs, marques de référence ou équivalences acceptées.

### Mise en œuvre
La mise en œuvre sera réalisée conformément aux prescriptions du fabricant et aux DTU applicables — **Référence à vérifier avant validation contractuelle.**

L'entreprise devra vérifier la compatibilité des supports avant toute application et signaler toute anomalie constatée.

### Contrôles
L'entreprise devra permettre les vérifications en cours d'exécution et fournir les procès-verbaux d'essais demandés.

### Questions pour affiner
1. Quelles performances minimales (résistance, classement feu, acoustique) sont exigées ?
2. Y a-t-il des contraintes d'accès, de bruit ou d'horaires à intégrer ?
3. Souhaitez-vous une liste de prestations explicitement exclues du lot ?`;
  }

  if (intent === "amelioration" || intent === "analyse") {
    const excerpt = extractedFromFiles?.trim() || request.trim();
    return `${header}## Analyse / amélioration de clause CCTP

### Texte analysé
\`\`\`
${excerpt.slice(0, 2000)}${excerpt.length > 2000 ? "\n… (tronqué)" : ""}
\`\`\`

### Manques ou points à renforcer
| Thème | Constat | Recommandation |
|-------|---------|----------------|
| Périmètre | À vérifier | Délimiter prestations incluses / exclues |
| Supports | Souvent absent | Exiger état des supports et reprises avant corps d'état |
| Contrôles | À préciser | Ajouter tolérances et PV d'essais |
| Normes | À valider | Citer DTU/normes sans numéro incertain |

### Proposition de reformulation (extrait type)
> L'entreprise devra réaliser les travaux conformément aux plans, au présent CCTP et aux règles de l'art. Les prestations incluront l'ensemble des sujétions de mise en œuvre, de protection et de nettoyage.

### Questions pour affiner
1. Pouvez-vous fournir l'article complet à retravailler ?
2. Quel lot et quelle famille d'ouvrages sont concernés ?
3. Existe-t-il des prescriptions MOA contraignantes à respecter impérativement ?`;
  }

  return `${header}## Assistance CCTP — ${ouvrage}

Votre demande a été prise en compte. Voici une orientation de travail pour **${lot}** à **${lieu}**.

### Prochaines étapes recommandées
1. **Structurer** — demander un sommaire par lot si le document n'existe pas encore.
2. **Rédiger** — article par article, avec prescriptions impératives et sujétions.
3. **Contrôler** — relecture croisée CCTP / plans / DPGF.

### Exemple de formulation type
Les prestations du présent lot incluront la fourniture, la pose et les sujétions nécessaires à une exécution conforme. L'entreprise devra signaler toute difficulté de mise en œuvre avant engagement définitif.

### Questions pour affiner
1. Souhaitez-vous un **sommaire**, un **article** ou une **analyse** d'un texte existant ?
2. Quels documents de référence sont déjà disponibles (plans, notes MOA, CCTP type) ?
3. Quel niveau de détail contractuel visez-vous (marché public, privé, sous-traitance) ?`;
}

export async function generateCctpRedaction(input: CctpGenerationInput): Promise<CctpRedactionResponseBody> {
  const mode = resolveMode(input);
  const reqText = input.refine ? input.refine.instruction.trim() : input.request.trim();
  if (!reqText) {
    throw new Error(input.refine ? "L'instruction d'affinage est obligatoire." : "La demande est obligatoire.");
  }

  if (isSkillsLlmConfigured()) {
    const messages: LlmChatMessage[] = [{ role: "system", content: buildSystemPrompt(input) }];
    if (input.refine) {
      messages.push(
        { role: "user", content: buildUserMessage({ ...input, request: input.request, refine: undefined }) },
        { role: "assistant", content: input.refine.previousMarkdown },
        {
          role: "user",
          content: `Affine le document selon cette consigne :\n\n${input.refine.instruction}\n\nConserve la structure utile. Réponds en Markdown complet.`,
        },
      );
    } else {
      messages.push({ role: "user", content: buildUserMessage(input) });
    }
    const markdown = await chatCompletion(messages);
    const insights = computeCctpAssistantInsights(input.context, {
      extractedFromFiles: input.extractedFromFiles,
      checkedDocumentIds: input.checkedDocumentIds,
      documentClassifications: input.documentClassifications,
    });
    return {
      markdown,
      usedLlm: true,
      generationMode: mode,
      refined: Boolean(input.refine),
      assistantInsights: insights,
      documentClassifications: input.documentClassifications,
    };
  }

  const insights = computeCctpAssistantInsights(input.context, {
    extractedFromFiles: input.extractedFromFiles,
    checkedDocumentIds: input.checkedDocumentIds,
    documentClassifications: input.documentClassifications,
  });
  const fallbackMd = attachInsightsToMarkdown(generateCctpFallback(input), insights, false);

  return {
    markdown: fallbackMd,
    usedLlm: false,
    generationMode: mode,
    refined: Boolean(input.refine),
    assistantInsights: insights,
    documentClassifications: input.documentClassifications,
    notice:
      "Mode assisté BeWork (sans clé OpenAI). Ajoutez OPENAI_API_KEY dans les variables d'environnement pour activer la génération IA complète.",
  };
}

/** Compatibilité appels JSON V1 */
export async function generateCctpRedactionLegacy(
  request: string,
  context: CctpProjectContext,
  normReferences?: string[],
): Promise<CctpRedactionResponseBody> {
  return generateCctpRedaction({ request, context, normReferences });
}
