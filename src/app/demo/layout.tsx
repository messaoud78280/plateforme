import type { Metadata } from "next";
import { SEO_NOINDEX_ROBOTS } from "@/lib/seo-search-engines";
import { EnvironmentBanner } from "@/components/system/EnvironmentBanner";
import { TrustContextBanner } from "@/components/system/TrustContextBanner";

export const metadata: Metadata = {
  title: "Démonstration Pilotage travaux | BeWork",
  description: "Espace de démonstration commerciale BeWork — données fictives.",
  robots: SEO_NOINDEX_ROBOTS,
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="cc-shell min-h-screen bg-[color:var(--cc-surface-muted,#f4f6f9)]">
      <EnvironmentBanner environment="demo" extra="données fictives" />
      <TrustContextBanner kind="demo" />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
