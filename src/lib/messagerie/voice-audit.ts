/**
 * Audit vocal Messagerie — MESSAGERIE-V2B (pas d’implémentation).
 *
 * État actuel :
 * - Aucun MediaRecorder / upload audio dans le composer
 * - Pièces jointes : images + docs via /api/messages/direct/upload
 * - Bouton 🎤 UI présent (désactivé) pour ancrer le réflexe WhatsApp
 *
 * Cible MESSAGERIE-V2C :
 * - Enregistrer → préécouter → envoyer (réflexes WhatsApp)
 * - Stockage audio court (durée max, compression)
 * - Lecture inline dans la bulle
 * - Permissions micro + fallback desktop
 *
 * Ne pas démarrer V2C sans validation produit.
 */
export const MESSAGERIE_VOICE_AUDIT = {
  status: "not_implemented" as const,
  plannedIn: "MESSAGERIE-V2C",
  composerMic: "disabled_placeholder",
};
