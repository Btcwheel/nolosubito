# Verifica porte e avvia Vite su 4430
try {
  $r = Invoke-WebRequest -Uri "http://localhost:4430" -UseBasicParsing -TimeoutSec 3
  Write-Host ("Porta 4430 attiva: HTTP " + $r.StatusCode + " - probabilmente Vite e gia li")
  exit 0
} catch {
  Write-Host "Porta 4430 libera - avvio Vite"
}

# Avvia Vite su porta 4430 in una nuova finestra
Start-Process -FilePath "npm" -ArgumentList "run","dev","--","--port","4430","--strictPort" -WorkingDirectory "C:\Users\Quixel\Downloads\fleet-flow-nolo" -WindowStyle Normal
Write-Host "Vite avviato su porta 4430"
