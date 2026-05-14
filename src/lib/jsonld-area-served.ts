/**
 * Zones géographiques structurées (schema.org) pour JSON-LD :
 * pays francophones cibles + régions France + zones linguistiques BE/CH.
 * Pas d’adresse postale inventée : uniquement entités géographiques nommées.
 */

const FR = { "@type": "Country" as const, name: "France" };
const BE = { "@type": "Country" as const, name: "Belgique" };
const CH = { "@type": "Country" as const, name: "Suisse" };
const LU = { "@type": "Country" as const, name: "Luxembourg" };

/** Régions administratives françaises (2016) — intentions « BTP + région ». */
const FRANCE_REGION_NAMES = [
  "Auvergne-Rhône-Alpes",
  "Bourgogne-Franche-Comté",
  "Bretagne",
  "Centre-Val de Loire",
  "Corse",
  "Grand Est",
  "Hauts-de-France",
  "Île-de-France",
  "Normandie",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Pays de la Loire",
  "Provence-Alpes-Côte d'Azur",
] as const;

export function jsonLdFranceAdministrativeAreas() {
  return FRANCE_REGION_NAMES.map((name) => ({
    "@type": "AdministrativeArea" as const,
    name,
    containedInPlace: FR,
  }));
}

/** Pays desservis (signal court pour ContactPoint, etc.). */
export function jsonLdCountriesServed() {
  return [FR, BE, CH, LU];
}

/**
 * Zone d’intervention riche pour Organization / ProfessionalService :
 * pays + précision France par région + Wallonie / Suisse romande (requêtes francophones).
 */
export function jsonLdExpandedAreaServed() {
  return [
    FR,
    ...jsonLdFranceAdministrativeAreas(),
    BE,
    {
      "@type": "AdministrativeArea" as const,
      name: "Wallonie",
      containedInPlace: BE,
    },
    {
      "@type": "AdministrativeArea" as const,
      name: "Bruxelles-Capitale",
      containedInPlace: BE,
    },
    CH,
    {
      "@type": "AdministrativeArea" as const,
      name: "Suisse romande",
      containedInPlace: CH,
    },
    LU,
  ];
}
