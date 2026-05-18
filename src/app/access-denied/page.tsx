import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accès non disponible",
  description: "Accès non disponible depuis votre zone géographique.",
  robots: { index: false, follow: false },
};

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="font-heading text-2xl font-bold text-slate-900">Accès non disponible</h1>
      <p className="mt-4 max-w-md text-sm text-slate-600">
        Accès non disponible depuis votre zone géographique.
      </p>
    </main>
  );
}
