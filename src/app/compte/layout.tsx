import type { Metadata } from "next";
import { SEO_NOINDEX_ROBOTS } from "@/lib/seo-search-engines";

export const metadata: Metadata = {
  title: { absolute: "Compte | BeWork" },
  robots: SEO_NOINDEX_ROBOTS,
};

export default function CompteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
