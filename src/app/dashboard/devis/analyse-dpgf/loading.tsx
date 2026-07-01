export default function AnalyseDpgfLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-3 w-32 rounded bg-slate-200" />
        <div className="h-8 w-64 rounded bg-slate-200" />
        <div className="h-4 w-full max-w-2xl rounded bg-slate-100" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="h-48 rounded-2xl bg-slate-100" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
