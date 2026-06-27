import type { Metadata } from "next";
import { SEO_NOINDEX_ROBOTS } from "@/lib/seo-search-engines";

export const metadata: Metadata = {
  title: { absolute: "Inscription | BeWork" },
  description: "Créer un compte client BeWork pour déléguer vos missions bureau-chantier BTP.",
  robots: SEO_NOINDEX_ROBOTS,
};

export default function InscriptionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
