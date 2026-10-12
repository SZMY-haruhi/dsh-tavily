import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { resolve as mockResolve } from "./mock-loader.mjs";

registerHooks({
  resolve(specifier, context, nextResolve) {
    return mockResolve(specifier, context, nextResolve);
  },
});

const { apply, inject, TAVILY_PROVIDER_ID, ENABLED_REF } = await import("../lib/index.js");
const { deepseekCalls } = await import("./mocks/web-search-deepseek.mjs");

const SECRET = "tvly-test-secret-should-not-leak";
const providers = [];
const routes = [];
const ctx = {
  get() {
    return undefined;
  },
  effect(run) {
    return run();
  },
  web: {
    registerSearchProvider(provider) {
      providers.push(provider);
    },
  },
  connection: {
    fetch: {
      register(route) {
        routes.push(route);
        return () => {};
      },
    },
  },
};

apply(ctx, {
  apiKeyEnv: "TAVILY_API_KEY",
  baseURL: "https://api.tavily.com",
  allowCustomBaseURL: false,
  maxResults: 5,
  searchTimeoutMs: 1000,
});

assert.deepEqual(inject, ["web", "connection"]);
assert.equal(providers.length, 1);
assert.equal(providers[0].id, TAVILY_PROVIDER_ID);
assert.equal(providers[0].id, "tavily");
assert.equal(ENABLED_REF, "TAVILY_SEARCH_ENABLED");
assert.equal(routes.length, 1);
assert.equal(routes[0].path, "/api/tavily-probe");
assert.deepEqual(routes[0].methods, ["POST"]);
assert.equal(routes[0].requestBody, "buffered");

const originalFetch = globalThis.fetch;
globalThis.fetch = async (_url, init) => {
  assert.equal(init.headers.authorization, `Bearer ${SECRET}`);
  return new Response(JSON.stringify({ results: [{ url: "https://example.test/tavily", title: "ok" }] }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

try {
  const postRes = await routes[0].fetch(new Request("http://dsh.internal/api/tavily-probe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ apiKey: SECRET }),
  }));
  const postBody = await postRes.text();
  assert.equal(postRes.status, 200);
  const posted = JSON.parse(postBody);
  assert.equal(posted.ok, true);
  assert.equal(posted.mode, "key");
  assert.equal(postBody.includes(SECRET), false);

  globalThis.fetch = async () => {
    throw new Error(`upstream echoed ${SECRET}`);
  };
  const leaked = await routes[0].fetch(new Request("http://dsh.internal/api/tavily-probe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ apiKey: SECRET }),
  }));
  const leakedBody = await leaked.text();
  assert.equal(leaked.status, 200);
  assert.equal(JSON.parse(leakedBody).ok, false);
  assert.equal(leakedBody.includes(SECRET), false);

  globalThis.fetch = async () => new Response(JSON.stringify({ results: [] }), { status: 200 });
  const keylessRes = await routes[0].fetch(new Request("http://dsh.internal/api/tavily-probe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  }));
  assert.deepEqual(await keylessRes.json(), { ok: true, mode: "keyless" });

  const off = await providers[0].search({ query: "probe" });
  assert.equal(deepseekCalls.length, 1);
  assert.equal(off.sources[0].url, "https://example.test/deepseek");
} finally {
  globalThis.fetch = originalFetch;
}

let clientModule;
const snapshots = [];
globalThis.window = {
  __ModuleLoader__: {
    load(reg) {
      const require = (id) => {
        if (id === "react") return { useState: (value) => [value, () => {}] };
        if (id === "react/jsx-runtime") return { jsx: () => null, jsxs: () => null };
        if (id === "@deepseek-ai/dsh-client-store") {
          return {
            createSnapshotStore(init) {
              let value = init;
              const store = {
                getSnapshot: () => value,
                set(next) {
                  value = next;
                  snapshots.push(next);
                },
                subscribe() {
                  return () => {};
                },
              };
              snapshots.push(init);
              return store;
            },
          };
        }
        throw new Error(`unexpected require ${id}`);
      };
      clientModule = reg.factory(require);
    },
  },
};

await import("../lib/client.js");
assert.equal(clientModule.inject.includes("remote.credentials"), true);

const leak = "LEAK-raw-credential-value";
let describeMode = "fail";
let writeMode = "reject";
const api = {
  async describe(refs) {
    if (describeMode === "fail") {
      return { ok: false, error: { code: "gateway/internal", message: leak } };
    }
    const value = {};
    for (const ref of refs) value[ref] = { configured: false, writable: true };
    return { ok: true, value };
  },
  async set() {
    if (writeMode === "reject") return { ok: false, error: { code: "credential/rejected", message: leak } };
    return { ok: true };
  },
  async unset() {
    const error = new Error(leak);
    error.code = "credential/rejected";
    throw error;
  },
};

let injected;
let onCreds;
const clientCtx = {
  effect(fn) {
    fn();
  },
  locale: { register() {} },
  remote: {
    credentials: api,
    $on(_event, fn) {
      onCreds = fn;
    },
  },
  slots: {
    inject(_name, register) {
      register();
    },
    register(meta) {
      injected = meta.inject();
    },
  },
};

clientModule.apply(clientCtx);
await new Promise((resolve) => setTimeout(resolve, 0));
const failedLoad = injected.hooks.tavilyCard.getSnapshot();
assert.equal(failedLoad.loadFailed, true);
assert.equal(failedLoad.keyWritable, false);
assert.equal(failedLoad.enabledWritable, false);
assert.equal(JSON.stringify(failedLoad).includes(leak), false);

describeMode = "ok";
await onCreds();
const loaded = injected.hooks.tavilyCard.getSnapshot();
assert.equal(loaded.loadFailed, false);
assert.equal(loaded.keyWritable, true);

injected.setKey(SECRET);
await injected.save();
const rejected = injected.hooks.tavilyCard.getSnapshot();
assert.equal(rejected.failed, true);
assert.equal(rejected.saveError, "credential/rejected");
assert.equal(JSON.stringify(rejected).includes(leak), false);
assert.equal(rejected.saveError.includes(SECRET), false);

describeMode = "ok";
writeMode = "ok";
api.describe = async (refs) => {
  const value = {};
  for (const ref of refs) value[ref] = { configured: ref === "TAVILY_SEARCH_ENABLED", writable: true };
  return { ok: true, value };
};
await onCreds();
injected.setEnabled(false);
await injected.save();
const thrown = injected.hooks.tavilyCard.getSnapshot();
assert.equal(thrown.failed, true);
assert.equal(thrown.saveError, "credential/rejected");
assert.equal(JSON.stringify(thrown).includes(leak), false);

console.log("smoke ok");
