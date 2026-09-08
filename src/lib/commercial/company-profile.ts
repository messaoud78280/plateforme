/**
 * Profil commercial / légal de l’organisation émettrice.
 * Stocké dans CommercialOrgSettings.quoteDocumentSettingsJson.companyProfile
 * (pas de migration Prisma) — source pour buildIssuerSnapshot.
 */
import type { Prisma } from "@prisma/client";

export type CompanyProfile = {
  name: string | null;
  /** Enseigne / nom affiché */
  tradeName: string | null;
  /** Sous-titre commercial (ex. Aménagements extérieurs • …) */
  activity: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  siren: string | null;
  siret: string | null;
  vatNumber: string | null;
  apeCode: string | null;
  apeLabel: string | null;
  legalForm: string | null;
  capital: string | null;
  logoPath: string | null;
};

export type IssuerSnapshotShape = {
  name?: string | null;
  tradeName?: string | null;
  activity?: string | null;
  siret?: string | null;
  siren?: string | null;
  vatNumber?: string | null;
  apeCode?: string | null;
  apeLabel?: string | null;
  legalForm?: string | null;
  formeJuridique?: string | null;
  capital?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  postalCode?: string | null;
  zipCode?: string | null;
  country?: string | null;
  logoPath?: string | null;
};

const EMPTY: CompanyProfile = {
  name: null,
  tradeName: null,
  activity: null,
  addressLine1: null,
  addressLine2: null,
  postalCode: null,
  city: null,
  country: "France",
  phone: null,
  email: null,
  website: null,
  siren: null,
  siret: null,
  vatNumber: null,
  apeCode: null,
  apeLabel: null,
  legalForm: null,
  capital: null,
  logoPath: null,
};

function str(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

/** Données connues Urban Aménagements — sans inventer rue n°, tél ni capital. */
export function urbanAmenagementsKnownProfile(): Partial<CompanyProfile> {
  return {
    name: "URBAN AMÉNAGEMENTS",
    tradeName: "URBAN AMÉNAGEMENTS",
    activity: "Aménagements extérieurs • Maçonnerie • Terrassement",
    addressLine1: "Rue Henri Dunant",
    postalCode: "78280",
    city: "Guyancourt",
    country: "France",
    email: "contact@amenagementexterieur78.fr",
    siren: "912259934",
    siret: "91225993400012",
    vatNumber: "FR86912259934",
    apeCode: "4211Z",
    apeLabel: "Construction de routes et autoroutes",
    legalForm: "SAS — Société par actions simplifiée",
  };
}

export function isUrbanAmenagementsOrg(name: string | null | undefined): boolean {
  const n = (name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  return n.includes("urban") && n.includes("amenagement");
}

export function parseCompanyProfile(docSettingsJson: unknown): CompanyProfile {
  if (!docSettingsJson || typeof docSettingsJson !== "object") return { ...EMPTY };
  const root = docSettingsJson as Record<string, unknown>;
  const raw = root.companyProfile;
  if (!raw || typeof raw !== "object") return { ...EMPTY };
  const o = raw as Record<string, unknown>;
  return {
    name: str(o.name),
    tradeName: str(o.tradeName),
    activity: str(o.activity),
    addressLine1: str(o.addressLine1),
    addressLine2: str(o.addressLine2),
    postalCode: str(o.postalCode ?? o.zipCode),
    city: str(o.city),
    country: str(o.country) ?? "France",
    phone: str(o.phone),
    email: str(o.email),
    website: str(o.website),
    siren: str(o.siren)?.replace(/\s/g, "") ?? null,
    siret: str(o.siret)?.replace(/\s/g, "") ?? null,
    vatNumber: str(o.vatNumber)?.replace(/\s/g, "") ?? null,
    apeCode: str(o.apeCode),
    apeLabel: str(o.apeLabel),
    legalForm: str(o.legalForm ?? o.formeJuridique),
    capital: str(o.capital),
    logoPath: str(o.logoPath),
  };
}

/** Complète les trous avec les données connues (Urban) sans écraser l’existant. */
export function withKnownOrgDefaults(
  orgName: string | null | undefined,
  profile: CompanyProfile,
): CompanyProfile {
  if (!isUrbanAmenagementsOrg(orgName) && !isUrbanAmenagementsOrg(profile.name)) {
    return profile;
  }
  const known = urbanAmenagementsKnownProfile();
  const out = { ...profile };
  for (const [k, v] of Object.entries(known) as [keyof CompanyProfile, string | null | undefined][]) {
    if (v && !out[k]) out[k] = v;
  }
  // Remplacer email Gmail perso si email pro connu et email actuel = gmail perso
  if (
    known.email &&
    out.email &&
    /@gmail\.com$/i.test(out.email) &&
    /djebaili/i.test(out.email)
  ) {
    out.email = known.email;
  }
  if (!out.email && known.email) out.email = known.email;
  return out;
}

export function mergeCompanyProfileIntoDocSettings(
  existing: unknown,
  profile: CompanyProfile,
): Prisma.InputJsonValue {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  base.companyProfile = profile;
  return base as Prisma.InputJsonValue;
}

export function companyProfileToIssuerSnapshot(
  profile: CompanyProfile,
  fallbacks?: Partial<IssuerSnapshotShape>,
): IssuerSnapshotShape {
  const name =
    profile.tradeName ||
    profile.name ||
    fallbacks?.tradeName ||
    fallbacks?.name ||
    "Entreprise";
  return {
    name,
    tradeName: profile.tradeName || profile.name || fallbacks?.tradeName || null,
    activity: profile.activity ?? fallbacks?.activity ?? null,
    siret: profile.siret ?? fallbacks?.siret ?? null,
    siren: profile.siren ?? null,
    vatNumber: profile.vatNumber ?? fallbacks?.vatNumber ?? null,
    apeCode: profile.apeCode ?? null,
    apeLabel: profile.apeLabel ?? null,
    legalForm: profile.legalForm ?? fallbacks?.legalForm ?? fallbacks?.formeJuridique ?? null,
    formeJuridique: profile.legalForm ?? fallbacks?.formeJuridique ?? null,
    capital: profile.capital ?? fallbacks?.capital ?? null,
    email: profile.email ?? fallbacks?.email ?? null,
    phone: profile.phone ?? fallbacks?.phone ?? null,
    website: profile.website ?? fallbacks?.website ?? null,
    addressLine1: profile.addressLine1 ?? fallbacks?.addressLine1 ?? null,
    addressLine2: profile.addressLine2 ?? fallbacks?.addressLine2 ?? null,
    city: profile.city ?? fallbacks?.city ?? null,
    postalCode: profile.postalCode ?? fallbacks?.postalCode ?? fallbacks?.zipCode ?? null,
    country: profile.country ?? fallbacks?.country ?? "France",
    logoPath: profile.logoPath ?? fallbacks?.logoPath ?? null,
  };
}

export function issuerSnapshotFromUnknown(raw: unknown): IssuerSnapshotShape | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    name: str(o.name),
    tradeName: str(o.tradeName),
    activity: str(o.activity),
    siret: str(o.siret)?.replace(/\s/g, "") ?? null,
    siren: str(o.siren)?.replace(/\s/g, "") ?? null,
    vatNumber: str(o.vatNumber)?.replace(/\s/g, "") ?? null,
    apeCode: str(o.apeCode),
    apeLabel: str(o.apeLabel),
    legalForm: str(o.legalForm ?? o.formeJuridique),
    formeJuridique: str(o.formeJuridique ?? o.legalForm),
    capital: str(o.capital),
    email: str(o.email),
    phone: str(o.phone),
    website: str(o.website),
    addressLine1: str(o.addressLine1 ?? o.address),
    addressLine2: str(o.addressLine2),
    city: str(o.city),
    postalCode: str(o.postalCode ?? o.zipCode),
    country: str(o.country) ?? "France",
    logoPath: str(o.logoPath),
  };
}

export function formatSiretDisplay(siret: string | null | undefined): string | null {
  if (!siret) return null;
  const d = siret.replace(/\D/g, "");
  if (d.length !== 14) return siret;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
}

export function formatSirenDisplay(siren: string | null | undefined): string | null {
  if (!siren) return null;
  const d = siren.replace(/\D/g, "");
  if (d.length !== 9) return siren;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}
