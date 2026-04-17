"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";

type Props = {
  /** Fond opaque sans blur (certaines pages marketing) */
  plainBg?: boolean;
  /** Affiche un lien « Blog » (désactiver sur /blog pour éviter un lien vers la page courante) */
  showBlogLink?: boolean;
  /** Contenu sous la barre principale (ex. bandeau ancres page d’accueil), dans le même header sticky */
  bottom?: ReactNode;
};

/**
 * En-tête commun pages vitrine : accès compte, navigation (méthode, forfaits) + rendez-vous découverte.
 */
export function MarketingSiteHeader({ plainBg = false, showBlogLink = true, bottom }: Props) {
  return (
    <header
      className={`sticky top-0 z-20 border-b border-[#c8cdd6] shadow-[0_1px_0_0_rgba(203,213,225,0.9)] ${
        plainBg ? "bg-[#f8f9fb]" : "bg-[#f8f9fb]/95 backdrop-blur-sm"
      }`}
    >
      <div
        className={`mx-auto flex max-w-6xl flex-col items-stretch gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4 ${bottom ? "border-b border-[#dce3ec]" : ""}`}
      >
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 sm:flex-1 sm:gap-4 md:gap-5 lg:gap-6"
          aria-label="BeWork — Accueil"
        >
          <span className="shrink-0">
            <BeWorkLogo size="sm" />
          </span>
          <span
            className="hidden h-9 w-px shrink-0 bg-gradient-to-b from-transparent via-[#94a3b8]/55 to-transparent sm:inline-block"
            aria-hidden
          />
          <span className="hidden min-w-0 text-left sm:block">
            <span className="block text-[0.8125rem] font-extrabold leading-snug tracking-tight text-[#0f172a] sm:text-sm lg:text-[0.9375rem]">
              Partenaire administratif{" "}
              <span className="font-bold text-[#94a3b8]">—</span>{" "}
              <span className="bg-gradient-to-b from-[#3b82f6] to-[#1d4ed8] bg-clip-text text-transparent">BTP</span>
            </span>
            <span className="mt-0.5 block text-[11px] font-medium leading-snug text-[#64748b] sm:text-xs">
              Cadre, rigueur, pilotage, lecture terrain
            </span>
          </span>
        </Link>
        <nav
          className="flex w-full flex-wrap items-center justify-start gap-1.5 sm:w-auto sm:justify-end sm:gap-2"
          aria-label="Navigation et accès plateforme"
        >
          <div
            className="flex items-center rounded-lg border border-[#e2e8f0] bg-white/80 px-0.5 py-0.5 shadow-sm sm:px-1"
            role="group"
            aria-label="Accès compte"
          >
            <Link
              href="/connexion"
              className="rounded-md px-2 py-1.5 text-xs font-medium text-[#334155] transition hover:bg-[#f1f5f9] hover:text-[#0f172a] sm:px-3 sm:text-sm"
            >
              Connexion
            </Link>
            <span className="mx-0.5 h-5 w-px shrink-0 bg-[#e2e8f0]" aria-hidden />
            <Link
              href="/inscription"
              className="rounded-md px-2 py-1.5 text-xs font-medium text-[#334155] transition hover:bg-[#f1f5f9] hover:text-[#0f172a] sm:px-3 sm:text-sm"
            >
              Espace client
            </Link>
          </div>
          {showBlogLink ? (
            <Link
              href="/blog"
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-[#64748b] transition hover:text-[#0f172a] sm:px-3 sm:text-sm"
            >
              Blog
            </Link>
          ) : null}
          <Link
            href="/notre-facon-de-travailler"
            className="rounded-lg px-2 py-1.5 text-xs font-medium text-[#64748b] transition hover:text-[#0f172a] sm:px-3 sm:text-sm"
            title="Notre méthode — flux, organisation et forfaits"
          >
            <span className="sm:hidden">Méthode</span>
            <span className="hidden sm:inline">Notre méthode</span>
          </Link>
          <Link
            href="/tarifs"
            className="rounded-lg surface-metallic-light px-2.5 py-1.5 text-xs font-medium text-[#1e293b] transition hover:bg-[#f8f9fb] sm:px-4 sm:py-2 sm:text-sm"
          >
            Forfaits
          </Link>
          <Link
            href="/contact"
            className="rounded-lg bg-[#1d4ed8] px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1e40af] sm:px-4 sm:py-2 sm:text-sm"
            aria-label="Rendez-vous découverte"
          >
            <span className="sm:hidden">Découverte</span>
            <span className="hidden sm:inline">Rendez-vous découverte</span>
          </Link>
        </nav>
      </div>
      {bottom}
    </header>
  );
}
