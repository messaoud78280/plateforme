/**
 * Identité juridique et certification Qualiopi — source unique.
 * BeWork = marque commerciale. Titulaire = OFC Création d'entreprise.
 * Ne jamais attribuer Qualiopi à BeWork isolément.
 */

export const FORMATION_LEGAL_ENTITY = {
  brand: "BeWork",
  legalName: "OFC Création d'entreprise",
  legalNameDisplay: "OFC Création d'entreprise",
  legalForm: "SASU",
  siren: "905 244 281",
  siret: "905 244 281 00010",
  nda: "11788515078",
  ndaRegion: "Île-de-France",
  ndaDisclaimer: "Cet enregistrement ne vaut pas agrément de l’État.",
  addressLine: "6 rue Henri Dunant",
  postalCity: "78280 Guyancourt",
  country: "France",
  vatNote: "Exonéré de TVA — art. 261-4-4°-a du CGI",
  pedagogicalLead: "Laure OLIVIÉ",
  contactEmail: "laureolivie@yahoo.fr",
  contactPhone: "06 95 66 18 18",
  publicEmail: "contact@bework.fr",
  schedule: "9h00–12h30 / 13h30–17h00",
} as const;

export const QUALIOPI_CERTIFICATION = {
  certificateNumber: "520911-1",
  certificator: "CERTIFOPAC",
  categoryCode: "L.6313-1 – 1°",
  categoryLabel: "ACTIONS DE FORMATION",
  categoryMention:
    "La certification qualité a été délivrée au titre de la catégorie d’action suivante : ACTIONS DE FORMATION.",
  validFrom: "2025-01-16",
  validFromLabel: "16 janvier 2025",
  validTo: "2028-01-15",
  validToLabel: "15 janvier 2028",
  surveillanceNote:
    "Validité sous réserve de la surveillance du cycle de certification.",
  certificatePdfHref: "/documents/certificat-qualiopi-ofc.pdf",
  certificatePdfLabel: "Télécharger le certificat Qualiopi d’OFC Création d’entreprise",
  /**
   * Fichier officiel du kit CERTIFOPAC / ministère.
   * À déposer manuellement : public/branding/qualiopi-actions-formation.png (ou .svg).
   * Tant qu’absent, l’UI utilise une signature textuelle conforme (sans faux logo).
   */
  logoHref: "/branding/qualiopi-actions-formation.png",
  logoAlt:
    "Qualiopi — processus certifié — République Française. Certification qualité des prestataires d’actions de formation",
} as const;

/** Formulations autorisées — ne pas paraphraser en attribuant Qualiopi à BeWork seul. */
export const QUALIOPI_COPY = {
  primary:
    "BeWork est une marque d’OFC Création d’entreprise, organisme de formation certifié Qualiopi au titre des actions de formation.",
  short:
    "Formations proposées par OFC Création d’entreprise, organisme certifié Qualiopi.",
  shortWithCategory:
    "Formations proposées par OFC Création d’entreprise, organisme certifié Qualiopi au titre des actions de formation.",
  learnMoreLabel: "En savoir plus sur notre organisme de formation",
  learnMoreHref: "/organisme-formation",
  whatIs:
    "Qualiopi est une certification qualité qui porte sur les processus mis en œuvre par les prestataires d’actions concourant au développement des compétences. Elle concerne l’organisation et la qualité des processus de formation — pas une certification des stagiaires, ni un diplôme, ni un agrément de l’État, ni une garantie de financement ou d’emploi.",
} as const;

export const QUALIOPI_ENGAGEMENTS = [
  {
    number: "01",
    title: "Apprendre en pratiquant",
    text: "Une pédagogie active construite autour de réalisations concrètes.",
  },
  {
    number: "02",
    title: "Un accompagnement personnalisé",
    text: "Des groupes limités à 6 à 8 participants pour faciliter les échanges et la pratique.",
  },
  {
    number: "03",
    title: "Une progression évaluée",
    text: "Des objectifs pédagogiques identifiés et une évaluation des acquis.",
  },
  {
    number: "04",
    title: "Des ressources pour continuer",
    text: "Un espace pédagogique personnel et des supports permettant de poursuivre son apprentissage.",
  },
] as const;

/** Alias rétrocompatibles pour les imports existants. */
export const FORMATION_ORGANISM = {
  brand: FORMATION_LEGAL_ENTITY.brand,
  legalName: `${FORMATION_LEGAL_ENTITY.legalName} — ${FORMATION_LEGAL_ENTITY.legalForm}`,
  relation: "BeWork est une marque d’OFC Création d’entreprise.",
  siret: FORMATION_LEGAL_ENTITY.siret,
  nda: FORMATION_LEGAL_ENTITY.nda,
  region: FORMATION_LEGAL_ENTITY.ndaRegion,
  vatNote: FORMATION_LEGAL_ENTITY.vatNote,
  ndaDisclaimer: FORMATION_LEGAL_ENTITY.ndaDisclaimer,
  qualiopi: "Organisme certifié Qualiopi — Actions de formation",
  pedagogicalLead: FORMATION_LEGAL_ENTITY.pedagogicalLead,
  contactEmail: FORMATION_LEGAL_ENTITY.contactEmail,
  contactPhone: FORMATION_LEGAL_ENTITY.contactPhone,
  schedule: FORMATION_LEGAL_ENTITY.schedule,
} as const;
