import { supabase } from './supabase';
import { pdf } from '@react-pdf/renderer';
import { createElement } from 'react';
import { PreventivoPdfDoc } from './PreventivoPdfDoc.jsx';

async function fetchAsDataUrl(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) return null;
  const blob = await res.blob();
  if (!blob.size) return null;
  return new Promise((resolve) => {
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

async function buildAssets(prev) {
  const assetBase = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
  const [logoB64, vehicleImageB64] = await Promise.all([
    fetchAsDataUrl(`${assetBase}logo-blu.png`),
    fetchVehicleImage(prev.veicolo_marca, prev.veicolo_modello),
  ]);
  return { logoB64, vehicleImageB64 };
}

/**
 * Scarica il PDF preventivo usando @react-pdf/renderer + PreventivoPdfDoc.
 */
export async function scaricaPreventivoPDF(prev, clienteNome) {
  if (!prev?.id) throw new Error('ID preventivo mancante');

  const { logoB64, vehicleImageB64 } = await buildAssets(prev);
  const doc = createElement(PreventivoPdfDoc, { prev, clienteNome, logoB64, vehicleImageB64 });
  const blob = await pdf(/** @type {any} */ (doc)).toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `preventivo-${prev.id.slice(-6).toUpperCase()}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Genera PDF con @react-pdf/renderer + PreventivoPdfDoc.
 * Restituisce base64 senza prefisso data URI (pronto per nodemailer attachment).
 * Usato da send-preventivo-custom per allegare il PDF all'email.
 */
export async function generaPreventivoPDFBase64(prev, clienteNome) {
  const { logoB64, vehicleImageB64 } = await buildAssets(prev);

  const doc = createElement(PreventivoPdfDoc, { prev, clienteNome, logoB64, vehicleImageB64 });
  const blob = await pdf(/** @type {any} */ (doc)).toBlob();

  // Converti Blob → base64 (senza prefisso data URI)
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      // Strip "data:application/pdf;base64," prefix
      const base64 = String(result).split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Conversione Blob→base64 fallita'));
    reader.readAsDataURL(blob);
  });
}
