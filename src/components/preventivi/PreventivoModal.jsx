import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, Car, Calendar, Gauge, Wallet, FileText } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { scaricaPreventivoPDF } from "@/lib/preventivoPdf";

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-[#DCE2EF] last:border-0">
      <span className="text-sm text-[#6D7894]">{label}</span>
      <span className="text-sm font-semibold text-[#1F2942]">{value}</span>
    </div>
  );
}

export default function PreventivoModal({ preventivo, clienteNome, open, onClose }) {
  const [downloading, setDownloading] = React.useState(false);
  if (!preventivo) return null;

  const p = preventivo;
  const dataDoc = p.inviato_at || p.created_at;
  const codice = `NS-${new Date(dataDoc).getFullYear()}-${p.id.slice(0, 6).toUpperCase()}`;

  const handleDownload = async () => {
    setDownloading(true);
    try { await scaricaPreventivoPDF(p, clienteNome); }
    finally { setDownloading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full p-0 overflow-hidden rounded-2xl gap-0">

        {/* Striscia navy + orange */}
        <div className="flex h-2">
          <div className="flex-[0.68] bg-[#36389D]" />
          <div className="flex-[0.32] bg-[#F6B000]" />
        </div>

        {/* Header */}
        <div className="bg-[#36389D] px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Preventivo</p>
              <h2 className="text-xl font-bold text-white leading-tight">
                {p.veicolo_marca} {p.veicolo_modello}
              </h2>
              {p.alimentazione && (
                <p className="text-sm text-white/60 mt-0.5">{p.alimentazione}</p>
              )}
            </div>
            <div className="text-right shrink-0 ml-4">
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Codice</p>
              <p className="text-sm font-bold text-white font-mono">{codice}</p>
              <p className="text-xs text-white/50 mt-1">
                {format(new Date(dataDoc), "d MMM yyyy", { locale: it })}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[60vh]">

          {/* Canone principale */}
          <div className="bg-[#36389D] rounded-xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Canone mensile</p>
              <div className="flex items-baseline gap-1">
                <span className="text-[#F6B000] text-lg font-bold">€</span>
                <span className="text-white text-4xl font-bold leading-none">
                  {Number(p.canone_finale ?? p.canone_mensile).toLocaleString("it-IT")}
                </span>
                <span className="text-white/60 text-sm">/mese</span>
              </div>
              {p.canone_finale && p.canone_finale !== p.canone_mensile && (
                <p className="text-white/40 text-xs mt-1 line-through">
                  Era €{Number(p.canone_mensile).toLocaleString("it-IT")}/mese
                </p>
              )}
            </div>
            <div className="bg-[#F6B000]/20 rounded-xl px-4 py-3 text-right">
              <p className="text-[10px] font-bold text-[#F6B000] uppercase tracking-widest mb-1">Anticipo</p>
              <p className="text-white font-bold text-lg">
                €{Number(p.anticipo || 0).toLocaleString("it-IT")}
              </p>
            </div>
          </div>

          {/* Configurazione */}
          <div>
            <p className="text-[10px] font-bold text-[#36389D] uppercase tracking-widest mb-3">Configurazione</p>
            <div className="bg-[#F4F6FB] rounded-xl px-4 divide-y divide-[#DCE2EF]">
              <Row label="Durata contratto" value={`${p.durata_mesi} mesi`} />
              <Row label="Km annui" value={`${Number(p.km_annui).toLocaleString("it-IT")} km/anno`} />
              <Row
                label="Km totali inclusi"
                value={`${(p.km_annui * p.durata_mesi / 12).toLocaleString("it-IT")} km`}
              />
              <Row
                label="Costo totale canoni"
                value={`€${(Number(p.canone_finale ?? p.canone_mensile) * p.durata_mesi).toLocaleString("it-IT")}`}
              />
            </div>
          </div>

          {/* Note cliente */}
          {p.note_cliente && (
            <div>
              <p className="text-[10px] font-bold text-[#36389D] uppercase tracking-widest mb-3">Note</p>
              <div className="bg-[#F4F6FB] border-l-4 border-[#36389D] rounded-r-xl px-4 py-3">
                <p className="text-sm text-[#54617D] leading-relaxed italic">{p.note_cliente}</p>
              </div>
            </div>
          )}

          {/* Intestatario */}
          {clienteNome && (
            <div className="bg-[#F4F6FB] rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#36389D]/10 flex items-center justify-center shrink-0">
                <span className="text-[#36389D] font-bold text-sm">{clienteNome.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-[10px] text-[#6D7894] font-semibold uppercase tracking-widest">Intestatario</p>
                <p className="text-sm font-semibold text-[#1F2942]">{clienteNome}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-[#DCE2EF] flex gap-3 bg-white">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Chiudi
          </Button>
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 bg-[#36389D] hover:bg-[#36389D]/90 text-white gap-2"
          >
            <Download className="w-4 h-4" />
            {downloading ? "Generazione…" : "Scarica PDF"}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
