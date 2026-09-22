import { supabase } from './supabase';

/**
 * Genera un token casuale sicuro per il magic link
 */
export function generateMagicToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Crea un magic link per una nota
 * Ritorna: { token, expiresAt, link }
 */
export function createMagicLink(noteId, expiresIn = 7 * 24 * 60 * 60 * 1000) {
  const token = generateMagicToken();
  const expiresAt = new Date(Date.now() + expiresIn);
  const baseUrl = window.location.origin;
  const link = `${baseUrl}/risposta/${token}`;

  return { token, expiresAt, link };
}

/**
 * Valida e recupera una nota dal magic token
 */
export async function getMagicLinkNote(token) {
  if (!token) return null;

  const { data, error } = await supabase
    .from('pratica_note')
    .select('*, pratiche(id, cliente_email, cliente_nome)')
    .eq('link_token', token)
    .single();

  if (error || !data) return null;

  // Controlla scadenza
  if (data.link_token_expires_at && new Date(data.link_token_expires_at) < new Date()) {
    return null; // Token scaduto
  }

  // Controlla se già utilizzato
  if (data.link_accessed_at) {
    return null; // Link già utilizzato
  }

  return data;
}

/**
 * Registra la risposta e marca il link come utilizzato
 */
export async function saveResponseToNote(token, responseText) {
  if (!responseText?.trim()) {
    throw new Error('La risposta non può essere vuota');
  }

  // Valida il token e ottiene la nota
  const note = await getMagicLinkNote(token);
  if (!note) {
    throw new Error('Link non valido o scaduto');
  }

  // Salva la risposta come nuova nota
  const { data: responseNote, error: insertError } = await supabase
    .from('pratica_note')
    .insert({
      pratica_id: note.pratica_id,
      autore_nome: note.pratiche.cliente_nome,
      autore_ruolo: 'cliente',
      testo: responseText,
      visibile_cliente: true,
    })
    .select()
    .single();

  if (insertError) {
    throw new Error('Errore nel salvataggio della risposta');
  }

  // Marca il link come utilizzato
  await supabase
    .from('pratica_note')
    .update({ link_accessed_at: new Date().toISOString() })
    .eq('id', note.id);

  return responseNote;
}
