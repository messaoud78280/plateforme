"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import type { ReactNode } from "react";
import { ResourcePdfDownload } from "@/components/ressources/ResourcePdfDownload";
import {
  resourcesBtnCompactOutline,
  resourcesBtnCompactPdf,
  resourcesIconWrap,
} from "@/components/ressources/resources-hub-ui";

export type ResourcesListEntry = {
  href: string;
  title: string;
  description: ReactNode;
  badge?: ReactNode;
  icon?: ReactNode;
  /** Chemin public du PDF (`/ressources/pdf/...`) */
  pdfHref?: string;
  resourceSlug?: string;
  openLabel?: string;
  pdfLabel?: string;
};

type Props = {
  items: readonly ResourcesListEntry[];
  columns?: 1 | 2;
  defaultOpenLabel?: string;
  defaultPdfLabel?: string;
  className?: string;
};

const cardClass =
  "group/card relative flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-100/80 transition-[border-color,box-shadow,transform] duration-200 motion-safe:hover:-translate-y-px motion-safe:hover:border-[#93c5fd]/70 motion-safe:hover:shadow-md motion-safe:hover:shadow-slate-900/[0.08] motion-safe:hover:ring-[#2563eb]/12 sm:gap-4 sm:p-5";

export function ResourcesClickableList({
  items,
  columns = 1,
  defaultOpenLabel = "Voir la fiche",
  defaultPdfLabel = "Télécharger le PDF",
  className = "",
}: Props) {
  if (items.length === 0) return null;

  const listClass =
    columns === 2
      ? "grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2 md:gap-4"
      : "flex list-none flex-col gap-3 p-0";

  return (
    <ul className={`${listClass} ${className}`.trim()} role="list">
      {items.map((item) => {
        const openLabel = item.openLabel ?? defaultOpenLabel;
        const pdfLabel = item.pdfLabel ?? defaultPdfLabel;
        const slug = item.resourceSlug ?? item.href;

        return (
          <li key={item.href} className="min-w-0">
            <article className={cardClass}>
              <span
                className="pointer-events-none absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-gradient-to-b from-[#1d4ed8] to-[#3b82f6] opacity-0 transition-opacity duration-200 group-hover/card:opacity-100 sm:inset-y-4"
                aria-hidden
              />
              <div className="flex items-start gap-3 sm:gap-4">
                {item.icon ? (
                  <span className={resourcesIconWrap} aria-hidden>
                    {item.icon}
                  </span>
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="font-heading text-base font-bold leading-snug tracking-tight text-[#0f172a] sm:text-[1.05rem]">
                      {item.title}
                    </h3>
                    {item.badge}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100/90 pt-3 sm:pt-3.5">
                <Link href={item.href} className={resourcesBtnCompactOutline}>
                  {openLabel}
                </Link>
                {item.pdfHref ? (
                  <ResourcePdfDownload
                    href={item.pdfHref}
                    resourceSlug={slug}
                    className={resourcesBtnCompactPdf}
                  >
                    <Download className="size-4 shrink-0" aria-hidden strokeWidth={2} />
                    {pdfLabel}
                  </ResourcePdfDownload>
                ) : null}
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
