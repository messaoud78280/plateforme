export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Chargement">
      <div className="h-8 w-48 rounded-lg bg-slate-200/80" />
      <div className="h-4 w-72 rounded bg-slate-100" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-28 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100" />
        <div className="h-28 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100" />
        <div className="h-28 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100" />
      </div>
    </div>
  );
}
