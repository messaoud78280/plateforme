import type { Metadata } from "next";
import ContactForm from "./ContactForm";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bework.fr";

export const metadata: Metadata = {
  title: "Contact et rendez-vous",
  description:
    "Demande de contact et prise de rendez-vous en visioconférence avec BeWork. Renseignez votre structure, vos coordonnées et choisissez un créneau pour une démo.",
  alternates: { canonical: `${BASE_URL}/contact` },
};

export default function ContactPage() {
  return <ContactForm />;
}
