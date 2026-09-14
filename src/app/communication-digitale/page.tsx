import { permanentRedirect } from "next/navigation";

/** Ancienne offre publique retirée : redirection permanente vers le positionnement actuel. */
export default function CommunicationDigitalePage() {
  permanentRedirect("/");
}
