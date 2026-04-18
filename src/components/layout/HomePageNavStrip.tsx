"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Bandeau d’ancres page d’accueil : le App Router ne fait pas toujours défiler vers #id au clic.
 * Sur la home, on force le scroll ; hors home, /#id charge l’accueil avec ancre.
 */
export function HomePageNavStrip() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    if (pathname !== "/") return;
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (!el) return;
    const t = window.requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(t);
  }, [pathname]);

  function handleSectionClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    if (!isHome) return;
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
  }

  return (
    <div className="nav-strip-metallic-blue nav-strip-metallic-blue--compact hidden md:block">
      <nav
        className="nav-strip-metallic-blue__nav mx-auto flex max-w-6xl flex-nowrap items-center justify-center gap-x-0 px-3 py-1.5 sm:px-5 sm:py-2"
        aria-label="Navigation principale"
      >
        <a
          className="whitespace-nowrap"
          href="/#plateforme"
          title="Offre, plateforme et secteurs — dont le BTP"
          onClick={(e) => handleSectionClick(e, "plateforme")}
        >
          Offre & secteurs
        </a>
        <Link
          className="whitespace-nowrap"
          href="/assistant-administratif-externalise"
          title="Partenaire administratif externalisé — présentation"
        >
          Partenaire externalisé
        </Link>
        <Link className="whitespace-nowrap" href="/tarifs" title="Tarifs — sans recrutement ni charges">
          Tarifs
        </Link>
        <Link className="whitespace-nowrap" href="/notre-facon-de-travailler" title="Flux, organisation et forfaits">
          Notre méthode
        </Link>
        <Link className="whitespace-nowrap" href="/blog">
          Blog
        </Link>
        <a className="whitespace-nowrap" href="/#equipe" onClick={(e) => handleSectionClick(e, "equipe")}>
          Équipe
        </a>
        <Link className="whitespace-nowrap" href="/faq">
          FAQ
        </Link>
      </nav>
    </div>
  );
}
