# Test bucket + Edge Function - versione robusta
$lines = Get-Content 'C:\Users\Quixel\Downloads\fleet-flow-nolo\.env.local'
$key = $null
foreach ($line in $lines) {
  if ($line -match '^VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)') {
    $key = $matches[1].Trim()
    break
  }
}
if (-not $key) { Write-Host "Key non trovata"; exit 1 }
Write-Host "Key length: $($key.Length)"

# 1. Lista bucket
$headers = @{ "Authorization" = "Bearer $key"; "apikey" = $key }
try {
  $resp = Invoke-RestMethod -Uri "https://nowoiywrzfnjocvsbmih.supabase.co/storage/v1/bucket" -Headers $headers -Method Get
  Write-Host "`n=== Buckets ==="
  $resp | ForEach-Object { Write-Host " - $($_.name) (public: $($_.public))" }
  $hasBucket = $resp | Where-Object { $_.name -eq 'preventivi-pdf' }
  if (-not $hasBucket) {
    Write-Host "`n>>> Bucket 'preventivi-pdf' NON esiste. Creazione..."
    $body = '{"name":"preventivi-pdf","public":false}'
    try {
      $createResp = Invoke-RestMethod -Uri "https://nowoiywrzfnjocvsbmih.supabase.co/storage/v1/bucket" -Headers $headers -Method Post -Body $body -ContentType "application/json"
      Write-Host "Bucket creato: $($createResp | ConvertTo-Json -Compress)"
    } catch {
      Write-Host "Errore creazione bucket: $($_.Exception.Message)"
    }
  } else {
    Write-Host "`n>>> Bucket 'preventivi-pdf' ESISTE"
  }
} catch {
  Write-Host "Errore lista bucket: $($_.Exception.Message)"
}

# 2. Test Edge Function con payload renderless
Write-Host "`n=== Test Edge Function (renderless payload) ==="
$testPayload = @'
{
  "payload": {
    "offerta": { "numero": "NS-TEST01", "data_emissione": "2026-06-25T10:00:00Z", "valida_fino_al": "2026-06-30T10:00:00Z" },
    "cliente": { "nome": "Test Cliente", "email": "test@example.com", "telefono": "+39 333 1234567" },
    "consulente": { "ragione_sociale": "Nolosubito S.r.l.", "telefono": "+39 06 400 49490", "cellulare": "+39 345 430 0936", "email": "info@nolosubito.it", "sito": "nolosubito.it" },
    "veicolo": { "marca": "Citroen", "modello": "C3", "versione": "PLUS", "titolo_display": "Citroen C3 PLUS", "sottotitolo_display": "Cambio manuale", "alimentazione": "Benzina", "potenza_cv": 100, "potenza_kw": 74, "cambio": "Manuale", "carrozzeria": "Hatchback", "colore_esterno": "Rosso", "interni": "Tessuto", "emissioni_co2_g_km": null, "classe_ambientale": null, "pronta_consegna": true, "foto_url": null },
    "contratto": { "durata_mesi": 48, "km_annui": 25000, "km_totali": 100000, "anticipo_iva_esclusa": 0, "anticipo_iva_inclusa": 0, "deposito_cauzionale": 0 },
    "canone": { "aliquota_iva": 22, "quota_veicolo_iva_esclusa": 276.86, "quota_veicolo_iva_inclusa": 337.77, "quota_servizi_iva_esclusa": 136.36, "quota_servizi_iva_inclusa": 166.36, "totale_iva_esclusa": 413.22, "totale_iva_inclusa": 504.13, "canone_mensile_display": 504.13 },
    "valore_veicolo": { "listino": 17900, "optional": 0, "accessori": 0, "totale": 17900 },
    "note_cliente": "Nota di test dal payload renderless",
    "servizi_inclusi": [
      { "titolo": "RC Auto", "dettaglio": "Penale 250" },
      { "titolo": "Copertura Danni", "dettaglio": "Penale 500" }
    ],
    "servizi_richiesti": [
      { "titolo": "Auto Sostitutiva", "dettaglio": "Disponibile su richiesta" }
    ],
    "branding": null
  }
}
'@

$fnHeaders = @{ "Authorization" = "Bearer $key"; "apikey" = $key; "Content-Type" = "application/json" }
try {
  $fnResp = Invoke-WebRequest -Uri "https://nowoiywrzfnjocvsbmih.supabase.co/functions/v1/generate-preventivo-pdf" -Headers $fnHeaders -Method Post -Body $testPayload -TimeoutSec 90
  Write-Host "Status: $($fnResp.StatusCode)"
  Write-Host "Content-Type: $($fnResp.Headers.'Content-Type')"
  if ($fnResp.Headers.'Content-Type' -match 'application/pdf') {
    $pdfPath = "C:\Users\Quixel\Downloads\fleet-flow-nolo\test-preventivo-renderless.pdf"
    [System.IO.File]::WriteAllBytes($pdfPath, $fnResp.Content)
    Write-Host "PDF salvato in: $pdfPath ($($fnResp.Content.Length) bytes)"
  } else {
    $bodyStr = [System.Text.Encoding]::UTF8.GetString($fnResp.Content)
    Write-Host "Body: $($bodyStr.Substring(0, [Math]::Min(800, $bodyStr.Length)))"
  }
} catch {
  Write-Host "Errore Edge Function: $($_.Exception.Message)"
  if ($_.ErrorDetails) { Write-Host "Details: $($_.ErrorDetails.Message)" }
  if ($_.Exception.Response) {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $body = $reader.ReadToEnd()
    Write-Host "Response body: $body"
  }
}
