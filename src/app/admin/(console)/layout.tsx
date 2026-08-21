import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/platform-admin/authz";

const NAV = [
  { href: "/admin", label: "Vue générale" },
  { href: "/admin/organisations", label: "Entreprises" },
  { href: "/admin/essais", label: "Essais" },
  { href: "/admin/adoption", label: "Adoption" },
  { href: "/admin/journal", label: "Journal" },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requirePlatformAdmin();

  return (
    <div className="min-h-dvh bg-[#f4f6f9] text-bework-ink">
      <header className="border-b border-bework-navy/10 bg-[#1e3a5f] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
              BeWork · Éditeur
            </p>
            <h1 className="text-lg font-semibold tracking-tight">Administration BeWork</h1>
          </div>
          <div className="flex items-center gap-3 text-[13px]">
            <span className="text-white/80">{admin.name}</span>
            <Link
              href="/api/auth/signout?callbackUrl=/admin/connexion"
              className="rounded-full border border-white/25 px-3 py-1.5 font-medium text-white/95 hover:bg-white/10"
            >
              Déconnexion
            </Link>
          </div>
        </div>
        <nav
          className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6"
          aria-label="Navigation admin"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium text-white/85 hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
