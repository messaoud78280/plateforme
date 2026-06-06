import { BEWORK_VALUE_PILLARS } from "@/lib/bework-value-pillars";
import { Check } from "lucide-react";

type Props = {
  /** hero = bandeau compact sous le hero · grid = cartes crédibilité · inline = liste simple */
  variant?: "hero" | "grid" | "inline";
  className?: string;
  id?: string;
};

export function BeWorkValuePillars({ variant = "grid", className = "", id }: Props) {
  if (variant === "inline") {
    return (
      <ul
        id={id}
        className={`grid gap-2 sm:grid-cols-2 ${className}`.trim()}
        aria-label="Atouts BeWork"
      >
        {BEWORK_VALUE_PILLARS.map((pillar) => (
          <li key={pillar.label} className="flex items-start gap-2 text-[14px] leading-snug text-slate-800">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1d4ed8]" strokeWidth={2.5} aria-hidden />
            <span className="font-medium">{pillar.label}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (variant === "hero") {
    return (
      <ul
        id={id}
        className={`mt-6 grid w-full max-w-[580px] grid-cols-1 gap-2 rounded-xl border border-slate-200/70 bg-white/[0.78] p-3 shadow-[0_8px_28px_-18px_rgba(15,23,42,0.1)] backdrop-blur-md sm:max-w-none sm:grid-cols-2 sm:gap-x-4 sm:gap-y-2.5 sm:p-4 lg:mx-0 lg:max-w-none ${className}`.trim()}
        aria-label="Atouts BeWork"
      >
        {BEWORK_VALUE_PILLARS.map((pillar) => (
          <li key={pillar.label} className="flex items-start gap-2.5 py-1 sm:py-0.5">
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-[#1d4ed8]"
              aria-hidden
            >
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            <span className="min-w-0 text-left text-[13px] font-semibold leading-snug tracking-tight text-[#171717] sm:text-[13.5px]">
              {pillar.label}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div
      id={id}
      className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`.trim()}
      aria-label="Atouts BeWork"
    >
      {BEWORK_VALUE_PILLARS.map((pillar) => (
        <article
          key={pillar.label}
          className="flex items-start gap-3 rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80 md:gap-4 md:p-6"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-[#1d4ed8] shadow-sm ring-1 ring-blue-100/90 md:h-11 md:w-11"
            aria-hidden
          >
            <Check className="h-5 w-5 md:h-[1.35rem] md:w-[1.35rem]" strokeWidth={2.5} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-sans text-[14px] font-bold leading-snug tracking-tight text-[#0f172a] md:text-[15px]">
              {pillar.label}
            </h3>
            <div className="mt-2 h-0.5 w-12 rounded-sm bg-[#1d4ed8]" aria-hidden />
            <p className="mt-2.5 text-[13px] leading-relaxed text-slate-600 md:text-sm">{pillar.detail}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
