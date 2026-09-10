"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { MarketingHeaderBlueprintDecor } from "@/components/layout/MarketingHeaderBlueprintDecor";
import { CTA_PRIMARY, CTA_SECONDARY } from "@/components/marketing/marketingCtaStyles";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";
import { BEWORK_BRAND_SIGNATURE } from "@/lib/seo-keywords";

type Props = {
  /** Fond opaque (pages sur fond déjà uni) */
  plainBg?: boolean;
};

const REASSURANCE = [
  "Formation pratique à la création avec l’IA",
  "Sans prérequis en programmation",
  "Petits groupes",
  "Démonstrations concrètes",
];

const NAV_ITEMS = [
  { href: "/", label: "Accueil" },
  { href: "/formation", label: "La formation" },
  { href: "/demonstrations", label: "Démonstrations" },
  { href: "/pour-qui", label: "Pour qui ?" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

const NAV_LINK =
  "inline-flex items-center gap-1 rounded-lg px-3.5 py-2.5 text-base font-semibold tracking-normal text-slate-700 transition-[color,background,box-shadow] hover:bg-white/80 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4ed8]/35";
const HEADER_BTN_SECONDARY = CTA_SECONDARY;
const HEADER_BTN_PRIMARY = CTA_PRIMARY;

export function MarketingSiteHeader({ plainBg = false }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

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
      if (e.key === "Escape") setMobileOpen(false);
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
          <p className="max-w-[14rem] text-[10px] font-medium leading-snug tracking-tight text-[#1d4ed8]/90 sm:max-w-none sm:whitespace-nowrap sm:text-[11px]">
            {BEWORK_BRAND_SIGNATURE}
          </p>
        </div>

        {/* Desktop : CTAs au-dessus, nav en dessous */}
        <div className="hidden min-w-0 flex-col items-end gap-2 lg:col-start-2 lg:row-start-1 lg:flex">
          <div
            className="flex shrink-0 items-center gap-2 whitespace-nowrap"
            role="group"
            aria-label="Actions principales"
          >
            <Link href="/demonstrations" className={HEADER_BTN_SECONDARY}>
              <span className="whitespace-nowrap">Démonstrations</span>
            </Link>
            <Link
              href="/contact#participer"
              className={HEADER_BTN_PRIMARY}
              {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "header-desktop-participer")}
            >
              <span className="whitespace-nowrap">Participer</span>
            </Link>
          </div>

          <nav
            className="relative flex max-w-full flex-wrap items-center justify-end gap-x-0.5 gap-y-1 rounded-xl border border-slate-200/70 bg-white/95 p-1 shadow-sm"
            aria-label="Navigation principale"
          >
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className={`${NAV_LINK} whitespace-nowrap`}>
                {item.label}
              </Link>
            ))}
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
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Link
                href="/demonstrations"
                className={HEADER_BTN_SECONDARY}
                onClick={() => setMobileOpen(false)}
              >
                Démonstrations
              </Link>
              <Link
                href="/contact#participer"
                className={HEADER_BTN_PRIMARY}
                onClick={() => setMobileOpen(false)}
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "header-mobile-participer")}
              >
                Participer
              </Link>
            </div>

            <nav className="flex flex-col gap-2" aria-label="Navigation mobile">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#1d4ed8]/95">Pourquoi BeWork ?</p>
              <div className="mt-2 space-y-2 text-sm text-slate-600">
                {REASSURANCE.map((line) => (
                  <p key={line}>• {line}</p>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <Link
                href="/contact#participer"
                className={`${HEADER_BTN_PRIMARY} w-full`}
                onClick={() => setMobileOpen(false)}
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "header-mobile-footer-participer")}
              >
                Participer à une session
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
