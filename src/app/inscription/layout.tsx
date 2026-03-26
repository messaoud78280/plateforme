import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

const pageUrl = absoluteUrl("/inscription");

export const metadata: Metadata = {
  title: "Créer un compte client | Tester BeWork",
  description:
    "Inscrivez-vous sur BeWork pour tester l'assistant administratif externalisé. Créez votre compte client et commencez à déléguer vos tâches administratives dès 215 € TTC/mois.",
  alternates: { canonical: pageUrl },
  robots: { index: true, follow: true },
};

export default function InscriptionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
