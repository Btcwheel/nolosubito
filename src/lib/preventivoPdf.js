import { pdf } from '@react-pdf/renderer';
import { createElement } from 'react';
import { PreventivoPdfDoc } from './PreventivoPdfDoc.jsx';
import { supabase } from './supabase';

async function fetchAsDataUrl(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) return null;

  const blob = await res.blob();
  if (!blob.size) return null;

  return await new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => resolve(null);
    fr.readAsDataURL(blob);
  });
}

const normKey = (value) => String(value || '').trim().toUpperCase();

// @react-pdf/renderer supporta solo PNG/JPEG: le foto caricate via CMS sono WebP
// (compressImageToWebP in services/offers.js), quindi vanno riconvertite per il PDF.
function convertToPngDataUrl(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

// Recupera la foto del veicolo (senza sfondo) caricata in CMS su offers.vehicle_image
async function fetchVehicleImage(marca, modello) {
  if (!marca || !modello) return null;

  try {
    const { data, error } = await supabase
      .from('offers')
      .select('make, model, foto_prev')
      .not('foto_prev', 'is', null);

    if (error || !data) return null;

    const normMarca = normKey(marca);
    const normModello = normKey(modello);
    const match = data.find((o) => {
      if (normKey(o.make) !== normMarca) return false;
      const normOfferModel = normKey(o.model);
      return normModello.startsWith(normOfferModel) || normOfferModel.startsWith(normModello);
    });
    if (!match?.foto_prev) return null;

    const dataUrl = await fetchAsDataUrl(match.foto_prev);
    if (dataUrl?.startsWith('data:image/webp')) return await convertToPngDataUrl(dataUrl);
    return dataUrl;
  } catch {
    return null;
  }
}

export async function scaricaPreventivoPDF(prev, clienteNome) {
  const rif = `NS-${prev.id.slice(-6).toUpperCase()}`;
  const assetBase = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');

  // react-pdf <Image> non supporta SVG come data-URL (solo PNG/JPEG) — niente .svg qui
  const logoB64 = (await fetchAsDataUrl(`${assetBase}logo-blu.png`)) || null;

  const vehicleImageB64 = await fetchVehicleImage(prev.veicolo_marca, prev.veicolo_modello);

  const doc = createElement(PreventivoPdfDoc, { prev, clienteNome, logoB64, vehicleImageB64 });
  const blob = await pdf(doc).toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Preventivo_${rif}_${(clienteNome || 'cliente').replace(/\s+/g, '_')}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
