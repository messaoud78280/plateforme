import type { SiteResourceType } from "@prisma/client";

export type ChantierResourceTaxonomyNode = {
  family: string;
  label: string;
  subFamilies: { key: string; label: string }[];
};

export const CHANTIER_RESOURCE_TYPE_LABELS: Record<SiteResourceType, string> = {
  materiaux: "Matériaux",
  consommables: "Consommables",
  location_engin: "Locations engins",
  location_outillage: "Locations outillage",
  equipements: "Équipements",
  services: "Services",
};

export const CHANTIER_RESOURCE_TAXONOMY: Record<SiteResourceType, ChantierResourceTaxonomyNode[]> = {
  materiaux: [
    {
      family: "maconnerie",
      label: "Maçonnerie",
      subFamilies: [
        { key: "blocs-beton", label: "Blocs béton" },
        { key: "liants", label: "Liants" },
        { key: "mortiers", label: "Mortiers" },
        { key: "granulats", label: "Granulats" },
      ],
    },
    {
      family: "beton",
      label: "Béton",
      subFamilies: [
        { key: "beton-pret", label: "Béton prêt à l’emploi" },
        { key: "adjuvants", label: "Adjuvants" },
      ],
    },
    {
      family: "terrassement",
      label: "Terrassement",
      subFamilies: [
        { key: "sables", label: "Sables" },
        { key: "graviers", label: "Graviers" },
      ],
    },
    {
      family: "platrerie",
      label: "Plâtrerie",
      subFamilies: [
        { key: "plaques-platre", label: "Plaques de plâtre" },
        { key: "rails", label: "Rails" },
        { key: "montants", label: "Montants" },
        { key: "bandes", label: "Bandes" },
        { key: "enduits", label: "Enduits" },
      ],
    },
    {
      family: "isolation",
      label: "Isolation",
      subFamilies: [
        { key: "isolants-mineraux", label: "Isolants minéraux" },
        { key: "isolants-synthetiques", label: "Isolants synthétiques" },
      ],
    },
    {
      family: "electricite",
      label: "Électricité",
      subFamilies: [
        { key: "gaines", label: "Gaines" },
        { key: "cables", label: "Câbles" },
        { key: "appareillages", label: "Appareillages" },
      ],
    },
    {
      family: "plomberie",
      label: "Plomberie",
      subFamilies: [
        { key: "tubes", label: "Tubes" },
        { key: "raccords", label: "Raccords" },
        { key: "evacuations", label: "Évacuations" },
        { key: "appareils-sanitaires", label: "Appareils sanitaires" },
      ],
    },
    {
      family: "peinture",
      label: "Peinture",
      subFamilies: [{ key: "peintures-interieures", label: "Peintures intérieures" }],
    },
    {
      family: "carrelage",
      label: "Carrelage",
      subFamilies: [
        { key: "colles", label: "Colles carrelage" },
        { key: "joints", label: "Joints" },
      ],
    },
    {
      family: "etancheite",
      label: "Étanchéité",
      subFamilies: [{ key: "membranes", label: "Membranes" }],
    },
    {
      family: "couverture",
      label: "Couverture",
      subFamilies: [{ key: "elements-couverture", label: "Éléments de couverture" }],
    },
    {
      family: "amenagements-exterieurs",
      label: "Aménagements extérieurs",
      subFamilies: [
        { key: "clotures-portails", label: "Clôtures et portails" },
        { key: "vrd", label: "VRD et extérieurs" },
      ],
    },
    {
      family: "menuiserie",
      label: "Menuiserie",
      subFamilies: [
        { key: "fenetres-portes", label: "Fenêtres et portes" },
        { key: "bois-panneaux", label: "Bois et panneaux" },
      ],
    },
    {
      family: "charpente",
      label: "Charpente",
      subFamilies: [{ key: "ossature-bois", label: "Ossature bois" }],
    },
    {
      family: "metallerie",
      label: "Métallerie",
      subFamilies: [{ key: "acier", label: "Acier et ouvrages métalliques" }],
    },
    {
      family: "divers-materiaux",
      label: "Divers matériaux",
      subFamilies: [{ key: "non-classe", label: "Non classé" }],
    },
  ],
  consommables: [
    {
      family: "consommables-chantier",
      label: "Consommables chantier",
      subFamilies: [
        { key: "fixations", label: "Fixations" },
        { key: "colles-mastics", label: "Colles et mastics" },
        { key: "protection", label: "Protection et films" },
      ],
    },
  ],
  location_engin: [
    {
      family: "engins",
      label: "Engins",
      subFamilies: [
        { key: "mini-pelles", label: "Mini-pelles" },
        { key: "nacelles", label: "Nacelles" },
        { key: "grues", label: "Grues" },
        { key: "compacteurs", label: "Compacteurs" },
      ],
    },
  ],
  location_outillage: [
    {
      family: "outillage",
      label: "Outillage",
      subFamilies: [
        { key: "electroportatif", label: "Électroportatif" },
        { key: "echafaudages", label: "Échafaudages" },
      ],
    },
  ],
  equipements: [
    {
      family: "epi",
      label: "EPI / sécurité",
      subFamilies: [{ key: "epi", label: "EPI" }],
    },
  ],
  services: [
    {
      family: "prestations",
      label: "Prestations",
      subFamilies: [{ key: "services", label: "Services" }],
    },
    {
      family: "documents-administratifs-chantier",
      label: "Documents administratifs chantier",
      subFamilies: [
        { key: "garanties-attestations", label: "Garanties et attestations" },
        { key: "assurances", label: "Assurances" },
      ],
    },
  ],
};

export function getFamilyLabel(type: SiteResourceType, familyKey: string): string {
  const node = CHANTIER_RESOURCE_TAXONOMY[type]?.find((f) => f.family === familyKey);
  return node?.label ?? familyKey;
}

export function getSubFamilyLabel(type: SiteResourceType, familyKey: string, subKey: string | null | undefined): string {
  if (!subKey) return "—";
  const node = CHANTIER_RESOURCE_TAXONOMY[type]?.find((f) => f.family === familyKey);
  return node?.subFamilies.find((s) => s.key === subKey)?.label ?? subKey;
}

export type ChantierResourceTaxonomySuggestion = {
  resourceType: SiteResourceType;
  family: string;
  subFamily: string | null;
};

/** Normalise le libellé pour les règles métier (sans accents, espaces unifiés). */
export function normalizeTaxonomyText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

/** Joint de carrelage — exclut « jointifs », lisses jointives, panneaux bois, etc. */
function isCarrelageJointContext(n: string): boolean {
  if (/jointifs|jointif\b|jointives|panneau.x\s+jointifs|lisse.x\s+jointive|joint de dilatation structure/.test(n)) {
    return false;
  }
  if (/joints?\s+(de\s+)?(carrelage|faience|mosaique)|mortier\s+de\s+joint|joint\s+(epoxy|souple|carrelage)/.test(n)) {
    return true;
  }
  if (/\bjoint\b/.test(n) && /carrelage|faience|mosaique|colle/.test(n)) return true;
  return false;
}

function isExteriorEnvelope(n: string): boolean {
  return /portail|portillon|porte\s+coulissante|porte\s+sectionnelle|grillage|cloture|palissade|occultant|claustra|panneau.x\s+de\s+chataignier|haie\s+artificielle/.test(
    n,
  );
}

export function suggestTaxonomyFromText(text: string): ChantierResourceTaxonomySuggestion {
  const n = normalizeTaxonomyText(text);

  if (
    /attestation|document administratif|frais contractuel|dommage.ouvrage|retenue de garantie|caution bancaire/.test(n) ||
    (/assurance chantier|garantie decennale|garantie de livraison/.test(n) &&
      !/portail|portillon|beton|maconnerie|fourniture|pose de|carrelage|plomberie|electricite|cloture/.test(n))
  ) {
    return {
      resourceType: "services",
      family: "documents-administratifs-chantier",
      subFamily: /attestation|garantie|decennale|livraison/.test(n) ? "garanties-attestations" : "assurances",
    };
  }

  if (isExteriorEnvelope(n)) {
    return { resourceType: "materiaux", family: "amenagements-exterieurs", subFamily: "clotures-portails" };
  }

  if (/\blocation\b|\blocative\b|\blouer\b|\bla\s+journee\b|\bforfait\s+location/.test(n)) {
    if (/echafaud|echafaudage|banche|pontage|perforateur|marteau|outillage|electroportatif/.test(n)) {
      return { resourceType: "location_outillage", family: "outillage", subFamily: "electroportatif" };
    }
    if (/nacelle|grue|mini.pelle|pelle|engin|compacteur|chargeuse/.test(n)) {
      return {
        resourceType: "location_engin",
        family: "engins",
        subFamily: /nacelle/.test(n) ? "nacelles" : /grue/.test(n) ? "grues" : "mini-pelles",
      };
    }
  }

  if (/baignoire|lavabo|wc\b|receveur|robinetterie|sanitaire|douche|ballon\s+ecs|chauffe.eau/.test(n)) {
    return { resourceType: "materiaux", family: "plomberie", subFamily: "appareils-sanitaires" };
  }

  if (/beton\s*c\d|beton\s*c\s*\d|c25\/30|c30\/37|beton\s+pret/.test(n)) {
    return { resourceType: "materiaux", family: "beton", subFamily: "beton-pret" };
  }

  if (/tuile|ardoise|zinc|couverture|liteau|volige|egout|cheneau/.test(n) && !/carrelage|faience/.test(n)) {
    return { resourceType: "materiaux", family: "couverture", subFamily: "elements-couverture" };
  }

  if (/membrane\s+etanche|etancheite\s+toiture|bache\s+etanche/.test(n)) {
    return { resourceType: "materiaux", family: "etancheite", subFamily: "membranes" };
  }

  if (/charpente|fermette|solive|poutre\s+bois|ossature\s+bois/.test(n)) {
    return { resourceType: "materiaux", family: "charpente", subFamily: "ossature-bois" };
  }

  if (/garde.corps|acier|metallique|heb|ipn|tube\s+metallique|bardage\s+metallique/.test(n)) {
    return { resourceType: "materiaux", family: "metallerie", subFamily: "acier" };
  }

  if (/parpaing|agglo|bloc\s+creux|bloc\s+beton|brique\s+(creuse|pleine)/.test(n)) {
    return { resourceType: "materiaux", family: "maconnerie", subFamily: "blocs-beton" };
  }

  if (/ciment|mortier\s+(sec|de\s+joint|colle)|liant/.test(n) && !/carrelage|faience/.test(n)) {
    return {
      resourceType: "materiaux",
      family: "maconnerie",
      subFamily: /mortier/.test(n) ? "mortiers" : "liants",
    };
  }

  if (/sable|gravier|granulat|0\/\d|grave|tout.venant/.test(n)) {
    return { resourceType: "materiaux", family: "terrassement", subFamily: /gravier|grave/.test(n) ? "graviers" : "sables" };
  }

  if (/laine\s+de\s+verre|laine\s+de\s+roche|isolant|polystyrene|polyurethane|pir\b|xps\b/.test(n)) {
    return {
      resourceType: "materiaux",
      family: "isolation",
      subFamily: /polystyrene|polyurethane|pir|xps/.test(n) ? "isolants-synthetiques" : "isolants-mineraux",
    };
  }

  if (/placo|plaque\s+de\s+platre|ba13|ba25|cloison\s+placo/.test(n)) {
    return { resourceType: "materiaux", family: "platrerie", subFamily: "plaques-platre" };
  }

  if (/gaine\s+icta|gaine\s+elec|icta|goulotte/.test(n)) {
    return { resourceType: "materiaux", family: "electricite", subFamily: "gaines" };
  }

  if (/cable|3g\d|5g\d|ho7|gaine\s+ird/.test(n)) {
    return { resourceType: "materiaux", family: "electricite", subFamily: "cables" };
  }

  if (/interrupteur|prise\s+elec|tableau\s+elec|disjoncteur/.test(n)) {
    return { resourceType: "materiaux", family: "electricite", subFamily: "appareillages" };
  }

  if (/tube\s+per|per\b|multicouche|evacuation|wc\s+suspendu|groupe\s+securite/.test(n)) {
    return {
      resourceType: "materiaux",
      family: "plomberie",
      subFamily: /evacuation|wc\s+suspendu/.test(n) ? "evacuations" : "tubes",
    };
  }

  if (/fenetre|porte\s+d[' ]?entree|menuiserie\s+(pvc|alu|bois)|volet|baie\s+coulissante/.test(n)) {
    return { resourceType: "materiaux", family: "menuiserie", subFamily: "fenetres-portes" };
  }

  if (/bois\s+massif|panneau\s+(contreplaque|osb|ctbx)|lambourde|liteau/.test(n)) {
    return { resourceType: "materiaux", family: "menuiserie", subFamily: "bois-panneaux" };
  }

  if (isCarrelageJointContext(n)) {
    return { resourceType: "materiaux", family: "carrelage", subFamily: "joints" };
  }

  if (/colle\s+carrelage|carrelage|faience|mosaique|gres\s+cerame|margelle|dallage/.test(n)) {
    return {
      resourceType: "materiaux",
      family: "carrelage",
      subFamily: /colle/.test(n) ? "colles" : null,
    };
  }

  if (/peinture|enduit\s+facade|ravalement|lasure/.test(n)) {
    return { resourceType: "materiaux", family: "peinture", subFamily: "peintures-interieures" };
  }

  if (/vis\b|cheville|boulon|agrafe|fixation|bande\s+joint/.test(n)) {
    return { resourceType: "consommables", family: "consommables-chantier", subFamily: "fixations" };
  }

  if (/mastic|colle\s+(ms|polyurethane)|silicone/.test(n)) {
    return { resourceType: "consommables", family: "consommables-chantier", subFamily: "colles-mastics" };
  }

  if (/bache|film\s+polyane|protection\s+chantier/.test(n)) {
    return { resourceType: "consommables", family: "consommables-chantier", subFamily: "protection" };
  }

  if (/mini.pelle|pelle|grue|nacelle|engin|compacteur/.test(n)) {
    return {
      resourceType: "location_engin",
      family: "engins",
      subFamily: /nacelle/.test(n) ? "nacelles" : /grue/.test(n) ? "grues" : "mini-pelles",
    };
  }

  if (/echafaud|perforateur|marteau.piqueur|outillage|banche/.test(n)) {
    return { resourceType: "location_outillage", family: "outillage", subFamily: /echafaud/.test(n) ? "echafaudages" : "electroportatif" };
  }

  if (/epi|casque|gant|harnais|lunette|botte\s+securite/.test(n)) {
    return { resourceType: "equipements", family: "epi", subFamily: "epi" };
  }

  if (/prestation|main.d.oeuvre|etude\s+technique|coordination\s+sps/.test(n)) {
    return { resourceType: "services", family: "prestations", subFamily: "services" };
  }

  return { resourceType: "materiaux", family: "divers-materiaux", subFamily: "non-classe" };
}
