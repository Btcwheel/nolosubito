# Setta temporaneamente il preventivo VW Tiguan a "Inviato" per testare la route /print
$lines = Get-Content 'C:\Users\Quixel\Downloads\fleet-flow-nolo\.env.local'
$key = $null; $url = $null
foreach ($line in $lines) {
  if ($line -match '^VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)') { $key = $matches[1].Trim() }
  if ($line -match '^VITE_SUPABASE_URL=(.+)') { $url = $matches[1].Trim() }
}
if (-not $key -or -not $url) { Write-Host "Env mancante"; exit 1 }

$prevId = "3db3d666-6708-4e5f-9aed-64382236f46a"
$headers = @{ "apikey" = $key; "Authorization" = "Bearer $key"; "Content-Type" = "application/json"; "Prefer" = "return=representation" }
$body = '{"status":"Inviato","inviato_at":"' + (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ") + '"}'

try {
  $resp = Invoke-RestMethod -Uri ($url + "/rest/v1/preventivi?id=eq." + $prevId) -Headers $headers -Method Patch -Body $body
  Write-Host "Preventivo aggiornato a Inviato:"
  $resp | Format-Table id, veicolo_marca, veicolo_modello, status
  Write-Host ("URL test: http://localhost:4430/print/preventivo/" + $prevId + "?print=true")
} catch {
  Write-Host ("Errore: " + $_.Exception.Message)
  if ($_.ErrorDetails) { Write-Host ("Details: " + $_.ErrorDetails.Message) }
}
