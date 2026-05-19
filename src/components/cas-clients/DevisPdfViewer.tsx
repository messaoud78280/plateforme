type Props = {
  pdfHref: string;
  title: string;
  downloadLabel?: string;
};

export function DevisPdfViewer({ pdfHref, title, downloadLabel = "Ouvrir le PDF en plein écran" }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <a href={pdfHref} download className="text-sm font-semibold text-[#1d4ed8] hover:underline">
          Télécharger
        </a>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
        <iframe
          title={title}
          src={`${pdfHref}#toolbar=1&navpanes=0&scrollbar=1`}
          className="h-[min(70vh,720px)] w-full"
        />
      </div>
      <p className="mt-2 text-center">
        <a href={pdfHref} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-slate-600 hover:text-[#1d4ed8]">
          {downloadLabel}
        </a>
      </p>
    </div>
  );
}
