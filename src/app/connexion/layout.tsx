import type { Metadata } from "next";
import { SEO_NOINDEX_ROBOTS } from "@/lib/seo-search-engines";

export const metadata: Metadata = {
  title: { absolute: "Connexion | BeWork" },
  description: "Connexion à votre espace BeWork (client, agent ou direction).",
  robots: SEO_NOINDEX_ROBOTS,
};

export default function ConnexionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
