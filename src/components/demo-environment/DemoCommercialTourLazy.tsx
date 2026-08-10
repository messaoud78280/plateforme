"use client";

import dynamic from "next/dynamic";

/** Wrapper client — `ssr: false` interdit dans les Server Components (Next 16). */
export const DemoCommercialTourLazy = dynamic(
  () =>
    import("@/components/demo-environment/DemoCommercialTour").then((m) => ({
      default: m.DemoCommercialTour,
    })),
  { ssr: false },
);
