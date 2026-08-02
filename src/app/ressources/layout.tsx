import type { ReactNode } from "react";
import { SeoInternalLinksAuto } from "@/components/seo/SeoInternalLinksAuto";

/** Layout ressources : maillage SEO en bas des tutos / guides (sans doubler les hubs). */
export default function RessourcesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SeoInternalLinksAuto />
    </>
  );
}
