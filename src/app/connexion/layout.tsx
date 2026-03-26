import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

const pageUrl = absoluteUrl("/connexion");

export const metadata: Metadata = {
  title: "Connexion | BeWork",
  description:
    "Connectez-vous à votre espace BeWork : client, agent ou gérante. Accédez à votre tableau de bord et gérez vos missions administratives.",
  alternates: { canonical: pageUrl },
  robots: { index: false, follow: true },
};

export default function ConnexionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
