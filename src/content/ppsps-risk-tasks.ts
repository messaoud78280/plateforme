/** Familles et tâches à risques — checklist PPSPS BeWork */

export type PpspsRiskAlert = "high" | "verify" | "habilitation" | "csps";

export type PpspsRiskTask = {
  id: string;
  label: string;
  alerts?: PpspsRiskAlert[];
};

export type PpspsRiskFamily = {
  id: string;
  title: string;
  tasks: PpspsRiskTask[];
};

export const PPSPS_RISK_FAMILIES: readonly PpspsRiskFamily[] = [
  {
    id: "hauteur",
    title: "Travaux en hauteur",
    tasks: [
      { id: "h-echafaudage", label: "Travail sur échafaudage", alerts: ["high", "habilitation", "verify"] },
      { id: "h-toiture", label: "Travail sur toiture", alerts: ["high", "habilitation"] },
      { id: "h-echelle", label: "Travail sur échelle ou escabeau", alerts: ["high"] },
      { id: "h-nacelle", label: "Travail en nacelle", alerts: ["high", "habilitation"] },
      { id: "h-garde-corps", label: "Pose de garde-corps", alerts: ["verify"] },
      { id: "h-rive", label: "Intervention en rive de plancher", alerts: ["high", "csps"] },
      { id: "h-tremie", label: "Travail à proximité de trémies ou ouvertures", alerts: ["high"] },
    ],
  },
  {
    id: "terrassement",
    title: "Terrassement / fouilles / réseaux",
    tasks: [
      { id: "t-terrassement", label: "Terrassement mécanique", alerts: ["high"] },
      { id: "t-tranchee", label: "Fouilles en tranchée", alerts: ["high", "csps"] },
      { id: "t-fond-fouille", label: "Intervention en fond de fouille", alerts: ["high", "csps"] },
      { id: "t-blindage", label: "Blindage de fouille", alerts: ["high", "habilitation"] },
      { id: "t-reseaux-enterres", label: "Travaux à proximité de réseaux enterrés", alerts: ["high", "verify"] },
      { id: "t-reseaux-elec", label: "Travaux à proximité de réseaux électriques", alerts: ["high", "verify"] },
      { id: "t-fondations", label: "Réalisation de fondations", alerts: ["verify"] },
      { id: "t-coulage-fouille", label: "Coulage béton en fouille", alerts: ["high"] },
    ],
  },
  {
    id: "manutention",
    title: "Manutention / levage",
    tasks: [
      { id: "m-manuelle", label: "Manutention manuelle de charges lourdes", alerts: ["verify"] },
      { id: "m-engin-levage", label: "Utilisation d'un engin de levage", alerts: ["high", "habilitation"] },
      { id: "m-grue", label: "Utilisation d'une grue mobile", alerts: ["high", "habilitation", "csps"] },
      { id: "m-chariot", label: "Utilisation d'un chariot élévateur", alerts: ["habilitation"] },
      { id: "m-stockage", label: "Livraison et stockage de matériaux", alerts: ["verify"] },
      { id: "m-elingage", label: "Élingage de charges", alerts: ["high", "habilitation"] },
      { id: "m-dechargement", label: "Déchargement camion", alerts: ["verify"] },
    ],
  },
  {
    id: "engins",
    title: "Engins / circulation chantier",
    tasks: [
      { id: "e-pelle", label: "Utilisation de pelle mécanique", alerts: ["high", "habilitation"] },
      { id: "e-mini-pelle", label: "Utilisation de mini-pelle", alerts: ["habilitation"] },
      { id: "e-compacteur", label: "Utilisation de compacteur", alerts: ["verify"] },
      { id: "e-circulation", label: "Circulation d'engins et piétons", alerts: ["high"] },
      { id: "e-voirie", label: "Travaux en voirie", alerts: ["high", "verify"] },
      { id: "e-emprise-voie", label: "Travaux avec emprise sur voie publique", alerts: ["high", "verify"] },
      { id: "e-signalisation", label: "Signalisation temporaire de chantier", alerts: ["verify"] },
    ],
  },
  {
    id: "electricite",
    title: "Électricité / énergie",
    tasks: [
      { id: "el-outillage", label: "Utilisation d'outillage électroportatif", alerts: ["verify"] },
      { id: "el-lignes", label: "Travaux à proximité de lignes électriques", alerts: ["high", "habilitation"] },
      { id: "el-raccordement", label: "Raccordement provisoire de chantier", alerts: ["habilitation", "verify"] },
      { id: "el-coffret", label: "Utilisation de coffret électrique de chantier", alerts: ["habilitation"] },
      { id: "el-install-existante", label: "Intervention sur installation existante", alerts: ["high", "habilitation"] },
    ],
  },
  {
    id: "demolition",
    title: "Démolition / poussières / bruit",
    tasks: [
      { id: "d-manuelle", label: "Démolition manuelle", alerts: ["high", "verify"] },
      { id: "d-mecanique", label: "Démolition mécanique", alerts: ["high"] },
      { id: "d-decoupe-beton", label: "Découpe béton", alerts: ["high", "verify"] },
      { id: "d-sciage", label: "Sciage / carottage", alerts: ["verify"] },
      { id: "d-poussieres", label: "Production de poussières", alerts: ["verify"] },
      { id: "d-bruit", label: "Exposition au bruit", alerts: ["verify"] },
      { id: "d-gravats", label: "Évacuation de gravats", alerts: ["verify"] },
    ],
  },
  {
    id: "chimique",
    title: "Produits dangereux / risques chimiques",
    tasks: [
      { id: "c-produits", label: "Utilisation de produits chimiques", alerts: ["verify"] },
      { id: "c-solvants", label: "Utilisation de colles, résines ou solvants", alerts: ["verify"] },
      { id: "c-amiante", label: "Risque amiante à vérifier", alerts: ["high", "csps", "verify"] },
      { id: "c-plomb", label: "Risque plomb à vérifier", alerts: ["high", "verify"] },
      { id: "c-carburants", label: "Manipulation de carburants ou huiles", alerts: ["verify"] },
      { id: "c-nettoyage", label: "Nettoyage avec produit irritant", alerts: ["verify"] },
    ],
  },
  {
    id: "organisation",
    title: "Organisation / secours",
    tasks: [
      { id: "o-isole", label: "Travail isolé", alerts: ["high", "verify"] },
      { id: "o-coactivite", label: "Coactivité avec autres entreprises", alerts: ["verify", "csps"] },
      { id: "o-stockage", label: "Zone de stockage encombrée", alerts: ["verify"] },
      { id: "o-site-occupe", label: "Intervention en site occupé", alerts: ["high", "verify"] },
      { id: "o-public", label: "Présence du public", alerts: ["high"] },
      { id: "o-secours", label: "Accès pompiers à maintenir", alerts: ["verify"] },
      { id: "o-evacuation", label: "Évacuation d'urgence", alerts: ["verify"] },
    ],
  },
] as const;

export const PPSPS_ALERT_LABELS: Record<PpspsRiskAlert, string> = {
  high: "Risque élevé",
  verify: "À vérifier",
  habilitation: "Habilitation requise",
  csps: "Validation CSPS recommandée",
};

export function getPpspsTaskById(id: string): (PpspsRiskTask & { familyTitle: string }) | undefined {
  for (const family of PPSPS_RISK_FAMILIES) {
    const task = family.tasks.find((t) => t.id === id);
    if (task) return { ...task, familyTitle: family.title };
  }
  return undefined;
}
