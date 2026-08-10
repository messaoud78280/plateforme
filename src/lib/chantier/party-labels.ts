/**
 * Libellés header chantier — client (donneur d’ordre) ≠ responsable opérationnel.
 * Aligné sur la logique portfolio (CHANTIERS-V2B).
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

export function isInternalChantierResponsible(u: ChantierPartyUser | null | undefined): boolean {
  if (!u?.name?.trim()) return false;
  if (u.accessStatus === "DISABLED" || u.accessStatus === "SUSPENDED") return false;
  if (u.personType === "CLIENT_EXT" || u.personType === "SUPPLIER") return false;
  if (u.personType === "SUBCONTRACTOR" || u.personType === "PARTNER") return false;
  if (u.personType === "INTERNAL") return true;
  if (u.role === "MANAGER" || u.role === "AGENCE" || u.role === "AGENT") return true;
  return u.personType == null || u.personType === "INTERNAL";
}

export function resolveChantierHeaderParties(opts: {
  client: ChantierPartyUser | null;
  assignedTo: ChantierPartyUser | null;
  internalManager?: string | null;
  organizationName?: string | null;
  /** CLIENT_EXT liés au chantier (ProjectAccess). */
  clientExtLabels?: string[];
  /** Nom client fiche suivi si présent. */
  followUpClientName?: string | null;
}): {
  clientLabel: string | null;
  responsibleLabel: string | null;
  responsibleIsInternal: boolean;
} {
  const client = opts.client;
  const assigned = opts.assignedTo;

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

  const ext =
    opts.clientExtLabels?.map((s) => s.trim()).find(Boolean) ||
    opts.followUpClientName?.trim() ||
    null;

  const clientLabel =
    ext ||
    client?.company?.trim() ||
    (client?.personType === "CLIENT_EXT" ? client.name?.trim() || null : null) ||
    opts.organizationName?.trim() ||
    // Dernier recours : ne pas afficher un INTERNAL (Denis Direction) comme « client »
    (client && !isInternalChantierResponsible(client) ? client.name?.trim() || null : null) ||
    null;

  return { clientLabel, responsibleLabel, responsibleIsInternal };
}
