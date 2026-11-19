import { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;

type Props = { url: string; page: number; zoom: number; onPageCount: (count: number) => void; onPageChange?: (page: number) => void; searchTerm?: string; onSearchStatus?: (status: string) => void; widthPercent?: number; watermark?: string };

export function PdfJsReader({ url, page, zoom, onPageCount, onPageChange, searchTerm = '', onSearchStatus, widthPercent = 100, watermark = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const documentRef = useRef<PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageCount, setPageCount] = useState(0);
  const [renderError, setRenderError] = useState('');
  const [searchPages, setSearchPages] = useState<number[]>([]);
  const [searchIndex, setSearchIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setRenderError('');
    const task = getDocument({ url });
    task.promise.then(pdf => {
      if (cancelled) return;
      documentRef.current = pdf;
      setPageCount(pdf.numPages); onPageCount(pdf.numPages); setLoading(false);
    }).catch(error => { if (!cancelled) { setLoading(false); setRenderError(error instanceof Error ? error.message : 'Unable to load this PDF.'); } });
    return () => { cancelled = true; documentRef.current = null; void task.destroy(); };
  }, [url]);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      const pdf = documentRef.current, canvas = canvasRef.current;
      if (!pdf || !canvas || !pageCount) return;
      const validPage = Math.min(pageCount, Math.max(1, page));
      if (validPage !== page) onPageChange?.(validPage);
      try {
        const pdfPage = await pdf.getPage(validPage);
        const viewport = pdfPage.getViewport({ scale: zoom / 100 });
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * dpr); canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = viewport.width + 'px'; canvas.style.height = viewport.height + 'px';
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas rendering is unavailable.');
        await pdfPage.render({ canvas, canvasContext: context, viewport, transform: dpr === 1 ? undefined : [dpr, 0, 0, dpr, 0, 0] }).promise;
      } catch (error) { if (!cancelled) setRenderError(error instanceof Error ? error.message : 'Unable to render this page.'); }
    };
    void render();
    return () => { cancelled = true; };
  }, [page, zoom, pageCount]);

  useEffect(() => {
    let cancelled = false;
    const search = async () => {
      const pdf = documentRef.current, term = searchTerm.trim().toLocaleLowerCase();
      setSearchPages([]); setSearchIndex(0);
      if (!pdf || !term) { onSearchStatus?.(''); return; }
      onSearchStatus?.('Searching document…');
      const pages: number[] = [];
      for (let number = 1; number <= pdf.numPages; number++) {
        if (cancelled) return;
        try {
          const text = await (await pdf.getPage(number)).getTextContent();
          const joined = text.items.map(item => 'str' in item ? item.str : '').join(' ').toLocaleLowerCase();
          if (joined.includes(term)) pages.push(number);
        } catch { /* skip pages whose text cannot be extracted */ }
      }
      if (cancelled) return;
      setSearchPages(pages); setSearchIndex(0);
      onSearchStatus?.(pages.length ? `Found text on ${pages.length} page(s).` : 'No matches found in searchable document text.');
    };
    void search();
    return () => { cancelled = true; };
  }, [searchTerm, url]);

  const goToSearchResult = (direction: 1 | -1) => {
    if (!searchPages.length) return;
    const next = (searchIndex + direction + searchPages.length) % searchPages.length;
    setSearchIndex(next); onPageChange?.(searchPages[next]);
  };

  return <div className="min-w-0 overflow-auto bg-[#E9EDF5] p-3 sm:p-5">
    {searchTerm.trim() && <div className="sticky top-0 z-10 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#DCE4EF] bg-white/95 p-2 text-sm shadow-sm backdrop-blur">
      <span className="text-[#52627B]">{searchPages.length ? `Match pages: ${searchPages.join(', ')}` : 'Search results'}</span>
      <div className="flex items-center gap-2"><span className="text-xs text-[#64748B]">{searchPages.length ? `${searchIndex + 1} / ${searchPages.length}` : '0 results'}</span><button type="button" onClick={() => goToSearchResult(-1)} disabled={!searchPages.length} className="rounded-lg border px-2 py-1 disabled:opacity-40">Previous match</button><button type="button" onClick={() => goToSearchResult(1)} disabled={!searchPages.length} className="rounded-lg border px-2 py-1 disabled:opacity-40">Next match</button></div>
    </div>}
    {loading && <p className="p-6 text-center text-sm text-[#52627B]">Loading PDF…</p>}
    {renderError && <p role="alert" className="p-4 text-sm text-rose-700">{renderError}</p>}
    {!loading && !renderError && <div className="relative mx-auto w-fit max-w-full overflow-hidden bg-white shadow-md" style={{ maxWidth: `${widthPercent}%` }}>
      <canvas ref={canvasRef} className="block max-w-full" />
      {watermark && <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid grid-cols-2 content-around gap-8 overflow-hidden p-6 opacity-[0.12]"><span className="rotate-[-28deg] whitespace-nowrap text-center text-xs font-bold uppercase tracking-[.2em] text-slate-700">{watermark}</span><span className="rotate-[-28deg] whitespace-nowrap text-center text-xs font-bold uppercase tracking-[.2em] text-slate-700">{watermark}</span><span className="rotate-[-28deg] whitespace-nowrap text-center text-xs font-bold uppercase tracking-[.2em] text-slate-700">{watermark}</span><span className="rotate-[-28deg] whitespace-nowrap text-center text-xs font-bold uppercase tracking-[.2em] text-slate-700">{watermark}</span></div>}
    </div>}
    <p className="mt-3 text-center text-xs text-[#64748B]">Page {Math.min(page, pageCount || page)} of {pageCount || '—'} · {zoom}% zoom</p>
  </div>;
}
