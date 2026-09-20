/**
 * Alertes de cohérence live sur les métrés — aide terrain, pas un audit exhaustif.
 */

export type CoherenceAlert = {
  id: string;
  severity: "info" | "warn";
  label: string;
};

type MeasureLike = {
  id: string;
  zone: string | null;
  label: string;
  measureType: string;
  lengthM: number | null;
  widthM: number | null;
  heightM: number | null;
  quantityValue: number | null;
  unit: string;
  computedQuantity: number;
  lot?: string | null;
  deductions?: Array<{ lengthM?: number | null; widthM?: number | null; quantity?: number | null }>;
};

export function buildMeasurementCoherence(measurements: MeasureLike[]): CoherenceAlert[] {
  const alerts: CoherenceAlert[] = [];

  for (const m of measurements) {
    if (!m.zone?.trim()) {
      alerts.push({
        id: `zone-${m.id}`,
        severity: "warn",
        label: `« ${m.label} » sans zone — risque de confusion au chiffrage`,
      });
    }
    if (!m.lot?.trim()) {
      alerts.push({
        id: `lot-${m.id}`,
        severity: "info",
        label: `« ${m.label} » sans lot — à rattacher si possible`,
      });
    }
    if (!(m.computedQuantity > 0)) {
      alerts.push({
        id: `qty-${m.id}`,
        severity: "warn",
        label: `« ${m.label} » : quantité nulle ou invalide — à reprendre`,
      });
    }

    if (m.measureType === "SURFACE" && m.lengthM != null && m.widthM != null) {
      const gross = m.lengthM * m.widthM;
      if (gross > 0 && m.computedQuantity > 0) {
        const ratio = Math.abs(m.computedQuantity - gross) / gross;
        if (ratio > 0.4) {
          alerts.push({
            id: `surf-${m.id}`,
            severity: "warn",
            label: `« ${m.label} » : nette éloignée de L×l (${gross.toFixed(2)} → ${m.computedQuantity.toFixed(2)}) — vérifier déductions / déchets`,
          });
        }
      }
    }

    if (m.measureType === "VOLUME" && m.lengthM != null && m.widthM != null && m.heightM != null) {
      const gross = m.lengthM * m.widthM * m.heightM;
      if (gross > 0 && m.computedQuantity > 0) {
        const ratio = Math.abs(m.computedQuantity - gross) / gross;
        if (ratio > 0.4) {
          alerts.push({
            id: `vol-${m.id}`,
            severity: "warn",
            label: `« ${m.label} » : volume net éloigné de L×l×h — à contrôler`,
          });
        }
      }
    }

    if (
      (m.measureType === "SURFACE" || m.measureType === "WALL") &&
      (m.lengthM == null || m.widthM == null) &&
      m.quantityValue == null
    ) {
      alerts.push({
        id: `dims-${m.id}`,
        severity: "warn",
        label: `« ${m.label} » : dimensions manquantes pour un métré ${m.measureType === "WALL" ? "mur" : "surface"}`,
      });
    }
  }

  const byKey = new Map<string, number>();
  for (const m of measurements) {
    const key = `${(m.zone || "").toLowerCase()}|${m.label.trim().toLowerCase()}|${m.unit}`;
    byKey.set(key, (byKey.get(key) ?? 0) + 1);
  }
  for (const [key, count] of byKey) {
    if (count < 2) continue;
    const [, label] = key.split("|");
    alerts.push({
      id: `dup-${key}`,
      severity: "info",
      label: `Plusieurs lignes « ${label} » même zone/unité — doublon possible`,
    });
  }

  return alerts.slice(0, 10);
}
