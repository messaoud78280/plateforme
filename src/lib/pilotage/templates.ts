/**
 * Modèle « Gros œuvre » — propositions modifiables, à valider par l’utilisateur.
 * Ne crée pas d’obligations contractuelles confirmées sans validation humaine.
 */

export type TemplateObligation = {
  title: string;
  description: string;
  category: string;
  priority: string;
  expectedPiece?: string;
};

export type TemplateRequiredDoc = {
  name: string;
  category: string;
  isMandatory: boolean;
};

export type TemplateDoeItem = {
  title: string;
  category: string;
  isMandatory: boolean;
};

export type TemplateAction = {
  title: string;
  category: string;
  priority: string;
  description?: string;
};

export type PilotageTemplate = {
  id: string;
  label: string;
  lot: string;
  obligations: TemplateObligation[];
  requiredDocuments: TemplateRequiredDoc[];
  doeItems: TemplateDoeItem[];
  actions: TemplateAction[];
  plans: { reference: string; title: string; planType: string }[];
};

export const TEMPLATE_GROS_OEUVRE: PilotageTemplate = {
  id: "gros-oeuvre",
  label: "Gros œuvre",
  lot: "Gros œuvre",
  obligations: [
    {
      title: "Remise du PPSPS avant démarrage",
      description: "Transmettre le PPSPS au coordonnateur SPS et obtenir l’avis avant intervention.",
      category: "Sécurité",
      priority: "Critique",
      expectedPiece: "PPSPS",
    },
    {
      title: "Notification du marché archivée",
      description: "Conserver la notification / OS de démarrage dans le dossier marché.",
      category: "Administratif",
      priority: "Haute",
      expectedPiece: "Notification / OS",
    },
  ],
  requiredDocuments: [
    { name: "Notification du marché", category: "Administratif", isMandatory: true },
    { name: "Ordre de service de démarrage", category: "Administratif", isMandatory: true },
    { name: "PPSPS", category: "Sécurité", isMandatory: true },
    { name: "Plan d’installation de chantier", category: "Méthodes", isMandatory: true },
    { name: "Planning d’exécution", category: "Études", isMandatory: true },
    { name: "Attestations d’assurance", category: "Administratif", isMandatory: true },
  ],
  doeItems: [
    { title: "Plans de recollement", category: "Plans de recollement", isMandatory: true },
    { title: "Plans d’exécution visés", category: "Plans d’exécution validés", isMandatory: true },
    { title: "Fiches techniques béton", category: "Fiches techniques", isMandatory: true },
    { title: "PV d’essais béton", category: "PV d’essais", isMandatory: true },
    { title: "Bons de livraison béton", category: "Documents fournisseurs", isMandatory: false },
    { title: "Attestations sous-traitants", category: "Documents sous-traitants", isMandatory: true },
  ],
  actions: [
    {
      title: "Collecter les pièces marché manquantes",
      category: "Document",
      priority: "Haute",
      description: "Vérifier AE, CCAP, CCTP, DPGF et OS de démarrage.",
    },
    {
      title: "Mettre à jour le planning d’exécution",
      category: "Obligation",
      priority: "Normale",
    },
    {
      title: "Préparer la 1re situation de travaux",
      category: "Situation",
      priority: "Normale",
    },
  ],
  plans: [
    { reference: "FON-01", title: "Plans de fondation", planType: "Fondations" },
    { reference: "COF-01", title: "Plans de coffrage", planType: "Coffrage" },
    { reference: "FER-01", title: "Plans de ferraillage", planType: "Ferraillage" },
  ],
};

export const PILOTAGE_TEMPLATES: PilotageTemplate[] = [TEMPLATE_GROS_OEUVRE];

export function getTemplateById(id: string): PilotageTemplate | undefined {
  return PILOTAGE_TEMPLATES.find((t) => t.id === id);
}
