import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

const pageUrl = absoluteUrl("/inscription");

export const metadata: Metadata = {
  title: "Créer un compte client | BeWork",
  description:
    "Créez votre compte BeWork : forfait administratif BTP et dépôt de missions sur la plateforme. Démarrage encadré.",
  alternates: { canonical: pageUrl, languages: { fr: pageUrl, "x-default": pageUrl } },
  robots: { index: true, follow: true },
};

export default function InscriptionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
