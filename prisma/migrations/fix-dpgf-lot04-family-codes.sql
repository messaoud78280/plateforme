-- Recodification lot 04 Analyse DPGF : MEXT-* -> codes par famille d'ouvrage
-- Ne modifie pas le contenu pédagogique (JSON content).

BEGIN;

CREATE TEMP TABLE dpgf_lot04_recode (
  old_code TEXT PRIMARY KEY,
  new_code TEXT NOT NULL UNIQUE,
  new_family TEXT NOT NULL
);

INSERT INTO dpgf_lot04_recode (old_code, new_code, new_family) VALUES
  ('ADPGF-04-MEXT-001', 'ADPGF-04-PEI-001', 'Portes d''entrée d''immeuble aluminium'),
  ('ADPGF-04-MEXT-002', 'ADPGF-04-SAS-001', 'Portes de SAS d''immeuble aluminium'),
  ('ADPGF-04-MEXT-003', 'ADPGF-04-FSV-001', 'Fenêtres PVC simple vantail'),
  ('ADPGF-04-MEXT-004', 'ADPGF-04-FSV-002', 'Fenêtres PVC simple vantail'),
  ('ADPGF-04-MEXT-005', 'ADPGF-04-FSV-003', 'Fenêtres PVC simple vantail'),
  ('ADPGF-04-MEXT-006', 'ADPGF-04-FSV-004', 'Fenêtres PVC simple vantail'),
  ('ADPGF-04-MEXT-007', 'ADPGF-04-FSV-005', 'Fenêtres PVC simple vantail'),
  ('ADPGF-04-MEXT-008', 'ADPGF-04-FSV-006', 'Fenêtres PVC simple vantail'),
  ('ADPGF-04-MEXT-009', 'ADPGF-04-FSV-007', 'Fenêtres PVC simple vantail'),
  ('ADPGF-04-MEXT-010', 'ADPGF-04-FDV-001', 'Fenêtres PVC à deux vantaux'),
  ('ADPGF-04-MEXT-011', 'ADPGF-04-FDV-002', 'Fenêtres PVC à deux vantaux'),
  ('ADPGF-04-MEXT-012', 'ADPGF-04-FDV-003', 'Fenêtres PVC à deux vantaux'),
  ('ADPGF-04-MEXT-013', 'ADPGF-04-PF1V-001', 'Portes-fenêtres PVC à un vantail'),
  ('ADPGF-04-MEXT-014', 'ADPGF-04-PF1V-002', 'Portes-fenêtres PVC à un vantail'),
  ('ADPGF-04-MEXT-015', 'ADPGF-04-PF2V-001', 'Portes-fenêtres PVC à deux vantaux'),
  ('ADPGF-04-MEXT-016', 'ADPGF-04-PF2V-002', 'Portes-fenêtres PVC à deux vantaux'),
  ('ADPGF-04-MEXT-017', 'ADPGF-04-PF2V-003', 'Portes-fenêtres PVC à deux vantaux'),
  ('ADPGF-04-MEXT-018', 'ADPGF-04-PF2V-004', 'Portes-fenêtres PVC à deux vantaux'),
  ('ADPGF-04-MEXT-019', 'ADPGF-04-VR-001', 'Volets roulants'),
  ('ADPGF-04-MEXT-020', 'ADPGF-04-VR-002', 'Volets roulants'),
  ('ADPGF-04-MEXT-021', 'ADPGF-04-VR-003', 'Volets roulants'),
  ('ADPGF-04-MEXT-022', 'ADPGF-04-VR-004', 'Volets roulants'),
  ('ADPGF-04-MEXT-023', 'ADPGF-04-VR-005', 'Volets roulants'),
  ('ADPGF-04-MEXT-024', 'ADPGF-04-VR-006', 'Volets roulants'),
  ('ADPGF-04-MEXT-025', 'ADPGF-04-VR-007', 'Volets roulants'),
  ('ADPGF-04-MEXT-026', 'ADPGF-04-VR-008', 'Volets roulants'),
  ('ADPGF-04-MEXT-027', 'ADPGF-04-VR-009', 'Volets roulants'),
  ('ADPGF-04-MEXT-028', 'ADPGF-04-VR-010', 'Volets roulants'),
  ('ADPGF-04-MEXT-029', 'ADPGF-04-COB-001', 'Châssis oscillo-battants PVC'),
  ('ADPGF-04-MEXT-030', 'ADPGF-04-COB-002', 'Châssis oscillo-battants PVC'),
  ('ADPGF-04-MEXT-031', 'ADPGF-04-COB-003', 'Châssis oscillo-battants PVC'),
  ('ADPGF-04-MEXT-032', 'ADPGF-04-COB-004', 'Châssis oscillo-battants PVC'),
  ('ADPGF-04-MEXT-033', 'ADPGF-04-EMAV-001', 'Ensembles menuisés PVC avec allège vitrée'),
  ('ADPGF-04-MEXT-034', 'ADPGF-04-EMAV-002', 'Ensembles menuisés PVC avec allège vitrée');

UPDATE "DpgfAnalysisSheet" AS s
SET
  "codeSheet" = m.new_code,
  "familyName" = m.new_family,
  "ouvrageType" = m.new_family,
  "updatedAt" = NOW()
FROM dpgf_lot04_recode AS m
WHERE s."codeSheet" = m.old_code
  AND s."lot" = '04';

COMMIT;
