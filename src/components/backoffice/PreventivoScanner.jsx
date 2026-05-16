import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  Upload, FileText, Loader2, Sparkles, Download, Mail,
  CheckCircle2, RotateCcw, X, Plus, Trash2,
} from 'lucide-react';
import { jsPDF } from 'jspdf';

const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-preventivo`;
const OCR_URL     = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ocr-document`;
const EMAIL_URL   = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-preventivo-email`;

const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

const EMPTY_DATA = {
  veicolo_marca: '',
  veicolo_modello: '',
  veicolo_allestimento: '',
  alimentazione: '',
  durata_mesi: '',
  km_annui: '',
  anticipo: '',
  deposito_cauzionale: '',
  canone_mensile: '',
  servizi: [],
  note_aggiuntive: '',
};

// ── PDF Generator ─────────────────────────────────────────────────────────────

function generatePDF(data, clienteNome, clienteEmail) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const margin = 18;
  const col2 = 120;

  // Header background
  doc.setFillColor(47, 53, 137); // #2F3589
  doc.rect(0, 0, W, 42, 'F');

  // Logo / nome
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('Nolosubito', margin, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(180, 190, 220);
  doc.text('Noleggio a Lungo Termine', margin, 25);

  // Data e numero ref
  const oggi = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  const ref = 'NS-' + Date.now().toString().slice(-6);
  doc.setTextColor(180, 190, 220);
  doc.setFontSize(9);
  doc.text(`Data: ${oggi}`, W - margin, 18, { align: 'right' });
  doc.text(`Rif. ${ref}`, W - margin, 24, { align: 'right' });

  let y = 54;

  // Titolo preventivo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 34, 80);
  doc.text('PREVENTIVO DI NOLEGGIO', margin, y);
  y += 8;

  // Cliente (se presente)
  if (clienteNome) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 110, 130);
    doc.text(`Per: ${clienteNome}${clienteEmail ? '  ·  ' + clienteEmail : ''}`, margin, y);
    y += 6;
  }

  y += 4;

  // ── Sezione veicolo ──
  doc.setFillColor(248, 249, 252);
  doc.roundedRect(margin, y, W - margin * 2, 28, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 110, 130);
  doc.text('VEICOLO', margin + 5, y + 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 34, 80);
  const veicolo = [data.veicolo_marca, data.veicolo_modello, data.veicolo_allestimento]
    .filter(Boolean).join(' ');
  doc.text(veicolo || '—', margin + 5, y + 18);
  if (data.alimentazione) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(130, 140, 160);
    doc.text(data.alimentazione, margin + 5, y + 24);
  }
  y += 36;

  // ── Griglia condizioni ──
  const boxes = [
    { label: 'Durata', value: data.durata_mesi ? `${data.durata_mesi} mesi` : '—' },
    { label: 'Km/anno', value: data.km_annui ? Number(data.km_annui).toLocaleString('it-IT') : '—' },
    { label: 'Anticipo', value: data.anticipo && Number(data.anticipo) > 0 ? `€ ${Number(data.anticipo).toLocaleString('it-IT')}` : 'Nessuno' },
    { label: 'Deposito cauz.', value: data.deposito_cauzionale && Number(data.deposito_cauzionale) > 0 ? `€ ${Number(data.deposito_cauzionale).toLocaleString('it-IT')}` : 'Nessuno' },
  ];
  const boxW = (W - margin * 2 - 9) / 4;
  boxes.forEach((b, i) => {
    const bx = margin + i * (boxW + 3);
    doc.setFillColor(240, 242, 252);
    doc.roundedRect(bx, y, boxW, 22, 2, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 150);
    doc.text(b.label, bx + boxW / 2, y + 7, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 34, 80);
    doc.text(b.value, bx + boxW / 2, y + 16, { align: 'center' });
  });
  y += 30;

  // ── Canone mensile (highlight) ──
  doc.setFillColor(249, 98, 9); // #F96209
  doc.roundedRect(margin, y, W - margin * 2, 22, 3, 3, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(255, 220, 190);
  doc.text('CANONE MENSILE IVA INCLUSA', margin + 5, y + 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  const canone = data.canone_mensile ? `€ ${Number(data.canone_mensile).toLocaleString('it-IT')} / mese` : '—';
  doc.text(canone, W - margin - 5, y + 16, { align: 'right' });
  y += 30;

  // ── Servizi inclusi ──
  if (data.servizi && data.servizi.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 34, 80);
    doc.text('SERVIZI INCLUSI NEL CANONE', margin, y);
    y += 6;

    doc.setFillColor(248, 249, 252);
    const serviziH = Math.ceil(data.servizi.length / 2) * 7 + 8;
    doc.roundedRect(margin, y, W - margin * 2, serviziH, 2, 2, 'F');
    y += 5;

    data.servizi.forEach((s, i) => {
      const col = i % 2 === 0 ? margin + 5 : margin + (W - margin * 2) / 2 + 5;
      const row = y + Math.floor(i / 2) * 7;
      doc.setFillColor(47, 53, 137);
      doc.circle(col + 1.5, row - 1, 1.2, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(50, 60, 80);
      doc.text(s, col + 5, row);
    });
    y += serviziH + 6;
  }

  // ── Note ──
  if (data.note_aggiuntive) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 34, 80);
    doc.text('NOTE', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 90, 110);
    const lines = doc.splitTextToSize(data.note_aggiuntive, W - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 6;
  }

  // ── Footer ──
  doc.setFillColor(47, 53, 137);
  doc.rect(0, 277, W, 20, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 190, 220);
  doc.text('Nolosubito · info@nolosubito.it · nolosubito.it', W / 2, 285, { align: 'center' });
  doc.setTextColor(120, 130, 160);
  doc.text('Questo preventivo ha validità 15 giorni dalla data di emissione.', W / 2, 290, { align: 'center' });

  return doc;
}

// ── Drag & Drop Zone ──────────────────────────────────────────────────────────

function DropZone({ onFile, loading }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }, [onFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !loading && inputRef.current?.click()}
      className={`
        relative flex flex-col items-center justify-center gap-3
        border-2 border-dashed rounded-xl p-10 cursor-pointer
        transition-all duration-200
        ${dragging ? 'border-electric bg-electric/5 scale-[1.01]' : 'border-border hover:border-electric/50 hover:bg-muted/30'}
        ${loading ? 'pointer-events-none opacity-60' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
      />
      {loading ? (
        <Loader2 className="w-10 h-10 text-electric animate-spin" />
      ) : (
        <div className="w-14 h-14 rounded-2xl bg-electric/10 flex items-center justify-center">
          <Upload className="w-7 h-7 text-electric" />
        </div>
      )}
      <div className="text-center">
        <p className="font-semibold text-foreground">
          {loading ? 'Analisi in corso...' : 'Carica il preventivo del concorrente'}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {loading ? 'L\'AI sta estraendo i dati dal documento' : 'PDF o immagine (JPG, PNG, WEBP) · Trascina o clicca'}
        </p>
      </div>
    </div>
  );
}

// ── Campo form ────────────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

// ── Componente principale ─────────────────────────────────────────────────────

export default function PreventivoScanner() {
  const [step, setStep] = useState('upload'); // upload | review | done
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(EMPTY_DATA);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [newServizio, setNewServizio] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const { toast } = useToast();

  async function handleFile(file) {
    if (!ACCEPTED.includes(file.type)) {
      toast({ title: 'Formato non supportato. Usa PDF, JPG, PNG o WEBP.', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      let base64 = null;
      let mediaType = null;
      let text = null;

      if (file.type === 'application/pdf') {
        // Estrai testo dal PDF lato client
        const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
        GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href;
        const buffer = await file.arrayBuffer();
        const pdf = await getDocument({ data: buffer }).promise;
        let rawText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          rawText += content.items.map(item => item.str).join(' ') + '\n\n';
        }
        text = rawText.trim();
      } else {
        // Immagine → base64
        base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result.split(',')[1]);
          reader.readAsDataURL(file);
        });
        mediaType = file.type;
      }

      const res = await fetch(ANALYZE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ base64, mediaType, text }),
      });

      const { data: extracted, error } = await res.json();
      if (error) throw new Error(error);

      setData({
        ...EMPTY_DATA,
        ...extracted,
        servizi: Array.isArray(extracted.servizi) ? extracted.servizi : [],
      });
      setStep('review');
      toast({ title: 'Dati estratti. Controlla e correggi prima di generare il PDF.' });
    } catch (err) {
      toast({ title: 'Errore durante l\'analisi', description: String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field, value) {
    setData(prev => ({ ...prev, [field]: value }));
  }

  function addServizio() {
    const s = newServizio.trim();
    if (!s) return;
    setData(prev => ({ ...prev, servizi: [...prev.servizi, s] }));
    setNewServizio('');
  }

  function removeServizio(i) {
    setData(prev => ({ ...prev, servizi: prev.servizi.filter((_, idx) => idx !== i) }));
  }

  function handleDownload() {
    const pdf = generatePDF(data, clienteNome, clienteEmail);
    const veicolo = [data.veicolo_marca, data.veicolo_modello].filter(Boolean).join('_') || 'preventivo';
    pdf.save(`Nolosubito_${veicolo}.pdf`);
    setStep('done');
    toast({ title: 'PDF scaricato.' });
  }

  async function handleSendEmail() {
    if (!clienteEmail) {
      toast({ title: 'Inserisci l\'email del cliente.', variant: 'destructive' });
      return;
    }
    setSendingEmail(true);
    try {
      const pdf = generatePDF(data, clienteNome, clienteEmail);
      const pdfBase64 = pdf.output('datauristring').split(',')[1];

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-preventivo-custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          clienteNome,
          clienteEmail,
          pdfBase64,
          veicolo: [data.veicolo_marca, data.veicolo_modello].filter(Boolean).join(' '),
          canone: data.canone_mensile,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      setStep('done');
      toast({ title: `Email inviata a ${clienteEmail}.` });
    } catch (err) {
      toast({ title: 'Errore invio email', description: String(err), variant: 'destructive' });
    } finally {
      setSendingEmail(false);
    }
  }

  function reset() {
    setStep('upload');
    setData(EMPTY_DATA);
    setClienteNome('');
    setClienteEmail('');
  }

  // ── STEP: UPLOAD ──
  if (step === 'upload') {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Genera preventivo Nolosubito</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Carica il preventivo del concorrente — l'AI estrae i dati e genera un PDF brandizzato Nolosubito.
          </p>
        </div>
        <DropZone onFile={handleFile} loading={loading} />
        <p className="text-xs text-center text-muted-foreground">
          I dati del fornitore originale vengono rimossi automaticamente dal documento generato.
        </p>
      </div>
    );
  }

  // ── STEP: DONE ──
  if (step === 'done') {
    return (
      <div className="max-w-md mx-auto text-center space-y-5 py-12">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground">Preventivo Nolosubito generato</p>
          <p className="text-sm text-muted-foreground mt-1">
            {data.veicolo_marca} {data.veicolo_modello} · €{data.canone_mensile}/mese
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => { handleDownload(); }} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Scarica di nuovo
          </Button>
          <Button onClick={reset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Nuovo preventivo
          </Button>
        </div>
      </div>
    );
  }

  // ── STEP: REVIEW ──
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-electric" />
            <h2 className="text-lg font-semibold text-foreground">Dati estratti — verifica e correggi</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Controlla che i dati siano corretti prima di generare il PDF Nolosubito.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Ricomincia
        </Button>
      </div>

      {/* Dati cliente */}
      <div className="bg-card border border-border/50 rounded-xl p-5 space-y-4">
        <p className="text-sm font-semibold text-foreground">Cliente (opzionale)</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome cliente">
            <Input value={clienteNome} onChange={e => setClienteNome(e.target.value)} placeholder="Mario Rossi" />
          </Field>
          <Field label="Email cliente">
            <Input type="email" value={clienteEmail} onChange={e => setClienteEmail(e.target.value)} placeholder="mario@esempio.it" />
          </Field>
        </div>
      </div>

      {/* Veicolo */}
      <div className="bg-card border border-border/50 rounded-xl p-5 space-y-4">
        <p className="text-sm font-semibold text-foreground">Veicolo</p>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Marca">
            <Input value={data.veicolo_marca} onChange={e => handleChange('veicolo_marca', e.target.value)} placeholder="Es. Volkswagen" />
          </Field>
          <Field label="Modello">
            <Input value={data.veicolo_modello} onChange={e => handleChange('veicolo_modello', e.target.value)} placeholder="Es. Golf" />
          </Field>
          <Field label="Allestimento">
            <Input value={data.veicolo_allestimento} onChange={e => handleChange('veicolo_allestimento', e.target.value)} placeholder="Es. Life 1.5 TSI" />
          </Field>
        </div>
        <Field label="Alimentazione">
          <Input value={data.alimentazione} onChange={e => handleChange('alimentazione', e.target.value)} placeholder="Es. Benzina, Diesel, Ibrido, Elettrico" />
        </Field>
      </div>

      {/* Condizioni economiche */}
      <div className="bg-card border border-border/50 rounded-xl p-5 space-y-4">
        <p className="text-sm font-semibold text-foreground">Condizioni economiche</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Durata (mesi)">
            <Input type="number" value={data.durata_mesi} onChange={e => handleChange('durata_mesi', e.target.value)} placeholder="36" />
          </Field>
          <Field label="Km / anno">
            <Input type="number" value={data.km_annui} onChange={e => handleChange('km_annui', e.target.value)} placeholder="15000" />
          </Field>
          <Field label="Anticipo (€)">
            <Input type="number" value={data.anticipo} onChange={e => handleChange('anticipo', e.target.value)} placeholder="0" />
          </Field>
          <Field label="Deposito cauzionale (€)">
            <Input type="number" value={data.deposito_cauzionale} onChange={e => handleChange('deposito_cauzionale', e.target.value)} placeholder="0" />
          </Field>
        </div>
        <Field label="Canone mensile IVA inclusa (€)">
          <Input type="number" value={data.canone_mensile} onChange={e => handleChange('canone_mensile', e.target.value)} placeholder="399" className="text-lg font-bold" />
        </Field>
      </div>

      {/* Servizi */}
      <div className="bg-card border border-border/50 rounded-xl p-5 space-y-3">
        <p className="text-sm font-semibold text-foreground">Servizi inclusi nel canone</p>
        <div className="flex flex-wrap gap-2">
          {data.servizi.map((s, i) => (
            <span key={i} className="flex items-center gap-1.5 text-xs bg-electric/10 text-electric rounded-full px-3 py-1.5 font-medium">
              {s}
              <button onClick={() => removeServizio(i)} className="hover:text-destructive transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newServizio}
            onChange={e => setNewServizio(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addServizio()}
            placeholder="Aggiungi servizio (es. Manutenzione ordinaria)"
            className="text-sm"
          />
          <Button variant="outline" size="sm" onClick={addServizio} disabled={!newServizio.trim()}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Note */}
      <div className="bg-card border border-border/50 rounded-xl p-5">
        <Field label="Note aggiuntive">
          <Textarea
            value={data.note_aggiuntive}
            onChange={e => handleChange('note_aggiuntive', e.target.value)}
            placeholder="Condizioni particolari, scadenza offerta, ecc."
            rows={3}
            className="text-sm resize-none"
          />
        </Field>
      </div>

      {/* Azioni */}
      <div className="flex gap-3">
        <Button onClick={handleDownload} className="flex-1" size="lg">
          <Download className="w-4 h-4 mr-2" />
          Scarica PDF Nolosubito
        </Button>
        <Button
          onClick={handleSendEmail}
          variant="outline"
          size="lg"
          disabled={!clienteEmail || sendingEmail}
          className="flex-1"
        >
          {sendingEmail ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Mail className="w-4 h-4 mr-2" />
          )}
          {sendingEmail ? 'Invio...' : 'Invia via email'}
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Il PDF non conterrà riferimenti al fornitore originale del preventivo.
      </p>
    </div>
  );
}
