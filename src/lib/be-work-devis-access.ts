import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

/** Rôles autorisés sur le module interne BeWork Devis (pas les clients). */
export function canAccessBeWorkDevis(role: string | undefined | null): boolean {
  return role === "MANAGER" || role === "AGENCE" || role === "AGENT";
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
