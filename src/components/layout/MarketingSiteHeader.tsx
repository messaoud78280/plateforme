"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

type Props = {
  plainBg?: boolean;
};

const NAV_ITEMS = [
  { href: "/#hero", label: "Découvrir" },
  { href: "/#possibilites", label: "Possibilités" },
  { href: "/#demonstrations", label: "Démonstrations" },
  { href: "/#journee", label: "La journée" },
  { href: "/#faq", label: "FAQ" },
] as const;

const NAV_LINK =
  "inline-flex items-center rounded-full px-3 py-2 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]/40";

/** Header maquette — flottant, logo + baseline, nav centrale, CTAs. */
export function MarketingSiteHeader({ plainBg = false }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled((prev) => (prev ? y > 4 : y > 24));
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

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 ${plainBg ? "" : ""}`}
    >
      <div className="container-site pt-3 sm:pt-4">
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2.5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-md transition-[padding,box-shadow] sm:px-4 lg:rounded-[1.35rem] lg:px-5 ${
            scrolled ? "py-2 shadow-[0_10px_36px_rgba(15,23,42,0.08)]" : "py-2.5"
          }`}
        >
          <Link
            href="/"
            className="flex shrink-0 items-center"
            aria-label="BeWork — Accueil"
          >
            <BeWorkLogo size="sm" priority />
          </Link>

          <nav
            className="hidden items-center gap-0.5 lg:flex"
            aria-label="Navigation principale"
          >
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className={NAV_LINK}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/contact#participer"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#2563eb] px-4 text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)] transition hover:bg-[#1d4ed8]"
              {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "header-participer")}
            >
              Participer
              <span aria-hidden>→</span>
            </Link>
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 lg:hidden"
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
                <span className="block h-0.5 w-4 rounded-full bg-current" />
                <span className="block h-0.5 w-4 rounded-full bg-current" />
                <span className="block h-0.5 w-4 rounded-full bg-current" />
              </span>
            )}
          </button>
        </div>
      </div>

      <div
        id="marketing-mobile-nav"
        className={`fixed inset-0 z-40 bg-white/98 pt-[5.5rem] backdrop-blur-sm transition-[opacity,visibility] duration-200 lg:hidden ${
          mobileOpen ? "visible opacity-100" : "invisible pointer-events-none opacity-0"
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="container-site flex flex-col gap-3 overflow-y-auto pb-10">
          <Link
            href="/contact#participer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#2563eb] text-sm font-semibold text-white"
            onClick={() => setMobileOpen(false)}
          >
            Participer →
          </Link>
          <nav className="mt-2 flex flex-col gap-1.5" aria-label="Navigation mobile">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3.5 text-sm font-semibold text-slate-900"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
