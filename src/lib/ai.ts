export type MissionSuggestion = {
  title: string;
  description: string;
  category?: string | null;
  priority?: "STANDARD" | "PRIORITAIRE" | "URGENT" | null;
};

export async function analyzeMissionFromText(text: string): Promise<MissionSuggestion> {
  const t = text.toLowerCase();

  let title = text.trim();
  if (!title) title = "Nouvelle mission";
  let description =
    "Vous souhaitez confier cette mission à votre assistant. Précisez les éléments importants (clients concernés, délais, documents à utiliser, recommandations) avant d'envoyer si besoin.";
  let category: MissionSuggestion["category"] = "Autre";
  let priority: MissionSuggestion["priority"] = "STANDARD";

  const contains = (...words: string[]) => words.some((w) => t.includes(w));

  if (contains("devis")) {
    title = "Préparer un devis";
    description =
      "Vous souhaitez que nous préparions un devis à partir des informations fournies (chantier, prestations, tarifs). Indiquez le nom du client, la référence éventuelle et la date souhaitée d'envoi.";
    category = "Facturation / devis";
  } else if (contains("facture", "relance", "impayé", "impaye", "rappel")) {
    title = "Relancer des factures";
    description =
      "Vous souhaitez que nous relancions une ou plusieurs factures en attente de paiement. Précisez les numéros de facture, les clients concernés et la date d'échéance.";
    category = "Facturation / devis";
    priority = "PRIORITAIRE";
  } else if (contains("fournisseur", "prestataire")) {
    title = "Rechercher un fournisseur";
    description =
      "Vous souhaitez que nous recherchions un ou plusieurs fournisseurs correspondant à vos critères (secteur, zone géographique, budget, délais). Indiquez vos priorités (prix, qualité, délai, proximité).";
    category = "Recherche";
  } else if (contains("document", "classement", "archiv", "dossier")) {
    title = "Classer des documents";
    description =
      "Vous souhaitez que nous organisions ou classions vos documents (factures, contrats, RH, etc.). Précisez le type de documents, la période concernée et l'organisation souhaitée (par client, par date, par type…).";
    category = "Documents";
  } else if (contains("déplacement", "deplacement", "voyage", "train", "avion", "hôtel", "hotel")) {
    title = "Organiser un déplacement";
    description =
      "Vous souhaitez que nous organisions un déplacement (transport et hébergement). Indiquez la destination, les dates aller/retour, les contraintes de budget et vos préférences (train, avion, type d'hôtel).";
    category = "Organisation";
  } else if (contains("tableau", "suivi", "reporting", "crm", "listing", "liste clients")) {
    title = "Créer un tableau de suivi";
    description =
      "Vous souhaitez que nous créions ou mettions à jour un tableau de suivi (clients, factures, projets, tâches…). Précisez les informations à suivre, la période concernée et le format souhaité (Excel, Google Sheets…).";
    category = "Administratif";
  }

  if (contains("urgent", "urgence", "aujourd'hui", "aujourdhui", "demain")) {
    priority = "URGENT";
  }

  return {
    title,
    description,
    category,
    priority,
  };
}
