import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { clientType, documents } = await req.json();

    // Build requirements description per client type
    const requirements = {
      "Privato": [
        "Ultime due buste paga",
        "CUD (Certificazione Unica)",
        "Documento di identità (carta d'identità o passaporto) — deve essere valido e non scaduto",
        "Patente di guida — deve essere valida e non scaduta",
        "IBAN bancario",
        "Recapito telefonico e indirizzo email"
      ],
      "P.IVA": [
        "Modello Unico (anno precedente) con ricevuta di presentazione",
        "Provvisorio anno precedente prima della comunicazione con ricevuta di presentazione",
        "Documento di identità (carta d'identità o passaporto) — deve essere valido e non scaduto",
        "Patente di guida — deve essere valida e non scaduta",
        "IBAN bancario",
        "Telefono, email e PEC"
      ],
      "Azienda": [
        "Ultimo bilancio con ricevuta di presentazione",
        "Documento di identità dell'amministratore — deve essere valido e non scaduto",
        "Visura camerale (non più vecchia di 6 mesi)",
        "IBAN aziendale",
        "Telefono aziendale, PEC e/o email"
      ]
    };

    const docList = requirements[clientType] || requirements["Privato"];

    const docDescriptions = documents.map((d, i) =>
      `Documento ${i + 1}: "${d.name}" (tipo: ${d.type || 'sconosciuto'})`
    ).join("\n");

    const prompt = `Sei un esperto di pratiche per il noleggio a lungo termine (NLT) in Italia. 
Il cliente è di tipo: ${clientType}.

Documenti richiesti per questa tipologia:
${docList.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Documenti caricati dal cliente:
${docDescriptions || "Nessun documento caricato"}

Analizza i documenti caricati e:
1. Verifica se tutti i documenti richiesti sono presenti
2. Segnala eventuali documenti mancanti
3. Segnala eventuali documenti che potrebbero essere scaduti (es. carta d'identità, patente, visura camerale) basandoti sul nome del file se possibile
4. Segnala documenti incoerenti o non pertinenti con quanto richiesto
5. Dai un giudizio generale: COMPLETO, PARZIALE o INCOMPLETO

Rispondi in italiano in modo chiaro e professionale. Sii diretto e conciso.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["COMPLETO", "PARZIALE", "INCOMPLETO"] },
          summary: { type: "string" },
          missing: { type: "array", items: { type: "string" } },
          warnings: { type: "array", items: { type: "string" } },
          ok: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json({ result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});