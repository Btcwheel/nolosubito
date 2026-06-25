Start-Sleep -Seconds 6
$ports = @(5173, 5174, 5175, 5176)
foreach ($p in $ports) {
  try {
    $r = Invoke-WebRequest -Uri ("http://localhost:" + $p) -UseBasicParsing -TimeoutSec 5
    Write-Host ("Porta " + $p + ": HTTP " + $r.StatusCode + " - dev server attivo")
    break
  } catch {
    Write-Host ("Porta " + $p + ": non risponde")
  }
}
