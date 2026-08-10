/** Tokens visuels — homepage premium BeWork (respiration, peu de bruit). */

export const HOME_SECTION =
  "scroll-mt-24 py-16 sm:py-20 md:py-28 lg:py-32" as const;

export const HOME_BG_WHITE = "bg-white" as const;
export const HOME_BG_SOFT = "bg-[#fafafa]" as const;
/** Alias — sections legacy hors homepage (tarifs, partenaire, etc.). */
export const HOME_BG_MUTED = HOME_BG_SOFT;

export const HOME_CARD =
  "rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]" as const;
export const HOME_CARD_SOFT = HOME_CARD;

export const HOME_EYEBROW =
  "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500" as const;

export const HOME_H2 =
  "font-display text-balance text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#0a0a0a] sm:text-[2.25rem] md:text-[2.75rem] lg:text-[3rem]" as const;

export const HOME_LEAD =
  "mt-5 max-w-2xl text-[1rem] leading-relaxed text-slate-600 sm:mt-6 sm:text-lg" as const;

export const HOME_HEADER = "mx-auto max-w-3xl text-center" as const;

export const HOME_CONTENT = "mt-12 sm:mt-14 md:mt-16" as const;

/** Apparition scroll — respectée via globals prefers-reduced-motion */
export const HOME_REVEAL =
  "motion-safe:animate-[home-fade-up_0.7s_ease-out_both]" as const;

export {
  CTA_PRIMARY as HOME_BTN_PRIMARY,
  CTA_SECONDARY as HOME_BTN_SECONDARY,
  CTA_SOFT as HOME_BTN_SOFT,
  CTA_GROUP as HOME_BTN_GROUP,
} from "@/components/marketing/marketingCtaStyles";
