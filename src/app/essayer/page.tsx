import { permanentRedirect } from "next/navigation";

/** Ancien tunnel essai SaaS — redirigé vers l’intérêt formation. */
export default function EssayerRedirect() {
  permanentRedirect("/contact#participer");
}
