# Trova un preventivo Inviato per testare la route /print
$lines = Get-Content 'C:\Users\Quixel\Downloads\fleet-flow-nolo\.env.local'
$key = $null; $url = $null
foreach ($line in $lines) {
  if ($line -match '^VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)') { $key = $matches[1].Trim() }
  if ($line -match '^VITE_SUPABASE_URL=(.+)') { $url = $matches[1].Trim() }
}
if (-not $key -or -not $url) { Write-Host "Env mancante"; exit 1 }

$headers = @{ "apikey" = $key; "Authorization" = "Bearer $key" }
try {
  $resp = Invoke-RestMethod -Uri ($url + "/rest/v1/preventivi?select=id,veicolo_marca,veicolo_modello,pratica_id,status&order=created_at.desc&limit=5") -Headers $headers -Method Get
  Write-Host "=== Ultimi 5 preventivi ==="
  $resp | Format-Table id, veicolo_marca, veicolo_modello, status
} catch {
  Write-Host ("Errore: " + $_.Exception.Message)
}
