/**
 * bework_quote_bundle_v1 — protocole d’échange ChatGPT → BeWork.
 * Les totaux financiers du JSON ne sont jamais une source de vérité.
 */

export const BEWORK_QUOTE_BUNDLE_FORMAT = "bework_quote_bundle_v1" as const;

export type BundleVisibility = "client" | "internal";

export type BundleEmailRole = "primary" | "secondary" | "professional" | "other";

export type BundleClientEmail = {
  email: string;
  role: BundleEmailRole;
};

export type BundleAddress = {
  line1: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
};

export type BundleClient = {
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  phone: string | null;
  emails: BundleClientEmail[];
  address: BundleAddress;
};

export type BundleSite = {
  sameAsClientAddress: boolean;
  address: BundleAddress | null;
  projectType: string | null;
  surfaceValue: number | null;
  surfaceUnit: string | null;
  accessNotes: string | null;
  constraints: string | null;
};

export type BundleQuoteMeta = {
  title: string | null;
  description: string | null;
  validityDays: number | null;
  pricingStrategy: string | null;
  vatSuggestedRate: number | null;
  vatRequiresConfirmation: boolean;
};

export type BundleLine = {
  designation: string;
  description: string | null;
  quantity: number;
  unit: string;
  unitPriceHt: number;
  vatRate: number | null;
  discountPercent: number | null;
};

export type BundleSection = {
  title: string;
  items: BundleLine[];
};

export type BundleTextBlock = {
  title: string | null;
  content: string;
  visibility: BundleVisibility;
};

export type BundleWorkStage = {
  order: number;
  title: string;
  description: string | null;
  mediaKey: string | null;
};

export type BundleMediaItem = {
  key: string;
  label: string;
  type: "photo" | "ai_preview" | "diagram" | "other";
  clientVisible: boolean;
  disclaimer: string | null;
  /** Rempli après upload dans BeWork (pas dans le JSON ChatGPT). */
  storageKey?: string | null;
  fileName?: string | null;
};

export type BeworkQuoteBundleV1 = {
  format: typeof BEWORK_QUOTE_BUNDLE_FORMAT;
  client: BundleClient;
  site: BundleSite;
  quote: BundleQuoteMeta;
  sections: BundleSection[];
  clientAdvice: BundleTextBlock[];
  reservations: BundleTextBlock[];
  internalNotes: BundleTextBlock[];
  workStages: BundleWorkStage[];
  warnings: string[];
  mediaManifest: BundleMediaItem[];
};

export type BundleParseIssue = {
  path: string;
  message: string;
  severity: "error" | "warn";
};

export type BundleParseResult =
  | { ok: true; bundle: BeworkQuoteBundleV1; warnings: BundleParseIssue[]; fingerprint: string }
  | { ok: false; errors: BundleParseIssue[]; rawKept: true };
