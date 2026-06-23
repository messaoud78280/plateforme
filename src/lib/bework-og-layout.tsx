/** Mise en page partagée pour opengraph-image (racine, blog, landings). */
export function BeWorkOgLayout({
  title,
  subtitle = "Assistance technique et administrative BTP · France, Belgique, Suisse, Luxembourg",
  kicker = "BeWork",
}: {
  title: string;
  subtitle?: string;
  kicker?: string;
}) {
  return (
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
      <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{kicker}</div>
      <div
        style={{
          marginTop: 24,
          fontSize: 30,
          fontWeight: 700,
          maxWidth: 980,
          lineHeight: 1.22,
          opacity: 0.98,
        }}
      >
        {title}
      </div>
      <div style={{ marginTop: 32, fontSize: 20, maxWidth: 900, lineHeight: 1.35, opacity: 0.88 }}>{subtitle}</div>
    </div>
  );
}

export const BEWORK_OG_SIZE = { width: 1200, height: 630 } as const;
export const BEWORK_OG_CONTENT_TYPE = "image/png";
