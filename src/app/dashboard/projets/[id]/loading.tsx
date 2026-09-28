export default function ProjetDetailLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-4 w-48 rounded bg-slate-200/80" />
      <div className="rounded-2xl border border-slate-200/90 bg-white px-4 py-5 sm:px-6 sm:py-6">
        <div className="h-3 w-20 rounded bg-slate-200/80" />
        <div className="mt-3 h-7 w-2/3 max-w-xl rounded bg-slate-200/80" />
        <div className="mt-3 flex gap-2">
          <div className="h-6 w-24 rounded-md bg-slate-100" />
          <div className="h-6 w-40 rounded-md bg-slate-100" />
          <div className="h-6 w-32 rounded-md bg-slate-100" />
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 sm:px-6">
        <div className="h-5 w-64 rounded bg-slate-200/80" />
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-50 ring-1 ring-slate-100" />
          ))}
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-12 rounded-xl bg-slate-50" />
          <div className="h-12 rounded-xl bg-slate-50" />
          <div className="h-12 rounded-xl bg-slate-50" />
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="h-4 w-40 rounded bg-slate-200/70" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-slate-50" />
          ))}
        </div>
      </div>
    </div>
  );
}
