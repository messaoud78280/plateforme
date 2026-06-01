"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function BannerInner({ pendingCount }: { pendingCount: number }) {
  const searchParams = useSearchParams();
  const approve = searchParams.get("approve");

  return (
    <div className="space-y-3">
      {approve === "success" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Compte client validé
          {searchParams.get("email") ? ` (${searchParams.get("email")})` : ""}.
        </div>
      )}
      {approve === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {searchParams.get("message") ?? "Validation impossible."}
        </div>
      )}
      {pendingCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <strong>{pendingCount}</strong> inscription{pendingCount > 1 ? "s" : ""} client en attente de
          validation — validez ou refusez depuis le tableau ci-dessous.
        </div>
      )}
    </div>
  );
}

export function ClientsApprovalBanner({ pendingCount }: { pendingCount: number }) {
  return (
    <Suspense fallback={null}>
      <BannerInner pendingCount={pendingCount} />
    </Suspense>
  );
}
