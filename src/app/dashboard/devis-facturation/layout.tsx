import type { Metadata } from "next";
import { requireCommercialSession } from "@/lib/commercial/access";

export const metadata: Metadata = {
  title: {
    default: "Devis & Facturation — BeWork",
    template: "%s — BeWork",
  },
};

export default async function DevisFacturationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCommercialSession();
  return children;
}
