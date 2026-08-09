"use client";

import { useEffect, useMemo } from "react";

/** Aperçu photos avant envoi — révoque les object URLs au démontage. */
export function PhotoPreviewGrid({ files }: { files: File[] }) {
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  useEffect(() => {
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [urls]);

  return (
    <div className="mb-2 grid grid-cols-3 gap-1.5">
      {urls.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} src={src} alt="" className="h-20 w-full rounded-lg object-cover" />
      ))}
    </div>
  );
}
