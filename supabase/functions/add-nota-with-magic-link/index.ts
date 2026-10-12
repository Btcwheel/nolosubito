import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AddNotaRequest = {
  praticaId: string;
  testo: string;
  autorNome: string;
  autoreRuolo: string;
  visibileCliente: boolean;
};

// Genera un token casuale sicuro
function generateMagicToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { praticaId, testo, autorNome, autoreRuolo, visibileCliente } =
      await req.json() as AddNotaRequest;

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Prepara i dati della nota
    const noteData: any = {
      pratica_id: praticaId,
      testo,
      autore_nome: autorNome,
      autore_ruolo: autoreRuolo,
      visibile_cliente: visibileCliente,
    };

    // Genera magic link se visibile al cliente
    if (visibileCliente) {
      const token = generateMagicToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 giorni

      noteData.link_token = token;
      noteData.link_token_expires_at = expiresAt.toISOString();
    }

    // Inserisci la nota
    const { data: insertedNote, error: insertError } = await supabaseClient
      .from('pratica_note')
      .insert([noteData])
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, data: insertedNote }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      }
    );
  }
});
