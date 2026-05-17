import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion | BeWork",
  description: "Connexion à votre espace BeWork (client, agent ou direction).",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function ConnexionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
