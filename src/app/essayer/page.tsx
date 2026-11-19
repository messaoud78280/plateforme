import { permanentRedirect } from "next/navigation";

/** Ancien tunnel essai SaaS / place formation IA — redirigé vers le hub formation BTP. */
export default function EssayerRedirect() {
  permanentRedirect("/formation-professionnelle-btp#demande-formation");
}
