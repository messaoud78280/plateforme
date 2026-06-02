-- Correspondances Artiprix étendues (chapitres fréquents BTP)
-- Idempotent : ON CONFLICT DO NOTHING

INSERT INTO "WorkItemCodificationMapping" ("id", "sourcePattern", "matchType", "lotCode", "familleCode", "ouvrageCode", "sousFamilleCode", "sousFamilleNom", "importSourceHint", "priority", "note")
VALUES
  -- Chapitre 1 — Démolitions / déposes
  ('map-artiprix-1-10', '1.10', 'artiprix_chapter', 'GO', 'DEM', 'MUR', 'MUR', 'Démolition de murs', 'Artiprix', 95, 'Démolitions maçonnerie'),
  ('map-artiprix-1-12', '1.12', 'artiprix_chapter', 'GO', 'DEM', 'PLA', 'PLA', 'Démolition de plafonds', 'Artiprix', 95, 'Démolitions plafonds'),
  ('map-artiprix-1-13', '1.13', 'artiprix_chapter', 'GO', 'DEM', 'SOL', 'SOL', 'Démolition de sols', 'Artiprix', 95, 'Démolitions sols / dalles'),
  ('map-artiprix-1-14', '1.14', 'artiprix_chapter', 'GO', 'DEM', 'EVG', NULL, 'Évacuation gravats', 'Artiprix', 92, 'Évacuations'),
  ('map-artiprix-1-2', '1.2', 'artiprix_chapter', 'GO', 'DEM', 'DEC', NULL, 'Décapage / curage', 'Artiprix', 88, 'Décapages'),
  ('map-artiprix-1-3', '1.3', 'artiprix_chapter', 'GO', 'DEM', 'MUR', 'MUR', 'Démolition ouvertures', 'Artiprix', 88, 'Ouvertures en démolition'),
  -- Chapitre 2 — Terrassements
  ('map-artiprix-2-3', '2.3', 'artiprix_chapter', 'GO', 'TER', 'REM', NULL, 'Remblais', 'Artiprix', 90, 'Remblais'),
  ('map-artiprix-2-4', '2.4', 'artiprix_chapter', 'GO', 'TER', 'DEC', NULL, 'Déblais', 'Artiprix', 88, 'Déblais'),
  ('map-artiprix-2-5', '2.5', 'artiprix_chapter', 'VRD', 'TER', 'TRC', NULL, 'Tranchées réseaux', 'Artiprix', 85, 'Tranchées VRD'),
  -- Chapitre 3 — Fondations
  ('map-artiprix-3-1', '3.1', 'artiprix_chapter', 'GO', 'FON', 'SEM', NULL, 'Semelles', 'Artiprix', 92, 'Semelles'),
  ('map-artiprix-3-2', '3.2', 'artiprix_chapter', 'GO', 'FON', 'LON', NULL, 'Longrines', 'Artiprix', 92, 'Longrines'),
  ('map-artiprix-3-3', '3.3', 'artiprix_chapter', 'GO', 'FON', 'RAD', NULL, 'Radier', 'Artiprix', 92, 'Radiers'),
  ('map-artiprix-3-4', '3.4', 'artiprix_chapter', 'GO', 'FON', 'SOU', NULL, 'Soubassement', 'Artiprix', 90, 'Soubassements'),
  -- Chapitre 4 — Gros œuvre / maçonnerie
  ('map-artiprix-4-1', '4.1', 'artiprix_chapter', 'GO', 'MAC', 'MUR', NULL, 'Murs', 'Artiprix', 90, 'Maçonnerie murs'),
  ('map-artiprix-4-2', '4.2', 'artiprix_chapter', 'GO', 'DAL', 'DAL', NULL, 'Dalles', 'Artiprix', 90, 'Dalles béton'),
  ('map-artiprix-4-3', '4.3', 'artiprix_chapter', 'GO', 'BET', 'ARM', NULL, 'Béton armé', 'Artiprix', 88, 'Ouvrages BA'),
  -- Chapitre 5–6 — Charpente / couverture
  ('map-artiprix-5-1', '5.1', 'artiprix_chapter', 'CHA', 'MAC', 'MUR', NULL, 'Charpente bois', 'Artiprix', 85, 'Charpente'),
  ('map-artiprix-6-1', '6.1', 'artiprix_chapter', 'CHA', 'MAC', 'REV', NULL, 'Couverture / zinguerie', 'Artiprix', 85, 'Couverture'),
  -- Chapitre 7–8 — Menuiseries / cloisons SO
  ('map-artiprix-7-1', '7.1', 'artiprix_chapter', 'MEN', 'MEN', 'MUR', NULL, 'Menuiseries extérieures', 'Artiprix', 85, 'Menuiseries ext.'),
  ('map-artiprix-8-1', '8.1', 'artiprix_chapter', 'SO', 'CLO', 'CLO', NULL, 'Cloisons', 'Artiprix', 90, 'Cloisons distribution'),
  ('map-artiprix-8-2', '8.2', 'artiprix_chapter', 'SO', 'PLA', 'PLA', NULL, 'Plafonds', 'Artiprix', 90, 'Plafonds'),
  ('map-artiprix-8-3', '8.3', 'artiprix_chapter', 'SO', 'ISO', 'REV', NULL, 'Isolation / doublage', 'Artiprix', 88, 'Doublages'),
  -- Chapitre 9–11 — Techniques
  ('map-artiprix-9-1', '9.1', 'artiprix_chapter', 'PLB', 'PLB', 'GEN', NULL, 'Plomberie', 'Artiprix', 85, 'Plomberie'),
  ('map-artiprix-10-1', '10.1', 'artiprix_chapter', 'ELE', 'ELE', 'GEN', NULL, 'Électricité', 'Artiprix', 85, 'Électricité'),
  ('map-artiprix-11-1', '11.1', 'artiprix_chapter', 'CVC', 'CVC', 'GEN', NULL, 'Chauffage / ventilation', 'Artiprix', 85, 'CVC'),
  -- Chapitre 12–13 — Finitions
  ('map-artiprix-12-1', '12.1', 'artiprix_chapter', 'PEI', 'PEI', 'REV', NULL, 'Peinture', 'Artiprix', 88, 'Peinture'),
  ('map-artiprix-13-1', '13.1', 'artiprix_chapter', 'REV', 'CAR', 'FAI', NULL, 'Carrelage / faïence', 'Artiprix', 88, 'Carrelage'),
  ('map-artiprix-13-2', '13.2', 'artiprix_chapter', 'REV', 'SOL', 'CHP', NULL, 'Chapes / sols', 'Artiprix', 88, 'Chapes'),
  -- VRD / extérieurs
  ('map-artiprix-14-1', '14.1', 'artiprix_chapter', 'VRD', 'ASS', 'CAN', NULL, 'Assainissement', 'Artiprix', 85, 'Réseaux assainissement'),
  ('map-artiprix-14-2', '14.2', 'artiprix_chapter', 'VRD', 'TER', 'BOR', NULL, 'Voirie / bordures', 'Artiprix', 85, 'VRD voirie'),
  ('map-artiprix-15-1', '15.1', 'artiprix_chapter', 'EXT', 'TER', 'REM', NULL, 'Espaces extérieurs', 'Artiprix', 80, 'Aménagements ext.'),
  -- Codes internes complémentaires
  ('map-vrd-a', 'VRD-A', 'prefix', 'VRD', 'ASS', 'REG', NULL, 'Regards assainissement', NULL, 78, 'VRD regards'),
  ('map-vrd-v', 'VRD-V', 'prefix', 'VRD', 'TER', 'BOR', NULL, 'Voirie', NULL, 78, 'VRD voirie'),
  ('map-bw-vrd', 'BW-VRD', 'prefix', 'VRD', 'ASS', 'CAN', NULL, 'Import BeWork VRD', 'BeWork', 65, 'Préfixe BW-VRD'),
  ('map-bw-go', 'BW-GO', 'prefix', 'GO', 'MAC', 'MUR', NULL, 'Import BeWork GO', 'BeWork', 65, 'Préfixe BW-GO'),
  ('map-bw-so', 'BW-SO', 'prefix', 'SO', 'CLO', 'CLO', NULL, 'Import BeWork SO', 'BeWork', 65, 'Préfixe BW-SO')
ON CONFLICT ("id") DO NOTHING;
