import type { Metadata } from "next";
import { SEO_NOINDEX_ROBOTS } from "@/lib/seo-search-engines";

export const metadata: Metadata = {
  title: "Démonstration Pilotage travaux | BeWork",
  description: "Espace de démonstration commerciale BeWork — données fictives.",
  robots: SEO_NOINDEX_ROBOTS,
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[color:var(--pilotage-bg,#f4f6f9)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
