$ErrorActionPreference = "Stop"

$Port = 8787
$RedmineBaseUrl = "https://redmine.wdm.co.jp"
$ApiKey = "YOUR_REDMINE_API_KEY"
$BasicUsername = "YOUR_BASIC_AUTH_USERNAME"
$BasicPassword = "YOUR_BASIC_AUTH_PASSWORD"

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Start()

Write-Host "Redmine proxy is running at http://127.0.0.1:$Port"
Write-Host "Press Ctrl+C to stop."

function Add-CorsHeaders($response) {
  $response.Headers["Access-Control-Allow-Origin"] = "*"
  $response.Headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
  $response.Headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Redmine-API-Key"
}

function Write-TextResponse($response, [int]$statusCode, [string]$body, [string]$contentType = "text/plain; charset=utf-8") {
  Add-CorsHeaders $response
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
  $response.StatusCode = $statusCode
  $response.ContentType = $contentType
  $response.ContentLength64 = $bytes.Length
  $response.OutputStream.Write($bytes, 0, $bytes.Length)
  $response.OutputStream.Close()
}

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $request = $context.Request
  $response = $context.Response

  try {
    if ($request.HttpMethod -eq "OPTIONS") {
      Write-TextResponse $response 204 ""
      continue
    }

    $path = $request.Url.AbsolutePath
    if ($path -notin @("/issues.json", "/users.json", "/issue_statuses.json", "/time_entries.json", "/custom_fields.json")) {
      Write-TextResponse $response 404 "Not found"
      continue
    }

    $targetUri = "$RedmineBaseUrl$path$($request.Url.Query)"
    $basicPair = "${BasicUsername}:${BasicPassword}"
    $basicToken = [Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes($basicPair))

    $headers = @{
      "Authorization" = "Basic $basicToken"
      "X-Redmine-API-Key" = $ApiKey
    }

    $redmineResponse = Invoke-WebRequest -Uri $targetUri -Headers $headers -UseBasicParsing
    Write-TextResponse $response ([int]$redmineResponse.StatusCode) $redmineResponse.Content "application/json; charset=utf-8"
  } catch {
    $statusCode = 500
    if ($_.Exception.Response) {
      $statusCode = [int]$_.Exception.Response.StatusCode
    }
    Write-TextResponse $response $statusCode $_.Exception.Message
  }
}
