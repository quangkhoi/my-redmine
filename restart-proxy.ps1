$ErrorActionPreference = "SilentlyContinue"

$port = 8787
$proxyScript = Join-Path $PSScriptRoot "proxy.ps1"

$listeners = netstat -ano -p tcp |
  Select-String ":$port\s+.*LISTENING\s+(\d+)" |
  ForEach-Object { $_.Matches[0].Groups[1].Value } |
  Select-Object -Unique

foreach ($processId in $listeners) {
  if ($processId -and $processId -ne "0" -and $processId -ne "4") {
    taskkill /PID $processId /F | Out-Null
  }
}

Start-Sleep -Milliseconds 500

Start-Process -WindowStyle Hidden powershell -ArgumentList @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $proxyScript
)
