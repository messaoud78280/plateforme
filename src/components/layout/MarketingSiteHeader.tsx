"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";

type Props = {
  /** Fond opaque (pages sur fond déjà uni) */
  plainBg?: boolean;
};

type SolutionMenuIconId = "devis" | "folder" | "invoice" | "cart" | "calendar";

type ResourceMenuIconId =
  | "book"
  | "globe"
  | "users"
  | "document"
  | "question"
  | "calculator";

const SOLUTION_MENU_ENTRIES: {
  href: string;
  title: string;
  description: string;
  icon: SolutionMenuIconId;
}[] = [
  {
    href: "/relance-devis-btp",
    title: "Signer plus de devis",
    description: "Relances et suivi pour transformer vos devis en chantiers.",
    icon: "devis",
  },
  {
    href: "/dict-dt-travaux",
    title: "Suivre vos chantiers sans retard",
    description: "DICT, dossiers et autorisations suivis jusqu’à l’intervention.",
    icon: "folder",
  },
  {
    href: "/impayes-btp-relances",
    title: "Facturation & encaissement",
    description: "Situations, factures et relances pour sécuriser votre trésorerie.",
    icon: "invoice",
  },
  {
    href: "/suivi-fournisseurs-chantier",
    title: "Piloter fournisseurs & achats",
    description: "Prix, commandes et livraisons centralisés côté administratif.",
    icon: "cart",
  },
  {
    href: "/assistants-administratifs-taches",
    title: "Planning & coordination",
    description: "Organisation chantier, vous validez les décisions clés.",
    icon: "calendar",
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
    href: "/ressources/tutos",
    title: "Tutoriels",
    description: "Tutoriels PDF et formats courts — CR chantier, DCE, PPSPS, mémoires techniques, etc.",
    icon: "document",
  },
  {
    href: "/ressources/guides",
    title: "Guides",
    description: "Articles sur le pilotage administratif BTP, la trésorerie, la relance et l’externalisation.",
    icon: "book",
  },
  {
    href: "/cas-clients",
    title: "Cas clients",
    description: "Exemples concrets : relances, trésorerie, dossiers chantier.",
    icon: "users",
  },
];

const REASSURANCE = [
  "Opérationnel en 3 à 5 jours",
  "Pas de recrutement",
  "Supervision depuis la France",
  "Plateforme simple et sécurisée",
];

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
    const onScroll = () => setScrolled(window.scrollY > 12);
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

  /** Fond blanc plein (maquette SaaS type Stripe / Notion) */
  const bgClass = plainBg ? "bg-white" : scrolled ? "bg-white shadow-[0_1px_0_0_rgb(226,232,240)]" : "bg-white";

  const barPy = scrolled ? "py-2 sm:py-2.5 md:py-3" : "py-2.5 sm:py-3.5 md:py-4";

  return (
    <header
      ref={headerRef}
      className={`relative sticky top-0 z-50 overflow-visible border-b border-slate-200 transition-[padding,box-shadow] duration-200 ease-out ${bgClass}`}
    >
      <div
        className={`container-site grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-x-4 ${barPy} font-sans`}
      >
        {/* Col 1 — marque */}
        <div className="min-w-0 justify-self-start">
          <Link href="/" className="group inline-block max-w-full transition-opacity hover:opacity-90" aria-label="BeWork — Accueil">
            <BeWorkLogo
              size="sm"
              imageClassName="h-12 max-w-[min(100%,14rem)] drop-shadow-[0_1px_0_rgba(15,23,42,0.12)] sm:h-14 sm:max-w-[min(100%,17rem)] md:h-20 md:max-w-[min(100%,22rem)] lg:h-[5.5rem] lg:max-w-[min(100%,28rem)]"
            />
          </Link>
        </div>

        {/* Desktop : nav + CTA regroupés et alignés à droite, une seule ligne */}
        <div className="hidden min-w-0 flex-nowrap items-center justify-end gap-4 lg:flex xl:gap-5">
          <nav
            className="relative flex min-w-0 items-center justify-end gap-4 whitespace-nowrap xl:gap-5"
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
                className={`inline-flex items-center gap-1 rounded-[10px] px-1.5 py-2 text-sm font-[530] tracking-tight transition-colors xl:px-2 ${
                  solutionsOpen ? "bg-[#eff6ff]/80 text-[#1d4ed8]" : "text-[#1d4ed8] hover:bg-slate-50"
                }`}
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
                <span className="whitespace-nowrap">Solutions BTP</span>
                <ChevronDown accent className={solutionsOpen ? "rotate-180" : ""} />
              </button>

              {solutionsOpen ? (
                <nav
                  className="bework-header-dropdown-enter absolute left-0 top-full z-[70] mt-2.5 hidden max-h-[min(70vh,calc(100dvh-5rem))] w-[min(30rem,calc(100vw-1.25rem))] overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200 bg-[#f8fafc] py-4 shadow-md shadow-slate-900/[0.08] lg:block"
                  aria-label="Solutions BTP"
                  role="menu"
                >
                  <p className="px-5 pb-3 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#1d4ed8]/95">
                    Nos solutions BTP
                  </p>
                  <ul className="flex flex-col gap-3 px-3">
                    {SOLUTION_MENU_ENTRIES.map((item) => (
                      <li key={item.href} role="none">
                        <Link
                          href={item.href}
                          role="menuitem"
                          className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors duration-150 hover:bg-[#eff6ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4ed8]/35"
                          onClick={() => setSolutionsOpen(false)}
                        >
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#eff6ff] text-[#1d4ed8]"
                            aria-hidden
                          >
                            <SolutionNavIcon id={item.icon} className="h-[17px] w-[17px]" />
                          </span>
                          <div className="min-w-0 flex-1 pt-px">
                            <span className="block text-[0.875rem] font-semibold leading-tight tracking-tight text-slate-900">
                              {item.title}
                            </span>
                            <span className="mt-1 block truncate text-[12px] leading-snug text-slate-600">{item.description}</span>
                          </div>
                          <ChevronRightThin className="mt-1 h-4 w-4 shrink-0 self-start text-slate-400" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 border-t border-slate-200/80 px-5 pt-3">
                    <Link
                      href="/#notre-expertise"
                      className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#1d4ed8] transition-colors hover:text-[#1e40af]"
                      onClick={() => setSolutionsOpen(false)}
                    >
                      Voir toutes nos solutions
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                </nav>
              ) : null}
            </div>

            <Link
              href="/#comment-ca-marche"
              className="rounded-[10px] px-1.5 py-2 text-sm font-[530] tracking-tight text-black whitespace-nowrap transition-colors hover:text-[#1d4ed8] xl:px-2"
            >
              Comment ça marche
            </Link>
            <Link
              href="/tarifs"
              className="rounded-[10px] px-1.5 py-2 text-sm font-[530] tracking-tight text-black whitespace-nowrap transition-colors hover:text-[#1d4ed8] xl:px-2"
            >
              Tarifs
            </Link>

            <div
              ref={resourcesWrapRef}
              className="relative shrink-0"
              onMouseEnter={openResources}
              onMouseLeave={scheduleCloseResources}
            >
              <div
                className={`inline-flex items-stretch rounded-[10px] transition-colors ${
                  resourcesOpen ? "bg-[#eff6ff]/80" : ""
                }`}
              >
                <Link
                  href="/ressources"
                  className={`inline-flex items-center rounded-l-[10px] px-1.5 py-2 text-sm font-[530] tracking-tight transition-colors xl:pl-2 xl:pr-1.5 ${
                    resourcesOpen ? "text-[#1d4ed8]" : "text-black hover:bg-slate-50"
                  }`}
                  onClick={() => setResourcesOpen(false)}
                >
                  <span className="whitespace-nowrap">Ressources</span>
                </Link>
                <button
                  type="button"
                  className={`inline-flex items-center rounded-r-[10px] border-l border-slate-200/80 px-1 py-2 transition-colors xl:pr-2 ${
                    resourcesOpen ? "text-[#1d4ed8]" : "text-black hover:bg-slate-50"
                  }`}
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
                  <ChevronDown accent className={resourcesOpen ? "rotate-180" : ""} />
                </button>
              </div>
              {resourcesOpen ? (
                <nav
                  className="bework-header-dropdown-enter absolute left-0 top-full z-[70] mt-2.5 hidden max-h-[min(70vh,calc(100dvh-5rem))] w-[min(420px,calc(100vw-2rem))] overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200 bg-[#f8fafc] py-4 whitespace-normal shadow-md shadow-slate-900/[0.08] lg:block"
                  aria-label="Ressources"
                  role="menu"
                >
                  <p className="px-5 pb-3 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#1d4ed8]/95">
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
                            <span className="block text-[0.875rem] font-semibold leading-tight tracking-tight text-slate-900">
                              {item.title}
                            </span>
                            <span className="mt-1 block truncate text-[12px] leading-snug text-slate-600">{item.description}</span>
                          </div>
                          <ChevronRightThin className="mt-1 h-4 w-4 shrink-0 self-start text-slate-400" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 border-t border-slate-200/80 px-5 pt-3">
                    <Link
                      href="/ressources"
                      className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#1d4ed8] transition-colors hover:text-[#1e40af]"
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

          <div className="flex shrink-0 items-center gap-2 whitespace-nowrap xl:gap-2.5">
            <Link
              href="/connexion"
              className="inline-flex min-h-[2.75rem] items-center gap-1.5 rounded-[10px] border border-slate-200 bg-white px-3.5 py-2 text-base font-medium tracking-tight text-black transition hover:border-slate-300 hover:bg-slate-50 xl:px-4"
            >
              <IconUser className="h-[18px] w-[18px] shrink-0 text-slate-700" aria-hidden />
              <span className="whitespace-nowrap">Connexion</span>
            </Link>
            <CalendlyBookingLink
              className="inline-flex min-h-[2.75rem] items-center gap-1.5 rounded-[10px] bg-[#1d4ed8] px-3.5 py-2 text-base font-semibold tracking-tight text-white shadow-md shadow-[#1d4ed8]/22 transition hover:bg-[#1e40af] xl:px-4"
            >
              <IconCalendar className="h-[18px] w-[18px] shrink-0 text-white" aria-hidden />
              <span className="whitespace-nowrap">Réserver un appel</span>
            </CalendlyBookingLink>
          </div>
        </div>

        {/* Burger : même ligne, à droite &lt; lg */}
        <button
          type="button"
          className="col-start-2 row-start-1 flex h-11 w-11 shrink-0 items-center justify-center justify-self-end rounded-lg border border-slate-200 text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 lg:hidden"
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
        className={`fixed inset-x-0 bottom-0 top-0 z-40 bg-white pt-[calc(4rem+env(safe-area-inset-top,0px))] transition-[opacity,visibility] duration-200 sm:pt-[calc(4.5rem+env(safe-area-inset-top,0px))] lg:hidden ${
          mobileOpen ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="h-[calc(100dvh-4rem-env(safe-area-inset-top,0px))] overflow-y-auto border-t border-slate-100 pb-10 pt-4 sm:h-[calc(100dvh-4.5rem-env(safe-area-inset-top,0px))]">
          <div className="container-site flex flex-col gap-6">
            <div>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">
                Nos solutions BTP
              </p>
              <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100">
                {SOLUTION_MENU_ENTRIES.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-start gap-3 px-3 py-3.5 transition hover:bg-[#f8fafc]"
                      onClick={() => setMobileOpen(false)}
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] text-[#1d4ed8]"
                        aria-hidden
                      >
                        <SolutionNavIcon id={item.icon} className="h-5 w-5" />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-sm font-semibold leading-snug text-slate-900">{item.title}</span>
                        <span className="text-[13px] leading-snug text-slate-600">{item.description}</span>
                      </div>
                      <ChevronRightThin className="h-5 w-5 shrink-0 self-center text-slate-400" />
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/#notre-expertise"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1d4ed8]"
                onClick={() => setMobileOpen(false)}
              >
                Voir toutes nos solutions
                <span aria-hidden>→</span>
              </Link>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-sm font-semibold text-slate-900">Pourquoi nous ?</p>
              <ul className="space-y-2 text-sm text-slate-600">
                {REASSURANCE.map((line) => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>
              <CalendlyBookingLink
                className="mt-2 inline-flex min-h-[3rem] justify-center rounded-xl bg-[#1d4ed8] px-4 py-3 text-base font-semibold text-white shadow-md shadow-[#1d4ed8]/20 hover:bg-[#1e40af]"
                onClick={() => setMobileOpen(false)}
              >
                Réserver un appel
              </CalendlyBookingLink>
            </div>

            <nav className="flex flex-col gap-1 border-t border-slate-100 pt-4" aria-label="Navigation mobile">
              <Link
                href="/#comment-ca-marche"
                className="rounded-lg px-3 py-3 text-sm font-[530] text-slate-800 hover:bg-slate-50"
                onClick={() => setMobileOpen(false)}
              >
                Comment ça marche
              </Link>
              <Link href="/tarifs" className="rounded-lg px-3 py-3 text-sm font-[530] text-slate-800 hover:bg-slate-50" onClick={() => setMobileOpen(false)}>
                Tarifs
              </Link>
              <p className="mt-3 px-3 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#1d4ed8]">
                Ressources
              </p>
              <Link
                href="/ressources"
                className="mx-3 mt-2 inline-flex min-h-[2.75rem] items-center justify-center rounded-lg border border-slate-200 bg-[#eff6ff]/40 px-3 text-sm font-semibold text-[#1d4ed8] transition hover:bg-[#eff6ff]"
                onClick={() => setMobileOpen(false)}
              >
                Vue d&apos;ensemble
              </Link>
              <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100">
                {RESOURCE_MENU_ENTRIES.map((item, index) => (
                  <li key={`mobile-${item.title}-${index}`}>
                    <Link
                      href={item.href}
                      className="flex items-start gap-3 px-3 py-3.5 transition hover:bg-[#f8fafc]"
                      onClick={() => setMobileOpen(false)}
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] text-[#1d4ed8]"
                        aria-hidden
                      >
                        <ResourceNavIcon id={item.icon} className="h-[18px] w-[18px]" />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-sm font-semibold leading-snug text-slate-900">{item.title}</span>
                        <span className="text-[13px] leading-snug text-slate-600">{item.description}</span>
                      </div>
                      <ChevronRightThin className="h-5 w-5 shrink-0 self-center text-slate-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex flex-col gap-2.5 pt-4">
              <Link
                href="/connexion"
                className="inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-[10px] border border-slate-200 bg-white px-4 py-3 text-base font-medium text-black hover:bg-slate-50"
                onClick={() => setMobileOpen(false)}
              >
                <IconUser className="h-[18px] w-[18px] text-slate-700" aria-hidden />
                Connexion
              </Link>
              <CalendlyBookingLink
                className="inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-[10px] bg-[#1d4ed8] px-4 py-3 text-base font-semibold text-white shadow-md shadow-[#1d4ed8]/20 hover:bg-[#1e40af]"
                onClick={() => setMobileOpen(false)}
              >
                <IconCalendar className="h-[18px] w-[18px]" aria-hidden />
                Réserver un appel
              </CalendlyBookingLink>
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

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  );
}
