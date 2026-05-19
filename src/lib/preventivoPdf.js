import { pdf } from '@react-pdf/renderer';
import { createElement } from 'react';
import { PreventivoPdfDoc } from './PreventivoPdfDoc.jsx';

export async function scaricaPreventivoPDF(prev, clienteNome) {
  const rif = `NS-${prev.id.slice(-6).toUpperCase()}`;

  const logoB64 = await fetch('/logo-blu.png')
    .then(r => r.ok ? r.blob() : null)
    .then(b => b ? new Promise(res => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.readAsDataURL(b);
    }) : null)
    .catch(() => null);

  const doc = createElement(PreventivoPdfDoc, { prev, clienteNome, logoB64 });
  const blob = await pdf(doc).toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Preventivo_${rif}_${(clienteNome || 'cliente').replace(/\s+/g, '_')}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
