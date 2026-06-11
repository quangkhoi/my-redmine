# Redmine HTTPS Proxy

Cloudflare Worker proxy for the Redmine dashboard. It exposes a HTTPS endpoint that the browser can call from GitHub Pages, then forwards allowed Redmine API requests with the API key and Basic Auth stored as Cloudflare secrets.

## Setup

```powershell
cd C:\workspace\my-redmine\cloudflare-worker
npm install
npx wrangler login
```

Set secrets:

```powershell
npx wrangler secret put REDMINE_API_KEY
npx wrangler secret put BASIC_USER
npx wrangler secret put BASIC_PASS
```

Use these values when prompted:

- `REDMINE_API_KEY`: Redmine API access key
- `BASIC_USER`: Basic Auth username
- `BASIC_PASS`: Basic Auth password

Deploy:

```powershell
npm run deploy
```

Or run the helper script:

```powershell
.\deploy-worker.ps1
```

After deploy, copy the Worker URL, for example:

```text
https://redmine-https-proxy.<account>.workers.dev
```

Set `REDMINE.proxyUrl` in `../app.js` to that HTTPS URL.

## Allowed Endpoints

Only these Redmine API paths are proxied:

- `/issues.json`
- `/users.json`
- `/issue_statuses.json`
- `/time_entries.json`
- `/custom_fields.json`

## CORS

Allowed origins are configured in `wrangler.toml`:

```toml
ALLOWED_ORIGINS = "https://quangkhoi.github.io,null"
```

`null` allows local `file://` usage. Add another origin if your GitHub Pages URL is different.
