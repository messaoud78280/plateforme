/**
 * MESSAGERIE-V2C.6B — Source unique de présentation d’un canal chantier actif.
 * Header, composer, badges et panneau contexte DOIVENT consommer ce resolver.
 * Aucun fallback CLIENT parallèle.
 */

export type ActiveChannelScopeType = "INTERNAL" | "CLIENT" | "SUPPLIER" | "SUBCONTRACTOR" | "OTHER";

export type ActiveChannelPresentation = {
  channelId: string | null;
  displayName: string;
  scopeType: ActiveChannelScopeType;
  /** Court : Interne / Client / Fournisseur */
  scopeLabel: string;
  /** Badge header : Interne / Client · Externe / Fournisseur · Externe */
  scopeBadge: string;
  external: boolean;
  projectTitle: string | null;
  participantCount: number;
  /** Ligne composer principale */
  composerLabel: string;
  /** Sous-ligne confidentialité courte */
  privacyLabel: string;
  /** Legacy Message.channel pour API */
  legacyChannel: "INTERNE" | "CLIENT" | "FOURNISSEUR" | "SOUS_TRAITANT";
};

export type ActiveChannelInput = {
  id: string;
  type: string;
  title: string;
  metaLabel?: string | null;
  external?: boolean;
  participantCount?: number;
} | null;

function scopeFromType(type: string | null | undefined): ActiveChannelScopeType {
  switch (type) {
    case "INTERNAL":
      return "INTERNAL";
    case "CLIENT":
      return "CLIENT";
    case "SUPPLIER":
      return "SUPPLIER";
    case "SUBCONTRACTOR":
      return "SUBCONTRACTOR";
    default:
      return "OTHER";
  }
}

function legacyFromScope(
  scope: ActiveChannelScopeType,
): ActiveChannelPresentation["legacyChannel"] {
  switch (scope) {
    case "INTERNAL":
      return "INTERNE";
    case "SUPPLIER":
      return "FOURNISSEUR";
    case "SUBCONTRACTOR":
      return "SOUS_TRAITANT";
    case "CLIENT":
    default:
      return "CLIENT";
  }
}

/**
 * Présentation unique dérivée du channel réellement sélectionné.
 * Si channel est null → présentation neutre (pas de faux CLIENT).
 */
export function resolveActiveChannelPresentation(
  channel: ActiveChannelInput,
  context?: {
    projectTitle?: string | null;
    participantCount?: number | null;
  },
): ActiveChannelPresentation {
  const projectTitle = context?.projectTitle?.trim() || null;
  const count =
    typeof context?.participantCount === "number"
      ? context.participantCount
      : typeof channel?.participantCount === "number"
        ? channel.participantCount
        : 0;
  const people =
    count > 0 ? `${count} personne${count > 1 ? "s" : ""}` : null;

  if (!channel) {
    return {
      channelId: null,
      displayName: "Conversation",
      scopeType: "OTHER",
      scopeLabel: "",
      scopeBadge: "",
      external: false,
      projectTitle,
      participantCount: count,
      composerLabel: "Sélectionnez une conversation",
      privacyLabel: "",
      legacyChannel: "CLIENT",
    };
  }

  const scopeType = scopeFromType(channel.type);
  const displayName = channel.title?.trim() || "Conversation";
  const external = Boolean(channel.external) || scopeType !== "INTERNAL";

  if (scopeType === "INTERNAL") {
    return {
      channelId: channel.id,
      displayName,
      scopeType,
      scopeLabel: "Interne",
      scopeBadge: "🔒 Interne",
      external: false,
      projectTitle,
      participantCount: count,
      composerLabel: people
        ? `🔒 À : ${displayName} · ${people}`
        : `🔒 À : ${displayName}`,
      privacyLabel: "Visible uniquement par les participants internes autorisés.",
      legacyChannel: legacyFromScope(scopeType),
    };
  }

  if (scopeType === "CLIENT") {
    return {
      channelId: channel.id,
      displayName,
      scopeType,
      scopeLabel: "Client",
      scopeBadge: "Client · Externe",
      external: true,
      projectTitle,
      participantCount: count,
      composerLabel: people
        ? `À : ${displayName} · Client externe · ${people}`
        : `À : ${displayName} · Client externe`,
      privacyLabel: `Visible par les participants de ce canal (${displayName}).`,
      legacyChannel: legacyFromScope(scopeType),
    };
  }

  if (scopeType === "SUPPLIER") {
    return {
      channelId: channel.id,
      displayName,
      scopeType,
      scopeLabel: "Fournisseur",
      scopeBadge: "Fournisseur · Externe",
      external: true,
      projectTitle,
      participantCount: count,
      composerLabel: people
        ? `À : ${displayName} · Fournisseur externe · ${people}`
        : `À : ${displayName} · Fournisseur externe`,
      privacyLabel: `Visible par les participants de ce canal (${displayName}).`,
      legacyChannel: legacyFromScope(scopeType),
    };
  }

  if (scopeType === "SUBCONTRACTOR") {
    return {
      channelId: channel.id,
      displayName,
      scopeType,
      scopeLabel: "Sous-traitant",
      scopeBadge: "Sous-traitant · Externe",
      external: true,
      projectTitle,
      participantCount: count,
      composerLabel: people
        ? `À : ${displayName} · Sous-traitant · ${people}`
        : `À : ${displayName} · Sous-traitant`,
      privacyLabel: `Visible par les participants de ce canal (${displayName}).`,
      legacyChannel: legacyFromScope(scopeType),
    };
  }

  return {
    channelId: channel.id,
    displayName,
    scopeType: "OTHER",
    scopeLabel: channel.metaLabel?.replace(" · Externe", "") || "Conversation",
    scopeBadge: channel.metaLabel || "",
    external,
    projectTitle,
    participantCount: count,
    composerLabel: `À : ${displayName}`,
    privacyLabel: "",
    legacyChannel: "CLIENT",
  };
}

/** Assertion P0 : header et composer ne peuvent pas diverger de scope. */
export function assertChannelPresentationConsistent(
  presentation: ActiveChannelPresentation,
): boolean {
  if (presentation.scopeType === "INTERNAL") {
    return (
      presentation.composerLabel.includes("Équipe") ||
      presentation.composerLabel.startsWith("🔒 À :")
    ) && !/Client externe|Fournisseur externe/i.test(presentation.composerLabel);
  }
  if (presentation.scopeType === "CLIENT") {
    return (
      /Client externe/i.test(presentation.composerLabel) &&
      !presentation.composerLabel.startsWith("🔒")
    );
  }
  if (presentation.scopeType === "SUPPLIER") {
    return (
      /Fournisseur externe/i.test(presentation.composerLabel) &&
      !/Client externe/i.test(presentation.composerLabel)
    );
  }
  return true;
}
