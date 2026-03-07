import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/copilot/suggestions
 * Retourne des suggestions de tâches à déléguer à partir d'une situation décrite.
 * Pour l'instant : règles par mots-clés (sans API externe).
 * Peut être étendu avec OpenAI plus tard.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: { situation?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const situation = typeof body.situation === "string" ? body.situation.trim().toLowerCase() : "";
  if (!situation) {
    return NextResponse.json(
      { error: "Décrivez brièvement votre situation." },
      { status: 400 }
    );
  }

  const suggestions = getSuggestionsFromSituation(situation);
  return NextResponse.json({ suggestions });
}

function getSuggestionsFromSituation(situation: string): { label: string; estimatedMinutes: number }[] {
  const base: { label: string; estimatedMinutes: number; keywords: string[] }[] = [
    { label: "Relancer factures impayées", estimatedMinutes: 30, keywords: ["facture", "impayé", "relance", "paiement", "client", "créance"] },
    { label: "Préparer devis clients", estimatedMinutes: 45, keywords: ["devis", "client", "proposition", "offre", "chiffrage"] },
    { label: "Rechercher fournisseurs", estimatedMinutes: 30, keywords: ["fournisseur", "recherche", "achat", "comparatif", "appel d'offres"] },
    { label: "Mettre à jour les documents RH", estimatedMinutes: 45, keywords: ["rh", "contrat", "employé", "paie", "document"] },
    { label: "Organiser les rendez-vous", estimatedMinutes: 20, keywords: ["rdv", "rendez-vous", "agenda", "calendrier", "planning"] },
    { label: "Rédiger des courriers administratifs", estimatedMinutes: 30, keywords: ["courrier", "lettre", "mail", "rédaction", "administratif"] },
    { label: "Vérifier et classer les factures", estimatedMinutes: 25, keywords: ["facture", "classer", "archiver", "vérifier", "compta"] },
    { label: "Préparer un dossier pour un appel d'offres", estimatedMinutes: 60, keywords: ["appel d'offres", "appel doffres", "marché", "dossier", "candidature"] },
  ];

  const scored = base.map((s) => {
    const score = s.keywords.filter((k) => situation.includes(k)).length;
    return { ...s, score };
  });
  scored.sort((a, b) => b.score - a.score);

  if (scored[0].score > 0) {
    return scored
      .filter((s) => s.score > 0)
      .slice(0, 4)
      .map(({ label, estimatedMinutes }) => ({ label, estimatedMinutes }));
  }

  return [
    { label: "Relancer factures impayées", estimatedMinutes: 30 },
    { label: "Préparer devis clients", estimatedMinutes: 45 },
    { label: "Rechercher fournisseurs", estimatedMinutes: 30 },
  ];
}
