/**
 * Fixture générique — métier « peinture intérieure » sans cas hardcodé.
 * Prouve que le moteur fonctionne par structure, pas par mots-clés.
 */
export const GENERIC_PAINT_TECHNICAL_BUNDLE = {
  format: "bework_technical_bundle_v1",
  schema_version: "1.0",
  bundle_id: "tech-generic-peinture-demo-001",
  source_revision: 1,
  mode: "professional",
  meta: {
    language: "fr",
    title: "Peinture intérieure — pièce témoin",
    generator: "fixture",
  },
  project: {
    title: "Appartement témoin — peinture",
    address: "12 rue des Lilas, 75011 Paris",
    trade_hints: ["peinture"],
  },
  sources: [
    {
      id: "SRC-NOTE",
      type: "client_statement",
      label: "Descriptif client",
    },
  ],
  assumptions: [
    {
      id: "H-01",
      text: "Deux couches de peinture acrylique mates sur supports sains",
      status: "open",
    },
  ],
  unknowns: [
    {
      id: "U-01",
      text: "État réel des supports (reprise enduit) non constaté",
      blocks: ["takeoff"],
    },
  ],
  lots: [{ code: "PEI", label: "Peinture intérieure" }],
  takeoff: {
    parameters: [
      {
        key: "salon.longueur",
        label: "Longueur salon",
        unit: "m",
        value: 5.2,
        provenance: {
          source: "client_statement",
          confidence: "to_confirm",
          classification: "DECLARED",
        },
      },
      {
        key: "salon.largeur",
        label: "Largeur salon",
        unit: "m",
        value: 3.8,
        provenance: {
          source: "client_statement",
          confidence: "to_confirm",
          classification: "DECLARED",
        },
      },
      {
        key: "salon.hauteur",
        label: "Hauteur sous plafond",
        unit: "m",
        value: 2.5,
        provenance: {
          source: "assumption",
          confidence: "to_confirm",
          classification: "ASSUMED",
        },
      },
    ],
    items: [
      {
        code: "PEI-01",
        lot: "PEI",
        designation: "Peinture murs salon",
        unit: "m2",
        formula: "2 * (salon.longueur + salon.largeur) * salon.hauteur",
        quantities: { technical: null, quote: null },
        provenance: {
          source: "calculation",
          confidence: "to_confirm",
          classification: "CALCULATED",
        },
        to_confirm: ["Hauteur sous plafond à vérifier sur place"],
        assumptions: ["H-01"],
      },
      {
        code: "PEI-02",
        lot: "PEI",
        designation: "Peinture plafond salon",
        unit: "m2",
        formula: "salon.longueur * salon.largeur",
        provenance: {
          source: "calculation",
          confidence: "to_confirm",
          classification: "CALCULATED",
        },
      },
    ],
  },
  workflow: {
    steps: [
      {
        id: "P01",
        order: 1,
        name: "Protection et préparation",
        kind: "work",
        lot: "PEI",
        takeoff_ids: ["PEI-01"],
        duration: { mode: "fixed", days: 0.5, calendar: "working" },
      },
      {
        id: "P02",
        order: 2,
        name: "Application peinture murs",
        kind: "work",
        lot: "PEI",
        takeoff_ids: ["PEI-01"],
        duration: { mode: "fixed", days: 1, calendar: "working" },
      },
      {
        id: "P03",
        order: 3,
        name: "Application peinture plafond",
        kind: "work",
        lot: "PEI",
        takeoff_ids: ["PEI-02"],
        duration: { mode: "fixed", days: 0.5, calendar: "working" },
      },
    ],
  },
  schedule: {
    tasks: [
      { step_id: "P01", depends_on: [] },
      {
        step_id: "P02",
        depends_on: [{ step_id: "P01", type: "FS", lag_days: 0 }],
      },
      {
        step_id: "P03",
        depends_on: [{ step_id: "P02", type: "FS", lag_days: 0 }],
      },
    ],
  },
  planning_settings: {
    start_date: null,
    desired_start_period: null,
    working_days: ["MON", "TUE", "WED", "THU", "FRI"],
    calendar: "FR",
  },
  quote_transfer: { create_quote: false },
  warnings: ["Hauteur sous plafond hypothétique"],
} as const;

/** Fixture MOREL terrassement — hypothèses fouilles clairement marquées. */
export const MOREL_TERRASSEMENT_TECHNICAL_BUNDLE = {
  format: "bework_technical_bundle_v1",
  schema_version: "1.0",
  bundle_id: "tech-morel-terrassement-001",
  source_revision: 1,
  mode: "professional",
  meta: {
    title: "Terrassement maison R+1 — MOREL",
    language: "fr",
  },
  project: {
    title: "Construction maison individuelle R+1 — MOREL",
    address: "3 rue de la Liberté, 78280 Guyancourt",
    trade_hints: ["terrassement"],
  },
  sources: [
    { id: "SRC-VISIT", type: "site_visit", label: "Visite terrain" },
    { id: "SRC-CLIENT", type: "client_statement", label: "Besoin client" },
  ],
  assumptions: [
    {
      id: "H-FOUILLE",
      text: "Section de fouille hypothétique 0,60 m × 0,80 m — à confirmer par plan de fondations / G2",
      status: "open",
    },
  ],
  unknowns: [
    {
      id: "U-FOND",
      text: "Plan de fondations et étude géotechnique non fournis",
      blocks: ["takeoff", "schedule"],
    },
  ],
  lots: [{ code: "TERR", label: "Terrassement" }],
  takeoff: {
    parameters: [
      {
        key: "terrain.surface",
        label: "Surface terrain",
        unit: "m2",
        value: 600,
        provenance: {
          source: "client_statement",
          confidence: "to_confirm",
          classification: "DECLARED",
        },
      },
      {
        key: "maison.longueur",
        label: "Longueur maison",
        unit: "m",
        value: 10,
        provenance: {
          source: "client_statement",
          confidence: "to_confirm",
          classification: "DECLARED",
        },
      },
      {
        key: "maison.largeur",
        label: "Largeur maison",
        unit: "m",
        value: 12,
        provenance: {
          source: "client_statement",
          confidence: "to_confirm",
          classification: "DECLARED",
        },
      },
      {
        key: "decapage.epaisseur",
        label: "Épaisseur décapage retenue",
        unit: "m",
        value: 0.25,
        provenance: {
          source: "assumption",
          confidence: "to_confirm",
          classification: "ASSUMED",
        },
      },
      {
        key: "fouille.largeur",
        label: "Largeur fouille (hypothèse)",
        unit: "m",
        value: 0.6,
        provenance: {
          source: "assumption",
          confidence: "to_confirm",
          classification: "ASSUMED",
        },
        hypothesis_id: "H-FOUILLE",
      },
      {
        key: "fouille.profondeur",
        label: "Profondeur fouille (hypothèse)",
        unit: "m",
        value: 0.8,
        provenance: {
          source: "assumption",
          confidence: "to_confirm",
          classification: "ASSUMED",
        },
        hypothesis_id: "H-FOUILLE",
      },
      {
        key: "fouille.longueur",
        label: "Linéaire de fouilles",
        unit: "ml",
        value: 54,
        provenance: {
          source: "calculation",
          confidence: "to_confirm",
          classification: "CALCULATED",
        },
      },
    ],
    items: [
      {
        code: "TER-01",
        lot: "TERR",
        designation: "Emprise maison",
        unit: "m2",
        formula: "maison.longueur * maison.largeur",
        provenance: {
          source: "calculation",
          confidence: "to_confirm",
          classification: "CALCULATED",
        },
      },
      {
        code: "TER-02",
        lot: "TERR",
        designation: "Décapage terre végétale",
        unit: "m2",
        quantity: 180,
        quantities: { geometric: 180, technical: 180, quote: 180 },
        provenance: {
          source: "calculation",
          confidence: "to_confirm",
          classification: "CALCULATED",
        },
      },
      {
        code: "TER-04",
        lot: "TERR",
        designation: "Volume décapage",
        unit: "m3",
        formula: "180 * decapage.epaisseur",
        provenance: {
          source: "calculation",
          confidence: "to_confirm",
          classification: "CALCULATED",
        },
        assumptions: ["Épaisseur 0,25 m"],
      },
      {
        code: "TER-05",
        lot: "TERR",
        designation: "Terre conservée",
        unit: "m3",
        quantity: 15,
        provenance: {
          source: "assumption",
          confidence: "to_confirm",
          classification: "ASSUMED",
        },
      },
      {
        code: "TER-03",
        lot: "TERR",
        designation: "Terrassement fouilles de fondations",
        unit: "m3",
        formula: "fouille.longueur * fouille.largeur * fouille.profondeur",
        quantities: { technical: 25.92, geometric: 25.92, quote: 25.92 },
        provenance: {
          source: "calculation",
          confidence: "to_confirm",
          classification: "CALCULATED",
        },
        assumptions: ["H-FOUILLE"],
        to_confirm: [
          "Largeur et profondeur à confirmer par plan de fondations et étude géotechnique",
        ],
        warnings: [
          "Dimensions 0,60 × 0,80 m = HYPOTHÈSE — pas une mesure terrain certaine",
        ],
      },
    ],
  },
  workflow: {
    steps: [
      {
        id: "P01",
        order: 1,
        name: "Préparation / implantation",
        kind: "work",
        duration: { mode: "fixed", days: 1, calendar: "working" },
      },
      {
        id: "P02",
        order: 2,
        name: "Décapage",
        kind: "work",
        takeoff_ids: ["TER-02"],
        duration: { mode: "fixed", days: 1, calendar: "working" },
      },
      {
        id: "P03",
        order: 3,
        name: "Fouilles",
        kind: "work",
        takeoff_ids: ["TER-03"],
        duration: { mode: "fixed", days: 2, calendar: "working" },
      },
      {
        id: "P04",
        order: 4,
        name: "Évacuation / mise en forme",
        kind: "work",
        duration: { mode: "fixed", days: 1, calendar: "working" },
      },
    ],
  },
  schedule: {
    tasks: [
      { step_id: "P01", depends_on: [] },
      { step_id: "P02", depends_on: [{ step_id: "P01", type: "FS" }] },
      { step_id: "P03", depends_on: [{ step_id: "P02", type: "FS" }] },
      { step_id: "P04", depends_on: [{ step_id: "P03", type: "FS" }] },
    ],
  },
  planning_settings: {
    start_date: null,
    working_days: ["MON", "TUE", "WED", "THU", "FRI"],
    calendar: "FR",
  },
  quote_transfer: { create_quote: false },
} as const;
