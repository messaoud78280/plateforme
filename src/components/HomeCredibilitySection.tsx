import Image from "next/image";
import Link from "next/link";
import { useId } from "react";

/** Section crédibilité BTP — sous les tarifs, même univers visuel métallique / premium */
export function HomeCredibilitySection() {
  return (
    <section
      id="preuve-credibilite"
      className="relative scroll-mt-28 overflow-hidden px-6 pb-14 pt-14 md:scroll-mt-32 md:pb-16 md:pt-18 lg:pt-22"
      style={{ scrollMarginTop: "7.5rem" }}
      aria-labelledby="credibility-heading"
    >
      {/* Courbe grise — fond uniquement, derrière le contenu */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[min(38%,18rem)] rounded-l-[88px] bg-gradient-to-l from-slate-200/30 via-slate-100/15 to-transparent opacity-[0.42] md:w-[min(36%,22rem)] md:rounded-l-[110px] md:opacity-35"
      />

      <div className="relative z-[1] mx-auto w-full max-w-6xl">
        {/* Header — max 720px, aligné gauche */}
        <header className="mb-6 text-left md:mb-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#1d4ed8] md:text-[12px]">
            Preuve &amp; crédibilité
          </p>
          <h2
            id="credibility-heading"
            className="mt-2.5 max-w-[720px] text-balance font-sans text-[1.625rem] font-bold leading-[1.2] tracking-tight text-[#0f172a] md:text-3xl lg:text-[2rem]"
          >
            Une méthode née du terrain BTP<span className="text-[#1d4ed8]">.</span>
          </h2>
          <p className="mt-3 max-w-[720px] text-[15px] leading-relaxed text-slate-600 md:text-base">
            BeWork n&apos;est pas une plateforme générique. L&apos;offre s&apos;appuie sur plus de 20 ans d&apos;expérience
            terrain dans le bâtiment, la gestion de chantier et l&apos;administratif.
          </p>
        </header>

        {/* Fondatrice + Notre rôle (au-dessus des 3 cartes crédibilité) */}
        <div className="mb-7 grid gap-4 md:mb-8 md:grid-cols-2 md:items-stretch md:gap-5">
          <article className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_4px_24px_-8px_rgba(15,23,42,0.08)]">
            <div className="flex h-full flex-col sm:flex-row">
              <div className="relative h-36 w-full shrink-0 sm:h-auto sm:min-h-[148px] sm:w-[44%] sm:max-w-[200px] md:min-h-[136px]">
                <Image
                  src="/laure-olivie-chantier.png"
                  alt="Laure Olivie, fondatrice de BeWork, sur chantier"
                  fill
                  className="object-cover object-[center_20%]"
                  sizes="(max-width:640px) 100vw, 200px"
                  priority={false}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center px-5 py-3 sm:py-4 md:px-6">
                <p className="font-sans text-[15px] font-semibold leading-snug text-[#0f172a] md:text-base">
                  Laure Olivie — fondatrice BeWork
                </p>
                <p className="mt-1.5 text-[13px] text-slate-600 md:text-sm">
                  Dirigeante BTP, 20 ans terrain en Île-de-France.
                </p>
                <div className="my-2.5 border-t border-slate-200/90" aria-hidden />
                <p className="text-[13px] leading-relaxed text-slate-600 md:text-sm">
                  Une approche issue du réel, pas de la théorie.
                </p>
              </div>
            </div>
          </article>

          <article className="flex items-center gap-4 rounded-xl border border-slate-200/90 bg-[#f4f7fa] p-4 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.06)] md:max-w-xl md:justify-self-end md:gap-5 md:p-5">
            <span
              className="flex h-[5.75rem] w-[5.75rem] shrink-0 items-center justify-center rounded-full bg-[#e1e9f5] text-[#1d4ed8] shadow-sm shadow-blue-900/[0.04] md:h-[6.5rem] md:w-[6.5rem]"
              aria-hidden
            >
              <IconTarget className="h-[2.75rem] w-[2.75rem] md:h-12 md:w-12" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-sans text-base font-bold text-[#0f172a] md:text-[1.05rem]">Notre rôle</h3>
              <div className="mt-2 h-1 w-14 rounded-sm bg-[#1d4ed8]" aria-hidden />
              <p className="mt-2 text-[14px] font-semibold leading-snug text-[#0f172a] md:text-[15px]">
                Tenir un relais administratif fiable, dans un cadre clair et structuré.
              </p>
              <div className="my-2.5 border-t border-slate-300/60" aria-hidden />
              <p className="text-[13px] leading-relaxed text-slate-600 md:text-sm">Pas empiler des dossiers.</p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-600 md:text-sm">
                Mettre en place une organisation qui tient.
              </p>
            </div>
          </article>
        </div>

        {/* 3 cartes — compactes (~180–210px), p-6 */}
        <div className="grid gap-4 md:grid-cols-3 md:gap-5">
          <article className="flex items-start gap-4 rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80 md:min-h-[180px] md:gap-5 md:p-6">
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-[#1d4ed8] shadow-sm shadow-blue-900/[0.05] ring-1 ring-blue-100/90 md:h-20 md:w-20"
              aria-hidden
            >
              <IconHardHat className="h-9 w-9 md:h-11 md:w-11" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-sans text-[15px] font-bold leading-snug tracking-tight text-[#0f172a] md:text-base">
                +20 ans d&apos;expérience BTP
              </h3>
              <div
                className="mt-2.5 h-1 w-[3.25rem] rounded-sm bg-[#1d4ed8] md:w-16"
                aria-hidden
              />
              <p className="mt-3 text-[13px] leading-relaxed text-slate-600 md:text-sm">
                Lecture terrain des contraintes chantier, délais, marges et urgences.
              </p>
            </div>
          </article>

          <article className="flex items-start gap-4 rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80 md:min-h-[180px] md:gap-5 md:p-6">
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-[#1d4ed8] shadow-sm shadow-blue-900/[0.05] ring-1 ring-blue-100/90 md:h-20 md:w-20"
              aria-hidden
            >
              <IconBuilding2 className="h-9 w-9 md:h-11 md:w-11" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-sans text-[15px] font-bold leading-snug tracking-tight text-[#0f172a] md:text-base">
                Connaissance métier
              </h3>
              <div
                className="mt-2.5 h-1 w-[3.25rem] rounded-sm bg-[#1d4ed8] md:w-16"
                aria-hidden
              />
              <p className="mt-3 text-[13px] leading-relaxed text-slate-600 md:text-sm">
                Devis, factures, relances, fournisseurs, dossiers chantier : on{" "}
                <span className="font-semibold text-slate-800">parle le langage du BTP.</span>
              </p>
            </div>
          </article>

          <article className="flex items-start gap-4 rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80 md:min-h-[180px] md:gap-5 md:p-6">
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-[#1d4ed8] shadow-sm shadow-blue-900/[0.05] ring-1 ring-blue-100/90 md:h-20 md:w-20"
              aria-hidden
            >
              <IconWorkflow className="h-9 w-9 md:h-11 md:w-11" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-sans text-[15px] font-bold leading-snug tracking-tight text-[#0f172a] md:text-base">
                Méthode &amp; outils
              </h3>
              <div
                className="mt-2.5 h-1 w-[3.25rem] rounded-sm bg-[#1d4ed8] md:w-16"
                aria-hidden
              />
              <p className="mt-3 text-[13px] leading-relaxed text-slate-600 md:text-sm">
                BATIPRIX, suivi structuré, plateforme privée et IA : des process pour gagner du temps sans perdre le contrôle.
              </p>
            </div>
          </article>
        </div>

        {/* Bandeau : gauche icône + texte + drapeau · séparateur · CTA */}
        <div className="mt-7 rounded-xl border border-slate-200/90 bg-white px-4 py-4 shadow-[0_2px_16px_-6px_rgba(15,23,42,0.06)] md:mt-8 md:flex md:min-h-[5.75rem] md:items-center md:px-7 md:py-5">
          <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:gap-6">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 md:gap-4">
              <span
                className="flex h-11 w-11 shrink-0 -translate-x-1 items-center justify-center rounded-full bg-[#eff6ff] text-[#1d4ed8] ring-1 ring-blue-100/80 md:h-12 md:w-12 md:-translate-x-1.5"
                aria-hidden
              >
                <IconShield className="h-[1.625rem] w-[1.625rem] md:h-7 md:w-7" />
              </span>
              <div className="flex min-w-0 flex-wrap items-center gap-2 md:gap-2">
                <p className="min-w-0 max-w-[min(100%,28rem)] text-[14px] font-bold leading-snug text-[#0f172a] md:text-[15px] md:leading-snug">
                  Société française, pilotée depuis la France, avec une plateforme privée et sécurisée.
                </p>
                <span
                  className="shrink-0 text-[2rem] leading-none md:text-[2.25rem]"
                  aria-hidden
                  title="France"
                >
                  🇫🇷
                </span>
              </div>
            </div>

            <div
              aria-hidden
              className="hidden h-12 w-px shrink-0 self-center bg-slate-200 md:block md:h-16 md:mx-2"
            />

            <div className="flex shrink-0 md:justify-end">
              <Link
                href="#comment-ca-marche"
                className="inline-flex w-full min-h-[2.875rem] items-center justify-center gap-1.5 rounded-lg bg-[#1d4ed8] px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-[#1d4ed8]/22 transition hover:bg-[#1e40af] md:w-auto md:min-h-[3rem] md:px-6 md:text-sm"
              >
                Découvrir comment ça marche
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Casque de sécurité — tracé Lucide « HardHat » (arcs complets + bandeau) */
function IconHardHat({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />
      <path d="M14 6a6 6 0 0 1 6 6v3" />
      <path d="M4 15v-3a6 6 0 0 1 6-6" />
      <rect x="2" y="15" width="20" height="4" rx="1" />
    </svg>
  );
}

/** Immeuble / entreprise — tracé Lucide « Building2 » */
function IconBuilding2({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10 12h4" />
      <path d="M10 8h4" />
      <path d="M14 21v-3a2 2 0 0 0-4 0v3" />
      <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
      <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
    </svg>
  );
}

/** Processus / méthode — tracé Lucide « Workflow » */
function IconWorkflow({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect width="8" height="8" x="3" y="3" rx="2" />
      <path d="M7 11v4a2 2 0 0 0 2 2h4" />
      <rect width="8" height="8" x="13" y="13" rx="2" />
    </svg>
  );
}

function IconTarget({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.75" fill="currentColor" stroke="none" />
      <path d="M20 5 13.5 11.5M20 5h-4M20 5v4" />
    </svg>
  );
}

/** Bouclier échiqueté (privé / sécurisé) — même motif que logo type capture */
function IconShield({ className }: { className?: string }) {
  const clipId = useId().replace(/:/g, "");
  const d = "M12 3 5 6v6c0 5 4 9 7 9s7-4 7-9V6l-7-3Z";
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <defs>
        <clipPath id={clipId}>
          <path d={d} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <path fill="currentColor" d={d} />
        <path fill="#ffffff" d="M12 3 19 6 12 12Z" />
        <path fill="#ffffff" d="M5 6 12 21 12 12Z" />
      </g>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinecap="round"
        strokeLinejoin="round"
        d={d}
      />
    </svg>
  );
}
