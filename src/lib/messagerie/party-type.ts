/**
 * MESSAGERIE-V2C.3 — Source unique de classification interlocuteur / conversation.
 * Ne jamais déduire « Interne » du seul fait qu’un User existe.
 */

export type MessagingPartyType =
  | "INTERNAL"
  | "CLIENT"
  | "SUPPLIER"
  | "SUBCONTRACTOR"
  | "PARTNER";

export type MessagingPartyLabel = {
  partyType: MessagingPartyType;
  /** Ex. « Client · Externe » */
  shortLabel: string;
  /** Ex. « Client » */
  roleLabel: string;
  /** true si hors périmètre interne */
  external: boolean;
  /** Indication composer / bandeau */
  visibilityHint: string;
};

const LABELS: Record<MessagingPartyType, MessagingPartyLabel> = {
  INTERNAL: {
    partyType: "INTERNAL",
    shortLabel: "Interne",
    roleLabel: "Interne",
    external: false,
    visibilityHint: "Message visible uniquement par l’équipe autorisée.",
  },
  CLIENT: {
    partyType: "CLIENT",
    shortLabel: "Client · Externe",
    roleLabel: "Client",
    external: true,
    visibilityHint: "Message visible par le client.",
  },
  SUPPLIER: {
    partyType: "SUPPLIER",
    shortLabel: "Fournisseur · Externe",
    roleLabel: "Fournisseur",
    external: true,
    visibilityHint: "Message visible par le fournisseur.",
  },
  SUBCONTRACTOR: {
    partyType: "SUBCONTRACTOR",
    shortLabel: "Sous-traitant · Externe",
    roleLabel: "Sous-traitant",
    external: true,
    visibilityHint: "Message visible par le sous-traitant.",
  },
  PARTNER: {
    partyType: "PARTNER",
    shortLabel: "Externe",
    roleLabel: "Partenaire",
    external: true,
    visibilityHint: "Message visible par le partenaire autorisé.",
  },
};

export type ResolveMessagingPartyInput = {
  personType?: string | null;
  permissionProfile?: string | null;
  /** ExternalOrganization.type */
  externalOrgType?: string | null;
  /** Message.channel ou canal conversation chantier */
  channel?: string | null;
  /** Task.category — ex. « Bon de commande » */
  taskCategory?: string | null;
  /** Titre conversation / tâche (heuristique secondaire uniquement) */
  titleHint?: string | null;
  /** User.role legacy — dernier recours, jamais prioritaire sur personType */
  legacyRole?: string | null;
};

function fromPersonType(personType: string | null | undefined): MessagingPartyType | null {
  if (!personType) return null;
  switch (personType) {
    case "INTERNAL":
      return "INTERNAL";
    case "CLIENT_EXT":
      return "CLIENT";
    case "SUPPLIER":
      return "SUPPLIER";
    case "SUBCONTRACTOR":
      return "SUBCONTRACTOR";
    case "MOE":
    case "CONTROL_OFFICE":
    case "PARTNER":
      return "PARTNER";
    default:
      return null;
  }
}

function fromExternalOrgType(t: string | null | undefined): MessagingPartyType | null {
  if (!t) return null;
  const u = t.toUpperCase();
  if (u === "CLIENT_EXT" || u === "CLIENT") return "CLIENT";
  if (u === "SUPPLIER") return "SUPPLIER";
  if (u === "SUBCONTRACTOR") return "SUBCONTRACTOR";
  if (u === "MOE" || u === "CONTROL_OFFICE" || u === "PARTNER") return "PARTNER";
  return null;
}

function fromChannel(channel: string | null | undefined): MessagingPartyType | null {
  if (!channel) return null;
  if (channel === "INTERNE") return "INTERNAL";
  if (channel === "CLIENT") return "CLIENT";
  if (channel === "FOURNISSEUR") return "SUPPLIER";
  return null;
}

function fromTaskCategory(category: string | null | undefined): MessagingPartyType | null {
  if (!category) return null;
  const c = category.toLowerCase();
  if (c.includes("bon de commande") || c.includes("fournisseur") || c.includes("livraison")) {
    return "SUPPLIER";
  }
  return null;
}

function fromTitleHint(title: string | null | undefined): MessagingPartyType | null {
  if (!title) return null;
  const t = title.toLowerCase();
  if (
    t.includes("point.p") ||
    t.includes("pointp") ||
    t.includes("fournisseur") ||
    /\bbc-?\d/i.test(title)
  ) {
    return "SUPPLIER";
  }
  return null;
}

function fromLegacyRole(role: string | null | undefined): MessagingPartyType | null {
  if (!role) return null;
  const r = role.toLowerCase();
  // Ne jamais traiter User.role=CLIENT comme client externe sans personType :
  // les personas internes démo ont aussi role CLIENT.
  if (r === "manager" || r === "agent" || r === "agence" || r === "gérant" || r === "gerant") {
    return "INTERNAL";
  }
  if (r === "fournisseur" || r === "supplier") return "SUPPLIER";
  if (r === "sous-traitant" || r === "subcontractor") return "SUBCONTRACTOR";
  return null;
}

/**
 * Résout le type d’interlocuteur / conversation pour l’UI Messagerie.
 * Priorité : channel → personType → externalOrg → taskCategory → title → legacyRole.
 * Sans signal fiable → INTERNAL uniquement si permissionProfile interne connu, sinon PARTNER (externe neutre).
 */
export function resolveMessagingPartyType(
  input: ResolveMessagingPartyInput,
): MessagingPartyLabel {
  const byChannel = fromChannel(input.channel);
  if (byChannel) return LABELS[byChannel];

  const byPerson = fromPersonType(input.personType);
  if (byPerson) return LABELS[byPerson];

  const byOrg = fromExternalOrgType(input.externalOrgType);
  if (byOrg) return LABELS[byOrg];

  const byCat = fromTaskCategory(input.taskCategory);
  if (byCat) return LABELS[byCat];

  const byTitle = fromTitleHint(input.titleHint);
  if (byTitle) return LABELS[byTitle];

  const profile = (input.permissionProfile ?? "").toUpperCase();
  if (
    profile === "DIRECTION" ||
    profile === "CONDUCTEUR" ||
    profile === "ADMINISTRATIF" ||
    profile === "CHEF_CHANTIER"
  ) {
    return LABELS.INTERNAL;
  }

  const byLegacy = fromLegacyRole(input.legacyRole);
  if (byLegacy) return LABELS[byLegacy];

  // Sans personType : ne pas afficher « Interne » par défaut (évite Sophie CLIENT_EXT mal taguée
  // si seule la présence d’un User est connue). Neutre externe.
  if (input.legacyRole?.toLowerCase() === "client" && !input.personType) {
    return LABELS.CLIENT;
  }

  return LABELS.PARTNER;
}

/** Libellé profil interne court pour sous-titre contact. */
export function internalProfileLabel(permissionProfile?: string | null): string {
  switch ((permissionProfile ?? "").toUpperCase()) {
    case "DIRECTION":
      return "Direction";
    case "CONDUCTEUR":
      return "Conducteur de travaux";
    case "ADMINISTRATIF":
      return "Administratif";
    case "CHEF_CHANTIER":
      return "Chef de chantier";
    default:
      return "Interne";
  }
}

/** Classes CSS discrètes (périmètre ≠ urgence). */
export function messagingPartyToneClass(party: MessagingPartyType): string {
  if (party === "INTERNAL") return "text-slate-600";
  if (party === "SUPPLIER") return "text-amber-800";
  if (party === "CLIENT") return "text-sky-800";
  return "text-slate-600";
}

export function formatPartyBadge(party: MessagingPartyLabel, opts?: { lock?: boolean }): string {
  if (party.partyType === "INTERNAL") {
    return opts?.lock === false ? party.shortLabel : `🔒 ${party.shortLabel}`;
  }
  return party.shortLabel;
}
