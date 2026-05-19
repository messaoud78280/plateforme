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
      family: "menuiserie",
      label: "Menuiserie",
      subFamilies: [{ key: "bois-panneaux", label: "Bois et panneaux" }],
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

export function suggestTaxonomyFromText(text: string): {
  resourceType: SiteResourceType;
  family: string;
  subFamily: string | null;
} {
  const n = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");

  if (/attestation|garantie|assurance|decennale|livraison|pv\s|proces.verbal|document administratif/.test(n)) {
    return {
      resourceType: "services",
      family: "documents-administratifs-chantier",
      subFamily: /attestation|garantie|decennale|livraison/.test(n) ? "garanties-attestations" : "assurances",
    };
  }
  if (/baignoire|lavabo|wc\b|receveur|robinetterie|sanitaire|douche/.test(n)) {
    return { resourceType: "materiaux", family: "plomberie", subFamily: "appareils-sanitaires" };
  }
  if (/beton\s*c\d|beton\s*c\s*\d|c25\/30|c30\/37|mortier|sable|gravier|ciment/.test(n)) {
    return {
      resourceType: "materiaux",
      family: /mortier|ciment/.test(n) ? "maconnerie" : "terrassement",
      subFamily: /gravier/.test(n) ? "graviers" : /sable/.test(n) ? "sables" : "liants",
    };
  }
  if (/\blocation\b|\blocative\b|\blouer\b|\bla\s+journee\b|\bforfait\s+location/.test(n)) {
    if (/echafaud|echafaudage|banche|pontage|perforateur|marteau|outillage|electroportatif/.test(n)) {
      return { resourceType: "location_outillage", family: "outillage", subFamily: "electroportatif" };
    }
    return {
      resourceType: "location_engin",
      family: "engins",
      subFamily: /nacelle/.test(n) ? "nacelles" : /grue/.test(n) ? "grues" : "mini-pelles",
    };
  }
  if (/parpaing|bloc.*beton|brique/.test(n)) {
    return { resourceType: "materiaux", family: "maconnerie", subFamily: "blocs-beton" };
  }
  if (/laine.*verre|laine.*roche|isolant|polystyrene/.test(n)) {
    return { resourceType: "materiaux", family: "isolation", subFamily: "isolants-mineraux" };
  }
  if (/mini.pelle|pelle|grue|nacelle|engin|compacteur/.test(n)) {
    return { resourceType: "location_engin", family: "engins", subFamily: "mini-pelles" };
  }
  if (/echafaud|perforateur|marteau.piqueur|outillage/.test(n)) {
    return { resourceType: "location_outillage", family: "outillage", subFamily: "electroportatif" };
  }
  if (/epi|casque|gant|harnais/.test(n)) {
    return { resourceType: "equipements", family: "epi", subFamily: "epi" };
  }
  if (/placo|plaque.*platre|ba13|ba25/.test(n)) {
    return { resourceType: "materiaux", family: "platrerie", subFamily: "plaques-platre" };
  }
  if (/parpaing|agglo|bloc.*beton|bloc.*creux/.test(n)) {
    return { resourceType: "materiaux", family: "maconnerie", subFamily: "blocs-beton" };
  }
  if (/ciment|mortier|liant/.test(n)) {
    return { resourceType: "materiaux", family: "maconnerie", subFamily: "liants" };
  }
  if (/sable|gravier|granulat|0\/\d/.test(n)) {
    return { resourceType: "materiaux", family: "terrassement", subFamily: /gravier/.test(n) ? "graviers" : "sables" };
  }
  if (/gaine.*icta|gaine.*elec|icta/.test(n)) {
    return { resourceType: "materiaux", family: "electricite", subFamily: "gaines" };
  }
  if (/cable|3g\d|5g\d|ho7/.test(n)) {
    return { resourceType: "materiaux", family: "electricite", subFamily: "cables" };
  }
  if (/tube.*pvc|pvc|evacuation|pression/.test(n)) {
    return { resourceType: "materiaux", family: "plomberie", subFamily: /evacuation/.test(n) ? "evacuations" : "tubes" };
  }
  if (/laine.*verre/.test(n)) {
    return { resourceType: "materiaux", family: "isolation", subFamily: "isolants-mineraux" };
  }
  if (/laine.*roche/.test(n)) {
    return { resourceType: "materiaux", family: "isolation", subFamily: "isolants-mineraux" };
  }
  if (/peinture/.test(n)) {
    return { resourceType: "materiaux", family: "peinture", subFamily: "peintures-interieures" };
  }
  if (/colle.*carrelage|joint/.test(n)) {
    return { resourceType: "materiaux", family: "carrelage", subFamily: /joint/.test(n) ? "joints" : "colles" };
  }

  return { resourceType: "materiaux", family: "divers-materiaux", subFamily: "non-classe" };
}
