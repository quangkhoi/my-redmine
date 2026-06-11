const ALLOWED_PATHS = new Set([
  "/issues.json",
  "/users.json",
  "/issue_statuses.json",
  "/time_entries.json",
  "/custom_fields.json",
]);

const DEFAULT_ALLOWED_ORIGINS = "https://quangkhoi.github.io,null";

export default {
  async fetch(request, env) {
    const requestUrl = new URL(request.url);
    const cors = buildCorsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors,
      });
    }

    if (request.method !== "GET") {
      return textResponse("Method not allowed", 405, cors);
    }

    if (!ALLOWED_PATHS.has(requestUrl.pathname)) {
      return textResponse("Not found", 404, cors);
    }

    const missingSecret = getMissingSecret(env);
    if (missingSecret) {
      return textResponse(`Missing Worker secret: ${missingSecret}`, 500, cors);
    }

    try {
      const targetUrl = new URL(`${normalizeBaseUrl(env.REDMINE_BASE_URL)}${requestUrl.pathname}`);
      targetUrl.search = requestUrl.search;

      const redmineResponse = await fetch(targetUrl.toString(), {
        headers: {
          Authorization: `Basic ${btoa(`${env.BASIC_USER}:${env.BASIC_PASS}`)}`,
          "X-Redmine-API-Key": env.REDMINE_API_KEY,
        },
      });

      const headers = new Headers(redmineResponse.headers);
      applyCorsHeaders(headers, cors);
      headers.set("Cache-Control", "no-store");
      headers.delete("Set-Cookie");

      return new Response(redmineResponse.body, {
        status: redmineResponse.status,
        headers,
      });
    } catch (error) {
      return textResponse(`Proxy error: ${error.message}`, 502, cors);
    }
  },
};

function getMissingSecret(env) {
  if (!env.REDMINE_BASE_URL) return "REDMINE_BASE_URL";
  if (!env.REDMINE_API_KEY) return "REDMINE_API_KEY";
  if (!env.BASIC_USER) return "BASIC_USER";
  if (!env.BASIC_PASS) return "BASIC_PASS";
  return "";
}

function buildCorsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowedOrigins = String(env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const allowAny = allowedOrigins.includes("*");
  const allowOrigin = allowAny || allowedOrigins.includes(origin) ? origin || "*" : allowedOrigins[0] || "*";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Redmine-API-Key",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function applyCorsHeaders(headers, cors) {
  Object.entries(cors).forEach(([key, value]) => {
    headers.set(key, value);
  });
}

function textResponse(message, status, cors) {
  const headers = new Headers(cors);
  headers.set("Content-Type", "text/plain; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(message, {
    status,
    headers,
  });
}

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}
