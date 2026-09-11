"use client";

import { useEffect, useState } from "react";
import { FORMATION_NAV } from "@/lib/bework-formation";
import styles from "./formation.module.css";

/** Navigation interne sticky — suit le scroll de /formation. */
export function FormationStickyNav() {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<string>(FORMATION_NAV[0]?.href ?? "");

  useEffect(() => {
    const hero = document.getElementById("formation-hero-title");
    const sections = FORMATION_NAV.map((n) => document.querySelector(n.href)).filter(
      Boolean,
    ) as HTMLElement[];

    const onScroll = () => {
      const y = window.scrollY;
      setVisible(y > (hero?.offsetTop ?? 280) + 220);

      let current: string = FORMATION_NAV[0]?.href ?? "";
      for (const el of sections) {
        if (el.getBoundingClientRect().top <= 140) {
          current = `#${el.id}`;
        }
      }
      setActive(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`${styles.stickyNav}${visible ? ` ${styles.stickyNavVisible}` : ""}`}
      aria-label="Sections de la page formation"
    >
      <div className={styles.stickyNavInner}>
        {FORMATION_NAV.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`${styles.stickyLink}${active === item.href ? ` ${styles.stickyLinkActive}` : ""}`}
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
