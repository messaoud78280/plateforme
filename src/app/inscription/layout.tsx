import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inscription | BeWork",
  description: "Créer un compte client BeWork pour déléguer vos missions bureau-chantier BTP.",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function InscriptionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
