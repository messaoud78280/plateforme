import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

const pageUrl = absoluteUrl("/inscription");

export const metadata: Metadata = {
  title: "Créer un compte client | BeWork",
  description:
    "Ouvrez votre espace client BeWork pour souscrire à un forfait administratif cadré (BTP et PME) et déposer vos demandes sur la plateforme.",
  alternates: { canonical: pageUrl, languages: { fr: pageUrl, "x-default": pageUrl } },
  robots: { index: true, follow: true },
};

export default function InscriptionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
