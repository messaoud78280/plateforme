"use client";

import { Download } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

type Props = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  href: string;
  resourceSlug: string;
};

/** Lien de téléchargement PDF avec événement Plausible. */
export function ResourcePdfDownload({ href, resourceSlug, className, onClick, children, ...rest }: Props) {
  return (
    <a
      href={href}
      download
      className={className}
      {...plausibleTrackProps(PLAUSIBLE_EVENTS.DOWNLOAD_GUIDE_PDF, resourceSlug)}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
      }}
    >
      {children ?? (
        <>
          <Download className="h-5 w-5 shrink-0" aria-hidden />
          Télécharger le PDF (gratuit)
        </>
      )}
    </a>
  );
}
