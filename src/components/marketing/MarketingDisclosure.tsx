import type { ReactNode } from "react";

type MarketingDisclosureProps = {
  title: ReactNode;
  children: ReactNode;
  /** Premier panneau ouvert par défaut (HTML `open`) */
  defaultOpen?: boolean;
  /** Icône ou badge à gauche du titre */
  leading?: ReactNode;
  className?: string;
  panelClassName?: string;
};

const CHEVRON = (
  <span
    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition group-open:rotate-180"
    aria-hidden
  >
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </span>
);

/** Accordéon marketing cohérent (FAQ, menus mobile, sections longues). */
export function MarketingDisclosure({
  title,
  children,
  defaultOpen = false,
  leading,
  className = "",
  panelClassName = "",
}: MarketingDisclosureProps) {
  return (
    <details className={`group overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ${className}`} open={defaultOpen || undefined}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-left font-semibold text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-inset [&::-webkit-details-marker]:hidden sm:px-5 sm:py-4">
        <span className="flex min-w-0 flex-1 items-center gap-3">
          {leading ? <span className="shrink-0">{leading}</span> : null}
          <span className="text-sm leading-snug sm:text-base">{title}</span>
        </span>
        {CHEVRON}
      </summary>
      <div className={`border-t border-slate-100 ${panelClassName}`}>{children}</div>
    </details>
  );
}
