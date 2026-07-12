"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  archiveDemoPilotageLink,
  revokeDemoPilotageLink,
  updateDemoCommercialNotes,
} from "@/app/dashboard/demonstrations/actions";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";

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
    <div className="min-w-[200px] space-y-2">
      <p className="text-[10px] text-bework-muted">
        Sections : {sections.length ? sections.join(", ") : "—"}
        <br />
        Intérêts : {interests.length ? interests.join(", ") : "—"}
      </p>
      <Textarea
        value={localNotes}
        onChange={(e) => setLocalNotes(e.target.value)}
        rows={2}
        placeholder="Note commerciale"
        className="!min-h-0 text-[11px]"
      />
      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={pending}
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
        </Button>
        {status === "ACTIVE" ? (
          <Button
            type="button"
            size="sm"
            variant="danger"
            disabled={pending}
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
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending}
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
        </Button>
      </div>
    </div>
  );
}
