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

  // RPC security definer: l'anon non ha permessi di lettura su pratiche,
  // quindi un select diretto con join non riuscirebbe a portare il nome cliente.
  // La funzione filtra già per scadenza/non-utilizzo lato server.
  const { data, error } = await supabase
    .rpc('get_magic_link_note', { p_token: token })
    .maybeSingle();

  if (error || !data) return null;

  return {
    ...data,
    pratiche: { cliente_nome: data.cliente_nome, cliente_email: data.cliente_email },
  };
}

/**
 * Registra la risposta e marca il link come utilizzato.
 * Passa dalla funzione RPC respond_to_magic_link_note (security definer):
 * l'utente anonimo non ha permessi di insert diretti su pratica_note, la
 * validazione del token e l'inserimento avvengono lato server in un'unica
 * transazione.
 */
export async function saveResponseToNote(token, responseText) {
  if (!responseText?.trim()) {
    throw new Error('La risposta non può essere vuota');
  }

  const { data, error } = await supabase.rpc('respond_to_magic_link_note', {
    p_token: token,
    p_testo: responseText,
  });

  if (error) {
    throw new Error(error.message || 'Errore nel salvataggio della risposta');
  }

  return data;
}
