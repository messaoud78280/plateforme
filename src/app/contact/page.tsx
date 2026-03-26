import type { Metadata } from "next";
import ContactForm from "./ContactForm";
import { absoluteUrl } from "@/lib/site";

const pageUrl = absoluteUrl("/contact");

export const metadata: Metadata = {
  title: "Contact et rendez-vous",
  description:
    "Demande de contact et prise de rendez-vous en visioconférence avec BeWork. Renseignez votre structure, vos coordonnées et choisissez un créneau pour une démo.",
  alternates: { canonical: pageUrl },
};

export default function ContactPage() {
  return <ContactForm />;
}
