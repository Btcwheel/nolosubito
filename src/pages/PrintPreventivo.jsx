import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { scaricaPreventivoPDF } from '@/lib/preventivoPrint';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-preventivo-print`;

export default function PrintPreventivo() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get('print') === 'true';
  const [[status, errorMsg], setState] = useState(['loading', '']);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const fnRes = await fetch(`${EDGE_FUNCTION_URL}?id=${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        });
        if (!fnRes.ok) throw new Error('Preventivo non trovato');
        const { preventivo: prev, pratica } = await fnRes.json();

        // DEBUG: logga i servizi ricevuti per diagnosticare problemi di stampa
        console.log('[PrintPreventivo] preventivo ricevuto:', {
          id: prev?.id,
          servizi: prev?.servizi,
          note_operative: prev?.note_operative,
        });

        if (cancelled) return;

        if (autoPrint) {
          await scaricaPreventivoPDF(prev, pratica?.cliente_nome || 'Cliente');
          window.close();
        } else {
          setState(['ready', '']);
        }
      } catch (e) {
        if (cancelled) return;
        console.error('[PrintPreventivo] errore:', e);
        setState(['error', e.message || String(e)]);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [id, autoPrint]);

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
    <div style={{ position: 'fixed', inset: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', color: '#374151', fontSize: '14px' }}>
      {autoPrint ? 'Generazione e download preventivo…' : 'Pronto per il download'}
    </div>
  );
}
