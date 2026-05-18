/**
 * Métadonnées structurées pour les prix observés importés (variantes ChatGPT, etc.).
 */

export type PriceEntryImportMeta = {
  codeSource?: string;
  famille?: string;
  sousFamille?: string;
  ficheMere?: string;
  unite?: string;
  largeur_m?: string;
  profondeur_m?: string;
  classe_terre?: string;
  quantiteReference?: string;
  tags?: string[];
  commentaire?: string;
  /** Grille de prix importée (pose / fourniture) — conservée intégralement. */
  prixGrille?: Record<string, number>;
  /** Caractéristiques techniques de la variante (volume, dimensions…). */
  caracteristiques?: Record<string, string | number | boolean>;
  temps_pose?: number;
};

export function isPriceEntryImportMeta(v: unknown): v is PriceEntryImportMeta {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export function parsePriceEntryImportMeta(raw: unknown): PriceEntryImportMeta | null {
  if (!isPriceEntryImportMeta(raw)) return null;
  return raw;
}

/** Reconstitue des métadonnées à partir des notes « clé: valeur » (imports antérieurs). */
export function parseImportMetaFromNotes(notes: string | null | undefined): PriceEntryImportMeta {
  if (!notes?.trim()) return {};
  const meta: PriceEntryImportMeta = {};
  const tags: string[] = [];
  for (const line of notes.split("\n")) {
    const m = /^([^:]+):\s*(.+)$/.exec(line.trim());
    if (!m) continue;
    const key = m[1].trim().toLowerCase();
    const val = m[2].trim();
    if (key === "profondeur_m" || key === "profondeur") meta.profondeur_m = val.replace(/\s*m\s*$/i, "").trim() || val;
    else if (key === "largeur_m" || key === "largeur") meta.largeur_m = val.replace(/\s*m\s*$/i, "").trim() || val;
    else if (key === "classe_terre" || key === "classe") meta.classe_terre = val;
    else if (key === "quantite_reference" || key === "quantite") meta.quantiteReference = val;
    else if (key.startsWith("tag")) tags.push(val);
    else if (key === "commentaire") meta.commentaire = val;
    else if (key === "famille") meta.famille = val;
    else if (key === "sous_famille" || key === "sous-famille") meta.sousFamille = val;
    else if (key === "fiche_mere") meta.ficheMere = val;
    else if (key === "code" || key === "code_source") meta.codeSource = val;
  }
  if (tags.length > 0) meta.tags = tags;
  return meta;
}

export function mergeImportMeta(
  stored: PriceEntryImportMeta | null,
  fromNotes: PriceEntryImportMeta,
): PriceEntryImportMeta {
  return { ...fromNotes, ...stored };
}
