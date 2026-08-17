import z from "@deepseek-ai/schemastery";
import { credentialRef } from "@deepseek-ai/dsh-credentials";
import { launchEnvironmentOf } from "@deepseek-ai/dsh-launch-environment";
import { WebError } from "@deepseek-ai/dsh-web";
import {
  DeepSeekSearchProvider,
  DEEPSEEK_DEFAULT_API_VERSION,
  DEEPSEEK_DEFAULT_BASE_URL,
  DEEPSEEK_DEFAULT_MAX_TOKENS,
  DEEPSEEK_DEFAULT_MAX_USES,
  DEEPSEEK_DEFAULT_MODEL,
} from "@deepseek-ai/dsh-web-search-deepseek";

/** Registry id. Must not collide with deepseek-official / exa. */
export const TAVILY_PROVIDER_ID = "tavily";
const TAVILY_HOST = "https://api.tavily.com";
const DEFAULT_KEY_ENV = "TAVILY_API_KEY";
const DEFAULT_TIMEOUT_MS = 30_000;
/** Non-secret switch stored via the credentials plane so the settings card can write it on rc.6. */
export const ENABLED_REF = "TAVILY_SEARCH_ENABLED";

export const name = "web-search-tavily";
export const inject = ["web", "webServer", "settings"];

export const Config = z.object({
  apiKey: z.string().role("secret"),
  apiKeyEnv: z.string().role("credential-ref").default(DEFAULT_KEY_ENV),
  baseURL: z.string().default(TAVILY_HOST),
  allowCustomBaseURL: z.boolean().default(false),
  maxResults: z.number().step(1).min(1).max(20).default(5),
  searchTimeoutMs: z.number().step(1).min(1).default(DEFAULT_TIMEOUT_MS),
});

function throwIfAborted(signal) {
  if (signal?.aborted) throw new WebError("Tavily search aborted", "WEB_ABORTED", { cause: signal.reason });
}

function isAbortError(error) {
  return error instanceof DOMException && (error.name === "AbortError" || error.name === "TimeoutError");
}

function truthy(value) {
  if (value == null) return false;
  const v = String(value).trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "on";
}

function searchHost(baseURL, allowCustom) {
  const host = (baseURL || TAVILY_HOST).replace(/\/+$/, "");
  if (host === TAVILY_HOST) return host;
  if (!allowCustom) {
    throw new WebError(`Tavily baseURL must be ${TAVILY_HOST} unless allowCustomBaseURL is true`, "WEB_PROVIDER_ERROR");
  }
  if (!host.startsWith("https://")) {
    throw new WebError("Tavily custom baseURL must use https", "WEB_PROVIDER_ERROR");
  }
  return host;
}

function deadlineSignal(signal, timeoutMs) {
  if (!timeoutMs || timeoutMs <= 0) return signal;
  const timer = AbortSignal.timeout(timeoutMs);
  if (!signal) return timer;
  if (typeof AbortSignal.any === "function") return AbortSignal.any([signal, timer]);
  return timer;
}

async function resolveRef(ctx, envName, literal) {
  if (literal && literal.length > 0) return literal;
  const ref = credentialRef(envName);
  const creds = ctx.get("credentials");
  if (creds) {
    const resolved = await creds.resolve(ref);
    if (resolved?.value && resolved.value.length > 0) return resolved.value;
  }
  const env = launchEnvironmentOf(ctx).get(ref);
  if (env?.value && env.value.length > 0) return env.value;
  return undefined;
}

function tavilyHeaders(apiKey) {
  const headers = {
    "content-type": "application/json",
    accept: "application/json",
  };
  if (apiKey) headers.authorization = `Bearer ${apiKey}`;
  else headers["x-tavily-access-mode"] = "keyless";
  return headers;
}

async function tavilyErrorText(res) {
  let message = `Tavily API error (HTTP ${res.status})`;
  try {
    const json = await res.json();
    const detail = typeof json?.error === "string"
      ? json.error
      : json?.error?.message || json?.message || json?.detail;
    if (typeof detail === "string" && detail.length > 0) message = detail;
  } catch {
    // keep status-line fallback
  }
  return message;
}

function toSources(body) {
  const rows = Array.isArray(body?.results) ? body.results : [];
  const sources = [];
  for (const row of rows) {
    if (typeof row?.url !== "string" || row.url.length === 0) continue;
    const item = { url: row.url };
    if (typeof row.title === "string" && row.title) item.title = row.title;
    if (typeof row.content === "string" && row.content) item.snippet = row.content.slice(0, 800);
    if (typeof row.published_date === "string" && row.published_date) item.publishedAt = row.published_date;
    sources.push(item);
  }
  return { sources, truncated: false };
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req, limit = 4096) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const text = Buffer.concat(chunks).toString("utf8").trim();
      if (!text) {
        resolve({});
        return;
      }
      try {
        const json = JSON.parse(text);
        resolve(json !== null && typeof json === "object" && !Array.isArray(json) ? json : {});
      } catch {
        reject(new Error("invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function classifyProbeError(error) {
  const msg = error instanceof Error ? error.message : String(error);
  if (/timed out|TimeoutError/i.test(msg)) return { code: "timeout" };
  if (/aborted/i.test(msg)) return { code: "timeout" };
  const http = msg.match(/HTTP (\d{3})/);
  if (http) {
    const status = Number(http[1]);
    if (status === 401 || status === 403) return { code: "invalid_key" };
    return { code: "http", status };
  }
  if (/unauthorized|invalid api key|forbidden|invalid key/i.test(msg)) return { code: "invalid_key" };
  if (/Tavily request failed|fetch failed|ECONN|ENOTFOUND|network/i.test(msg)) return { code: "network" };
  const trimmed = msg.replace(/^Tavily (API error|returned an unprocessable response):?\s*/i, "").slice(0, 60);
  return { code: "other", error: trimmed || "unknown" };
}

async function searchTavily(query, opts, signal) {
  throwIfAborted(signal);
  const host = searchHost(opts.baseURL, opts.allowCustomBaseURL);
  const requestSignal = deadlineSignal(signal, opts.searchTimeoutMs);
  let res;
  try {
    res = await fetch(`${host}/search`, {
      method: "POST",
      redirect: "error",
      headers: tavilyHeaders(opts.apiKey),
      body: JSON.stringify({
        query,
        max_results: opts.maxResults,
        search_depth: "basic",
        chunks_per_source: 3,
        include_answer: false,
        include_raw_content: false,
        include_images: false,
      }),
      ...(requestSignal ? { signal: requestSignal } : {}),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new WebError(`Tavily search timed out after ${opts.searchTimeoutMs}ms`, "WEB_PROVIDER_ERROR", { cause: error });
    }
    if (signal?.aborted || isAbortError(error)) throw new WebError("Tavily search aborted", "WEB_ABORTED", { cause: error });
    throw new WebError(`Tavily request failed: ${String(error)}`, "WEB_PROVIDER_ERROR", { cause: error });
  }
  if (!res.ok) {
    if (signal?.aborted) throwIfAborted(signal);
    throw new WebError(await tavilyErrorText(res), "WEB_PROVIDER_ERROR");
  }
  try {
    return toSources(await res.json());
  } catch (error) {
    if (signal?.aborted || isAbortError(error)) throw new WebError("Tavily search aborted", "WEB_ABORTED", { cause: error });
    throw new WebError(`Tavily returned an unprocessable response: ${String(error)}`, "WEB_PROVIDER_ERROR", { cause: error });
  }
}

class TavilySearchProvider {
  id = TAVILY_PROVIDER_ID;

  constructor(resolveOptions) {
    this.resolveOptions = resolveOptions;
  }

  available() {
    return true;
  }

  async search(request, signal) {
    const options = this.resolveOptions();
    throwIfAborted(signal);
    const enabled = truthy(await resolveRef(options.ctx, ENABLED_REF));
    if (!enabled) {
      return options.deepseek.search(request, signal);
    }
    const apiKey = await resolveRef(options.ctx, options.apiKeyEnv, options.apiKey);
    return searchTavily(request.query, {
      apiKey,
      baseURL: options.baseURL,
      allowCustomBaseURL: options.allowCustomBaseURL,
      maxResults: request.maxResults ?? options.maxResults,
      searchTimeoutMs: options.searchTimeoutMs,
    }, signal);
  }
}

export function apply(ctx, config) {
  // Dispatch namespace for Plugin configuration. Toggle/key stay on credentials.
  ctx.settings.register("web-search-tavily", Config);
  const apiKeyEnv = config.apiKeyEnv || DEFAULT_KEY_ENV;
  const deepseek = new DeepSeekSearchProvider(() => {
    const keyEnv = credentialRef("DEEPSEEK_API_KEY");
    return {
      resolveApiKey: async () => resolveRef(ctx, "DEEPSEEK_API_KEY"),
      apiKeyEnv: keyEnv,
      baseURL: DEEPSEEK_DEFAULT_BASE_URL,
      model: DEEPSEEK_DEFAULT_MODEL,
      apiVersion: DEEPSEEK_DEFAULT_API_VERSION,
      maxTokens: DEEPSEEK_DEFAULT_MAX_TOKENS,
      maxUses: DEEPSEEK_DEFAULT_MAX_USES,
    };
  });

  ctx.web.registerSearchProvider(new TavilySearchProvider(() => ({
    ctx,
    apiKey: config.apiKey,
    apiKeyEnv,
    baseURL: config.baseURL || TAVILY_HOST,
    allowCustomBaseURL: config.allowCustomBaseURL === true,
    maxResults: config.maxResults || 5,
    searchTimeoutMs: config.searchTimeoutMs || DEFAULT_TIMEOUT_MS,
    deepseek,
  })));

  ctx.webServer.register({
    kind: "exact",
    path: "/api/tavily-probe",
    handler: async (req, res) => {
      if (req.method !== "POST") {
        return sendJson(res, 405, { ok: false, code: "other", error: "method not allowed" });
      }
      try {
        const body = await readJsonBody(req);
        const draft = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
        const clearKey = body.clearKey === true;
        let apiKey;
        if (draft.length > 0) apiKey = draft.slice(0, 512);
        else if (!clearKey) apiKey = await resolveRef(ctx, apiKeyEnv, config.apiKey);
        const mode = apiKey ? "key" : "keyless";
        await searchTavily("tavily", {
          apiKey,
          baseURL: config.baseURL || TAVILY_HOST,
          allowCustomBaseURL: config.allowCustomBaseURL === true,
          maxResults: 1,
          searchTimeoutMs: config.searchTimeoutMs || DEFAULT_TIMEOUT_MS,
        });
        return sendJson(res, 200, { ok: true, mode });
      } catch (error) {
        if (error instanceof Error && (error.message === "invalid JSON body" || error.message === "body too large")) {
          return sendJson(res, 400, { ok: false, code: "other", error: error.message });
        }
        return sendJson(res, 200, { ok: false, ...classifyProbeError(error) });
      }
    },
  });
}
