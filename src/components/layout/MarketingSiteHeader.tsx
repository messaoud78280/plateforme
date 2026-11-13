"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import {
  BTP_CTA_PRIMARY,
  BTP_NAV_ITEMS,
  BEWORK_BTP_SIGNATURE,
} from "@/lib/bework-btp-services";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";
import styles from "./MarketingSiteHeader.module.css";

type Props = {
  plainBg?: boolean;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M4.5 7V5.25a3.5 3.5 0 0 1 7 0V7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <rect
        x="3"
        y="7"
        width="10"
        height="7"
        rx="1.75"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="8" cy="10.25" r="1" fill="currentColor" />
    </svg>
  );
}

/** Header marketing — site commercial BTP. */
export function MarketingSiteHeader({ plainBg = false }: Props) {
  const pathname = usePathname() || "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const privateHref = "/dashboard";
  const privateLabel = "Accès plateforme";
  const privateAria = "Accès plateforme — connexion à l’espace collaboratif";

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
    if (!mobileOpen) return;

    const panel = mobilePanelRef.current;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const panelFocusable = panel
      ? Array.from(
          panel.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        )
      : [];
    const focusable = menuButtonRef.current
      ? [...panelFocusable, menuButtonRef.current]
      : panelFocusable;

    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => panelFocusable[0]?.focus());

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        return;
      }
      if (event.key !== "Tab" || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [mobileOpen]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1180px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMobileOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className={cx(styles.root, plainBg && styles.rootPlain)}>
      <div className={styles.shell}>
        <div className={cx(styles.panel, scrolled && styles.panelScrolled)}>
          <div className={styles.tierBrand}>
            <div className={styles.brandCluster}>
              <Link href="/" className={styles.brand} aria-label="BeWork — Accueil">
                <BeWorkLogo size="md" priority imageClassName={styles.logoImg} />
              </Link>

              <span className={styles.brandDivider} aria-hidden />

              <p className={styles.signature} aria-label={BEWORK_BTP_SIGNATURE}>
                <span className={styles.signatureBody}>
                  <span className={styles.signaturePrimary}>
                    <span className={styles.signaturePrimaryFull}>
                      Conduite de travaux ·{" "}
                      <span className={styles.accent}>Pilotage TCE</span>
                    </span>
                    <span className={styles.signaturePrimaryShort}>
                      <span className={styles.accent}>Conduite de travaux</span>
                    </span>
                  </span>
                  <span className={styles.signatureSecondary}>
                    <span className={styles.signatureSecondaryFull}>
                      Ingénierie opérationnelle BTP
                    </span>
                    <span className={styles.signatureSecondaryShort}>
                      Pilotage TCE
                    </span>
                  </span>
                </span>
              </p>
            </div>

            <div className={styles.actions}>
              <Link href="/contact" className={styles.ctaSecondary} aria-label="Contact">
                <span className={styles.ctaSecondaryFull} aria-hidden>
                  Contact
                </span>
                <span className={styles.ctaSecondaryShort} aria-hidden>
                  Contact
                </span>
              </Link>
              <Link
                href={BTP_CTA_PRIMARY.href}
                className={styles.cta}
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "header-devis")}
              >
                {BTP_CTA_PRIMARY.label}
                <span aria-hidden>→</span>
              </Link>
            </div>

            <div className={styles.mobileTopActions}>
              <Link
                href={BTP_CTA_PRIMARY.href}
                className={styles.ctaCompact}
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "header-devis-mobile")}
              >
                Devis
              </Link>
              <button
                ref={menuButtonRef}
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

          <div className={styles.tierNav}>
            <nav className={styles.nav} aria-label="Navigation principale">
              {BTP_NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(styles.navLink, isActive(item.href) && styles.navLinkActive)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <Link href={privateHref} className={styles.privateAccess} aria-label={privateAria}>
              <LockIcon className={styles.privateAccessIcon} />
              <span>{privateLabel}</span>
            </Link>
          </div>
        </div>
      </div>

      <div
        ref={mobilePanelRef}
        id="marketing-mobile-nav"
        role="dialog"
        aria-modal={mobileOpen || undefined}
        aria-label="Menu principal"
        className={cx(styles.mobilePanel, mobileOpen && styles.mobileOpen)}
        aria-hidden={!mobileOpen}
      >
        <div className={styles.mobileInner}>
          <nav className={styles.mobileNav} aria-label="Navigation mobile">
            {BTP_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={styles.mobileLink}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className={styles.mobileLink}
              onClick={() => setMobileOpen(false)}
            >
              Contact
            </Link>
          </nav>

          <div className={styles.mobilePrivateWrap}>
            <Link
              href={privateHref}
              className={styles.mobilePrivateAccess}
              aria-label={privateAria}
              onClick={() => setMobileOpen(false)}
            >
              <LockIcon className={styles.privateAccessIcon} />
              <span>{privateLabel}</span>
            </Link>
          </div>

          <div className={styles.mobileActions}>
            <Link
              href={BTP_CTA_PRIMARY.href}
              className={styles.ctaMobile}
              onClick={() => setMobileOpen(false)}
            >
              {BTP_CTA_PRIMARY.label} →
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
