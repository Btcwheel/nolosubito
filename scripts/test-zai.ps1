# Test diretto Z.ai endpoint con payload testo minimale
$key = "e0808702b49d46b6a14dff4e88581cf1.a79wdU2YHyzXtJD9"
$endpoint = "https://api.z.ai/api/paas/v4/chat/completions"

$body = @'
{
  "model": "glm-4.6",
  "max_tokens": 256,
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "Rispondi solo con JSON: {\"ok\":true,\"model\":\"glm-4.6\"}" }
      ]
    }
  ],
  "response_format": { "type": "json_object" }
}
'@

$headers = @{ "Authorization" = "Bearer $key"; "Content-Type" = "application/json" }
Write-Host "=== Test Z.ai endpoint (solo testo) ==="
try {
  $resp = Invoke-WebRequest -Uri $endpoint -Headers $headers -Method Post -Body $body -UseBasicParsing -TimeoutSec 60
  Write-Host ("Status: " + $resp.StatusCode)
  Write-Host ("Body: " + $resp.Content.Substring(0, [Math]::Min(1200, $resp.Content.Length)))
} catch {
  Write-Host ("Errore: " + $_.Exception.Message)
  if ($_.Exception.Response) {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $errBody = $reader.ReadToEnd()
    Write-Host ("Error body: " + $errBody)
  }
}
