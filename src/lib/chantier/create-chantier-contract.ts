/**
 * Contrat création chantier dashboard ↔ POST /api/projets.
 * Staff (y compris AGENT) : clientId obligatoire, jamais inventé.
 * CLIENT : tenant résolu côté API, pas de picker.
 */
export function staffRequiresClientId(showClientPicker: boolean): boolean {
  return showClientPicker === true;
}

export const CREATE_CHANTIER_STAFF_MISSING_CLIENT_ERROR =
  "Sélectionnez un client pour ce chantier.";
