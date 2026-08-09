import Link from "next/link";

export default async function InvitationWelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; company?: string; projects?: string }>;
}) {
  const { role, company, projects } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">
          {company ? `Bienvenue chez ${company}` : "Bienvenue sur BeWork"}
        </h1>
        {role ? (
          <p className="mt-3 text-sm text-slate-600">
            Votre rôle : <strong>{role}</strong>
          </p>
        ) : null}
        {projects ? (
          <p className="mt-2 text-sm text-slate-500">
            Vous avez accès à : <strong>{projects}</strong>
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            Vos accès chantier seront visibles dès la connexion.
          </p>
        )}
        <Link
          href="/connexion"
          className="mt-8 inline-block rounded-lg bg-[#1d4ed8] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1e40af]"
        >
          Accéder à BeWork
        </Link>
      </div>
    </div>
  );
}
