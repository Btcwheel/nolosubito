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

// Recupera la foto del veicolo (senza sfondo) caricata in CMS su offers.vehicle_image
async function fetchVehicleImage(marca, modello) {
  if (!marca || !modello) return null;

  try {
    const { data, error } = await supabase
      .from('offers')
      .select('make, model, vehicle_image')
      .not('vehicle_image', 'is', null);

    if (error || !data) return null;

    const match = data.find(
      (o) => normKey(o.make) === normKey(marca) && normKey(o.model) === normKey(modello)
    );
    if (!match?.vehicle_image) return null;

    return await fetchAsDataUrl(match.vehicle_image);
  } catch {
    return null;
  }
}

export async function scaricaPreventivoPDF(prev, clienteNome) {
  const rif = `NS-${prev.id.slice(-6).toUpperCase()}`;
  const assetBase = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');

  const logoB64 =
    (await fetchAsDataUrl(`${assetBase}logo-blu.svg`)) ||
    (await fetchAsDataUrl(`${assetBase}logo-blu.png`)) ||
    null;

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
