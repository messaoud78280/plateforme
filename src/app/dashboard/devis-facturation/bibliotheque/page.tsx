import { redirect } from "next/navigation";

/** Ancienne URL — le référentiel est désormais dans Bibliothèque → Ouvrages & prix. */
export default function BibliothequeRedirectPage() {
  redirect("/dashboard/documents?universe=ouvrages");
}
