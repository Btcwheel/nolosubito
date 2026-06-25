# Recupera log Edge Function via API
$lines = Get-Content 'C:\Users\Quixel\Downloads\fleet-flow-nolo\.env.local'
$key = $null
foreach ($line in $lines) {
  if ($line -match '^VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)') { $key = $matches[1].Trim(); break }
}
$headers = @{ "Authorization" = "Bearer $key"; "apikey" = $key }
try {
  $resp = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/nowoiywrzfnjocvsbmih/functions/generate-preventivo-pdf/logs?limit=50" -Headers $headers -Method Get
  Write-Host "=== Logs generate-preventivo-pdf ==="
  $resp | ConvertTo-Json -Depth 6
} catch {
  Write-Host "Errore: $($_.Exception.Message)"
  if ($_.ErrorDetails) { Write-Host "Details: $($_.ErrorDetails.Message)" }
}
