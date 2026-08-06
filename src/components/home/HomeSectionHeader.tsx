import type { ReactNode } from "react";

type HomeSectionHeaderProps = {
  id: string;
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  className?: string;
};

/** En-tête de section standardisé (H2 + lead). */
export function HomeSectionHeader({ id, eyebrow, title, lead, className = "" }: HomeSectionHeaderProps) {
  return (
    <header className={`mx-auto max-w-3xl text-center ${className}`.trim()}>
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1d4ed8]">{eyebrow}</p>
      ) : null}
      <h2
        id={id}
        className={`font-display text-balance text-[1.625rem] font-extrabold leading-[1.15] tracking-tight text-[#0f172a] sm:text-[1.875rem] md:text-[2.5rem] ${
          eyebrow ? "mt-3" : ""
        }`}
      >
        {title}
      </h2>
      {lead ? (
        <div className="mt-4 text-[0.9375rem] leading-relaxed text-slate-600 sm:mt-6 sm:text-base md:text-lg md:leading-relaxed">{lead}</div>
      ) : null}
    </header>
  );
}
