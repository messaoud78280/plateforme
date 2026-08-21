"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { MarketingDisclosure } from "@/components/marketing/MarketingDisclosure";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";
import { MarketingHeaderBlueprintDecor } from "@/components/layout/MarketingHeaderBlueprintDecor";
import { CTA_PRIMARY, CTA_SECONDARY } from "@/components/marketing/marketingCtaStyles";
import { BEWORK_BRAND_SIGNATURE } from "@/lib/seo-keywords";

type Props = {
  /** Fond opaque (pages sur fond déjà uni) */
  plainBg?: boolean;
};

type SolutionMenuIconId = "devis" | "folder" | "invoice" | "cart" | "calendar" | "document";

type ResourceMenuIconId =
  | "book"
  | "globe"
  | "users"
  | "document"
  | "question"
  | "calculator"
  | "newspaper";

const SOLUTION_MENU_ENTRIES: {
  href: string;
  title: string;
  description: string;
  icon: SolutionMenuIconId;
  accentColor: string;
}[] = [
  {
    href: '/#plateforme',
    title: 'Plateforme BeWork',
    description: 'Chantiers, documents, planning, gestion — tout au même endroit.',
    icon: 'folder',
    accentColor: '#2563eb',
  },
  {
    href: '/#connexions',
    title: 'Connexions logiciels',
    description: 'Vos outils existants reliés à votre plateforme, sans double saisie.',
    icon: 'devis',
    accentColor: '#7c3aed',
  },
  {
    href: '/#automatisations',
    title: 'Automatisations',
    description: "Ce que vos équipes répètent — automatisé autour de vos processus.",
    icon: 'calendar',
    accentColor: '#ea580c',
  },
  {
    href: '/#solutions-avancees',
    title: 'Solutions sur mesure',
    description: "Outils métier spécifiques, applications et IA lorsque nécessaire.",
    icon: 'document',
    accentColor: '#7c3aed',
  },
  {
    href: '/notre-facon-de-travailler',
    title: 'Notre méthode',
    description: 'Comprendre, concevoir, connecter, construire, former, faire évoluer.',
    icon: 'invoice',
    accentColor: '#0d9488',
  },
];

/** Sous-rubriques du menu « Ressources » (la page hub est /ressources). */
const RESOURCE_MENU_ENTRIES: {
  href: string;
  title: string;
  description: string;
  icon: ResourceMenuIconId;
}[] = [
  {
    href: "/ressources",
    title: "Centre de ressources BTP",
    description: "Guides, tutoriels et contenus métier BeWork.",
    icon: "globe",
  },
  {
    href: "/ressources/tutos",
    title: "Tutoriels",
    description: "Tutoriels PDF — CR, DCE, PPSPS, mémoires techniques…",
    icon: "document",
  },
  {
    href: "/ressources/guides",
    title: "Guides",
    description: "Guides longs : conduite de travaux, IA & organisation.",
    icon: "book",
  },
  {
    href: "/blog",
    title: "Blog",
    description: "Articles BTP : planning, aléas, relances, retours d’expérience.",
    icon: "newspaper",
  },
  {
    href: "/cas-clients",
    title: "Cas clients",
    description: "Exemples concrets d’organisation bureau-chantier.",
    icon: "users",
  },
];

const REASSURANCE = [
  "Plateforme BTP sur mesure",
  "Connexion logiciels existants",
  "Automatisations métier",
  "Accompagnement et formation",
];

const NAV_LINK =
  "inline-flex items-center gap-1 rounded-lg px-3.5 py-2.5 text-base font-semibold tracking-normal text-slate-700 transition-[color,background,box-shadow] hover:bg-white/80 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4ed8]/35";
const NAV_LINK_OPEN = "bg-white text-[#1d4ed8] shadow-sm ring-1 ring-slate-200/70";
const HEADER_BTN_SECONDARY = CTA_SECONDARY;
const HEADER_BTN_PRIMARY = CTA_PRIMARY;

export function MarketingSiteHeader({ plainBg = false }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const solutionsCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resourcesCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const solutionsWrapRef = useRef<HTMLDivElement | null>(null);
  const resourcesWrapRef = useRef<HTMLDivElement | null>(null);

  const clearSolutionsCloseTimer = useCallback(() => {
    if (solutionsCloseTimer.current) {
      clearTimeout(solutionsCloseTimer.current);
      solutionsCloseTimer.current = null;
    }
  }, []);

  const clearResourcesCloseTimer = useCallback(() => {
    if (resourcesCloseTimer.current) {
      clearTimeout(resourcesCloseTimer.current);
      resourcesCloseTimer.current = null;
    }
  }, []);

  const openSolutions = useCallback(() => {
    clearSolutionsCloseTimer();
    clearResourcesCloseTimer();
    setSolutionsOpen(true);
    setResourcesOpen(false);
  }, [clearSolutionsCloseTimer, clearResourcesCloseTimer]);

  const scheduleCloseSolutions = useCallback(() => {
    clearSolutionsCloseTimer();
    solutionsCloseTimer.current = setTimeout(() => setSolutionsOpen(false), 175);
  }, [clearSolutionsCloseTimer]);

  const openResources = useCallback(() => {
    clearSolutionsCloseTimer();
    clearResourcesCloseTimer();
    setResourcesOpen(true);
    setSolutionsOpen(false);
  }, [clearSolutionsCloseTimer, clearResourcesCloseTimer]);

  const scheduleCloseResources = useCallback(() => {
    clearResourcesCloseTimer();
    resourcesCloseTimer.current = setTimeout(() => setResourcesOpen(false), 175);
  }, [clearResourcesCloseTimer]);

  useEffect(() => {
    /** Seuil avec hystérésis : évite basculements rapides près du haut (scroll élastique, barre de défilement). */
    const releaseScrollY = 4;
    const engageScrollY = 32;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled((prev) => {
        if (prev) return y > releaseScrollY;
        return y > engageScrollY;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSolutionsOpen(false);
        setResourcesOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!solutionsOpen && !resourcesOpen) return;
    const down = (e: MouseEvent) => {
      const t = e.target as Node;
      if (solutionsOpen && solutionsWrapRef.current && !solutionsWrapRef.current.contains(t)) {
        setSolutionsOpen(false);
      }
      if (resourcesOpen && resourcesWrapRef.current && !resourcesWrapRef.current.contains(t)) {
        setResourcesOpen(false);
      }
    };
    document.addEventListener("mousedown", down);
    return () => document.removeEventListener("mousedown", down);
  }, [solutionsOpen, resourcesOpen]);

  const barPy = scrolled ? "py-2 md:py-2.5" : "py-2.5 md:py-3";

  return (
    <header
      ref={headerRef}
      className="relative sticky top-0 z-50 overflow-visible border-b border-slate-200/60"
    >
      <MarketingHeaderBlueprintDecor plainBg={plainBg} />
      <div
        className={`container-site relative z-10 grid grid-cols-[1fr_auto] items-center gap-x-4 font-sans lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-x-8 ${barPy}`}
      >
        <div className="relative z-20 col-start-1 row-start-1 flex shrink-0 flex-col items-start gap-1.5 justify-self-start">
          <Link
            href="/"
            className="group inline-flex items-center transition-opacity hover:opacity-90"
            aria-label="BeWork — Accueil"
          >
            <BeWorkLogo size="sm" priority />
          </Link>
          <p className="max-w-[11.5rem] text-[10px] font-medium leading-snug tracking-tight text-[#1d4ed8]/90 sm:max-w-none sm:whitespace-nowrap sm:text-[11px]">
            {BEWORK_BRAND_SIGNATURE}
          </p>
        </div>

        {/* Desktop : 2 lignes — CTAs au-dessus, nav en dessous */}
        <div className="hidden min-w-0 flex-col items-end gap-2 lg:col-start-2 lg:row-start-1 lg:flex">
          <div
            className="flex shrink-0 items-center gap-2 whitespace-nowrap"
            role="group"
            aria-label="Compte et prise de rendez-vous"
          >
            <Link href="/connexion" className={HEADER_BTN_SECONDARY}>
              <IconUser className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />
              <span className="whitespace-nowrap">Connexion</span>
            </Link>
            <Link
              href="/essayer"
              className={HEADER_BTN_PRIMARY}
              {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "header-desktop-essayer")}
            >
              <span className="whitespace-nowrap">Demander un essai</span>
            </Link>
          </div>

          <nav
            className="relative flex max-w-full flex-wrap items-center justify-end gap-x-0.5 gap-y-1 rounded-xl border border-slate-200/70 bg-white/95 p-1 shadow-sm"
            aria-label="Navigation principale"
          >
            <div
              ref={solutionsWrapRef}
              className="relative shrink-0"
              onMouseEnter={openSolutions}
              onMouseLeave={scheduleCloseSolutions}
            >
              <button
                type="button"
                className={`${NAV_LINK} ${solutionsOpen ? NAV_LINK_OPEN : ""}`}
                aria-expanded={solutionsOpen}
                aria-haspopup="menu"
                onClick={(e) => {
                  e.stopPropagation();
                  clearSolutionsCloseTimer();
                  clearResourcesCloseTimer();
                  setSolutionsOpen((v) => !v);
                  setResourcesOpen(false);
                }}
              >
                <span className="whitespace-nowrap">Offre</span>
                <ChevronDown accent={solutionsOpen} className={solutionsOpen ? "rotate-180" : ""} />
              </button>

              {solutionsOpen ? (
                <nav
                  className="bework-header-dropdown-enter absolute left-0 top-full z-[70] mt-2.5 hidden max-h-[min(70vh,calc(100dvh-5rem))] w-[min(30rem,calc(100vw-1.25rem))] overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200 bg-[#f8fafc] py-4 shadow-md shadow-slate-900/[0.08] lg:block"
                  aria-label="Solutions BeWork"
                  role="menu"
                >
                  <p className="px-5 pb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#1d4ed8]/95">
                    Découvrir BeWork
                  </p>
                  <ul className="flex flex-col gap-1.5 px-3">
                    {SOLUTION_MENU_ENTRIES.map((item) => (
                      <li key={item.href} role="none">
                        <Link
                          href={item.href}
                          role="menuitem"
                          className="group flex items-start gap-3 rounded-lg px-2 py-2.5 transition-all duration-150 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4ed8]/35"
                          onClick={() => setSolutionsOpen(false)}
                        >
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors"
                            style={{
                              background: `${item.accentColor}15`,
                              color: item.accentColor,
                            }}
                            aria-hidden
                          >
                            <SolutionNavIcon id={item.icon} className="h-[17px] w-[17px]" />
                          </span>
                          <div className="min-w-0 flex-1 pt-px">
                            <span
                              className="block text-sm font-semibold leading-tight tracking-tight text-slate-900 transition-colors group-hover:text-slate-900"
                            >
                              {item.title}
                            </span>
                            <span className="mt-0.5 block text-xs leading-snug text-slate-500">{item.description}</span>
                          </div>
                          <ChevronRightThin className="mt-1 h-4 w-4 shrink-0 self-start text-slate-300 transition-colors group-hover:text-slate-500" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 border-t border-slate-100 px-5 pt-3">
                    <Link
                      href="/#besoin"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-[#1d4ed8] transition-colors hover:text-[#1e40af]"
                      onClick={() => setSolutionsOpen(false)}
                    >
                      Parler de mon entreprise
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                </nav>
              ) : null}
            </div>

            <Link href="/#plateforme" className={`${NAV_LINK} whitespace-nowrap`}>
              Plateforme
            </Link>
            <Link href="/#connexions" className={`${NAV_LINK} whitespace-nowrap`}>
              Connexions
            </Link>
            <Link href="/#automatisations" className={`${NAV_LINK} whitespace-nowrap`}>
              Automatisations
            </Link>
            <Link href="/notre-facon-de-travailler" className={`${NAV_LINK} whitespace-nowrap`}>
              Méthode
            </Link>

            <div
              ref={resourcesWrapRef}
              className="relative shrink-0"
              onMouseEnter={openResources}
              onMouseLeave={scheduleCloseResources}
            >
              <div className={`inline-flex items-stretch rounded-lg ${resourcesOpen ? NAV_LINK_OPEN : ""}`}>
                <Link
                  href="/ressources"
                  className={`${NAV_LINK} rounded-r-none pr-2 whitespace-nowrap`}
                  onClick={() => setResourcesOpen(false)}
                >
                  Ressources BTP
                </Link>
                <button
                  type="button"
                  className={`${NAV_LINK} rounded-l-none border-l border-slate-200/70 px-2 ${resourcesOpen ? "text-[#1d4ed8]" : ""}`}
                  aria-expanded={resourcesOpen}
                  aria-haspopup="menu"
                  aria-label="Sous-rubriques Ressources"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearResourcesCloseTimer();
                    clearSolutionsCloseTimer();
                    setResourcesOpen((v) => !v);
                    setSolutionsOpen(false);
                  }}
                >
                  <ChevronDown accent={resourcesOpen} className={resourcesOpen ? "rotate-180" : ""} />
                </button>
              </div>
              {resourcesOpen ? (
                <nav
                  className="bework-header-dropdown-enter absolute right-0 left-auto top-full z-[70] mt-2.5 hidden max-h-[min(70vh,calc(100dvh-5rem))] w-[min(420px,calc(100vw-2rem))] overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200 bg-[#f8fafc] py-4 whitespace-normal shadow-md shadow-slate-900/[0.08] lg:block"
                  aria-label="Ressources"
                  role="menu"
                >
                  <p className="px-5 pb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#1d4ed8]/95">
                    À explorer
                  </p>
                  <ul className="flex flex-col gap-3 px-3" role="none">
                    {RESOURCE_MENU_ENTRIES.map((item, index) => (
                      <li key={`${item.title}-${index}`} role="none">
                        <Link
                          href={item.href}
                          role="menuitem"
                          className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors duration-150 hover:bg-[#eff6ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4ed8]/35"
                          onClick={() => setResourcesOpen(false)}
                        >
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#eff6ff] text-[#1d4ed8]"
                            aria-hidden
                          >
                            <ResourceNavIcon id={item.icon} className="h-[17px] w-[17px]" />
                          </span>
                          <div className="min-w-0 flex-1 pt-px">
                            <span className="block text-base font-semibold leading-tight tracking-tight text-slate-900">
                              {item.title}
                            </span>
                            <span className="mt-1 block truncate text-sm leading-snug text-slate-600">{item.description}</span>
                          </div>
                          <ChevronRightThin className="mt-1 h-4 w-4 shrink-0 self-start text-slate-400" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 border-t border-slate-200/80 px-5 pt-3">
                    <Link
                      href="/ressources"
                      className="inline-flex items-center gap-1 text-base font-semibold text-[#1d4ed8] transition-colors hover:text-[#1e40af]"
                      onClick={() => setResourcesOpen(false)}
                    >
                      Vue d&apos;ensemble Ressources (carrousels)
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                </nav>
              ) : null}
            </div>
          </nav>
        </div>

        <button
          type="button"
          className="col-start-2 row-start-1 flex h-11 w-11 shrink-0 items-center justify-center justify-self-end rounded-lg border border-slate-200/90 bg-white/90 text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-white lg:hidden"
          aria-expanded={mobileOpen}
          aria-controls="marketing-mobile-nav"
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? (
            <span className="text-xl leading-none" aria-hidden>
              ×
            </span>
          ) : (
            <span className="flex flex-col gap-1.5" aria-hidden>
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
            </span>
          )}
        </button>
      </div>

      {/* Menu mobile */}
      <div
        id="marketing-mobile-nav"
        className={`fixed inset-x-0 bottom-0 top-0 z-40 bg-white pt-[calc(4.5rem+env(safe-area-inset-top,0px))] transition-[opacity,visibility] duration-200 lg:hidden ${
          mobileOpen ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="h-[calc(100dvh-4.5rem-env(safe-area-inset-top,0px))] overflow-y-auto overscroll-contain pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-3">
          <div className="container-site flex flex-col gap-3">
            {/* Liens rapides — visibles sans déplier */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Link
                href="/#plateforme"
                className={HEADER_BTN_SECONDARY}
                onClick={() => setMobileOpen(false)}
              >
                Plateforme
              </Link>
              <Link
                href="/#besoin"
                className={HEADER_BTN_PRIMARY}
                onClick={() => setMobileOpen(false)}
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "header-mobile-besoin")}
              >
                Parler de mon besoin
              </Link>
            </div>

            <nav className="flex flex-col gap-2" aria-label="Navigation mobile">
              <MarketingDisclosure title="Plateforme">
                <ul className="divide-y divide-slate-100">
                  {SOLUTION_MENU_ENTRIES.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="flex items-start gap-3 px-4 py-3.5 transition hover:bg-[#f8fafc] sm:px-5"
                        onClick={() => setMobileOpen(false)}
                      >
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] text-[#1d4ed8]"
                          aria-hidden
                        >
                          <SolutionNavIcon id={item.icon} className="h-[17px] w-[17px]" />
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="text-sm font-semibold leading-snug text-slate-900">{item.title}</span>
                          <span className="text-xs leading-snug text-slate-600">{item.description}</span>
                        </div>
                        <ChevronRightThin className="h-4 w-4 shrink-0 self-center text-slate-400" />
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
                  <Link
                    href="/notre-facon-de-travailler"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#1d4ed8]"
                    onClick={() => setMobileOpen(false)}
                  >
                    Notre approche
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </MarketingDisclosure>

              <Link
                href="/#plateforme"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900"
                onClick={() => setMobileOpen(false)}
              >
                Plateforme
              </Link>
              <Link
                href="/#connexions"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900"
                onClick={() => setMobileOpen(false)}
              >
                Connexions & Automatisations
              </Link>
              <Link
                href="/#solutions-avancees"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900"
                onClick={() => setMobileOpen(false)}
              >
                Solutions sur mesure
              </Link>
              <Link
                href="/notre-facon-de-travailler"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900"
                onClick={() => setMobileOpen(false)}
              >
                Notre approche
              </Link>
              <Link
                href="/tarifs"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900"
                onClick={() => setMobileOpen(false)}
              >
                Tarifs
              </Link>

              <MarketingDisclosure title="Ressources BTP">
                <div className="px-4 py-3 sm:px-5">
                  <Link
                    href="/ressources"
                    className="inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-lg border border-slate-200 bg-[#eff6ff]/50 text-sm font-semibold text-[#1d4ed8] transition hover:bg-[#eff6ff]"
                    onClick={() => setMobileOpen(false)}
                  >
                    Vue d&apos;ensemble
                  </Link>
                </div>
                <ul className="divide-y divide-slate-100 border-t border-slate-100">
                  {RESOURCE_MENU_ENTRIES.map((item, index) => (
                    <li key={`mobile-${item.title}-${index}`}>
                      <Link
                        href={item.href}
                        className="flex items-start gap-3 px-4 py-3.5 transition hover:bg-[#f8fafc] sm:px-5"
                        onClick={() => setMobileOpen(false)}
                      >
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] text-[#1d4ed8]"
                          aria-hidden
                        >
                          <ResourceNavIcon id={item.icon} className="h-[17px] w-[17px]" />
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="text-sm font-semibold leading-snug text-slate-900">{item.title}</span>
                          <span className="text-xs leading-snug text-slate-600">{item.description}</span>
                        </div>
                        <ChevronRightThin className="h-4 w-4 shrink-0 self-center text-slate-400" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </MarketingDisclosure>
            </nav>

              <MarketingDisclosure title="Pourquoi BeWork ?" className="border-slate-100 bg-slate-50/80">
              <div className="space-y-2 px-4 py-3 text-sm text-slate-600 sm:px-5">
                {REASSURANCE.map((line) => (
                  <p key={line}>• {line}</p>
                ))}
              </div>
            </MarketingDisclosure>

            <div className="flex flex-col gap-2.5 pt-1">
              <Link
                href="/connexion"
                className={`${HEADER_BTN_SECONDARY} w-full`}
                onClick={() => setMobileOpen(false)}
              >
                <IconUser className="h-[18px] w-[18px] text-slate-700" aria-hidden />
                Connexion
              </Link>
              <Link
                href="/essayer"
                className={`${HEADER_BTN_PRIMARY} w-full`}
                onClick={() => setMobileOpen(false)}
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "header-mobile-footer-essayer")}
              >
                Essayer BeWork
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function ResourceNavIcon({ id, className }: { id: ResourceMenuIconId; className?: string }) {
  switch (id) {
    case "globe":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.55" />
          <path
            d="M12 2.75c2.62 8.25 2.62 13.08 0 18.5M12 12h9.05M12 12H2.95M21 12h-18"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
          />
          <ellipse cx="12" cy="12" rx="3.85" ry="9.05" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
        </svg>
      );
    case "book":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path
            d="M5 17.95V8.05l5-3.55 6 4.2 6-4.2v9.85l-6 4.05-6-4z"
            stroke="currentColor"
            strokeWidth="1.55"
            strokeLinejoin="round"
          />
          <path d="M10 21.5V13.85M17 21.85V13.9" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
        </svg>
      );
    case "users":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <circle cx="9.5" cy="8.5" r="2.75" stroke="currentColor" strokeWidth="1.55" />
          <path
            d="M4 20c.9-4.2 4.73-7 11-7 6.05 0 9.93 3.33 11 8"
            stroke="currentColor"
            strokeWidth="1.55"
            strokeLinecap="round"
          />
          <path
            d="M15.89 13.72a6 6 0 0 1 4 3.72M17.5 5.7a4.5 4.5 0 0 1 4.5 4.5v.5"
            stroke="currentColor"
            strokeWidth="1.55"
            strokeLinecap="round"
          />
        </svg>
      );
    case "document":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M8 21V3h11l5 5v13H8Z" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 3v7h7M11 17h10M11 13h10" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
          <circle cx="8.75" cy="13.75" r="1.25" fill="currentColor" />
        </svg>
      );
    case "newspaper":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path
            d="M3.5 6.5h13a1.5 1.5 0 0 1 1.5 1.5v10.25a1.75 1.75 0 0 0 1.75 1.75H4.5a1 1 0 0 1-1-1V6.5Z"
            stroke="currentColor"
            strokeWidth="1.55"
            strokeLinejoin="round"
          />
          <path
            d="M18 9.5h2a1 1 0 0 1 1 1v8a1.5 1.5 0 0 1-1.5 1.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M6.25 10.25h7.5M6.25 13.5h7.5M6.25 16.75h4.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
        </svg>
      );
    case "question":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.55" />
          <path
            d="M9.62 10.125c0-1.5 1.28-3 3.375-3 2.096 0 3.376 1.344 3.376 2.938 0 2.937-3.375 2.187-3.375 3.124"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="17.5" r="0.875" fill="currentColor" />
        </svg>
      );
    case "calculator":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <rect x="5.5" y="3.5" width="13" height="17" rx="2" stroke="currentColor" strokeWidth="1.55" />
          <path d="M8.75 18.25v-1m2.125 1v-1m2.125 1v-1m2 1v-1M8 7.25h10" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
          <rect x="7.75" y="14.75" width="2.125" height="2.125" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
          <rect x="10.938" y="14.75" width="2.125" height="2.125" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
          <rect x="14.125" y="14.75" width="2.125" height="2.125" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );
    default:
      return null;
  }
}

function ChevronRightThin({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M7.25 14.75L11.917 10L7.25 5.25" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SolutionNavIcon({ id, className }: { id: SolutionMenuIconId; className?: string }) {
  switch (id) {
    case "devis":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path
            d="M8 15h8M10 18h5M14 21H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8l5 5v12a2 2 0 0 1-2 2h-8"
            stroke="currentColor"
            strokeWidth="1.55"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17 18l3-6M15 21l6-11"
            stroke="currentColor"
            strokeWidth="1.55"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M17 5V3M17 5h5" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "folder":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path
            d="M3 18V8a2 2 0 0 1 2-2h4l2 3h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"
            stroke="currentColor"
            strokeWidth="1.55"
            strokeLinejoin="round"
          />
          <path d="M3 13h18" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
        </svg>
      );
    case "invoice":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path
            d="M8 21V3h10l5 5v13H8Zm5-17v5m4-5 4 4m-17 11h13"
            stroke="currentColor"
            strokeWidth="1.55"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13.5 16.75c0 .97-.783 1.75-1.75 1.75s-1.75-.78-1.75-1.75 .783-1.75 1.75-1.75 1.75.783 1.75 1.75Z"
            stroke="currentColor"
            strokeWidth="1.3"
          />
          <path d="M11.75 17V14.5m1.84-1h-2.93" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "cart":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path
            d="M4 20h-.75M7.48 17H21l-1.62-11H9M7.48 17 6 4H4M7.48 17H5.62M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
            stroke="currentColor"
            strokeWidth="1.55"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M7 9h13" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
        </svg>
      );
    case "calendar":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <rect x="3" y="6" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="1.55" />
          <path d="M8 6V4m8 2V4" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
          <path d="M4 12h17" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
          <path d="M8 17h8M8 19h5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
        </svg>
      );
    case "document":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path
            d="M14 3H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8l-4-5Z"
            stroke="currentColor"
            strokeWidth="1.55"
            strokeLinejoin="round"
          />
          <path d="M14 3v5h5M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

function ChevronDown({ className, accent }: { className?: string; accent?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={`shrink-0 transition-transform duration-200 ${accent ? "text-[#1d4ed8]" : "text-slate-500"} ${className ?? ""}`}
    >
      <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M5.75 18.75c1.06-3.43 5.31-5.25 6.25-5.25s5.12 2.06 6.24 5.25"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
