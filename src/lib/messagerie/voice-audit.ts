/**
 * Audit vocal Messagerie — MESSAGERIE-V2C + V2C.1 hardening.
 *
 * Implémenté :
 * - MediaRecorder (isTypeSupported : webm/opus → mp4 Safari)
 * - Upload bucket privé `messagerie` + refs storage://
 * - Signed URL après ACL conversation (/api/messagerie/media)
 * - Player compact + un seul audio à la fois
 * - Limite 120 s + message FR si micro refusé
 *
 * Hors scope (dette V2D) :
 * - Transcription IA / résumé
 * - Appels audio/vidéo
 * - Offline complet
 * - Purge URLs publiques legacy dm/ dans bucket documents
 */
export const MESSAGERIE_VOICE_AUDIT = {
  status: "implemented_v2c1" as const,
  plannedNext: "MESSAGERIE-V2D (transcription optionnelle)",
  composerMic: "enabled",
  mediaAcl: "signed_url_after_conversation_acl",
};
