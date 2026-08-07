import type { ReactNode } from "react";
import Link from "next/link";
import { BlueprintCotationFooterHairline } from "@/components/home/BlueprintCotationDecor";
import { MarketingSitePreFooter } from "@/components/layout/MarketingSitePreFooter";
import { BTP_PAIN_PAGE_CLUSTER } from "@/lib/btp-pain-pages";
import { EXTERNALISATION_ADMIN_BT_NAV } from "@/lib/externalisation-administrative-btp-geo";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";
import { SITE_URL, getOrgSameAs } from "@/lib/site";

const COL_LINK =
  "text-base text-slate-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500/70";

function ColumnTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{children}</h3>;
}

function socialLabel(url: string): "linkedin" | "facebook" | "instagram" | "tiktok" | "youtube" | "other" {
  const u = url.toLowerCase();
  if (u.includes("linkedin.com")) return "linkedin";
  if (u.includes("facebook.com")) return "facebook";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  return "other";
}

function SocialIcon({ type }: { type: ReturnType<typeof socialLabel> }) {
  const common = "h-4 w-4";
  switch (type) {
    case "linkedin":
      return (
        <svg className={common} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case "facebook":
      return (
        <svg className={common} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "instagram":
      return (
        <svg className={common} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg className={common} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
        </svg>
      );
    case "youtube":
      return (
        <svg className={common} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    default:
      return (
        <svg className={common} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" aria-hidden>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" />
        </svg>
      );
  }
}

/** Pied de page marketing sombre multi-colonnes (style catalogue type « annuaire pro » adapté au site BeWork). */
export function MarketingSiteFooter() {
  const year = new Date().getFullYear();
  const sameAs = getOrgSameAs();

  return (
    <>
      <MarketingSitePreFooter />
      <footer className="relative z-10 border-t border-slate-800/80 bg-[#0b1220] text-slate-300">
        <BlueprintCotationFooterHairline />
        <div className="relative z-10 mx-auto max-w-site px-5 py-14 sm:px-6 lg:py-16">
          <div className="grid grid-cols-2 gap-10 sm:gap-12 md:grid-cols-3 lg:grid-cols-6 lg:gap-8">
          {/* Marque */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1 lg:max-w-xs">
            <Link href="/" className="inline-block rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
              <span className="text-xl font-extrabold tracking-tight text-white">
                Be<span className="text-[color:var(--accent-500)]">Work</span>
              </span>
            </Link>
            <p className="mt-4 text-base leading-relaxed text-slate-400">
              BeWork conçoit, déploie et fait évoluer des plateformes internes intelligentes pour les entreprises du BTP.
              Vos équipes les utilisent au quotidien.
            </p>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              Société française — Éditeur et partenaire d&apos;évolution.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <ColumnTitle>Solutions BTP</ColumnTitle>
            <ul className="flex flex-col gap-3">
              <li>
                <Link href="/relance-devis-btp" className={COL_LINK}>
                  Signer plus de devis
                </Link>
              </li>
              {BTP_PAIN_PAGE_CLUSTER.map((p) => (
                <li key={p.href}>
                  <Link href={p.href} className={COL_LINK}>
                    {p.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/dict-dt-travaux" className={COL_LINK}>
                  Chantiers &amp; dossiers travaux
                </Link>
              </li>
              <li>
                <Link href="/impayes-btp-relances" className={COL_LINK}>
                  Facturation &amp; impayés
                </Link>
              </li>
              <li>
                <Link href="/suivi-fournisseurs-chantier" className={COL_LINK}>
                  Fournisseurs &amp; achats
                </Link>
              </li>
              <li>
                <Link href="/#plateforme" className={COL_LINK}>
                  Plateforme interne BTP
                </Link>
              </li>
              <li>
                <Link href="/#modules" className={COL_LINK}>
                  Composez votre plateforme
                </Link>
              </li>
              <li>
                <Link href="/assistants-administratifs-taches" className={COL_LINK}>
                  Capacités plateforme
                </Link>
              </li>
              <li>
                <Link href="/assistants-administratifs-taches#marches-publics-accords-cadres" className={COL_LINK}>
                  Marchés publics &amp; accords-cadres
                </Link>
              </li>
              <li>
                <Link href="/externaliser-administratif" className={COL_LINK}>
                  Équiper l&apos;admin BTP
                </Link>
              </li>
              <li>
                <Link href="/services" className={COL_LINK}>
                  Capacités métier (hub)
                </Link>
              </li>
              <li>
                <Link href="/services/compte-rendu-chantier" className={COL_LINK}>
                  Compte rendu de chantier
                </Link>
              </li>
              <li>
                <Link href="/services/analyse-dce-btp" className={COL_LINK}>
                  Analyse DCE
                </Link>
              </li>
              <li>
                <Link href="/services/ppsps" className={COL_LINK}>
                  PPSPS
                </Link>
              </li>
              <li>
                <Link href="/services/doe-btp" className={COL_LINK}>
                  DOE
                </Link>
              </li>
              <li>
                <Link href="/contact" className={COL_LINK}>
                  Demander une démonstration
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <ColumnTitle>Déploiement par pays</ColumnTitle>
            <ul className="flex flex-col gap-3">
              {EXTERNALISATION_ADMIN_BT_NAV.map((z) => (
                <li key={z.href}>
                  <Link href={z.href} className={COL_LINK}>
                    {z.title === "Suisse" ? "Suisse romande" : z.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <ColumnTitle>Ressources</ColumnTitle>
            <ul className="flex flex-col gap-3">
              <li>
                <Link href="/ressources" className={COL_LINK}>
                  Hub ressources
                </Link>
              </li>
              <li>
                <Link href="/ressources/tutos" className={COL_LINK}>
                  Tutoriels PDF
                </Link>
              </li>
              <li>
                <Link href="/ressources/guides" className={COL_LINK}>
                  Guides
                </Link>
              </li>
              <li>
                <Link href="/blog" className={COL_LINK}>
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/cas-clients" className={COL_LINK}>
                  Cas clients
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <ColumnTitle>Offre &amp; espace client</ColumnTitle>
            <ul className="flex flex-col gap-3">
              <li>
                <Link href="/tarifs" className={COL_LINK}>
                  Étude tarifaire personnalisée
                </Link>
              </li>
              <li>
                <Link href="/contact#formulaire" className={COL_LINK}>
                  Demander une démonstration
                </Link>
              </li>
              <li>
                <Link href="/inscription" className={COL_LINK}>
                  Créer un compte
                </Link>
              </li>
              <li>
                <Link href="/connexion" className={COL_LINK}>
                  Connexion
                </Link>
              </li>
              <li>
                <Link href="/#process-bework" className={COL_LINK}>
                  Process BeWork
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <ColumnTitle>À propos</ColumnTitle>
            <ul className="flex flex-col gap-3">
              <li>
                <Link href="/notre-facon-de-travailler" className={COL_LINK}>
                  Notre façon de travailler
                </Link>
              </li>
              <li>
                <Link href="/faq" className={COL_LINK}>
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className={COL_LINK} {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "footer-column")}>
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/conditions-generales-vente" className={COL_LINK}>
                  Conditions générales de vente
                </Link>
              </li>
              <li>
                <Link href="/mentions-legales" className={COL_LINK}>
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/politique-confidentialite" className={COL_LINK}>
                  Politique de confidentialité
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800/90">
        <div className="mx-auto flex max-w-site flex-col gap-6 px-5 py-6 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-4">
          <p className="text-sm text-slate-500 sm:text-base">
            © {year} BeWork. Tous droits réservés.
          </p>

          <div className="flex flex-wrap items-center gap-5 md:justify-end">
            {sameAs.length > 0 ? (
              <>
                <div className="flex items-center gap-2">
                  {sameAs.map((url) => {
                    const t = socialLabel(url);
                    return (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-600 text-slate-400 transition-colors hover:border-slate-400 hover:text-white"
                        aria-label={t === "other" ? "BeWork — lien externe" : `BeWork sur ${t}`}
                      >
                        <SocialIcon type={t} />
                      </a>
                    );
                  })}
                </div>
                <span className="hidden h-8 w-px bg-slate-700 sm:block" aria-hidden />
              </>
            ) : null}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-slate-400 sm:text-base">
              <Link href="/faq" className="transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500/70">
                Centre d&apos;aide / FAQ
              </Link>
              <Link
                href="/contact"
                className="transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500/70"
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "footer-bar")}
              >
                Demandes légales
              </Link>
              <a
                href={`${SITE_URL}/sitemap.xml`}
                className="transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500/70"
              >
                Plan du site
              </a>
              <a
                href={`${SITE_URL}/llms.txt`}
                className="transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500/70"
              >
                Index IA (llms.txt)
              </a>
              <a
                href={`${SITE_URL}/ai.txt`}
                className="transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500/70"
              >
                Politique IA (ai.txt)
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
}
