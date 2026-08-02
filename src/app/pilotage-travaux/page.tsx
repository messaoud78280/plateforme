import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { absoluteUrl } from "@/lib/site";

const MARKETING_TARGET = "/services/assistant-travaux";

/**
 * Alias public historique : ne doit pas pointer vers le dashboard (zone privée / noindex).
 * Redirection 308 vers la page marketing « assistant travaux ».
 */
export const metadata: Metadata = {
  title: { absolute: "Pilotage travaux BTP | BeWork" },
  description:
    "Pilotage et assistance travaux BTP avec BeWork — renvoi vers la page assistant travaux.",
  robots: { index: false, follow: true },
  alternates: { canonical: absoluteUrl(MARKETING_TARGET) },
};

export default function PilotageTravauxAliasPage() {
  redirect(MARKETING_TARGET);
}
