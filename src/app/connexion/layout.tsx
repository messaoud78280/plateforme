import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bework.fr";

export const metadata: Metadata = {
  title: "Connexion | BeWork",
  description:
    "Connectez-vous à votre espace BeWork : client, agent ou gérante. Accédez à votre tableau de bord et gérez vos missions administratives.",
  alternates: { canonical: `${BASE_URL}/connexion` },
  robots: { index: false, follow: true },
};

export default function ConnexionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
