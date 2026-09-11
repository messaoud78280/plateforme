"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";
import styles from "./MarketingSiteHeader.module.css";

type Props = {
  plainBg?: boolean;
};

const NAV_ITEMS = [
  { href: "/#hero", label: "Découvrir", match: "home" },
  { href: "/#possibilites", label: "Possibilités", match: "possibilites" },
  { href: "/#demonstrations", label: "Démonstrations", match: "demonstrations" },
  { href: "/formation#programme", label: "Programme", match: "programme" },
  { href: "/#faq", label: "FAQ", match: "faq" },
] as const;

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function useActiveNav() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const sync = () => setHash(window.location.hash.replace(/^#/, ""));
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  return (match: (typeof NAV_ITEMS)[number]["match"]) => {
    if (match === "programme") {
      return pathname.startsWith("/formation");
    }
    if (pathname !== "/" && pathname !== "") return false;
    if (match === "home") return !hash || hash === "hero";
    return hash === match;
  };
}

/** Header marketing flottant — deux étages dans un seul panneau premium. */
export function MarketingSiteHeader({ plainBg = false }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isActive = useActiveNav();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled((prev) => (prev ? y > 60 : y > 100));
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
    <header className={cx(styles.root, plainBg && styles.rootPlain)}>
      <div className={styles.shell}>
        <div className={cx(styles.panel, scrolled && styles.panelScrolled)}>
          {/* ——— Étage 1 : marque + CTA ——— */}
          <div className={styles.tierBrand}>
            <Link href="/" className={styles.brand} aria-label="BeWork — Accueil">
              <BeWorkLogo size="md" priority imageClassName={styles.logoImg} />
            </Link>

            <div className={styles.actions}>
              <Link
                href="/formation"
                className={styles.ctaSecondary}
                aria-label="Découvrir la formation"
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "header-formation")}
              >
                <span className={styles.ctaSecondaryFull} aria-hidden>
                  Découvrir la formation
                </span>
                <span className={styles.ctaSecondaryShort} aria-hidden>
                  Formation
                </span>
              </Link>
              <Link
                href="/contact#participer"
                className={styles.cta}
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "header-participer")}
              >
                Participer
                <span aria-hidden>→</span>
              </Link>
            </div>

            <div className={styles.mobileTopActions}>
              <Link
                href="/contact#participer"
                className={styles.ctaCompact}
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "header-participer-mobile")}
              >
                Participer
              </Link>
              <button
                type="button"
                className={styles.menuBtn}
                aria-expanded={mobileOpen}
                aria-controls="marketing-mobile-nav"
                aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
                onClick={() => setMobileOpen((v) => !v)}
              >
                {mobileOpen ? (
                  <span className={styles.menuClose} aria-hidden>
                    ×
                  </span>
                ) : (
                  <span className={styles.menuIcon} aria-hidden>
                    <span />
                    <span />
                    <span />
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ——— Étage 2 : navigation ——— */}
          <div className={styles.tierNav}>
            <nav className={styles.nav} aria-label="Navigation principale">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(styles.navLink, isActive(item.match) && styles.navLinkActive)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div
        id="marketing-mobile-nav"
        className={cx(styles.mobilePanel, mobileOpen && styles.mobileOpen)}
        aria-hidden={!mobileOpen}
      >
        <div className={styles.mobileInner}>
          <nav className={styles.mobileNav} aria-label="Navigation mobile">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={styles.mobileLink}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={styles.mobileActions}>
            <Link
              href="/formation"
              className={styles.ctaSecondaryMobile}
              onClick={() => setMobileOpen(false)}
            >
              Découvrir la formation
            </Link>
            <Link
              href="/contact#participer"
              className={styles.ctaMobile}
              onClick={() => setMobileOpen(false)}
            >
              Participer →
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
