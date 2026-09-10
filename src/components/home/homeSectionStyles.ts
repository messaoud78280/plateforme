/**
 * Design system BeWork — tokens alignés sur le hero maquette validé.
 */

export const BW = {
  blue: "#2563eb",
  blueDeep: "#1d4ed8",
  ink: "#0a0a0a",
  muted: "#64748b",
  canvas: "#f7f8fb",
  violetSoft: "#c4b5fd",
  peachSoft: "#fdba74",
} as const;

/** Section standard — paddings maîtrisés (pas de vide mort). */
export const BW_SECTION =
  "relative scroll-mt-28 overflow-hidden py-14 sm:py-16 md:py-20 lg:py-24" as const;

export const BW_SECTION_TIGHT =
  "relative scroll-mt-28 overflow-hidden py-12 sm:py-14 md:py-16" as const;

export const BW_EYEBROW =
  "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500" as const;

export const BW_PILL =
  "inline-flex items-center gap-1.5 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.04em] text-[#1d4ed8]" as const;

export const BW_H2 =
  "font-display text-[1.85rem] font-extrabold leading-[1.06] tracking-[-0.04em] text-[#0a0a0a] sm:text-[2.5rem] md:text-[3rem]" as const;

export const BW_LEAD =
  "mt-4 max-w-xl text-[1rem] leading-relaxed text-slate-500 sm:mt-5 sm:text-[1.05rem]" as const;

export const BW_CARD =
  "rounded-[1.35rem] border border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]" as const;

export const BW_BTN_PRIMARY =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#2563eb] px-6 text-[0.95rem] font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.32)] transition hover:bg-[#1d4ed8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]" as const;

export const BW_BTN_SECONDARY =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200/90 bg-white px-5 text-[0.95rem] font-semibold text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]/40" as const;

/* ——— Compat legacy ——— */

export const HOME_SECTION = BW_SECTION;
export const HOME_BG_WHITE = "bg-white" as const;
export const HOME_BG_SOFT = "bg-[#f7f8fb]" as const;
export const HOME_BG_MUTED = HOME_BG_SOFT;
export const HOME_CARD = BW_CARD;
export const HOME_CARD_SOFT = HOME_CARD;
export const HOME_EYEBROW = BW_EYEBROW;
export const HOME_H2 = BW_H2;
export const HOME_LEAD = BW_LEAD;
export const HOME_HEADER = "mx-auto max-w-3xl text-center" as const;
export const HOME_CONTENT = "mt-10 sm:mt-12 md:mt-14" as const;
export const HOME_REVEAL =
  "motion-safe:animate-[home-fade-up_0.7s_ease-out_both]" as const;

/** Réexport — compat si un module importe encore depuis homeSectionStyles. */
export { BwAtmosphere } from "./BwAtmosphere";

export {
  CTA_PRIMARY as HOME_BTN_PRIMARY,
  CTA_SECONDARY as HOME_BTN_SECONDARY,
  CTA_SOFT as HOME_BTN_SOFT,
  CTA_GROUP as HOME_BTN_GROUP,
} from "@/components/marketing/marketingCtaStyles";
