/**
 * Rattachement visite ↔ chantier — helpers UI / recherche (pas de nouveau modèle).
 */

export type LinkableProject = {
  id: string;
  title: string;
  siteAddress: string | null;
  siteCity: string | null;
  chantierStatus: string | null;
  statusLabel: string;
  clientName: string | null;
};

export function normalizeSearchText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Filtre local des chantiers (nom, client, ville, adresse). */
export function filterLinkableProjects(
  projects: LinkableProject[],
  query: string,
): LinkableProject[] {
  const q = normalizeSearchText(query);
  if (!q) return projects;
  const tokens = q.split(/\s+/).filter(Boolean);
  return projects.filter((p) => {
    const hay = normalizeSearchText(
      [p.title, p.clientName, p.siteCity, p.siteAddress].filter(Boolean).join(" "),
    );
    return tokens.every((t) => hay.includes(t));
  });
}

export type VisitProjectCoherenceInput = {
  visitClientName?: string | null;
  visitAddress?: string | null;
  visitCity?: string | null;
  projectTitle?: string | null;
  projectClientName?: string | null;
  projectAddress?: string | null;
  projectCity?: string | null;
};

/**
 * Avertissement soft si client / adresse divergent.
 * Ne bloque jamais — l'humain confirme.
 */
export function visitProjectCoherenceWarning(
  input: VisitProjectCoherenceInput,
): string | null {
  const visitClient = normalizeSearchText(input.visitClientName);
  const projectClient = normalizeSearchText(input.projectClientName);
  const visitAddr = normalizeSearchText(
    [input.visitAddress, input.visitCity].filter(Boolean).join(" "),
  );
  const projectAddr = normalizeSearchText(
    [input.projectAddress, input.projectCity].filter(Boolean).join(" "),
  );

  let clientMismatch = false;
  if (visitClient && projectClient) {
    clientMismatch =
      !visitClient.includes(projectClient) &&
      !projectClient.includes(visitClient);
  }

  let addressMismatch = false;
  if (visitAddr.length >= 6 && projectAddr.length >= 6) {
    const visitTokens = visitAddr.split(/\s+/).filter((t) => t.length >= 3);
    const overlap = visitTokens.filter((t) => projectAddr.includes(t)).length;
    addressMismatch = overlap < Math.min(2, visitTokens.length);
  }

  if (clientMismatch || addressMismatch) {
    return "Les informations de la visite diffèrent du chantier sélectionné.";
  }
  return null;
}
