"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";

type Props = {
  /** Fond opaque sans blur (certaines pages marketing) */
  plainBg?: boolean;
  /** Affiche un lien « Blog » (désactiver sur /blog pour éviter un lien vers la page courante) */
  showBlogLink?: boolean;
  /**
   * Slogan page d’accueil : deuxième rangée, centré sur la largeur du header ;
   * les sous-titres « Partenaire administratif — BTP » passent sur cette rangée (gauche), comme la maquette.
   */
  centerSlot?: ReactNode;
  /** Contenu sous la barre principale (ex. bandeau ancres page d’accueil), dans le même header sticky */
  bottom?: ReactNode;
};

function BrandTaglines({ className = "" }: { className?: string }) {
  return (
    <div className={`min-w-0 text-left ${className}`}>
      <span className="block text-[0.8125rem] font-extrabold leading-snug tracking-tight text-black sm:text-sm lg:text-[0.9375rem] lg:leading-snug">
        Partenaire administratif <span className="font-bold text-[#94a3b8]">—</span>{" "}
        <span className="bg-gradient-to-b from-[#3b82f6] to-[#1d4ed8] bg-clip-text text-transparent">BTP</span>
      </span>
      <span className="mt-1.5 block text-[11px] font-medium leading-relaxed text-black sm:mt-2 sm:text-xs md:text-[0.8125rem] md:leading-relaxed">
        Devis, facturation, relances, dossiers chantier BTP
      </span>
    </div>
  );
}

/**
 * En-tête commun pages vitrine : accès compte, navigation (méthode, forfaits) + rendez-vous découverte.
 */
export function MarketingSiteHeader({ plainBg = false, showBlogLink = true, centerSlot, bottom }: Props) {
  const nav = (
    <nav
      className="flex w-full flex-wrap items-center justify-start gap-1.5 pt-0.5 sm:w-auto sm:shrink-0 sm:justify-end sm:gap-2 sm:pt-1"
      aria-label="Navigation et accès plateforme"
    >
      <div
        className="flex items-center rounded-full border border-[#e2e8f0] bg-white/90 px-0.5 py-0.5 shadow-sm sm:px-1"
        role="group"
        aria-label="Accès compte"
      >
        <Link
          href="/connexion"
          className="rounded-full px-2 py-1.5 text-xs font-medium text-black transition hover:bg-[#f1f5f9] hover:text-black sm:px-3 sm:text-sm"
        >
          Connexion
        </Link>
        <span className="mx-0.5 h-5 w-px shrink-0 bg-[#e2e8f0]" aria-hidden />
        <Link
          href="/inscription"
          className="rounded-full px-2 py-1.5 text-xs font-medium text-black transition hover:bg-[#f1f5f9] hover:text-black sm:px-3 sm:text-sm"
        >
          Espace client
        </Link>
      </div>
      {showBlogLink ? (
        <Link
          href="/blog"
          className="rounded-lg px-2 py-1.5 text-xs font-medium text-black transition hover:text-black sm:px-3 sm:text-sm"
        >
          Blog
        </Link>
      ) : null}
      <Link
        href="/notre-facon-de-travailler"
        className="rounded-lg px-2 py-1.5 text-xs font-medium text-black transition hover:text-black sm:px-3 sm:text-sm"
        title="Notre méthode — flux, organisation et forfaits"
      >
        <span className="sm:hidden">Méthode</span>
        <span className="hidden sm:inline">Notre méthode</span>
      </Link>
      <Link
        href="/tarifs"
        className="rounded-lg surface-metallic-light px-2.5 py-1.5 text-xs font-medium text-black transition hover:bg-[#f8f9fb] sm:px-4 sm:py-2 sm:text-sm"
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
  );

  return (
    <header
      className={`sticky top-0 z-20 border-b border-[#c8cdd6] shadow-[0_1px_0_0_rgba(203,213,225,0.9)] ${
        plainBg ? "bg-[#f8f9fb]" : "bg-[#f8f9fb]/95 backdrop-blur-sm"
      }`}
    >
      <div
        className={`mx-auto flex max-w-6xl flex-col items-stretch gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5 md:gap-6 ${bottom && !centerSlot ? "border-b border-[#dce3ec]" : ""}`}
      >
        {centerSlot ? (
          <>
            {/*
              Grille : colonne 1 = marque / sous-titres, colonne 3 = nav puis slogan.
              Le slogan est centré dans la même largeur que la barre Connexion → Rendez-vous découverte.
            */}
            <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-end lg:gap-x-6">
              <div className="flex flex-row items-start justify-between gap-4 lg:contents [&>*]:min-w-0">
                <Link
                  href="/"
                  className="group w-fit shrink-0 transition-opacity hover:opacity-90 lg:col-start-1 lg:row-start-1 lg:self-start"
                  aria-label="BeWork — Accueil"
                >
                  <BeWorkLogo size="sm" />
                </Link>
                <div className="flex shrink-0 justify-end lg:col-start-3 lg:row-start-1 lg:justify-self-end">{nav}</div>
              </div>
              <Link
                href="/"
                className="min-w-0 justify-self-start text-left hover:opacity-95 lg:col-start-1 lg:row-start-2"
              >
                <BrandTaglines />
              </Link>
              <div className="min-w-0 w-full text-center lg:col-start-3 lg:row-start-2 lg:w-full lg:max-w-none lg:justify-self-stretch">
                {centerSlot}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 lg:gap-8">
            <Link
              href="/"
              className="group flex min-w-0 flex-col gap-3 sm:max-w-xl sm:gap-3.5 md:gap-4 lg:max-w-[min(100%,20rem)] xl:max-w-xs"
              aria-label="BeWork — Accueil"
            >
              <span className="shrink-0 w-fit transition-opacity group-hover:opacity-90">
                <BeWorkLogo size="sm" />
              </span>
              <BrandTaglines />
            </Link>
            {nav}
          </div>
        )}
      </div>
      {bottom}
    </header>
  );
}
