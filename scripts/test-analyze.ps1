# Test analyze-preventivo con payload minimale per vedere l'errore Anthropic
$lines = Get-Content 'C:\Users\Quixel\Downloads\fleet-flow-nolo\.env.local'
$anon = $null; $url = $null
foreach ($line in $lines) {
  if ($line -match '^VITE_SUPABASE_ANON_KEY=(.+)') { $anon = $matches[1].Trim() }
  if ($line -match '^VITE_SUPABASE_URL=(.+)') { $url = $matches[1].Trim() }
}
if (-not $anon -or -not $url) { Write-Host "Env mancante"; exit 1 }

# Payload solo testo (no immagini) per isolare il problema
$body = '{"text":"Preventivo test: VW Tiguan, 48 mesi, 25000 km/anno, canone 500 euro"}'
$headers = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $anon" }

Write-Host "=== Test 1: solo testo (no immagini) ==="
try {
  $resp = Invoke-WebRequest -Uri ($url + "/functions/v1/analyze-preventivo") -Headers $headers -Method Post -Body $body -UseBasicParsing -TimeoutSec 60
  Write-Host ("Status: " + $resp.StatusCode)
  Write-Host ("Body: " + $resp.Content.Substring(0, [Math]::Min(1500, $resp.Content.Length)))
} catch {
  Write-Host ("Errore: " + $_.Exception.Message)
  if ($_.Exception.Response) {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $errBody = $reader.ReadToEnd()
    Write-Host ("Error body: " + $errBody)
  }
}
