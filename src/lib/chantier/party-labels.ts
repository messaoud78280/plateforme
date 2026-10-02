/**
 * Présentation chantier partagée — liste & fiche (NAVIGATION-V2).
 * Client (donneur d’ordre) ≠ créateur/owner INTERNE ≠ responsable opérationnel.
 */

export type ChantierPartyUser = {
  id?: string;
  name: string | null;
  company?: string | null;
  personType?: string | null;
  role?: string | null;
  permissionProfile?: string | null;
  accessStatus?: string | null;
};

export type ProjectPresentationInput = {
  title: string;
  chantierStatusLabel?: string | null;
  client: ChantierPartyUser | null;
  assignedTo: ChantierPartyUser | null;
  internalManager?: string | null;
  /** Org hôte (SETRIM) — ne pas confondre avec le client. */
  hostOrganizationName?: string | null;
  /** Org cliente (channel CLIENT / ExternalOrganization). */
  clientOrganizationName?: string | null;
  /** CLIENT_EXT liés (ProjectAccess) — préférer company. */
  clientExtLabels?: string[];
  followUpClientName?: string | null;
};

export type ProjectPresentation = {
  /** Titre brut DB (inchangé). */
  title: string;
  /**
   * Titre d’affichage Project Signature.
   * Peut retirer un suffixe client historique « — CLIENT » si correspondance sûre.
   */
  displayTitle: string;
  clientLabel: string | null;
  responsibleLabel: string | null;
  responsibleIsInternal: boolean;
  /** Affichage si pas de responsable. */
  responsibleDisplay: string;
  statusLabel: string | null;
};

export function isInternalChantierResponsible(u: ChantierPartyUser | null | undefined): boolean {
  if (!u?.name?.trim()) return false;
  if (u.accessStatus === "DISABLED" || u.accessStatus === "SUSPENDED") return false;
  if (u.personType === "CLIENT_EXT" || u.personType === "SUPPLIER") return false;
  if (u.personType === "SUBCONTRACTOR" || u.personType === "PARTNER") return false;
  if (u.personType === "INTERNAL") return true;
  if (u.role === "MANAGER" || u.role === "AGENCE" || u.role === "AGENT") return true;
  return u.personType == null || u.personType === "INTERNAL";
}

function norm(s: string | null | undefined): string | null {
  const t = s?.trim();
  return t || null;
}

/** Normalise pour comparaison titre ↔ client (casse, accents, espaces). */
export function normalizePartyLabel(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Titre d’affichage Project Signature.
 * Retire uniquement un suffixe client historique du type « … — CLIENT »
 * lorsque le segment après le séparateur correspond exactement au clientLabel.
 * Ne touche jamais Project.title en base. N’extrait pas la surface.
 */
export function resolveProjectDisplayTitle(
  rawTitle: string,
  clientLabel: string | null | undefined,
): string {
  const title = rawTitle.trim();
  if (!title) return rawTitle;
  const client = clientLabel?.trim();
  if (!client) return title;

  // Séparateurs historiques prudents uniquement (em dash / en dash / hyphen cadrés).
  const sepMatch = title.match(/^(.*?)(\s+[—–-]\s+)(.+)$/u);
  if (!sepMatch) return title;

  const head = sepMatch[1]!.trim();
  const suffix = sepMatch[3]!.trim();
  if (!head || !suffix) return title;

  // Correspondance exacte normalisée du suffixe entier = client (pas un sous-mot).
  if (normalizePartyLabel(suffix) !== normalizePartyLabel(client)) {
    return title;
  }

  // Garde-fou : ne pas vider le titre.
  return head || title;
}

function isHostCompany(
  label: string | null,
  host: string | null | undefined,
): boolean {
  if (!label || !host) return false;
  return label.trim().toLowerCase() === host.trim().toLowerCase();
}

/** Reliquat scénario démo — ne jamais afficher comme client. */
function isLegacyDemoClientLabel(label: string | null | undefined): boolean {
  if (!label?.trim()) return false;
  return /ABC\s*Promotion/i.test(label);
}

/**
 * Résout client + responsable pour header / liste.
 * Ne jamais afficher un INTERNE (Denis Direction) comme client.
 */
export function resolveChantierHeaderParties(opts: {
  client: ChantierPartyUser | null;
  assignedTo: ChantierPartyUser | null;
  internalManager?: string | null;
  organizationName?: string | null;
  clientOrganizationName?: string | null;
  clientExtLabels?: string[];
  followUpClientName?: string | null;
}): {
  clientLabel: string | null;
  responsibleLabel: string | null;
  responsibleIsInternal: boolean;
} {
  const client = opts.client;
  const assigned = opts.assignedTo;
  const host = norm(opts.organizationName);

  let responsibleLabel: string | null = null;
  let responsibleIsInternal = false;

  if (assigned && isInternalChantierResponsible(assigned)) {
    responsibleLabel = assigned.name!.trim();
    responsibleIsInternal = true;
  } else if (opts.internalManager?.trim()) {
    const im = opts.internalManager.trim();
    const looksExternal =
      im.toLowerCase() === "sophie martin" ||
      (client?.personType === "CLIENT_EXT" && im === client.name);
    if (!looksExternal) {
      responsibleLabel = im;
      responsibleIsInternal = true;
    }
  }

  const candidates: (string | null)[] = [
    norm(opts.clientOrganizationName),
    ...(opts.clientExtLabels ?? []).map((s) => norm(s)),
    norm(opts.followUpClientName),
    client?.personType === "CLIENT_EXT" ? norm(client.company) || norm(client.name) : null,
    // company du user client uniquement si ce n’est PAS l’org hôte (SETRIM)
    client && isInternalChantierResponsible(client)
      ? null
      : norm(client?.company),
  ];

  let clientLabel: string | null = null;
  for (const c of candidates) {
    if (!c) continue;
    if (isHostCompany(c, host)) continue;
    if (isLegacyDemoClientLabel(c)) continue;
    // Ne jamais prendre le nom d’un user INTERNE
    if (client && isInternalChantierResponsible(client) && c === norm(client.name)) {
      continue;
    }
    clientLabel = c;
    break;
  }

  return { clientLabel, responsibleLabel, responsibleIsInternal };
}

/** Source unique liste + fiche. */
export function buildProjectPresentation(
  input: ProjectPresentationInput,
): ProjectPresentation {
  const parties = resolveChantierHeaderParties({
    client: input.client,
    assignedTo: input.assignedTo,
    internalManager: input.internalManager,
    organizationName: input.hostOrganizationName,
    clientOrganizationName: input.clientOrganizationName,
    clientExtLabels: input.clientExtLabels,
    followUpClientName: input.followUpClientName,
  });

  return {
    title: input.title,
    displayTitle: resolveProjectDisplayTitle(input.title, parties.clientLabel),
    clientLabel: parties.clientLabel,
    responsibleLabel: parties.responsibleLabel,
    responsibleIsInternal: parties.responsibleIsInternal,
    responsibleDisplay: parties.responsibleLabel?.trim() || "Responsable à définir",
    statusLabel: norm(input.chantierStatusLabel),
  };
}
