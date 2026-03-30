"use client";

import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";

type Props = {
  /** Fond opaque sans blur (certaines pages marketing) */
  plainBg?: boolean;
  /** Affiche un lien « Blog » (ex. article) */
  showBlogLink?: boolean;
};

/**
 * En-tête commun pages vitrine : accès compte, navigation (méthode, forfaits) + cadrage.
 */
export function MarketingSiteHeader({ plainBg = false, showBlogLink = false }: Props) {
  return (
    <header
      className={`sticky top-0 z-20 border-b border-[#c8cdd6] ${
        plainBg ? "bg-[#f8f9fb]" : "bg-[#f8f9fb]/95 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3.5 sm:gap-3 sm:px-6 sm:py-4">
        <Link href="/" className="min-w-0 shrink-0" aria-label="BeWork — Accueil">
          <BeWorkLogo size="sm" />
        </Link>
        <nav
          className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2"
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
          >
            Cadrage
          </Link>
        </nav>
      </div>
    </header>
  );
}
