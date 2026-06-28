import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { buildPayload, renderTemplate } from '@/lib/preventivoPrint';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-preventivo-print`;

const TEMPLATE_URL = '/export/preventivo-template.html';

export default function PrintPreventivo() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get('print') === 'true';
  const iframeRef = useRef(null);
  const [[status, errorMsg], setState] = useState(['loading', '']);
  const generating = useRef(false);

  const generatePdf = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const fnRes = await fetch(`${EDGE_FUNCTION_URL}?id=${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        });
        if (!fnRes.ok) throw new Error('Preventivo non trovato');
        const { preventivo: prev, pratica } = await fnRes.json();

        const payload = await buildPayload(prev, pratica);

        const tplRes = await fetch(TEMPLATE_URL);
        if (!tplRes.ok) throw new Error(`Template HTTP ${tplRes.status}`);
        const tplHtml = await tplRes.text();

        const compiledHtml = renderTemplate(tplHtml, payload);

        // @ts-ignore
        window.dataLayer = [];
        // @ts-ignore
        window.gtag = function() {};
        document.querySelectorAll('script[src*="googletagmanager"]').forEach(s => s.remove());

        if (cancelled) return;

        if (iframeRef.current) {
          iframeRef.current.srcdoc = compiledHtml;
        }

        generatePdf.current = async () => {
          if (generating.current) return;
          generating.current = true;

          try {
            const iframe = iframeRef.current;
            if (!iframe) return;
            const doc = iframe.contentDocument || iframe.contentWindow.document;

            // Aspetta font + immagini + rendering
            await doc.fonts.ready;
            await Promise.all(Array.from(doc.querySelectorAll('img')).map(
              (img) => img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; }),
            ));
            await new Promise(r => setTimeout(r, 500));

            const pages = doc.querySelectorAll('.page');
            if (!pages.length) throw new Error('Nessuna pagina trovata');

            const overflows = Array.from(pages).filter((p) => p.scrollHeight > p.clientHeight + 2);
            if (overflows.length) {
              throw new Error('Il contenuto del preventivo supera lo spazio disponibile in una pagina A4. Riduci i servizi inclusi o le note.');
            }

            const pdf = new jsPDF('p', 'mm', [210, 297]);

            for (let i = 0; i < pages.length; i++) {
              const el = pages[i];
              if (i > 0) pdf.addPage([210, 297]);

              const raw = await html2canvas(el, {
                useCORS: true,
                scale: 2,
                backgroundColor: null,
              });

              pdf.addImage(raw.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
            }

            pdf.save(`preventivo-${id.slice(-6).toUpperCase()}.pdf`);

            // Chiudi popup dopo il download
            setTimeout(() => { window.close(); }, 500);
          } catch (e) {
            console.error('[PrintPreventivo] PDF fallito:', e);
          }
        };

        setState(['ready', '']);
      } catch (e) {
        if (cancelled) return;
        console.error('[PrintPreventivo] errore:', e);
        setState(['error', e.message || String(e)]);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [id]);

  const handleIframeLoad = () => {
    if (autoPrint) generatePdf.current?.();
  };

  if (status === 'error') {
    return (
      <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', color: '#b91c1c', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', marginBottom: '8px' }}>Errore generazione PDF</div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>{errorMsg}</div>
        <button
          onClick={() => window.close()}
          style={{ marginTop: '16px', padding: '6px 16px', background: '#36389D', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          Chiudi
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {status === 'loading' && (
        <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', color: '#374151', textAlign: 'center', fontSize: '14px' }}>
          Generazione preventivo…
        </div>
      )}
      <iframe
        ref={iframeRef}
        onLoad={handleIframeLoad}
        style={{
          width: '794px',
          flex: 1,
          border: 'none',
          background: '#fff',
          margin: '0 auto',
        }}
        title="Preventivo"
      />
    </div>
  );
}
