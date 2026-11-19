import { permanentRedirect } from "next/navigation";

/** Ancienne confirmation d’essai SaaS — plus exposée. */
export default function EssayerConfirmationRedirect() {
  permanentRedirect("/contact");
}
