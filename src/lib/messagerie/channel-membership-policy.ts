/**
 * MESSAGERIE-V2C.6C — Règles produit PARTICIPANT ≠ SUPERVISEUR.
 *
 * Source de vérité participants : table ProjectChannelParticipant (explicite).
 * Supervision DIRECTION/MANAGER : canView (et canWrite → devient participant).
 *
 * Discussions / notifications / unread / realtime :
 * → participants uniquement.
 *
 * Par chantier :
 * → canView (participants + supervision).
 */

export type ChannelMembershipKind = "participant" | "supervisor_only" | "none";

/** Notifier un utilisateur d’un nouveau message canal ? */
export function shouldNotifyChannelMember(opts: {
  isAuthor: boolean;
  membership: ChannelMembershipKind;
}): boolean {
  if (opts.isAuthor) return false;
  return opts.membership === "participant";
}

/** Accumuler un unread personnel sur ce canal ? */
export function shouldAccumulateChannelUnread(opts: {
  membership: ChannelMembershipKind;
}): boolean {
  return opts.membership === "participant";
}

/** Apparaître dans la boîte Discussions ? */
export function shouldAppearInDiscussionsInbox(opts: {
  membership: ChannelMembershipKind;
}): boolean {
  return opts.membership === "participant";
}

/** Apparaître dans Par chantier ? */
export function shouldAppearInParChantier(opts: {
  canView: boolean;
}): boolean {
  return opts.canView;
}

/**
 * Premier envoi d’un superviseur :
 * il DOIT devenir participant (pas de participant fantôme).
 */
export function supervisorFirstSendJoinsAsParticipant(): true {
  return true;
}
