"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { QualiopiMark } from "@/components/qualiopi/QualiopiMark";
import { QUALIOPI_COPY } from "@/lib/formation-organism";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";
import styles from "./MarketingSiteHeader.module.css";

type Props = {
  plainBg?: boolean;
};

const NAV_ITEMS = [
  { href: "/#hero", label: "Découvrir", match: "home" },
  { href: "/#demonstrations", label: "Possibilités", match: "demonstrations" },
  { href: "/demonstrations", label: "Démonstrations", match: "/demonstrations" },
  { href: "/formation#programme", label: "Programme", match: "programme" },
  { href: "/faq", label: "FAQ", match: "/faq" },
] as const;

const PLATFORM_HREF = "/dashboard";

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
    if (match.startsWith("/")) {
      return pathname.startsWith(match);
    }
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
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const isActive = useActiveNav();
  const privateHref = PLATFORM_HREF;
  const privateLabel = "Accès privé";
  const privateAria = "Accès privé — connexion à la plateforme";

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

  return (
    <header className={cx(styles.root, plainBg && styles.rootPlain)}>
      <div className={styles.shell}>
        <div className={cx(styles.panel, scrolled && styles.panelScrolled)}>
          {/* ——— Étage 1 : marque + signature + CTA ——— */}
          <div className={styles.tierBrand}>
            <div className={styles.brandCluster}>
              <Link href="/" className={styles.brand} aria-label="BeWork — Accueil">
                <BeWorkLogo size="md" priority imageClassName={styles.logoImg} />
              </Link>

              <span className={styles.brandDivider} aria-hidden />

              <p
                className={styles.signature}
                aria-label="En une journée, passez de l’idée au projet. Créez avec l’IA, sans savoir coder."
              >
                <span className={styles.signatureBody}>
                  <span className={styles.signaturePrimary}>
                    <span className={styles.signaturePrimaryFull}>
                      En{"\u00a0"}une{"\u00a0"}journée, passez{" "}
                      <span className={styles.accent}>
                        de{"\u00a0"}l’idée au{"\u00a0"}projet
                      </span>
                      .
                    </span>
                    <span className={styles.signaturePrimaryShort}>
                      Passez{" "}
                      <span className={styles.accent}>
                        de{"\u00a0"}l’idée au{"\u00a0"}projet
                      </span>
                      .
                    </span>
                  </span>
                  <span className={styles.signatureSecondary}>
                    <span className={styles.signatureSecondaryFull}>
                      Créez <span className={styles.accent}>avec{"\u00a0"}l’IA</span>,{" "}
                      <span className={styles.accent}>sans{"\u00a0"}savoir{"\u00a0"}coder</span>.
                    </span>
                    <span className={styles.signatureSecondaryShort}>
                      Créez <span className={styles.accent}>avec{"\u00a0"}l’IA</span>,{" "}
                      <span className={styles.accent}>sans{"\u00a0"}savoir{"\u00a0"}coder</span>.
                    </span>
                  </span>
                </span>
              </p>
            </div>

            <div className={styles.qualiopiSlot}>
              <Link
                href={QUALIOPI_COPY.learnMoreHref}
                className={styles.qualiopiBrand}
                aria-label="Organisme de formation certifié Qualiopi — OFC Création d’entreprise"
                title="Organisme certifié Qualiopi"
              >
                <QualiopiMark variant="header" showCategoryMention={false} />
              </Link>
            </div>

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

          {/* ——— Étage 2 : navigation + accès privé ——— */}
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

            <Link
              href={privateHref}
              className={styles.privateAccess}
              aria-label={privateAria}
            >
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
