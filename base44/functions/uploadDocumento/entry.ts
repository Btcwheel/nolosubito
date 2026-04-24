import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

const BUCKET = "pratiche-documenti";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const praticaId = formData.get("pratica_id");
  const tipoDocumento = formData.get("tipo_documento") || "Altro";

  if (!file || !praticaId) {
    return Response.json({ error: "Missing file or pratica_id" }, { status: 400 });
  }

  const ext = file.name.split(".").pop();
  const fileName = `${praticaId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

  // Save record to PraticaDocumento entity
  const doc = await base44.asServiceRole.entities.PraticaDocumento.create({
    pratica_id: praticaId,
    nome_file: file.name,
    tipo_documento: tipoDocumento,
    file_url: urlData.publicUrl,
    stato_verifica: "In attesa",
    caricato_da: user.full_name || user.email,
  });

  return Response.json({ success: true, documento: doc });
});