import { useEffect, useMemo, useRef, useState } from 'react';
type ZrimoClient = ReturnType<typeof import('@zrimo/viewer').ViewerClient.create>;
type ZrimoViewer = ReturnType<ZrimoClient['createViewer']>;
import '@zrimo/viewer/styles.css';
import { PdfJsReader } from './PdfJsReader';

type SearchSnapshot = { matches: ReadonlyArray<{ pageIndex: number }>; activeIndex: number };
type Props = {
  url: string;
  fileName: string;
  mimeType: string;
  page: number;
  zoom: number;
  onPageCount: (count: number) => void;
  onPageChange?: (page: number) => void;
  searchTerm?: string;
  onSearchStatus?: (status: string) => void;
  widthPercent?: number;
  watermark?: string;
};

function TextDocumentReader({ url, zoom, searchTerm = '', onSearchStatus, widthPercent = 100, watermark = '', onPageCount }: Pick<Props, 'url' | 'zoom' | 'searchTerm' | 'onSearchStatus' | 'widthPercent' | 'watermark' | 'onPageCount'>) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const MAX_TEXT_BYTES = 15 * 1024 * 1024;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setText('');
    void fetch(url).then(async response => {
      if (!response.ok) throw new Error('Unable to load this text document.');
      const blob = await response.blob();
      if (blob.size > MAX_TEXT_BYTES) throw new Error('This text file is too large for a safe in-app preview (15 MB maximum).');
      return blob.text();
    }).then(value => {
      if (!active) return;
      setText(value);
      onPageCount(1);
      setLoading(false);
    }).catch(cause => {
      if (!active) return;
      setError(cause instanceof Error ? cause.message : 'Unable to read this text document.');
      setLoading(false);
    });
    return () => { active = false; };
  }, [url]);

  const highlighted = useMemo(() => {
    const term = searchTerm.trim();
    if (!term || !text) return text;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((part, index) => part.toLocaleLowerCase() === term.toLocaleLowerCase()
      ? <mark key={index} className="rounded bg-amber-200 text-inherit">{part}</mark>
      : part);
  }, [text, searchTerm]);

  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) { onSearchStatus?.(''); return; }
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const count = (text.match(new RegExp(escaped, 'gi')) || []).length;
    onSearchStatus?.(text ? (count ? `Found ${count} match(es) in this text document.` : 'No matches found in this text document.') : 'Searching text…');
  }, [text, searchTerm, onSearchStatus]);

  return <div className="relative min-h-[360px] overflow-auto bg-[#E9EDF5] p-3 sm:p-5">
    {loading && <p className="p-6 text-center text-sm text-[#52627B]">Loading text document…</p>}
    {error && <p role="alert" className="p-4 text-sm text-rose-700">{error}</p>}
    {!loading && !error && <div className="relative mx-auto min-h-[320px] rounded-lg bg-white p-4 shadow-md sm:p-8" style={{ width: `${widthPercent}%`, maxWidth: '100%' }}>
      <pre className="whitespace-pre-wrap break-words font-sans leading-7 text-[#1F2937]" style={{ fontSize: `${zoom / 100}rem` }}>{highlighted}</pre>
      {watermark && <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid grid-cols-2 content-around gap-8 overflow-hidden p-6 opacity-[0.12]"><span className="-rotate-12 whitespace-nowrap text-center text-xs font-bold uppercase tracking-[.2em] text-slate-700">{watermark}</span><span className="-rotate-12 whitespace-nowrap text-center text-xs font-bold uppercase tracking-[.2em] text-slate-700">{watermark}</span><span className="-rotate-12 whitespace-nowrap text-center text-xs font-bold uppercase tracking-[.2em] text-slate-700">{watermark}</span><span className="-rotate-12 whitespace-nowrap text-center text-xs font-bold uppercase tracking-[.2em] text-slate-700">{watermark}</span></div>}
    </div>}
    <p className="mt-3 text-center text-xs text-[#64748B]">Plain-text preview · {zoom}% text size</p>
  </div>;
}

function OfficeDocumentReader({ url, fileName, page, zoom, onPageCount, onPageChange, searchTerm = '', onSearchStatus, widthPercent = 100, watermark = '' }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ZrimoViewer | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [searchResult, setSearchResult] = useState<SearchSnapshot | null>(null);
  const pageRef = useRef(page);
  const onPageCountRef = useRef(onPageCount);
  const onPageChangeRef = useRef(onPageChange);
  const onSearchStatusRef = useRef(onSearchStatus);
  pageRef.current = page;
  onPageCountRef.current = onPageCount;
  onPageChangeRef.current = onPageChange;
  onSearchStatusRef.current = onSearchStatus;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let active = true;
    setReady(false);
    let client: ZrimoClient | null = null;
    let viewer: ZrimoViewer | null = null;
    const initialize = async () => {
      try {
        const { ViewerClient } = await import('@zrimo/viewer');
        if (!active) return;
        client = ViewerClient.create({
          assetBaseUrl: new URL('/vendor/zrimo/', window.location.href),
          limits: { maxInputBytes: 50 * 1024 * 1024 },
        });
        viewer = client.createViewer({
          container: host,
          ui: false,
          layout: 'continuous',
          fit: 'width',
          overscan: 1,
        });
        viewerRef.current = viewer;
        viewer.on('progress', () => {
          if (active) setProgress('Preparing document…');
        });
        viewer.on('pagechange', event => {
          if (!active) return;
          onPageCountRef.current(event.pageCount);
          onPageChangeRef.current?.(event.pageIndex + 1);
        });
        viewer.on('ready', state => {
          if (!active) return;
          setLoading(false);
          setReady(true);
          setProgress('');
          onPageCountRef.current(state.pageCount);
          onPageChangeRef.current?.(state.pageIndex + 1);
          viewer?.goToPage(Math.max(0, pageRef.current - 1));
        });
        viewer.on('searchchange', result => {
          if (active) setSearchResult(result as SearchSnapshot | null);
        });
        const response = await fetch(url);
        if (!response.ok) throw new Error('Unable to retrieve this resource for in-app viewing.');
        const blob = await response.blob();
        if (!active) return;
        await viewer.load(blob, { fileName });
        if (!active) return;
        setLoading(false);
        setReady(true);
        setProgress('');
        onPageCountRef.current(viewer.state.pageCount);
      } catch (cause) {
        if (!active) return;
        setLoading(false);
        setError(cause instanceof Error ? cause.message : 'This document could not be rendered in the in-app reader.');
      }
    };
    void initialize();
    return () => {
      active = false;
      viewerRef.current = null;
      if (viewer) void viewer.destroy();
      if (client) void client.destroy();
    };
  }, [url, fileName]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!ready || !viewer || viewer.state.status !== 'ready') return;
    viewer.goToPage(Math.max(0, page - 1));
  }, [page, ready]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!ready || !viewer || viewer.state.status !== 'ready') return;
    if (zoom === 100) {
      viewer.setFit('width');
      viewer.fitWidth();
    } else {
      viewer.setZoom(Math.max(0.5, Math.min(2, zoom / 100)));
    }
  }, [zoom, ready]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!ready || !viewer || viewer.state.status !== 'ready') return;
    viewer.setFit('width');
    viewer.fitWidth();
  }, [widthPercent, ready]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const term = searchTerm.trim();
    setSearchResult(null);
    if (!ready || !viewer || viewer.state.status !== 'ready' || !term) {
      onSearchStatusRef.current?.('');
      return;
    }
    onSearchStatusRef.current?.('Searching document…');
    let active = true;
    void viewer.search(term).then(result => {
      if (!active) return;
      const snapshot = result as SearchSnapshot;
      setSearchResult(snapshot);
      onSearchStatusRef.current?.(snapshot.matches.length ? `Found text on ${new Set(snapshot.matches.map(match => match.pageIndex)).size} page(s).` : 'No matches found in searchable document text.');
      if (snapshot.matches[0]) onPageChangeRef.current?.(snapshot.matches[0].pageIndex + 1);
    }).catch(() => {
      if (active) onSearchStatusRef.current?.('Search is not available for this document.');
    });
    return () => { active = false; };
  }, [searchTerm, url, ready]);

  const matchPages = [...new Set((searchResult?.matches || []).map(match => match.pageIndex + 1))];
  const goToMatch = (direction: 1 | -1) => {
    const viewer = viewerRef.current;
    if (!viewer || !searchResult?.matches.length) return;
    if (direction > 0) viewer.searchNext(); else viewer.searchPrevious();
    const next = viewer.state.pageIndex + 1;
    onPageChange?.(next);
  };

  return <div className="relative min-w-0 overflow-auto bg-[#E9EDF5] p-2 sm:p-5">
    {searchTerm.trim() && <div className="sticky top-0 z-10 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#DCE4EF] bg-white/95 p-2 text-sm shadow-sm backdrop-blur">
      <span className="text-[#52627B]">{matchPages.length ? `Match pages: ${matchPages.join(', ')}` : 'Search results'}</span>
      <div className="flex items-center gap-2"><span className="text-xs text-[#64748B]">{searchResult?.matches.length ? `${Math.max(0, searchResult.activeIndex) + 1} / ${searchResult.matches.length}` : '0 results'}</span><button type="button" onClick={() => goToMatch(-1)} disabled={!searchResult?.matches.length} className="rounded-lg border px-2 py-1 disabled:opacity-40">Previous match</button><button type="button" onClick={() => goToMatch(1)} disabled={!searchResult?.matches.length} className="rounded-lg border px-2 py-1 disabled:opacity-40">Next match</button></div>
    </div>}
    {loading && <p className="p-6 text-center text-sm text-[#52627B]">{progress || 'Loading document…'}</p>}
    {error && <p role="alert" className="p-4 text-sm text-rose-700">{error}</p>}
    <div className="relative mx-auto" style={{ width: `${widthPercent}%`, maxWidth: '100%', minHeight: 360 }}>
      <div ref={hostRef} className="min-h-[360px] w-full overflow-auto rounded-lg bg-white shadow-md" style={{ height: 'min(75vh, 900px)' }} />
      {watermark && <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid grid-cols-2 content-around gap-8 overflow-hidden p-6 opacity-[0.12]"><span className="-rotate-12 whitespace-nowrap text-center text-xs font-bold uppercase tracking-[.2em] text-slate-700">{watermark}</span><span className="-rotate-12 whitespace-nowrap text-center text-xs font-bold uppercase tracking-[.2em] text-slate-700">{watermark}</span><span className="-rotate-12 whitespace-nowrap text-center text-xs font-bold uppercase tracking-[.2em] text-slate-700">{watermark}</span><span className="-rotate-12 whitespace-nowrap text-center text-xs font-bold uppercase tracking-[.2em] text-slate-700">{watermark}</span></div>}
    </div>
    <p className="mt-3 text-center text-xs text-[#64748B]">Protected document preview · Page {page} · {zoom}% zoom</p>
  </div>;
}

export function UniversalResourceReader(props: Props) {
  const mime = props.mimeType.split(';')[0].trim().toLowerCase();
  if (mime === 'application/pdf') {
    return <PdfJsReader url={props.url} page={props.page} zoom={props.zoom} onPageCount={props.onPageCount} onPageChange={props.onPageChange} searchTerm={props.searchTerm} onSearchStatus={props.onSearchStatus} widthPercent={props.widthPercent} watermark={props.watermark} />;
  }
  if (mime === 'text/plain') {
    return <TextDocumentReader url={props.url} zoom={props.zoom} searchTerm={props.searchTerm} onSearchStatus={props.onSearchStatus} widthPercent={props.widthPercent} watermark={props.watermark} onPageCount={props.onPageCount} />;
  }
  return <OfficeDocumentReader {...props} />;
}
