"use client";

import { useRouter } from "next/navigation";
import { WorkItemForm } from "@/components/commercial/WorkItemForm";

export function WorkItemEditor({
  workItemId,
  embedded,
  onDone,
}: {
  workItemId: string;
  embedded?: boolean;
  onDone?: () => void;
}) {
  const router = useRouter();
  return (
    <WorkItemForm
      mode="edit"
      workItemId={workItemId}
      layout={embedded ? "drawer" : "page"}
      onSaved={() => {
        if (!embedded) router.refresh();
        onDone?.();
      }}
      onCancel={onDone}
    />
  );
}
