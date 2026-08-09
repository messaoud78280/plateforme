/**
 * Audit vocal Messagerie — MESSAGERIE-V2C livré.
 *
 * Implémenté :
 * - MediaRecorder (webm/opus, mp4/Safari)
 * - Upload via /api/messages/direct/upload (audio autorisé)
 * - durationSec dans attachmentsJson (pas de migration)
 * - Player compact + un seul audio à la fois
 * - Permissions micro (messages FR)
 *
 * Hors scope (dette V2D / plus tard) :
 * - Transcription IA
 * - Résumé / traduction
 * - Appels audio/vidéo
 * - Messagerie offline complète
 */
export const MESSAGERIE_VOICE_AUDIT = {
  status: "implemented_v2c" as const,
  plannedNext: "MESSAGERIE-V2D (transcription optionnelle)",
  composerMic: "enabled",
};
