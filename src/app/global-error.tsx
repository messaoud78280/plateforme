"use client";

/**
 * Capture les erreurs non gérées au niveau racine (layout, etc.)
 * et affiche une page claire au lieu du message générique Next.js.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f8fafc", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", color: "#0f172a", marginBottom: 8 }}>
            Une erreur est survenue
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: 24 }}>
            Rechargez la page ou vérifiez les logs du serveur (Railway → Deployments → View logs).
            {error.digest && (
              <span style={{ display: "block", marginTop: 8, color: "#94a3b8" }}>
                Référence : {error.digest}
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: "10px 20px",
              backgroundColor: "#1d4ed8",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Réessayer
          </button>
          <p style={{ marginTop: 24, fontSize: "0.75rem", color: "#94a3b8" }}>
            Si le problème persiste : vérifiez <strong>DATABASE_URL</strong>, <strong>NEXTAUTH_URL</strong> et <strong>NEXTAUTH_SECRET</strong> dans les variables d&apos;environnement Railway.
          </p>
        </div>
      </body>
    </html>
  );
}
