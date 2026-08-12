/**
 * Paramètres documents commerciaux (PDF devis) — JSON versionné côté org.
 * Séparé du moteur graphique. Évolutif sans migration à chaque mention.
 */
export type QuoteDocumentSettings = {
  /** Afficher IBAN/BIC sur le devis */
  showBankOnQuote?: boolean;
  /** Mode de règlement affiché (ex. Virement bancaire) */
  paymentModeLabel?: string | null;
  /** Texte gestion déchets — null = ne pas afficher */
  wasteManagementText?: string | null;
  /** Coût déchets affiché tel quel — « Inclus » ou montant, jamais inventé */
  wasteCostLabel?: string | null;
  /** « Devis gratuit » / « Devis payant : X € » — null = ne pas afficher */
  quoteFeeLabel?: string | null;
  /** Texte bon pour accord */
  acceptanceText?: string | null;
  /** CGV en annexe (pages suivantes) */
  cgvText?: string | null;
  /** Ligne footer additionnelle */
  footerText?: string | null;
  /** Conditions particulières par défaut */
  defaultParticularConditions?: string | null;
  /** Alerter si assurance absente */
  requireInsurance?: boolean;
  /** Alerter si déchets absents */
  requireWaste?: boolean;
  /** Alerter si durée d’exécution absente */
  requireExecutionDuration?: boolean;
  /** Alerter si adresse chantier absente */
  requireSiteAddress?: boolean;
  /**
   * Contexte contrat consommateur (paramètre org par défaut).
   * EN_ETABLISSEMENT | A_DISTANCE | HORS_ETABLISSEMENT
   * Ne déclenche pas automatiquement un droit de rétractation.
   */
  consumerContractContextDefault?: string | null;
  /** Texte annexe rétractation (template configurable) — affiché seulement si context = HORS_ETABLISSEMENT ou A_DISTANCE ET flag showRetractionAnnex */
  retractionAnnexText?: string | null;
  showRetractionAnnex?: boolean;
  /** Préparer annexation attestation décennale (URL/chemin) — fusion PDF non forcée en V2 */
  decennaleDocumentPath?: string | null;
  decennaleInsurer?: string | null;
  decennalePolicyNumber?: string | null;
  decennaleCoverage?: string | null;
  decennaleValidFrom?: string | null;
  decennaleValidTo?: string | null;
};

export const DEFAULT_ACCEPTANCE_TEXT =
  "Le client reconnaît avoir pris connaissance du présent devis et de ses éventuelles annexes, et les accepte.";

export function parseQuoteDocumentSettings(raw: unknown): QuoteDocumentSettings {
  if (!raw || typeof raw !== "object") return {};
  return raw as QuoteDocumentSettings;
}
