"use client";

import { PlausibleClickCapture } from "@/components/analytics/PlausibleClickCapture";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PlausibleClickCapture />
      {children}
    </>
  );
}
