import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { SEO_NOINDEX_ROBOTS } from "@/lib/seo-search-engines";
import { BackLink } from "@/components/ui/BackLink";
import { DesignSystemCatalog } from "@/components/design-system/DesignSystemCatalog";

export const metadata: Metadata = {
  title: "Design system | BeWork",
  robots: SEO_NOINDEX_ROBOTS,
};

export default async function DesignSystemPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/design-system");
  }
  const role = session.user.role;
  if (role !== "MANAGER" && role !== "AGENCE") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-4">
      <BackLink href="/dashboard">Tableau de bord</BackLink>
      <DesignSystemCatalog />
    </div>
  );
}
