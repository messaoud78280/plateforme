import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

/** Rôles autorisés sur le module interne BeWork Devis (pas les clients). */
export function canAccessBeWorkDevis(role: string | undefined | null): boolean {
  return role === "MANAGER" || role === "AGENCE" || role === "AGENT";
}

/**
 * Gestion des enrichissements Dico BTP (notes personnelles + images) :
 * réservée aux gérants. Les autres membres de l'équipe consultent seulement.
 */
export function canManageBeWorkDico(role: string | undefined | null): boolean {
  return role === "MANAGER";
}

/** Session obligatoire + rôle interne ; sinon redirection. */
export async function requireBeWorkDevisSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/devis");
  }
  if (!canAccessBeWorkDevis(session.user.role)) {
    redirect("/dashboard");
  }
  return session;
}
