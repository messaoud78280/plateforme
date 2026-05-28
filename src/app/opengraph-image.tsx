import { ImageResponse } from "next/og";

export const alt = "BeWork — Partenaire administratif pour le BTP et les artisans";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 64,
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 45%, #1d4ed8 100%)",
          color: "#f8fafc",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          BeWork
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 32,
            fontWeight: 600,
            maxWidth: 900,
            lineHeight: 1.25,
            opacity: 0.95,
          }}
        >
          Administratif structuré pour artisans et entreprises du bâtiment
        </div>
        <div style={{ marginTop: 36, fontSize: 22, opacity: 0.85 }}>
          Cadre forfaitaire HT · France, Belgique, Suisse, Luxembourg · Dès 290 € HT / mois
        </div>
      </div>
    ),
    { ...size }
  );
}
