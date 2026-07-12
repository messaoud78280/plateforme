"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  archiveDemoPilotageLink,
  revokeDemoPilotageLink,
  updateDemoCommercialNotes,
} from "@/app/dashboard/demonstrations/actions";

export function DemoAdminActions({
  id,
  status,
  notes,
  interests,
  sections,
}: {
  id: string;
  status: string;
  notes: string | null;
  interests: string[];
  sections: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [localNotes, setLocalNotes] = useState(notes ?? "");

  return (
    <div className="space-y-2 min-w-[180px]">
      <p className="text-[10px] text-slate-500">
        Sections : {sections.length ? sections.join(", ") : "—"}
        <br />
        Intérêts : {interests.length ? interests.join(", ") : "—"}
      </p>
      <textarea
        value={localNotes}
        onChange={(e) => setLocalNotes(e.target.value)}
        rows={2}
        placeholder="Note commerciale"
        className="w-full rounded border border-slate-200 px-2 py-1 text-[11px]"
      />
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          disabled={pending}
          className="rounded border px-2 py-1 text-[10px] font-semibold"
          onClick={() => {
            const fd = new FormData();
            fd.set("id", id);
            fd.set("commercialNotes", localNotes);
            startTransition(async () => {
              await updateDemoCommercialNotes(fd);
              router.refresh();
            });
          }}
        >
          Sauver note
        </button>
        {status === "ACTIVE" ? (
          <button
            type="button"
            disabled={pending}
            className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-800"
            onClick={() => {
              if (!confirm("Révoquer ce lien prospect ?")) return;
              const fd = new FormData();
              fd.set("id", id);
              startTransition(async () => {
                await revokeDemoPilotageLink(fd);
                router.refresh();
              });
            }}
          >
            Révoquer
          </button>
        ) : null}
        <button
          type="button"
          disabled={pending}
          className="rounded border px-2 py-1 text-[10px] font-semibold"
          onClick={() => {
            const fd = new FormData();
            fd.set("id", id);
            startTransition(async () => {
              await archiveDemoPilotageLink(fd);
              router.refresh();
            });
          }}
        >
          Archiver
        </button>
      </div>
    </div>
  );
}
