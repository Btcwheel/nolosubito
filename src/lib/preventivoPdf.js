import { pdf } from '@react-pdf/renderer';
import { createElement } from 'react';
import { PreventivoPdfDoc } from './PreventivoPdfDoc.jsx';

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

export async function scaricaPreventivoPDF(prev, clienteNome) {
  const rif = `NS-${prev.id.slice(-6).toUpperCase()}`;
  const assetBase = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');

  const logoB64 =
    (await fetchAsDataUrl(`${assetBase}logo-blu.svg`)) ||
    (await fetchAsDataUrl(`${assetBase}logo-blu.png`)) ||
    null;

  const doc = createElement(PreventivoPdfDoc, { prev, clienteNome, logoB64 });
  const blob = await pdf(doc).toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Preventivo_${rif}_${(clienteNome || 'cliente').replace(/\s+/g, '_')}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
