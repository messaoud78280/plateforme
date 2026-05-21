/**
 * Guide express « Établir un CCTP BTP » — source unique pour le Skill CCTP (UI + prompts).
 */

export const CCTP_DEFINITION = {
  title: "C'est quoi un CCTP ?",
  body: `Le CCTP (Cahier des Clauses Techniques Particulières) décrit précisément les travaux à réaliser sur un chantier : quoi faire, comment, avec quels matériaux, selon quelles règles, et qui fait quoi. Il vise à éviter les oublis, les malentendus, les litiges et à permettre aux entreprises de chiffrer correctement.`,
};

export const CCTP_PURPOSES = [
  "Décrire les travaux à réaliser",
  "Définir les matériaux attendus",
  "Préciser les normes et DTU applicables",
  "Fixer les règles de mise en œuvre",
  "Clarifier les limites de prestation",
  "Éviter les oublis dans les devis",
  "Comparer les offres des entreprises",
  "Réduire les litiges pendant le chantier",
  "Préparer un DPGF, un BPU, un DQE ou un devis",
] as const;

export type CctpDocumentCategory = {
  id: string;
  title: string;
  items: readonly string[];
};

export const CCTP_DOCUMENT_CATEGORIES: readonly CctpDocumentCategory[] = [
  {
    id: "base",
    title: "A. Documents de base",
    items: [
      "Plans architecte (masse, niveaux, coupes, façades, toiture)",
      "Plans techniques",
      "Photos du chantier",
      "Relevés sur site",
      "Programme du maître d'ouvrage",
      "Notice descriptive",
    ],
  },
  {
    id: "graphiques",
    title: "B. Pièces graphiques complémentaires",
    items: [
      "Carnet de détails",
      "Plans de calepinage / réservations / repérage",
      "Tableaux des surfaces, portes, fenêtres",
      "Carnets menuiseries / sanitaires",
      "Tableau des finitions",
    ],
  },
  {
    id: "diagnostics",
    title: "C. Diagnostics (rénovation)",
    items: [
      "Amiante",
      "Plomb",
      "Termites",
      "Humidité",
      "Structure",
      "Électricité / gaz",
      "Performance énergétique",
      "Réseaux existants",
    ],
  },
  {
    id: "etudes",
    title: "D. Études techniques",
    items: [
      "Étude de sol G1 / G2",
      "Structure",
      "Thermique / acoustique",
      "Incendie / accessibilité PMR",
      "Assainissement / VRD / hydraulique",
      "Environnement",
    ],
  },
  {
    id: "normes",
    title: "E. Règles techniques",
    items: [
      "DTU",
      "Normes NF",
      "Eurocodes",
      "Avis techniques / DTA CSTB",
      "Fiches fabricants / notices de pose",
      "Réglementation incendie, accessibilité, thermique",
    ],
  },
  {
    id: "financier",
    title: "F. Documents financiers",
    items: ["DPGF", "BPU", "DQE", "Devis entreprise"],
  },
  {
    id: "admin",
    title: "G. Documents administratifs du marché",
    items: [
      "CCAP",
      "RC",
      "Acte d'engagement",
      "Planning",
      "Conditions de réception",
      "Exigences DOE",
      "Assurances / sous-traitance / pénalités / variantes",
    ],
  },
];

export const CCTP_STRUCTURE_SECTIONS = [
  "Objet du lot",
  "Description générale des travaux",
  "Documents de référence",
  "Normes, DTU et règles applicables",
  "Contraintes du chantier",
  "Prescriptions générales",
  "Prescriptions techniques",
  "Description détaillée des ouvrages",
  "Matériaux et produits",
  "Mode de mise en œuvre",
  "Contrôles et essais",
  "Protections et nettoyage",
  "Limites de prestation",
  "Documents à remettre en fin de chantier",
] as const;

/** Structure standardisée par ouvrage / article (Skill CCTP v2). */
export const CCTP_OUVRAGE_TEMPLATE_FIELDS = [
  "Objet des travaux",
  "Prestations comprises",
  "Prestations exclues",
  "Matériaux",
  "Mise en œuvre",
  "Références DTU et normes",
  "Prescriptions techniques",
  "Tolérances",
  "Réservations",
  "Interfaces inter-lots",
  "Points de contrôle",
  "Nettoyage chantier",
  "Essais et validations",
  "DOE et documents finaux",
] as const;

/** Champs enrichis pour fiches ouvrages connectables bibliothèque / DPGF. */
export const CCTP_OUVRAGE_EXTENDED_FIELDS = [
  ...CCTP_OUVRAGE_TEMPLATE_FIELDS,
  "Localisation sur plans",
  "Variantes acceptées",
  "Limites de prestation",
  "Contraintes de mise en œuvre",
  "Contrôles avant réception",
] as const;

export const CCTP_SIX_STEPS = [
  { step: 1, title: "Comprendre le besoin du client", detail: "Type de projet, usage, finition, contraintes, délais, attentes techniques." },
  { step: 2, title: "Rassembler les documents", detail: "Plans, photos, diagnostics, études, notice, tableaux, DPGF/BPU/DQE, pièces marché." },
  { step: 3, title: "Lister les lots", detail: "Découpage par corps d'état (GO, charpente, CVC, électricité, finitions…)." },
  { step: 4, title: "Repérer les ouvrages", detail: "Pour chaque lot : fondations, murs, réservations, finitions, etc." },
  { step: 5, title: "Décrire chaque ouvrage", detail: "Quoi, où, matériaux, règles, compris / exclu, points à vérifier." },
  { step: 6, title: "Vérifier la cohérence", detail: "Plans, DPGF, devis, études, diagnostics, limites de prestation." },
] as const;

export const CCTP_FINAL_CHECKLIST = [
  "Les plans sont-ils à jour ?",
  "Les diagnostics sont-ils pris en compte (rénovation) ?",
  "Les études techniques sont-elles intégrées ?",
  "Les normes et DTU sont-ils mentionnés (sans inventer de numéros) ?",
  "Chaque ouvrage est-il localisé et clairement décrit ?",
  "Les matériaux et performances sont-ils assez précis ?",
  "Les limites de prestation sont-elles claires (qui fait quoi) ?",
  "Les interfaces entre lots sont-elles traitées ?",
  "Le CCTP est-il cohérent avec le DPGF / BPU / devis ?",
  "Les variantes et documents DOE sont-ils identifiés ?",
  "Les contraintes chantier sont-elles décrites ?",
] as const;

export const CCTP_COMMON_ERRORS = [
  {
    title: "Être trop vague",
    bad: "Pose de carrelage.",
    good: "Fourniture et pose de carrelage grès cérame 60×60 cm, pose collée sur support préparé, compris colle, joints, coupes, plinthes si prévues aux plans et toutes sujétions.",
  },
  { title: "Oublier les limites de prestation", bad: "Ne pas préciser percements, réservations, rebouchages, protections, déchets.", good: "Matrice lot / prestation / responsable." },
  { title: "Oublier un ouvrage dans le DPGF", bad: "CCTP décrit un seuil béton absent du DPGF.", good: "Croiser chaque ouvrage avec une ligne de prix." },
  { title: "Ignorer les diagnostics", bad: "Rénovation sans amiante / plomb / humidité.", good: "Intégrer contraintes des rapports." },
  { title: "Mélanger les lots", bad: "Qui rebouche après passage plomberie ?", good: "Interfaces explicites entre lots." },
] as const;

export const CCTP_NORMS_STANDARD_PHRASE =
  "Les travaux seront exécutés conformément aux DTU, normes NF, règles professionnelles, avis techniques et prescriptions fabricants en vigueur à la date de signature du marché.";

export const CCTP_OUVRAGE_EXAMPLE = {
  title: "Mur en blocs béton creux de 20 cm",
  localization: "Murs périphériques suivant plans architecte et plans structure.",
  description:
    "Fourniture et mise en œuvre de blocs béton creux de 20 cm d'épaisseur, hourdés au mortier de ciment, compris coupes, réglages, joints, réservations, chaînages, linteaux et toutes sujétions nécessaires à la parfaite exécution de l'ouvrage.",
  materials: "Blocs béton creux conformes aux normes applicables, classe de résistance adaptée.",
  miseEnOeuvre: "Pose à joints réguliers, respect des aplombs, niveaux et alignements. Exécution suivant plans et prescriptions techniques.",
  compris: ["Fourniture des blocs", "Mortier", "Pose", "Coupes", "Réglages", "Réservations", "Nettoyage de la zone"],
  aVerifier: ["Classe de résistance des blocs", "Chaînages", "Linteaux", "Réservations réseaux", "Prescriptions étude structure"],
};

/** Modèle vide à coller dans la demande (mode fiche ouvrage). */
export function formatOuvrageTemplateMarkdown(): string {
  return CCTP_OUVRAGE_TEMPLATE_FIELDS.map((f) => `### ${f}\n…`).join("\n\n");
}

/** Liste des pièces cochées (ids checklist « catégorie:libellé »). */
export function formatCheckedDocumentsForPrompt(checkedIds: readonly string[]): string {
  if (!checkedIds.length) return "";
  const byCat = new Map<string, string[]>();
  for (const id of checkedIds) {
    const [catId, ...rest] = id.split(":");
    const label = rest.join(":");
    const cat = CCTP_DOCUMENT_CATEGORIES.find((c) => c.id === catId);
    const title = cat?.title ?? catId;
    const list = byCat.get(title) ?? [];
    list.push(label);
    byCat.set(title, list);
  }
  const lines: string[] = ["Pièces déjà en possession (checklist utilisateur) :"];
  for (const [title, items] of byCat) {
    lines.push(`- ${title} : ${items.join(" ; ")}`);
  }
  return lines.join("\n");
}

/** Bloc condensé injecté dans le prompt système (≤ contexte raisonnable). */
export function getCctpMethodologySystemPromptBlock(): string {
  return `
## Méthodologie BeWork — Assistant travaux CCTP (référence obligatoire)

Tu es un **assistant métier chantier**, pas un générateur de texte générique. Ton : conducteur de travaux, économiste, rédacteur CCTP — professionnel, terrain, crédible.

Un bon CCTP est **clair, précis, cohérent avec les plans**, **chiffrable** et **exécutable**.

### Langage chantier (obligatoire)
- Dire : « L'entreprise devra… », « Les ouvrages comprendront… », « À valider avec le MOE avant exécution ».
- Éviter : « Veuillez saisir », « En tant qu'IA », formulations startup.
- Préférer : « Précisez les réservations, interfaces techniques et contraintes chantier. »

### Pédagogie intégrée
Pour les points sensibles, ajouter brièvement :
- **Pourquoi cette information ?** (impact chiffrage / exécution)
- **Risque chantier** si oubli
- **Erreur fréquente** terrain

### Vigilance technique
Quand l'analyse métier BeWork est fournie, reprendre en tête de réponse :
- Niveau de vigilance (faible / moyen / élevé / critique)
- Alertes documentaires et interfaces inter-lots
Puis produire le livrable demandé.

### Chaîne documentaire
Besoin client → Plans + études + diagnostics → Description des ouvrages → Normes/DTU → Limites de prestation → CCTP final.

### Structure type d'un lot CCTP
${CCTP_STRUCTURE_SECTIONS.map((s, i) => `${i + 1}. ${s}`).join("\n")}

### Fiche ouvrage / article — rubriques obligatoires
${CCTP_OUVRAGE_TEMPLATE_FIELDS.map((f) => `- ${f}`).join("\n")}

Chaque fiche peut aussi mentionner : localisation plans, variantes, limites de prestation, contrôles avant réception (connexion future bibliothèque BeWork / DPGF / DCE).

### Limites de prestation (indispensables)
Préciser : compris / non compris / autre lot / réservations / rebouchages / protections / nettoyage / documents techniques.

### Phrase type normes (sans recopier les DTU)
« ${CCTP_NORMS_STANDARD_PHRASE} »

### Méthode en 6 étapes
${CCTP_SIX_STEPS.map((s) => `${s.step}. ${s.title} — ${s.detail}`).join("\n")}

### Erreurs à éviter
- Descriptions vagues (« pose de carrelage » sans format, support, sujétions).
- Ouvrage au CCTP absent du DPGF/devis.
- Diagnostics rénovation ignorés.
- Interfaces entre lots floues.
- Confondre « jointifs » bois et « joints » de carrelage.

### Question finale avant validation
« L'entreprise peut-elle comprendre, chiffrer et exécuter correctement les travaux avec ce document ? »`;
}
