import Link from "next/link";

/** Boutons marketing alignés sur l’accueil BeWork */
export const resourcesBtnPrimary =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-[#2563eb]/70 bg-gradient-to-b from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] px-6 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_20px_rgba(29,78,216,0.28)] transition hover:border-[#3b82f6] hover:from-[#2563eb] hover:via-[#1d4ed8] hover:to-[#1e40af] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_6px_24px_rgba(29,78,216,0.34)] active:translate-y-px";

export const resourcesBtnSecondary =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 px-6 text-sm font-semibold text-slate-800 shadow-[0_6px_20px_-14px_rgba(15,23,42,0.12)] ring-1 ring-slate-100/80 backdrop-blur-[2px] transition hover:border-slate-300 hover:bg-white hover:shadow-[0_10px_28px_-16px_rgba(15,23,42,0.14)]";

export const resourcesCardShell =
  "group/card relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-md shadow-slate-900/[0.06] ring-1 ring-black/[0.03] transition-[transform,box-shadow,border-color] duration-300 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-slate-300/90 motion-safe:hover:shadow-xl motion-safe:hover:shadow-slate-900/[0.1] motion-reduce:transition-none sm:p-5";

export const resourcesIconWrap =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eff6ff] text-[#2563eb] ring-1 ring-blue-100/90 shadow-sm shadow-slate-900/[0.04] sm:h-11 sm:w-11";

export const resourcesCardLinkBtn =
  "inline-flex min-h-10 w-full items-center justify-center rounded-full bg-gradient-to-b from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] px-4 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(29,78,216,0.22)] transition hover:from-[#2563eb] hover:via-[#1d4ed8] hover:to-[#1e40af] sm:w-auto sm:min-h-11 sm:px-5";

export function ResourcesSectionHeader({
  id,
  title,
  description,
  linkHref,
  linkLabel,
}: {
  id: string;
  title: string;
  description: string;
  linkHref?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center md:max-w-3xl">
      <h2 id={id} className="font-heading text-2xl font-bold tracking-tight text-[#0f172a] sm:text-[1.65rem]">
        {title}
      </h2>
      <p className="mt-2 text-base leading-relaxed text-slate-600">{description}</p>
      {linkHref && linkLabel ? (
        <Link
          href={linkHref}
          className="mt-3 inline-flex text-sm font-semibold text-[#2563eb] underline-offset-4 transition hover:text-[#1d4ed8] hover:underline"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

function CategoryIconSvg({ id }: { id: string }) {
  const cn = "h-[22px] w-[22px]";
  switch (id) {
    case "gestion-chantier":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 12h6M9 16h4" strokeLinecap="round" />
        </svg>
      );
    case "appels-offres":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path d="M8 21h10a2 2 0 002-2V9l-5-6H8a2 2 0 00-2 2v13a2 2 0 002 2z" strokeLinejoin="round" />
          <path d="M13 4v7h7M10 17h9" strokeLinecap="round" />
        </svg>
      );
    case "documents-admin":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path d="M4 18V6a2 2 0 012-2h4l2 3h8a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2z" strokeLinejoin="round" />
        </svg>
      );
    case "securite":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path d="M12 3l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V7l8-4z" strokeLinejoin="round" />
          <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "devis-facturation":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path d="M12 3v18M7 8h4.5a2.5 2.5 0 010 5H7M17 16H12.5a2.5 2.5 0 000-5H17" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <circle cx="12" cy="8" r="3" />
          <path d="M5 20c1.2-4 3.8-6 7-6s5.8 2 7 6" strokeLinecap="round" />
          <path d="M16 4l2 2M20 8h-3" strokeLinecap="round" />
        </svg>
      );
  }
}

export function ResourcesThemeCard({
  id,
  title,
  description,
  links,
}: {
  id: string;
  title: string;
  description: string;
  links: { href: string; label: string }[];
}) {
  return (
    <article className={`${resourcesCardShell} p-5 sm:p-6`}>
      <span
        className="pointer-events-none absolute inset-x-5 bottom-0 h-[2px] rounded-t-full bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] opacity-0 transition-opacity duration-300 motion-safe:group-hover/card:opacity-90 sm:inset-x-6"
        aria-hidden
      />
      <div className="flex items-start gap-3">
        <span className={resourcesIconWrap} aria-hidden>
          <CategoryIconSvg id={id} />
        </span>
        <div className="min-w-0 flex-1 text-left">
          <h3 className="font-heading text-lg font-bold tracking-tight text-[#0f172a]">{title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{description}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm font-medium">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-[#2563eb] underline-offset-2 transition hover:text-[#1d4ed8] hover:underline">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
