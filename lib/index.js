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
const DEFAULT_TAVILY_BASE = "https://api.tavily.com";
const DEFAULT_KEY_ENV = "TAVILY_API_KEY";
/** Non-secret switch stored via the credentials plane so the settings card can write it on rc.6. */
export const ENABLED_REF = "TAVILY_SEARCH_ENABLED";

export const name = "web-search-tavily";
export const inject = ["web"];

export const Config = z.object({
  apiKey: z.string().role("secret"),
  apiKeyEnv: z.string().role("credential-ref").default(DEFAULT_KEY_ENV),
  baseURL: z.string().default(DEFAULT_TAVILY_BASE),
  maxResults: z.number().step(1).min(1).max(20).default(5),
});

function throwIfAborted(signal) {
  if (signal?.aborted) throw new WebError("Tavily search aborted", "WEB_ABORTED", { cause: signal.reason });
}

function isAbortError(error) {
  return error instanceof DOMException && error.name === "AbortError";
}

function truthy(value) {
  if (value == null) return false;
  const v = String(value).trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "on";
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

async function searchTavily(query, opts, signal) {
  throwIfAborted(signal);
  const endpoint = `${opts.baseURL.replace(/\/+$/, "")}/search`;
  let res;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      redirect: "error",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        api_key: opts.apiKey,
        query,
        max_results: opts.maxResults,
        search_depth: "basic",
      }),
      signal,
    });
  } catch (error) {
    if (signal?.aborted || isAbortError(error)) throw new WebError("Tavily search aborted", "WEB_ABORTED", { cause: error });
    throw new WebError(`Tavily request failed: ${String(error)}`, "WEB_PROVIDER_ERROR", { cause: error });
  }
  if (!res.ok) {
    let message = `Tavily API error (HTTP ${res.status})`;
    try {
      const json = await res.json();
      const detail = json?.error || json?.message || json?.detail;
      if (detail) message = typeof detail === "string" ? detail : JSON.stringify(detail);
    } catch (error) {
      if (signal?.aborted || isAbortError(error)) throw new WebError("Tavily search aborted", "WEB_ABORTED", { cause: error });
    }
    throw new WebError(message, "WEB_PROVIDER_ERROR");
  }
  const data = await res.json();
  const sources = (data.results || []).map((row) => ({
    url: row.url,
    ...(row.title ? { title: row.title } : {}),
    ...(row.content ? { snippet: row.content.slice(0, 800) } : {}),
    ...(row.published_date ? { publishedAt: row.published_date } : {}),
  }));
  return { sources, truncated: false };
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
    if (!apiKey) {
      throw new WebError(
        `Tavily is enabled but ${options.apiKeyEnv} is empty; paste the key in Settings → 插件 → Tavily 网页搜索`,
        "WEB_PROVIDER_CREDENTIAL_MISSING",
      );
    }
    return searchTavily(request.query, {
      apiKey,
      baseURL: options.baseURL,
      maxResults: request.maxResults ?? options.maxResults,
    }, signal);
  }
}

export function apply(ctx, config) {
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
    baseURL: config.baseURL || DEFAULT_TAVILY_BASE,
    maxResults: config.maxResults || 5,
    deepseek,
  })));
}
