import type { ReactNode } from "react";

/** Bloc « En résumé » — même charte que le TL;DR des articles blog. */
export function SeoEnResumeBlock({ title = "En résumé", children }: { title?: string; children: ReactNode }) {
  return (
    <aside
      className="not-prose rounded-2xl border border-[#1d4ed8]/30 bg-gradient-to-br from-[#eff6ff] via-white to-[#eff6ff] p-6 shadow-[0_10px_40px_-22px_rgba(29,78,216,0.45)] md:p-7"
      aria-label={title}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1d4ed8]">{title}</p>
      <div className="mt-4 text-[0.97rem] leading-relaxed text-slate-800">{children}</div>
    </aside>
  );
}

/** Carte checklist — alignée sur les guides /ressources. */
export function SeoChecklistCard({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
  return (
    <div className="not-prose rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-bold tracking-tight text-slate-900">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2">
            <span className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-[#1d4ed8]" aria-hidden />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Encadré objectif / contexte — fond blanc carte. */
export function SeoObjectiveCard({ children }: { children: ReactNode }) {
  return (
    <div className="not-prose rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700 shadow-sm">
      {children}
    </div>
  );
}
