import type { Metadata } from "next";
import { SEO_NOINDEX_ROBOTS } from "@/lib/seo-search-engines";

export const metadata: Metadata = {
  title: { absolute: "Signature contrat | BeWork" },
  description: "Espace de signature du contrat BeWork.",
  robots: SEO_NOINDEX_ROBOTS,
};

export default function ContractLayout({ children }: { children: React.ReactNode }) {
  return children;
}
