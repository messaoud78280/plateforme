"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";
import styles from "./MarketingSiteHeader.module.css";

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

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Header marketing flottant — présence premium, logo ancré, nav aérée. */
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
      className={cx(styles.root, plainBg && styles.rootPlain)}
    >
      <div className={styles.shell}>
        <div className={cx(styles.bar, scrolled && styles.barScrolled)}>
          <Link
            href="/"
            className={styles.brand}
            aria-label="BeWork — Accueil"
          >
            <BeWorkLogo
              size="sm"
              priority
              imageClassName={styles.logoImg}
            />
          </Link>

          <nav className={styles.nav} aria-label="Navigation principale">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className={styles.navLink}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={styles.actions}>
            <Link
              href="/contact#participer"
              className={styles.cta}
              {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "header-participer")}
            >
              Participer
              <span aria-hidden>→</span>
            </Link>
          </div>

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

      <div
        id="marketing-mobile-nav"
        className={cx(styles.mobilePanel, mobileOpen && styles.mobileOpen)}
        aria-hidden={!mobileOpen}
      >
        <div className={styles.mobileInner}>
          <Link
            href="/contact#participer"
            className={styles.ctaMobile}
            onClick={() => setMobileOpen(false)}
          >
            Participer →
          </Link>
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
        </div>
      </div>
    </header>
  );
}
