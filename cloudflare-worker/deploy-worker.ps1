$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "npm is not available. Install Node.js first, then run this script again."
}

npm install
npx wrangler login
npx wrangler secret put REDMINE_API_KEY
npx wrangler secret put BASIC_USER
npx wrangler secret put BASIC_PASS
npm run deploy
