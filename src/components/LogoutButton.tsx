"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-300"
    >
      Déconnexion
    </button>
  );
}
