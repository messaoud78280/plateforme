/**
 * Phases canoniques planning — jamais lot = désignation de tâche.
 */

export const UNCLASSIFIED_PHASE = "À classer";

export type PhaseRole =
  | "preparation"
  | "demolition"
  | "logistics"
  | "networks"
  | "installation"
  | "execution"
  | "finishes"
  | "wait"
  | "controls"
  | "handover"
  | "generic"
  | "unclassified";

export type CanonicalPhase = {
  /** Libellé affiché / stocké dans lot */
  label: string;
  /** Ordre déterministe (plus petit = plus tôt) */
  order: number;
  role: PhaseRole;
  /** true si l'ancien lot était la désignation de la tâche */
  wasDesignationFallback: boolean;
  source: "structured" | "inferred" | "unclassified";
  /** ID phase workflow explicite si connue. */
  executionPhaseId?: string | null;
  /**
   * Origine structurelle :
   * - execution_phase : workflow.execution_phases
   * - legacy_fallback : resolver historique (lot / section / texte)
   * - unstructured : aucune structure exploitable
   */
  structureSource?: "execution_phase" | "legacy_fallback" | "unstructured";
};

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Lot qui n'est qu'une copie du nom de tâche → faux lot. */
export function isDesignationLikeLot(
  lot: string | null | undefined,
  name: string | null | undefined,
): boolean {
  const l = (lot ?? "").trim();
  const n = (name ?? "").trim();
  if (!l) return false;
  if (!n) return false;
  if (norm(l) === norm(n)) return true;
  // Désignation longue collée comme « phase » unique
  if (l.length >= 48 && norm(n).startsWith(norm(l).slice(0, 40))) return true;
  return false;
}

function parsePhaseNumber(lot: string): number | null {
  const m = lot.match(/phase\s*(\d+)/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

/** Marqueurs de contrôle FINAL (pas un contrôle intermédiaire / hold-point). */
export function hasFinalControlMarkers(text: string): boolean {
  const t = norm(text);
  return /final|finaux|finale|globaux|globale|conformite|conformité|reception technique|réception technique/.test(
    t,
  );
}

/** Remise client / handover terminal — pas « livraison », ni nettoyage courant. */
export function hasTerminalHandoverMarkers(text: string): boolean {
  const t = norm(text);
  if (
    /remise\s+(de\s+l'|au\s+)?client|remise\s+des\s+cl[eé]s|remise\s+de\s+l['']installation|handover/.test(
      t,
    )
  ) {
    return true;
  }
  // Nettoyage de fin de chantier sans finitions métier → remise
  if (
    /nettoyage/.test(t) &&
    /fin\s+de\s+chantier/.test(t) &&
    !/\bfinitions?\b|rebouchage|joints?\b|enduits?/.test(t)
  ) {
    return true;
  }
  if (
    (/reception|réception/.test(t) &&
      !/controle|contrôle|technique/.test(t) &&
      /client|ouvrage|cles|clés|cles/.test(t))
  ) {
    return true;
  }
  return false;
}

/**
 * Inférence de rôle depuis libellé — prudente :
 * - « livraison », « nettoyage » courant, « Contrôle X » intermédiaire ≠ rôles terminaux
 * - seuls les marqueurs finaux / lots exacts Contrôles|Remise imposent controls/handover
 */
function inferRoleFromText(text: string): PhaseRole | null {
  const t = norm(text);

  // Lots / libellés de phase exacts
  if (/^contr[oô]les?\s*$/.test(t)) return "controls";
  if (/^remise\s*$/.test(t)) return "handover";

  // Contrôle FINAL uniquement — un « Contrôle étanchéité » intermédiaire reste générique
  if (
    (/controle|contrôle|essais|verification|vérification|inspection/.test(t) &&
      hasFinalControlMarkers(t))
  ) {
    return "controls";
  }

  const finishesCue =
    /\bfinitions?\b|rebouchage|reprise de finition|enduits? de finition/.test(t);
  const terminalHandover = hasTerminalHandoverMarkers(t);

  // Finitions + nettoyage de fin sans remise client → finitions (pas Remise)
  if (finishesCue && !terminalHandover) {
    return "finishes";
  }
  if (terminalHandover) {
    return "handover";
  }
  if (finishesCue) {
    return "finishes";
  }
  if (
    /depose|dépose|demolition|démolition|curage|deconstruction|déconstruction/.test(
      t,
    ) &&
    !/installation de chantier|preparation du chantier|préparation du chantier/.test(
      t,
    )
  ) {
    return "demolition";
  }
  if (
    /installation de chantier|base vie|preparation du chantier|préparation du chantier|protection des ouvrages|installations? provisoires/.test(
      t,
    )
  ) {
    return "preparation";
  }
  // Libellés de section / phase structurés (pas des produits)
  if (
    /\breseaux\b|\bréseaux\b|\bdistribution\b|\bcheminements?\b|\bcanalisations?\b|\bfouilles?\b|\bterrassements?\b/.test(
      t,
    )
  ) {
    return "networks";
  }
  if (
    /\bappareillages?\b|\belevation\b|\bélévation\b|\bfondations?\b|\bmaconnerie\b|\bmaçonnerie\b/.test(
      t,
    )
  ) {
    return "installation";
  }
  return null;
}

const ROLE_ORDER: Record<PhaseRole, number> = {
  preparation: 10,
  logistics: 15,
  demolition: 20,
  networks: 30,
  execution: 35,
  installation: 40,
  finishes: 50,
  wait: 60,
  controls: 70,
  handover: 80,
  generic: 45,
  unclassified: 90,
};

const ROLE_LABEL: Record<PhaseRole, string> = {
  preparation: "Préparation",
  logistics: "Logistique",
  demolition: "Déposes",
  networks: "Réseaux",
  execution: "Exécution",
  installation: "Appareillage & pose",
  finishes: "Finitions",
  wait: "Attente",
  controls: "Contrôles",
  handover: "Remise",
  generic: "Travaux",
  unclassified: UNCLASSIFIED_PHASE,
};

/**
 * Résout une phase exploitable pour affichage, Gantt et resource leveling.
 * Ne renvoie jamais le nom de la tâche comme phase.
 */
export function resolveCanonicalPhase(input: {
  lot?: string | null;
  name: string;
  kind?: string | null;
  description?: string | null;
  /** Section commerciale devis — n'est pas une phase temporelle seule. */
  commercialSection?: string | null;
}): CanonicalPhase {
  const rawLot = (input.lot ?? "").trim();
  const commercial = (input.commercialSection ?? "").trim();
  const designationLike = isDesignationLikeLot(rawLot, input.name);
  const inferredFromName = inferRoleFromText(
    `${input.name} ${input.description ?? ""}`,
  );
  const inferredFromLot = rawLot ? inferRoleFromText(rawLot) : null;
  const inferredFromCommercial = commercial
    ? inferRoleFromText(commercial)
    : null;
  const inferred =
    inferredFromName ?? inferredFromLot ?? inferredFromCommercial;

  // Contrôles / remise : priorité à l'inférence nom même si section source est mauvaise
  if (inferredFromName === "controls" || inferredFromName === "handover") {
    return {
      label: ROLE_LABEL[inferredFromName],
      order: ROLE_ORDER[inferredFromName],
      role: inferredFromName,
      wasDesignationFallback: designationLike || !rawLot,
      source: "inferred",
      structureSource: "legacy_fallback",
    };
  }

  // Section commerciale structurée si lot absent / désignation / catch-all PHASE n
  const lotIsBroad =
    !!rawLot &&
    (parsePhaseNumber(rawLot) != null || /^phase\s*\d+/i.test(rawLot));
  const preferCommercial =
    commercial &&
    !isDesignationLikeLot(commercial, input.name) &&
    (!rawLot || designationLike || lotIsBroad);

  if (preferCommercial) {
    const role =
      inferredFromName ||
      inferredFromCommercial ||
      inferredFromLot ||
      "generic";
    const useInferredLabel =
      role === "controls" ||
      role === "handover" ||
      role === "finishes" ||
      role === "preparation" ||
      role === "demolition";
    return {
      label: useInferredLabel && inferredFromName ? ROLE_LABEL[role] : commercial,
      order: ROLE_ORDER[role] ?? ROLE_ORDER.generic,
      role,
      wasDesignationFallback: designationLike || !rawLot,
      source: inferredFromName ? "inferred" : "structured",
      structureSource: "legacy_fallback",
    };
  }

  if (rawLot && !designationLike) {
    const phaseNum = parsePhaseNumber(rawLot);
    const isBroadPhase = phaseNum != null || /^phase\s*\d+/i.test(rawLot);
    // Phase large « PHASE n — … » : le nom de tâche prime ; le libellé catch-all
    // ne doit pas imposer dépose/prep à toutes les tâches.
    const role = isBroadPhase
      ? inferredFromName || "generic"
      : inferredFromLot || inferredFromName || "generic";
    const order =
      role === "controls" || role === "handover" || role === "finishes"
        ? ROLE_ORDER[role]
        : phaseNum != null
          ? phaseNum * 10 + (ROLE_ORDER[role] % 10)
          : ROLE_ORDER[role] ?? ROLE_ORDER.generic;
    return {
      label: isBroadPhase && inferredFromName ? ROLE_LABEL[role] : rawLot,
      order,
      role,
      wasDesignationFallback: false,
      source: isBroadPhase && inferredFromName ? "inferred" : "structured",
      structureSource: "legacy_fallback",
    };
  }

  if (inferred) {
    return {
      label: ROLE_LABEL[inferred],
      order: ROLE_ORDER[inferred],
      role: inferred,
      wasDesignationFallback: designationLike || !rawLot,
      source: "inferred",
      structureSource: "legacy_fallback",
    };
  }

  return {
    label: UNCLASSIFIED_PHASE,
    order: ROLE_ORDER.unclassified,
    role: "unclassified",
    wasDesignationFallback: designationLike || !rawLot,
    source: "unclassified",
    structureSource: "unstructured",
  };
}

/** Clé de resource leveling stable (pas une désignation unique). */
export function phaseResourceGroupKey(phase: CanonicalPhase): string {
  if (phase.role === "unclassified") return "DEFAULT-A";
  // Groupes métier large pour éviter faux parallèle entre sous-libellés
  if (
    phase.role === "preparation" ||
    phase.role === "demolition" ||
    phase.role === "logistics" ||
    phase.role === "networks" ||
    phase.role === "execution" ||
    phase.role === "installation" ||
    phase.role === "finishes" ||
    phase.role === "wait" ||
    phase.role === "controls" ||
    phase.role === "handover"
  ) {
    return `ROLE:${phase.role}`;
  }
  const normLabel = phase.label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 48);
  return normLabel ? `LOT:${normLabel}` : "DEFAULT-A";
}
