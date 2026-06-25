# Upload template.html su bucket site-images (pubblico)
$lines = Get-Content 'C:\Users\Quixel\Downloads\fleet-flow-nolo\.env.local'
$key = $null
foreach ($line in $lines) {
  if ($line -match '^VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)') {
    $key = $matches[1].Trim()
    break
  }
}
if (-not $key) { Write-Host "Key non trovata"; exit 1 }

# Upsert (uso upsert=true per sovrascrivere se esiste)
$headers = @{
  "Authorization" = "Bearer $key"
  "apikey" = $key
  "Content-Type" = "text/html; charset=utf-8"
  "x-upsert" = "true"
}

$templatePath = 'C:\Users\Quixel\Downloads\fleet-flow-nolo\supabase\functions\generate-preventivo-pdf\template.html'
$bytes = [System.IO.File]::ReadAllBytes($templatePath)
Write-Host "Template size: $($bytes.Length) bytes"

try {
  $resp = Invoke-RestMethod -Uri "https://nowoiywrzfnjocvsbmih.supabase.co/storage/v1/object/site-images/preventivo-template.html" -Headers $headers -Method Post -Body $bytes
  Write-Host "Upload OK: $($resp | ConvertTo-Json -Compress)"

  # Verifica URL pubblico
  $publicUrl = "https://nowoiywrzfnjocvsbmih.supabase.co/storage/v1/object/public/site-images/preventivo-template.html"
  Write-Host "Public URL: $publicUrl"

  # Test download
  $testResp = Invoke-WebRequest -Uri $publicUrl -Method Get -TimeoutSec 30
  Write-Host "Download test - Status: $($testResp.StatusCode), Content-Length: $($testResp.Content.Length)"
} catch {
  Write-Host "Errore: $($_.Exception.Message)"
  if ($_.ErrorDetails) { Write-Host "Details: $($_.ErrorDetails.Message)" }
}
