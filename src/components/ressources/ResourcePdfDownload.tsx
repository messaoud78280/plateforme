"use client";

import { Download } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

type Props = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  href: string;
  resourceSlug: string;
};

/** Lien de téléchargement PDF avec push dataLayer optionnel (GA4). */
export function ResourcePdfDownload({ href, resourceSlug, className, onClick, children, ...rest }: Props) {
  return (
    <a
      href={href}
      download
      className={className}
      {...rest}
      onClick={(e) => {
        if (typeof window !== "undefined" && window.dataLayer) {
          window.dataLayer.push({ event: "download_resource", resource_slug: resourceSlug });
        }
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
