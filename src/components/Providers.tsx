"use client";

import { SessionProvider } from "next-auth/react";
import { PlausibleClickCapture } from "@/components/analytics/PlausibleClickCapture";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PlausibleClickCapture />
      {children}
    </SessionProvider>
  );
}
