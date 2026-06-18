import Link from "next/link";
import type { CasClientFeaturedCase, CasClientSimpleCase } from "@/content/cas-clients-catalog";

type FeaturedProps = { case: CasClientFeaturedCase };
type SimpleProps = { case: CasClientSimpleCase };

export function CasClientFeaturedCard({ case: c }: FeaturedProps) {
  return (
    <article className="flex flex-col rounded-2xl border-2 border-[#1d4ed8]/25 bg-white p-7 shadow-sm ring-1 ring-[#1d4ed8]/10 md:col-span-2 lg:col-span-3">
      <div className="flex flex-wrap gap-2">
        {c.badges.map((b) => (
          <span
            key={b}
            className="rounded-full bg-[#1d4ed8]/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#1d4ed8]"
          >
            {b}
          </span>
        ))}
      </div>
      <h2 className="mt-4 text-xl font-semibold text-black">{c.cardTitle}</h2>
      <p className="mt-2 text-sm font-medium text-[#1e3a5f]">{c.cardSubtitle}</p>
      <p className="mt-3 text-sm leading-relaxed text-black">{c.cardSummary}</p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href={c.href}
          className="inline-flex justify-center rounded-lg bg-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1e40af]"
        >
          Voir le cas client
        </Link>
        <a
          href={`${c.href}#rapport-dtu`}
          className="inline-flex justify-center rounded-lg border-2 border-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-[#1d4ed8] hover:bg-[#eff6ff]"
        >
          Rapport DTU
        </a>
        <a
          href={c.pdfCompleteHref}
          download
          className="inline-flex justify-center rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          PDF cas client
        </a>
      </div>
    </article>
  );
}

export function CasClientSimpleCard({ case: c }: SimpleProps) {
  return (
    <article className="rounded-2xl surface-metallic-light p-7">
      <h2 className="text-lg font-semibold text-black">{c.title}</h2>
      {c.profil ? (
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[#1e3a5f]">{c.profil}</p>
      ) : null}
      {c.contexte ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          <span className="font-semibold text-black">Contexte :</span> {c.contexte}
        </p>
      ) : null}
      <div className="mt-4 space-y-3 text-sm text-black">
        <p>
          <span className="font-semibold text-black">Avant :</span> {c.before}
        </p>
        {c.mission ? (
          <p>
            <span className="font-semibold text-black">Mission BeWork :</span> {c.mission}
          </p>
        ) : null}
        <p>
          <span className="font-semibold text-black">Après :</span> {c.after}
        </p>
      </div>
      <ul className="mt-5 space-y-2 text-sm text-black" role="list">
        {c.kpis.map((k) => (
          <li key={k} className="flex items-start gap-2">
            <span className="mt-0.5 text-[#1d4ed8]" aria-hidden>
              ✓
            </span>
            <span>{k}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
