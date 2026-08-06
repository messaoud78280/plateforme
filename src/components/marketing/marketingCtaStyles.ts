/**
 * Styles CTA marketing unifiés — une ligne, centrés, compacts.
 * À utiliser sur l’accueil, le header, tarifs et landings publiques.
 */

export const CTA_PRIMARY =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#1d4ed8] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e40af] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4ed8]/50 sm:h-12 sm:px-6 sm:text-[0.9375rem]" as const;

export const CTA_SECONDARY =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-[#0f172a] shadow-sm transition hover:border-[#1d4ed8]/35 hover:bg-[#f8fafc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4ed8]/35 sm:h-12 sm:px-6 sm:text-[0.9375rem]" as const;

export const CTA_SOFT =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-[#1d4ed8]/25 bg-[#eff6ff] px-5 text-sm font-semibold text-[#1e3a8a] transition hover:bg-[#dbeafe] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4ed8]/35 sm:h-12 sm:px-6 sm:text-[0.9375rem]" as const;

/** Conteneur pour groupes de CTA (évite l’écrasement / wrap moche). */
export const CTA_GROUP =
  "flex flex-wrap items-center gap-3" as const;
