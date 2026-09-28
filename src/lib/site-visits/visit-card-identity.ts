/**
 * Identité d'une carte visite — lecture seule, aucune donnée inventée.
 * Titre = Project.title si la visite est rattachée.
 * Sinon : nom de site, puis client. Le type vient des lots, des périmètres
 * ou du sujet déjà saisi.
 */

const GENERIC_LOT = new Set(["autre", "autres", "divers"]);

const GENERIC_SUBJECT =
  /^(compte[\s-]?rendu|cr\b|visite( chantier)?|relev[eé]|autre)\b/i;

export type VisitCardIdentity = {
  title: string;
  clientLine: string | null;
  place: string | null;
  /** Phrase de type uniquement quand aucun badge métier n'existe. */
  typeLine: string | null;
  badges: string[];
  extraBadgeCount: number;
  linked: boolean;
};

function clean(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function sameText(a: string, b: string): boolean {
  return a.localeCompare(b, "fr", { sensitivity: "base" }) === 0;
}

/** « Lot 02 — Cuisine » → « Cuisine ». Le préfixe est administratif. */
export function scopeDisplayName(name: string): string {
  const trimmed = clean(name);
  const match = trimmed.match(/^lot\s*\d+\s*[—–-]\s*(.+)$/i);
  return clean(match?.[1] ?? trimmed);
}

/** Les libellés courts (Cuisine, Électricité) passent avant les intitulés longs. */
function preferReadableBadges(labels: string[]): string[] {
  const short: string[] = [];
  const long: string[] = [];
  for (const label of labels) {
    (label.length <= 24 ? short : long).push(label);
  }
  return [...short, ...long];
}

function uniqueLabels(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const label = clean(value);
    if (!label) continue;
    const key = label.toLocaleLowerCase("fr");
    if (seen.has(key) || GENERIC_LOT.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}

function isGenericSubject(value: string): boolean {
  return GENERIC_SUBJECT.test(value);
}

function typeFromText(input: {
  subject?: string | null;
  clientNeed?: string | null;
  clientName: string;
}): string | null {
  const subject = clean(input.subject);
  if (subject && !isGenericSubject(subject) && !sameText(subject, input.clientName)) {
    return subject;
  }
  const need = clean(input.clientNeed);
  if (need && !isGenericSubject(need) && !sameText(need, input.clientName)) {
    return need;
  }
  return null;
}

export function buildVisitCardIdentity(input: {
  projectTitle?: string | null;
  projectCity?: string | null;
  scopeNames?: string[] | null;
  clientName: string;
  siteName?: string | null;
  subject?: string | null;
  clientNeed?: string | null;
  lots?: string[] | null;
  visitCity?: string | null;
  siteAddress?: string | null;
}): VisitCardIdentity {
  const clientName = clean(input.clientName) || "Client";
  const projectTitle = clean(input.projectTitle);
  const linked = projectTitle.length > 0;
  const siteName = clean(input.siteName);

  const title = linked
    ? projectTitle
    : siteName && !sameText(siteName, clientName)
      ? siteName
      : clientName;

  const clientLine =
    !sameText(title, clientName) && clientName !== "Client" ? clientName : null;

  const place =
    clean(input.projectCity) ||
    clean(input.visitCity) ||
    clean(input.siteAddress) ||
    null;

  const badges = preferReadableBadges(
    uniqueLabels([
      ...(input.lots ?? []),
      ...(input.scopeNames ?? []).map(scopeDisplayName),
    ]),
  );
  const shown = badges.slice(0, 3);

  const typeLine =
    shown.length > 0
      ? null
      : typeFromText({
          subject: input.subject,
          clientNeed: input.clientNeed,
          clientName,
        }) ?? "Type de chantier à préciser";

  return {
    title,
    clientLine,
    place,
    typeLine,
    badges: shown,
    extraBadgeCount: Math.max(0, badges.length - shown.length),
    linked,
  };
}
