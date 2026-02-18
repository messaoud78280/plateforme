"use client";

interface TimelineEvent {
  label: string;
  date: Date;
  detail?: string;
}

interface TaskTimelineProps {
  events: TimelineEvent[];
}

export function TaskTimeline({ events }: TaskTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-slate-500">Aucun historique pour le moment.</p>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="h-3 w-3 rounded-full bg-slate-300" />
            {i < events.length - 1 && (
              <div className="mt-1 h-full w-px flex-1 bg-slate-200" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <p className="font-medium text-slate-800">{event.label}</p>
            {event.detail && (
              <p className="mt-0.5 text-sm text-slate-600">{event.detail}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              {new Date(event.date).toLocaleString("fr-FR")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
