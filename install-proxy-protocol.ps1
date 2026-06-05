$ErrorActionPreference = "Stop"

$protocol = "redmineproxy"
$batPath = Join-Path $PSScriptRoot "start-proxy.bat"
$command = "cmd.exe /c start """" ""$batPath"""
$baseKey = "HKCU:\Software\Classes\$protocol"

New-Item -Path $baseKey -Force | Out-Null
New-ItemProperty -Path $baseKey -Name "(default)" -Value "URL:Redmine Proxy Launcher" -PropertyType String -Force | Out-Null
New-ItemProperty -Path $baseKey -Name "URL Protocol" -Value "" -PropertyType String -Force | Out-Null
New-Item -Path "$baseKey\shell\open\command" -Force | Out-Null
New-ItemProperty -Path "$baseKey\shell\open\command" -Name "(default)" -Value $command -PropertyType String -Force | Out-Null

Write-Host "Installed redmineproxy:// protocol."
Write-Host "Command: $command"
