import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bework.fr";

export const metadata: Metadata = {
  title: "Créer un compte client | Tester BeWork",
  description:
    "Inscrivez-vous sur BeWork pour tester l'assistant administratif externalisé. Créez votre compte client et commencez à déléguer vos tâches administratives dès 215€/mois.",
  alternates: { canonical: `${BASE_URL}/inscription` },
  robots: { index: true, follow: true },
};

export default function InscriptionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
