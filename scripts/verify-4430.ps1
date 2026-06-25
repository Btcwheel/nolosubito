Start-Sleep -Seconds 3
try {
  $r = Invoke-WebRequest -Uri "http://localhost:4430" -UseBasicParsing -TimeoutSec 10
  Write-Host ("Porta 4430: HTTP " + $r.StatusCode + " - Vite attivo")
  Write-Host ("Content-Type: " + $r.Headers.'Content-Type')
} catch {
  Write-Host ("Errore: " + $_.Exception.Message)
}
