import { cctpNormLabelsByIds } from "@/content/cctp-norm-references";
import { CCTP_REDACTION_SYSTEM_PROMPT } from "@/lib/skills/cctp-redaction-system-prompt";
import type { CctpGenerationInput, CctpProjectContext, CctpRedactionResponseBody } from "@/lib/skills/cctp-redaction-types";
import { chatCompletion, isSkillsLlmConfigured } from "@/lib/skills/llm-chat";

const DETAIL_LABELS: Record<CctpProjectContext["detailLevel"], string> = {
  synthese: "Synthèse (sommaire et grandes parties)",
  standard: "Standard (articles exploitables chantier)",
  detaille: "Détaillé (prescriptions fines, sujétions, contrôles)",
};

function buildUserMessage(input: CctpGenerationInput): string {
  const { request, context, extractedFromFiles, normReferences } = input;
  const lines = [
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

  lines.push("", "## Demande utilisateur", request.trim());
  return lines.join("\n");
}

function detectIntent(request: string): "sommaire" | "article" | "amelioration" | "analyse" | "general" {
  const t = request.toLowerCase();
  if (/(sommaire|trame|plan|structure)/.test(t)) return "sommaire";
  if (/(amélior|amelior|corriger|reformul|relecture)/.test(t)) return "amelioration";
  if (/(manque|analys|audit|vérifier|verifier|incohéren)/.test(t)) return "analyse";
  if (/(rédig|redig|article|clause|prestation)/.test(t)) return "article";
  return "general";
}

function generateCctpFallback(input: CctpGenerationInput): string {
  const { request, context, extractedFromFiles, normReferences } = input;
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

  if (intent === "sommaire") {
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
  const trimmed = input.request.trim();
  if (!trimmed) {
    throw new Error("La demande est obligatoire.");
  }

  if (isSkillsLlmConfigured()) {
    const markdown = await chatCompletion([
      { role: "system", content: CCTP_REDACTION_SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(input) },
    ]);
    return { markdown, usedLlm: true };
  }

  return {
    markdown: generateCctpFallback(input),
    usedLlm: false,
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
