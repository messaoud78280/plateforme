import type { ReactNode } from "react";
import Link from "next/link";
import {
  BTP_CTA_PRIMARY,
  BTP_NAV_ITEMS,
  BTP_SERVICE_LINKS,
  BEWORK_BTP_BRAND_SHORT,
  BEWORK_BTP_SIGNATURE,
} from "@/lib/bework-btp-services";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";
import { SITE_URL, getOrgSameAs } from "@/lib/site";

const COL_LINK =
  "text-[1.05rem] text-[#5B6776] transition-colors hover:text-[#1F2A37] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E4E8C]";

function ColumnTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#1F2A37]">
      {children}
    </h3>
  );
}

function socialLabel(url: string): "linkedin" | "other" {
  return url.toLowerCase().includes("linkedin.com") ? "linkedin" : "other";
}

function SocialIcon({ type }: { type: ReturnType<typeof socialLabel> }) {
  const common = "h-4 w-4";
  if (type === "linkedin") {
    return (
      <svg className={common} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    );
  }
  return (
    <svg className={common} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" />
    </svg>
  );
}

/** Pied de page marketing — charte claire cabinet ingénierie. */
export function MarketingSiteFooter() {
  const year = new Date().getFullYear();
  const socialProfiles = getOrgSameAs();

  return (
    <footer className="relative z-10 border-t border-[#DCE4EE] bg-[#F8FAFC] text-[#1F2A37]">
      <div className="relative z-10 mx-auto max-w-site px-5 py-12 sm:px-6 lg:py-16">
        <div className="grid grid-cols-2 gap-10 sm:gap-12 md:grid-cols-3 lg:grid-cols-5 lg:gap-8">
          <div className="col-span-2 md:col-span-3 lg:col-span-1 lg:max-w-xs">
            <Link
              href="/"
              className="inline-block rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E4E8C]"
            >
              <span className="text-xl font-extrabold tracking-tight text-[#1F2A37]">
                Be<span className="text-[#1E4E8C]">Work</span>
              </span>
            </Link>
            <p className="mt-3 text-sm font-medium leading-snug text-[#5B6776]">
              {BEWORK_BTP_BRAND_SHORT}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-[#5B6776]">
              {BEWORK_BTP_SIGNATURE}
            </p>
            <p className="mt-4 text-[11px] leading-relaxed text-[#5B6776]">
              Éditeur : OFC Création d’entreprise —{" "}
              <Link href="/mentions-legales" className="underline-offset-2 hover:underline">
                mentions légales
              </Link>
              .
            </p>
            <Link
              href={BTP_CTA_PRIMARY.href}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1E4E8C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#163A68]"
              {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "footer-devis")}
            >
              {BTP_CTA_PRIMARY.label}
              <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            <ColumnTitle>Prestations</ColumnTitle>
            <ul className="flex flex-col gap-3">
              {BTP_NAV_ITEMS.filter((item) => !item.children).map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={COL_LINK}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <ColumnTitle>Nos services</ColumnTitle>
            <ul className="flex flex-col gap-3">
              {BTP_SERVICE_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={COL_LINK}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/demande-de-devis" className={COL_LINK}>
                  Demande de devis
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <ColumnTitle>Légal</ColumnTitle>
            <ul className="flex flex-col gap-3">
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
              <li>
                <Link href="/conditions-generales-vente" className={COL_LINK}>
                  Conditions générales
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <ColumnTitle>Contact</ColumnTitle>
            <ul className="flex flex-col gap-3">
              <li>
                <Link
                  href="/contact"
                  className={COL_LINK}
                  {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "footer-column")}
                >
                  Nous écrire
                </Link>
              </li>
              <li>
                <Link href="/demande-de-devis?besoin=conducteur_travaux" className={COL_LINK}>
                  Conducteur de travaux
                </Link>
              </li>
              <li>
                <Link href="/demande-de-devis?besoin=assistance_marches_publics" className={COL_LINK}>
                  Étude de marché
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-[#DCE4EE]">
        <div className="mx-auto flex max-w-site flex-col gap-6 px-5 py-5 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-4">
          <p className="text-sm text-[#5B6776]">© {year} BeWork. Tous droits réservés.</p>

          <div className="flex flex-wrap items-center gap-5 md:justify-end">
            {socialProfiles.length > 0 ? (
              <>
                <div className="flex items-center gap-2">
                  {socialProfiles.map((url) => {
                    const t = socialLabel(url);
                    return (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DCE4EE] text-[#5B6776] transition-colors hover:border-[#1E4E8C] hover:text-[#1F2A37]"
                        aria-label={t === "other" ? "BeWork — lien externe" : `BeWork sur ${t}`}
                      >
                        <SocialIcon type={t} />
                      </a>
                    );
                  })}
                </div>
                <span className="hidden h-8 w-px bg-[#DCE4EE] sm:block" aria-hidden />
              </>
            ) : null}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-[#5B6776]">
              <Link
                href="/demande-de-devis"
                className="transition-colors hover:text-[#1F2A37] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E4E8C]"
              >
                Devis
              </Link>
              <Link
                href="/contact"
                className="transition-colors hover:text-[#1F2A37] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E4E8C]"
                {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "footer-bar")}
              >
                Contact
              </Link>
              <a
                href={`${SITE_URL}/sitemap.xml`}
                className="transition-colors hover:text-[#1F2A37] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E4E8C]"
              >
                Plan du site
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
