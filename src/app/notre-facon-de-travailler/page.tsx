import { permanentRedirect } from "next/navigation";

/** Ancienne page méthode BTP — redirigée vers la formation. */
export default function NotreFaconDeTravaillerRedirect() {
  permanentRedirect("/formation");
}
